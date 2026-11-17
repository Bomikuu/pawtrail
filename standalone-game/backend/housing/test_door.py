"""Door contract checks; generated records exist only in Django's isolated test DB."""
import time
from django.test import TestCase,SimpleTestCase
from django.db import transaction
from django.core.cache import cache
from rest_framework.exceptions import ValidationError,PermissionDenied
from .models import PlayerGameProfile,PlayerHouse,WorldInteraction,PetGameProfile
from .interactions import handle,states
from .spatial import Navigation

PIECE={'id':'door-under-test','item':'wooden-door','x':5.5,'y':7,'rotation':0}
FRONT={'x':192,'y':270,'direction':'up'}
PORTAL={'x':192,'y':246,'direction':'up'}

class DoorGeometryTests(SimpleTestCase):
    def test_closed_and_open_passage_with_permanent_frame(self):
        closed=Navigation([PIECE]);opened=Navigation([PIECE],states={PIECE['id']:{'open':True}})
        self.assertFalse(closed.segment([192,280],[192,216]))
        self.assertTrue(opened.segment([192,280],[192,216]))
        for x in [176,212]:self.assertFalse(opened.clear([x,246]))

class DoorActionTests(TestCase):
    def setUp(self):
        cache.clear()
        self.owner=PlayerGameProfile.objects.create(id='door-test-owner',username='door_test_owner',name='Door test owner')
        self.guest=PlayerGameProfile.objects.create(id='door-test-guest',username='door_test_guest',name='Door test guest')
        self.house=PlayerHouse.objects.create(owner=self.owner,name='Isolated door test',layout=[PIECE],permissions={'furniture':True})
    def begin(self,aid,player=None):
        with transaction.atomic():return handle(player or self.owner,self.house,'interior',{'type':'interaction.begin','actionId':aid,'target':PIECE['id'],'action':'toggle_door'},FRONT)
    def complete(self,aid,position=None):
        row=WorldInteraction.objects.get(player=self.owner,action_id=aid)
        row.payload={**row.payload,'started':time.time()-2};row.save(update_fields=['payload'])
        with transaction.atomic():return handle(self.owner,self.house,'interior',{'type':'interaction.complete','actionId':aid},position or FRONT)
    def make_open(self):
        self.house.object_states={'interior:'+PIECE['id']:{'open':True}}
        self.house.save(update_fields=['object_states'])
    def state(self):
        self.house.refresh_from_db();return states(self.house,'interior').get(PIECE['id'],{})
    def test_open_is_persistent_and_repeated_completion_does_not_toggle_twice(self):
        self.begin('door-idempotent');result=self.complete('door-idempotent')
        self.assertTrue(result['objectState']['open'])
        again=self.complete('door-idempotent')
        self.assertTrue(again['objectState']['open']);self.assertEqual(self.state()['revision'],1)
        self.owner.refresh_from_db();self.assertEqual(self.owner.wallet,250)
    def test_cancel_does_not_change_door_and_cannot_complete_later(self):
        self.begin('door-cancelled')
        with transaction.atomic():handle(self.owner,self.house,'interior',{'type':'interaction.cancel','actionId':'door-cancelled'},FRONT)
        with self.assertRaises(ValidationError):self.complete('door-cancelled')
        self.assertFalse(self.state().get('open',False))
    def test_nonowner_cannot_toggle_even_with_general_furniture_permission(self):
        with self.assertRaises(PermissionDenied):self.begin('door-not-owner',self.guest)
        self.assertEqual(WorldInteraction.objects.count(),0)
    def test_current_actor_blocks_closing_even_if_position_cache_has_expired(self):
        self.make_open();self.begin('door-owner-inside')
        with self.assertRaisesMessage(ValidationError,'doorway is clear'):self.complete('door-owner-inside',PORTAL)
        self.assertTrue(self.state()['open'])
    def test_other_actor_blocks_closing_then_clear_door_closes_once(self):
        self.make_open();cache.set('positions:'+self.owner.id,{self.guest.id:PORTAL})
        self.begin('door-guest-inside')
        with self.assertRaisesMessage(ValidationError,'doorway is clear'):self.complete('door-guest-inside')
        self.assertTrue(self.state()['open'])
        cache.delete('positions:'+self.owner.id)
        self.assertFalse(self.complete('door-guest-inside')['objectState']['open'])
        self.assertFalse(self.complete('door-guest-inside')['objectState']['open'])
        self.assertEqual(self.state()['revision'],1)
    def test_pet_blocks_closing(self):
        self.make_open();pet=PetGameProfile.objects.create(id='door-test-pet',owner=self.owner)
        cache.set('pet:'+self.owner.id+':'+pet.id,PORTAL)
        self.begin('door-pet-inside')
        with self.assertRaisesMessage(ValidationError,'doorway is clear'):self.complete('door-pet-inside')
        self.assertTrue(self.state()['open'])
    def test_removed_door_rejects_stale_completion(self):
        self.begin('door-removed')
        self.house.layout=[];self.house.save(update_fields=['layout'])
        with self.assertRaises(ValidationError):self.complete('door-removed')
        self.assertEqual(self.state(),{})
