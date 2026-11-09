"""On-demand walking routes. Visitor coordinates are not persisted."""
import json
import hashlib
import math
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import urlsplit
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import APIException, Throttled, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .domain import point, distance
from housing.service import check_rate


class RoutingUnavailable(APIException):
    status_code = 503
    default_detail = 'Walking directions are unavailable. Try again or open the destination in Maps.'


# A public-area radius is uncertainty, never permission to move a route endpoint.
MAX_SNAP_METERS = 75


def decode_shape(value):
    if not isinstance(value, str) or len(value) > 500000:
        raise ValueError('Invalid route shape')
    index, latitude, longitude = 0, 0, 0
    points = []

    def number():
        nonlocal index
        result, shift = 0, 0
        while True:
            if index >= len(value) or shift > 30:
                raise ValueError('Invalid route shape')
            digit = ord(value[index]) - 63
            index += 1
            if not 0 <= digit <= 63:
                raise ValueError('Invalid route shape')
            result |= (digit & 31) << shift
            if digit < 32:
                return ~(result >> 1) if result & 1 else result >> 1
            shift += 5

    while index < len(value):
        latitude += number()
        longitude += number()
        coordinate = [longitude / 1000000, latitude / 1000000]
        if not -180 <= coordinate[0] <= 180 or not -85 <= coordinate[1] <= 85:
            raise ValueError('Invalid route coordinate')
        points.append(coordinate)
        if len(points) > 30000:
            raise ValueError('Route too detailed')
    return points


def finite(value, maximum):
    if type(value) not in [int, float] or not math.isfinite(value) or not 0 <= value <= maximum:
        raise ValueError('Invalid route estimate')
    return value


def route_candidate(trip, origin, destination):
    if trip.get('status') != 0 or trip.get('units') not in ['kilometers', 'km']:
        raise ValueError('No route')
    summary = trip['summary']
    meters = finite(summary['length'], 200) * 1000
    seconds = finite(summary['time'], 7 * 86400)
    coordinates, steps = [], []
    for leg in trip['legs']:
        shape = decode_shape(leg['shape'])
        coordinates.extend(shape[1:] if coordinates and shape and coordinates[-1] == shape[0] else shape)
        for maneuver in leg.get('maneuvers', []):
            if maneuver.get('travel_mode', 'pedestrian') != 'pedestrian':
                raise ValueError('Not a walking route')
            instruction = maneuver.get('instruction')
            if isinstance(instruction, str) and instruction and len(steps) < 200:
                steps.append({'instruction': instruction[:1000], 'distanceMeters': finite(maneuver.get('length', 0), 200) * 1000})
    if not 2 <= len(coordinates) <= 30000:
        raise ValueError('Incomplete route')
    start_gap, end_gap = distance(origin, coordinates[0]), distance(destination, coordinates[-1])
    if max(start_gap, end_gap) > MAX_SNAP_METERS:
        raise ValueError('Route endpoints are too far from the selected points')
    return {'coordinates': coordinates, 'distanceMeters': meters, 'durationSeconds': seconds,
            'steps': steps, 'origin': origin, 'destination': destination,
            'accessDistanceMeters': {'origin': start_gap, 'destination': end_gap},
            'profile': 'walking', 'optimization': 'shortest', 'provider': 'Valhalla / OpenStreetMap',
            'estimatedAt': timezone.now().isoformat()}


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def walking_route(request):
    if not isinstance(request.data, dict):
        raise ValidationError('Choose a start and destination.')
    origin = point(request.data.get('origin'))
    destination = point(request.data.get('destination'))
    if distance(origin, destination) > 100000:
        raise ValidationError('This destination is too far for local walking directions. Open it in Maps instead.')
    caller = hashlib.sha256(request.META.get('REMOTE_ADDR', 'local').encode()).hexdigest()
    check_rate('walking-route:' + caller, 30, 60)
    endpoint = settings.WALKING_ROUTING_URL
    if not endpoint:
        raise RoutingUnavailable()
    parsed = urlsplit(endpoint)
    if parsed.scheme not in ['http', 'https'] or not parsed.netloc or parsed.username or parsed.password:
        raise RoutingUnavailable()
    # Public demo use is deliberately bounded; production requires its own endpoint.
    if 'valhalla1.openstreetmap.de' in endpoint and not cache.add('walking-route-provider', True, 2):
        raise Throttled(2, 'Please wait a moment before requesting another walking route.')
    payload = {
        # Keep candidates local and remove candidate-ranking penalties so they
        # cannot outweigh distance-only pedestrian costing.
        'locations': [{'lon': p[0], 'lat': p[1], 'type': 'break', 'radius': 25,
                       'search_cutoff': MAX_SNAP_METERS, 'rank_candidates': False}
                      for p in [origin, destination]],
        'costing': 'pedestrian',
        'costing_options': {'pedestrian': {'shortest': True, 'walking_speed': 4.5, 'max_distance': 100000}},
        'directions_options': {'units': 'kilometers', 'language': 'en-US'},
        'alternates': 2,
    }
    upstream = Request(endpoint, data=json.dumps(payload).encode(), method='POST', headers={
        'Content-Type': 'application/json', 'Accept': 'application/json',
        'User-Agent': 'PawTrail walking directions', 'X-Client-Id': settings.WALKING_ROUTING_CLIENT_ID,
    })
    try:
        with urlopen(upstream, timeout=12) as response:
            raw = response.read(2000001)
        if len(raw) > 2000000:
            raise ValueError('Route too large')
        result = json.loads(raw)
        alternatives = result.get('alternates', [])
        if not isinstance(alternatives, list):
            raise ValueError('Invalid alternatives')
        candidates = []
        for item in [result, *alternatives[:2]]:
            try:
                candidates.append(route_candidate(item['trip'], origin, destination))
            except (ValueError, KeyError, TypeError, AttributeError):
                continue
        if not candidates:
            return Response({'detail': 'No mapped walking route reaches within 75 m of both selected points. Choose a starting point on a nearby street or open the destination in Maps.'}, status=422)
        # Include short access gaps when comparing candidates, but do not report
        # those unverified connections as mapped walking distance or travel time.
        route = min(candidates, key=lambda item: (item['distanceMeters'] + sum(item['accessDistanceMeters'].values()), item['durationSeconds']))
        return Response(route, headers={'Cache-Control': 'private, no-store'})
    except HTTPError as error:
        if error.code in [400, 404]:
            return Response({'detail': 'No walking route was found to this approximate area. Open Maps or choose another animal.'}, status=422)
        raise RoutingUnavailable() from None
    except (URLError, TimeoutError, OSError, ValueError, KeyError, TypeError, AttributeError):
        raise RoutingUnavailable() from None
