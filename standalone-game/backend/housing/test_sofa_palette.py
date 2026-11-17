"""Palette persistence through the real layout action; isolated test database only."""
import copy
import uuid
from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient
from .models import PlayerGameProfile,PlayerHouse


class SofaPaletteSaveTests(TestCase):
    def setUp(self):
        cache.clear()
        self.player=PlayerGameProfile.objects.create(id='palette-save-test',username='palette_save_test',name='Palette save test',inventory={'sofa':2})
        self.layout=[dict(id='blue',item='sofa',x=5,y=6,rotation=0),dict(id='rose',item='sofa',x=13,y=6,rotation=0)]
        self.house=PlayerHouse.objects.create(owner=self.player,name='Palette test',visibility='private',layout=self.layout)
        self.client=APIClient();self.client.force_authenticate(self.player)

    def save_layout(self,layout):
        return self.client.post('/api/homes/action',dict(type='layout',house=self.player.id,zone='interior',revision=self.house.revision,layout=layout),format='json',HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4()))

    def test_two_colors_persist_independently_and_remain_on_rotation(self):
        layout=copy.deepcopy(self.layout)
        layout[0].update(upholsteryColor='#376DB7',rotation=90)
        layout[1].update(upholsteryColor='#B86A82',rotation=270)
        response=self.save_layout(layout)
        self.assertEqual(response.status_code,200,response.data)
        self.house.refresh_from_db()
        self.assertEqual([(p['id'],p['upholsteryColor'],p['rotation']) for p in self.house.layout],[('blue','#376db7',90),('rose','#b86a82',270)])

    def test_restore_original_removes_only_that_sofas_override(self):
        self.house.layout=[{**self.layout[0],'upholsteryColor':'#376db7'},{**self.layout[1],'upholsteryColor':'#b86a82'}]
        self.house.save(update_fields=['layout'])
        layout=copy.deepcopy(self.house.layout);layout[0].pop('upholsteryColor')
        response=self.save_layout(layout)
        self.assertEqual(response.status_code,200,response.data)
        self.house.refresh_from_db()
        self.assertNotIn('upholsteryColor',self.house.layout[0])
        self.assertEqual(self.house.layout[1]['upholsteryColor'],'#b86a82')

    def test_invalid_colors_do_not_modify_saved_layout(self):
        for color in ['#fff','#zz0000','#00000000','red',None,17]:
            with self.subTest(color=color):
                layout=copy.deepcopy(self.layout);layout[0]['upholsteryColor']=color
                response=self.save_layout(layout)
                self.assertEqual(response.status_code,400,response.data)
                self.house.refresh_from_db();self.assertEqual(self.house.layout,self.layout)

    def test_unsupported_furniture_cannot_accept_upholstery(self):
        layout=copy.deepcopy(self.layout);layout[0].update(item='wooden-door',upholsteryColor='#376db7')
        self.player.inventory={'sofa':1,'wooden-door':1};self.player.save(update_fields=['inventory'])
        response=self.save_layout(layout)
        self.assertEqual(response.status_code,400,response.data)
        self.house.refresh_from_db();self.assertEqual(self.house.layout,self.layout)
