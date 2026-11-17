"""Current sofa batch seat contracts, isolated generated database records only."""
from django.test import TestCase
from django.db import transaction
from django.core.cache import cache
from rest_framework.exceptions import ValidationError
from .models import PlayerGameProfile,PlayerHouse
from .interactions import handle,release
from .spatial import point
from .geometry import definition

class SofaFamilySeatTests(TestCase):
    def setUp(self):
        cache.clear()
        self.players=[PlayerGameProfile.objects.create(id='sofa-test-'+str(i),username='sofa_test_'+str(i),name='Isolated seat reviewer '+str(i)) for i in range(4)]
        self.piece={'id':'sofa-test','item':'three-seat-sofa','x':5.5,'y':7,'rotation':0}
        self.house=PlayerHouse.objects.create(owner=self.players[0],name='Isolated sofa review',layout=[self.piece],permissions={'furniture':True})
    def begin(self,i,aid=None):
        with transaction.atomic():return handle(self.players[i],self.house,'interior',{'type':'interaction.begin','actionId':aid or 'sofa-claim-'+str(i),'target':'sofa-test','action':'sit'},{'x':192,'y':272,'direction':'up'})
    def test_three_distinct_claims_and_fourth_rejected(self):
        events=[self.begin(i) for i in range(3)]
        self.assertEqual(len({e['pose']['x'] for e in events}),3)
        with self.assertRaisesMessage(ValidationError,'occupied'):self.begin(3)
    def test_releasing_middle_seat_makes_only_that_slot_available(self):
        events=[self.begin(i) for i in range(3)]
        release(self.players[1].id,self.house.owner_id,'sofa-claim-1')
        fourth=self.begin(3)
        self.assertEqual(fourth['pose']['x'],events[1]['pose']['x'])
        self.assertNotEqual(fourth['pose']['x'],events[0]['pose']['x'])
    def test_native_contacts_and_actor_facing_follow_rotation(self):
        for rotation,facing in [(0,'down'),(90,'left'),(180,'up'),(270,'right')]:
            self.piece={**self.piece,'rotation':rotation};self.house.layout=[self.piece];self.house.save(update_fields=['layout'])
            geometry=definition(self.piece)['geometry'];approach=point(self.piece,geometry['approaches'][0])
            with transaction.atomic():event=handle(self.players[0],self.house,'interior',{'type':'interaction.begin','actionId':'sofa-facing-'+str(rotation),'target':'sofa-test','action':'sit'},{'x':approach[0],'y':approach[1],'direction':'up'})
            expected=point(self.piece,geometry['seats'][0]['point'])
            self.assertEqual(event['pose']['facing'],facing)
            self.assertEqual(event['pose']['x'],expected[0])
            self.assertEqual(event['pose']['y'],expected[1]-geometry['seats'][0]['elevation'])
            release(self.players[0].id,self.house.owner_id,'sofa-facing-'+str(rotation))
