import { requestPosition } from "@/features/neighborhood/game/discovery/geolocation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlatformBridge, MapViewer } from "@/features/neighborhood/game/platform";
import {
  loadSources,
  publicRecords,
  invalidatePublicRecords,
} from "@/features/neighborhood/game/discovery/service";
import { metersBetween, withinBounds } from "@/features/neighborhood/game/discovery/geo";
import { COMMUNITY_START } from "@/features/neighborhood/game/community";
import { discoveryCandidates, membershipEntities } from "@/features/neighborhood/game/discovery/members";
import { withAttention } from "@/features/neighborhood/game/discovery/attention";
import {
  ENTITY_KINDS,
  type EntityKind,
  type MapEntity,
  type SourceIssue,
  type Point,
  type Proximity,
  type PublicRecords,
  type UserPosition,
} from "@/features/neighborhood/game/discovery/types";
import type { MapBounds } from "./map-canvas";
const PREFS = "pawtrail:discovery-layers:v2";
export function useDiscovery(platform?: PlatformBridge) {
  const [base, setBase] = useState<MapEntity[]>([]);
  const [records, setRecords] = useState<PublicRecords>({
    entities: [],
    summaries: {},
  });
  const [nearRecords, setNearRecords] = useState<PublicRecords>({
    entities: [],
    summaries: {},
  });
  const [sourceIssues, setSourceIssues] = useState<SourceIssue[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [reportIssue, setReportIssue] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, retry] = useState(0);
  const [query, setQuery] = useState("");
  const [hasPets, setHasPets] = useState(false);
  const [visitOnly, setVisitOnly] = useState(false);
  const [contributionFilter, setContributionFilter] = useState("all");
  const [layers, setLayers] = useState<EntityKind[]>(() => {
    try {
      const value = localStorage.getItem(PREFS);
      const saved = JSON.parse(
        value || localStorage.getItem("pawtrail:discovery-layers:v1") || "null",
      );
      if (
        !value &&
        Array.isArray(saved) &&
        saved.length === ENTITY_KINDS.length - 1
      )
        return ENTITY_KINDS;
      return Array.isArray(saved)
        ? saved.filter((k: EntityKind) => ENTITY_KINDS.includes(k))
        : ENTITY_KINDS;
    } catch {
      return ENTITY_KINDS;
    }
  });
  const [clusters, setClusters] = useState(true);
  const [reputationLayer, setReputationLayer] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cluster, setCluster] = useState<string[] | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [inView, setInView] = useState<MapBounds | null>(null);
  const [proximity, setProximity] = useState<Proximity | null>(null);
  const [hover, setHover] = useState<Proximity | null>(null);
  const [radius, setRadius] = useState(500);
  const [nearOnly, setNearOnly] = useState(false);
  const [picking, setPicking] = useState(false);
  const [viewer, setViewer] = useState<UserPosition | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [locating, setLocating] = useState(false);
  const [focus, setFocus] = useState<{ point: Point; id: number } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const focusRevision = useRef(0);
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("pawtrail:saved-map-places:v1") || "[]",
      );
      return Array.isArray(value)
        ? value.filter((v) => typeof v === "string" && v.length < 200)
        : [];
    } catch {
      return [];
    }
  });
  const [truncated, setTruncated] = useState(false);
  const [now, setNow] = useState(Date.now());
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const identity = useRef({ name: "You", avatar: null as string | null });
  const [account, setAccount] = useState<MapViewer | null>(null);
  useEffect(() => {
    let active = true;
    platform
      ?.mapViewer?.()
      .then((value) => {
        if (active) {
          identity.current = value;
          setAccount(value);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [platform]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(PREFS, JSON.stringify(layers));
    } catch {}
  }, [layers]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "pawtrail:saved-map-places:v1",
        JSON.stringify(saved),
      );
    } catch {}
  }, [saved]);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    loadSources(platform, abort.signal)
      .then((data) => {
        if (!abort.signal.aborted) {
          setBase(data.entities);
          setIssues(data.warnings);
          setSourceIssues(data.issues ?? []);
          setTruncated(data.truncated);
        }
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setIssues(["Community places could not load. Retry to reconnect."]);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [platform, attempt]);
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(() => {
      publicRecords(bounds, abort.signal)
        .then((data) => {
          if (!abort.signal.aborted) {
            setRecords(data);
            setReportIssue("");
          }
        })
        .catch(() => {
          if (!abort.signal.aborted)
            setReportIssue(
              "Published welfare reports are unavailable. Existing places and animal profiles still work.",
            );
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [bounds, attempt, now]);
  useEffect(() => {
    if (!proximity) {
      setNearRecords({ entities: [], summaries: {} });
      return;
    }
    const abort = new AbortController();
    const timer = setTimeout(() => {
      publicRecords(null, abort.signal, { ...proximity, radius })
        .then((data) => {
          if (!abort.signal.aborted) setNearRecords(data);
        })
        .catch(() => {});
    }, 350);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [proximity?.center[0], proximity?.center[1], radius, attempt, now]);
  const onBounds = useCallback((value: MapBounds) => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setBounds(value), 250);
  }, []);
  useEffect(() => () => clearTimeout(debounce.current), []);
  const entities = useMemo(() => {
    const map = new Map<string, MapEntity>();
    for (const item of [
      ...base,
      ...records.entities,
      ...nearRecords.entities,
    ]) {
      if (item.sample || item.demo) continue;
      if (item.help && Date.parse(item.help.expiresAt) <= now && !item.sample)
        continue;
      if (item.event && Date.parse(item.event.endsAt) <= now && !item.sample)
        continue;
      map.set(item.id, {
        ...item,
        ...records.summaries[item.id],
        ...nearRecords.summaries[item.id],
      });
    }
    return withAttention([...map.values()], now);
  }, [base, records, nearRecords, now]);
  const matching = useMemo(
    () =>
      discoveryCandidates(entities, layers).filter(
        (e) =>
          layers.includes(e.kind) &&
          (!hasPets || !!e.animal || !!e.membership?.animals.length) &&
          (!visitOnly ||
            (!!e.entry &&
              (e.capacity === undefined || (e.occupancy ?? 0) < e.capacity))) &&
          (contributionFilter === "all" ||
            (e.contribution?.level ?? "unrated") === contributionFilter) &&
          (!query.trim() ||
            `${e.name} ${e.area} ${e.host?.name ?? ""} ${e.host?.username ?? ""} ${(e.membership?.animals ?? []).map((a) => a.name).join(" ")}`
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase())),
      ),
    [entities, layers, query, hasPets, visitOnly, contributionFilter],
  );
  const nearby = useMemo(
    () =>
      proximity
        ? matching.filter(
            (e) => metersBetween(proximity.center, e.coordinates) <= radius,
          )
        : [],
    [matching, proximity, radius],
  );
  const visible = nearOnly && proximity ? nearby : matching;
  const listed = visible.filter(
    (e) =>
      (!cluster || cluster.includes(e.id)) &&
      (!inView || withinBounds(e, inView)),
  );
  const selectable = useMemo(
    () => [...entities, ...membershipEntities(entities)],
    [entities],
  );
  const selected = selectable.find((e) => e.id === selectedId) ?? null;
  function focusOn(point: Point) {
    setFocus({ point, id: ++focusRevision.current });
  }
  useEffect(() => () => clearTimeout(previewTimer.current), []);
  function choose(id: string) {
    const entity = selectable.find((e) => e.id === id);
    if (!entity) return;
    clearTimeout(previewTimer.current);
    setSelectedId(id);
    setHover(null);
    setProximity({ center: entity.coordinates, radius, label: entity.name });
    setPicking(false);
    focusOn(entity.coordinates);
  }
  function choosePoint(point: Point, label = "Selected map location") {
    setSelectedId(null);
    setProximity({ center: point, radius, label });
    setHover(null);
    setPicking(false);
    setNearOnly(false);
    setCluster(null);
    focusOn(point);
  }
  function previewEntity(e: MapEntity | null) {
    clearTimeout(previewTimer.current);
    if (!e) {
      setHover(null);
      return;
    }
    previewTimer.current = setTimeout(() => {
      setHover({
        center: e.coordinates,
        radius,
        label: e.name,
        temporary: true,
      });
      focusOn(e.coordinates);
    }, 160);
  }
  const hoverEntity = useCallback(
    (e: MapEntity | null) =>
      setHover(
        e
          ? { center: e.coordinates, radius, label: e.name, temporary: true }
          : null,
      ),
    [radius],
  );
  function locate(updateDiscovery = true): Promise<UserPosition | null> {
    if (!navigator.geolocation) {
      setLocationStatus(
        "Location is unavailable in this browser. Choose a center on the map.",
      );
      if (updateDiscovery) setPicking(true);
      return Promise.resolve(null);
    }
    setLocating(true);
    setLocationStatus("Requesting your location…");
    return new Promise((resolve) =>
      requestPosition(
        navigator.geolocation,
        (position) => {
          const coordinates: Point = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          const viewer = {
            coordinates,
            accuracy: position.coords.accuracy,
            ...identity.current,
          };
          setViewer(viewer);
          if (updateDiscovery) choosePoint(coordinates, "Nearby you");
          setLocating(false);
          setLocationStatus(
            `Location found. Accuracy about ${Math.round(position.coords.accuracy)} m.`,
          );
          resolve(viewer);
        },
        () => {
          setLocating(false);
          setLocationStatus(
            "Location access was unavailable. Choose a center on the map instead.",
          );
          if (updateDiscovery) setPicking(true);
          resolve(null);
        },
      ),
    );
  }
  function clear() {
    setQuery("");
    setLayers(ENTITY_KINDS);
    setCluster(null);
    setInView(null);
    setNearOnly(false);
    setSelectedId(null);
    setProximity(null);
    setHover(null);
    setPicking(false);
    setHasPets(false);
    setVisitOnly(false);
    setContributionFilter("all");
  }
  return {
    dataRevision: attempt,
    entities,
    account,
    matching: visible,
    listed,
    selected,
    selectedId,
    choose,
    recenter: focusOn,
    closeSelection: () => setSelectedId(null),
    cluster,
    setCluster,
    query,
    setQuery,
    layers,
    setLayers,
    clusters,
    setClusters,
    reputationLayer,
    setReputationLayer,
    hasPets,
    setHasPets,
    visitOnly,
    setVisitOnly,
    contributionFilter,
    setContributionFilter,
    loading,
    sourceIssues,
    hasActiveFilters:
      !!query.trim() ||
      hasPets ||
      visitOnly ||
      contributionFilter !== "all" ||
      layers.length !== ENTITY_KINDS.length ||
      !!cluster ||
      !!inView ||
      nearOnly,
    issues: [...issues, ...(reportIssue ? [reportIssue] : [])],
    retry: () => {
      invalidatePublicRecords();
      retry((n) => n + 1);
    },
    bounds,
    onBounds,
    inView,
    setInView,
    proximity: proximity ? { ...proximity, radius } : null,
    displayCircle: hover ?? (proximity ? { ...proximity, radius } : null),
    setProximity,
    radius,
    setRadius,
    nearby,
    areaSummary: nearRecords.areaSummary,
    nearOnly,
    setNearOnly,
    picking,
    setPicking,
    choosePoint,
    hoverEntity,
    previewEntity,
    viewer,
    locate,
    locating,
    locationStatus,
    focus,
    saved,
    toggleSaved: (id: string) =>
      setSaved((list) =>
        list.includes(id) ? list.filter((k) => k !== id) : [...list, id],
      ),
    truncated: truncated || !!records.truncated || !!nearRecords.truncated,
    clear,
  };
}
