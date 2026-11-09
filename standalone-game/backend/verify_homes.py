"""Bounded two-account service verification requested by the multiplayer brief.
Uses isolated temporary storage; does not create users in the PawTrail platform.
"""
import tempfile,os,time,json,base64,hmac,hashlib,asyncio,uuid
from pathlib import Path
with tempfile.TemporaryDirectory(prefix='pawtrail-homes-verification-') as directory:
    os.environ['DJANGO_SETTINGS_MODULE']='config.settings'
    os.environ['PAWTRAIL_GAME_DATA_DIR']=directory
    os.environ['PAWTRAIL_GAME_SECRET']='isolated-service-verification-not-a-deployment-secret'
    import django
    django.setup()
    from django.core.management import call_command
    call_command('migrate',verbosity=0,interactive=False)
    from housing.service import *
    from housing.auth import decode_ticket
    from channels.testing import WebsocketCommunicator
    from config.asgi import application
    from channels.db import database_sync_to_async
    def ticket(id,name):
        data=dict(aud='pawtrail-housing',id=id,name=name,username=name.lower(),sample=True,pets=[],exp=int(time.time())+120)
        encoded=base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip('=')
        sig=base64.urlsafe_b64encode(hmac.new(os.environ['PAWTRAIL_GAME_SECRET'].encode(),encoded.encode(),hashlib.sha256).digest()).decode().rstrip('=')
        return data,encoded+'.'+sig
    a,ta=ticket('demo:verification-alice','Alice');b,tb=ticket('demo:verification-bob','Bob')
    alice=provision(a);bob=provision(b)
    from django.test import Client
    api=Client(HTTP_HOST='127.0.0.1',HTTP_ORIGIN='http://127.0.0.1:3000')
    response=api.post('/api/homes/exchange',data=json.dumps({'assertion':ta}),content_type='application/json')
    assert response.status_code==200,response.content
    opaque=response.json()['token'];assert opaque.startswith('session.')
    response=api.get('/api/homes/state?house=me',HTTP_AUTHORIZATION='Bearer '+opaque)
    assert response.status_code==200 and response.json()['player']['id']==a['id'],response.content
    assert not can_enter(bob,alice.playerhouse),'Friends-only access must reject a stranger'
    mutation(alice,dict(type='request',target=bob.id),'request-one')
    mutation(bob,dict(type='accept',target=alice.id),'accept-one')
    assert friend(alice.id,bob.id)
    mutation(alice,dict(type='invite',target=bob.id),'invite-one')
    assert can_enter(bob,alice.playerhouse)
    old=alice.wallet;mutation(alice,dict(type='buy',target='flower-pot'),'purchase-repeat');mutation(alice,dict(type='buy',target='flower-pot'),'purchase-repeat');alice.refresh_from_db()
    assert alice.wallet==old-ITEMS['flower-pot']['price'],'Repeated purchase must debit once'
    try:mutation(bob,dict(type='layout',house=alice.id,revision=1,layout=[]),'unauthorized-layout');raise AssertionError('Visitor modified owner layout')
    except PermissionDenied:pass
    try:mutation(alice,dict(type='fact',target='feed'),'fabricated-care');raise AssertionError('Client fabricated care facts')
    except ValidationError:pass
    try:mutation(alice,dict(type='layout',revision=999,layout=[]),'stale-layout');raise AssertionError('Stale revision accepted')
    except ValidationError:pass
    # Verify default placement really survives the same validator as a saved edit.
    validate_layout(alice.playerhouse.layout,alice.inventory)
    async def receive(socket,kind):
        for _ in range(30):
            event=await socket.receive_json_from(timeout=4)
            if event['type']==kind:return event
        raise AssertionError('Expected room event '+kind)
    async def rooms():
        headers=[(b'origin',b'http://127.0.0.1:3000')]
        one=WebsocketCommunicator(application,'/ws/homes',headers=headers)
        two=WebsocketCommunicator(application,'/ws/homes',headers=headers)
        assert (await one.connect())[0];await one.send_json_to(dict(type='auth',ticket=ta,house=a['id']));assert (await receive(one,'ready'))['id']==a['id']
        assert (await two.connect())[0];await two.send_json_to(dict(type='auth',ticket=tb,house=a['id']));assert (await receive(two,'ready'))['id']==b['id']
        assert (await receive(one,'player.join'))['player']['id'] in [a['id'],b['id']]
        await two.send_json_to(dict(type='player.chat',text='Hello from another account'))
        assert (await receive(one,'player.chat'))['text']=='Hello from another account'
        await asyncio.sleep(.12)
        await two.send_json_to(dict(type='player.move',x=408,y=528,direction='right',walking=True))
        moved=await receive(one,'player.move');assert moved['id']==b['id'] and moved['x']==408
        await two.send_json_to(dict(type='player.emote',emote='wave'))
        assert (await receive(one,'player.emote'))['emote']=='wave'
        await two.disconnect();assert (await receive(one,'player.leave'))['id']==b['id']
        await one.disconnect()
    asyncio.run(rooms())
    mutation(alice,dict(type='block',target=bob.id),'block-one');assert not can_enter(bob,alice.playerhouse)
    print('Passed: two isolated account identities, friend/invite access, authoritative purchase replay, unauthorized layout/care rejection, valid starter layout, live join/chat/movement/emote/leave, block revocation.')
