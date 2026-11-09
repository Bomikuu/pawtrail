from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from social.models import Post, Comment, Notification


class CommunityPublicationTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.author = User.objects.create_user(username='author', email='author@example.invalid', password='unit-only-strong-pass')
        self.reviewer = User.objects.create_user(username='reviewer', email='reviewer@example.invalid', password='unit-only-review-pass', is_staff=True)
        self.member = APIClient()
        self.member.force_authenticate(self.author)
        self.staff = APIClient()
        self.staff.force_authenticate(self.reviewer)
        self.public = APIClient()

    def test_text_post_requires_review_and_removed_post_is_unavailable_to_author(self):
        response = self.member.post('/api/v1/community/posts', {'text': 'A thoughtful care update', 'type': 'story', 'refs': [], 'mediaIds': []}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['moderation'], 'pending')
        key = response.data['id']
        self.assertEqual(self.public.get('/api/v1/community/posts/' + key).status_code, 404)
        review = self.staff.post('/api/v1/moderation/' + key + '/review', {'id': key, 'expectedVersion': 1, 'action': 'publish', 'reason': 'Reviewed generated test content'}, format='json')
        self.assertEqual(review.status_code, 200, review.data)
        self.assertIn('verification', review.data)
        self.assertEqual(self.public.get('/api/v1/community/posts/' + key).status_code, 200)
        self.assertEqual(self.member.delete('/api/v1/community/posts/' + key).status_code, 204)
        self.assertEqual(self.member.get('/api/v1/community/posts/' + key).status_code, 404)
        self.assertEqual(self.member.get('/api/v1/community/posts').data['count'], 0)

    def test_pending_comment_survives_reload_for_its_author_and_can_be_reviewed(self):
        parent = Post.objects.create(author=self.reviewer, text='Published context')
        path = '/api/v1/discussions/post/' + str(parent.pk) + '/comments'
        response = self.member.post(path, {'text': 'A helpful generated comment'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['moderation'], 'pending')
        key = response.data['id']
        self.assertEqual(self.public.get(path).data['count'], 0)
        self.assertEqual(self.member.get(path).data['count'], 1)
        self.assertFalse(Notification.objects.filter(recipient=self.reviewer, kind='comment').exists())
        queue = self.staff.get('/api/v1/moderation', {'state': 'pending', 'kind': 'publication'})
        item = next((row for row in queue.data['results'] if row.get('commentId') == key), None)
        self.assertIsNotNone(item)
        self.assertIsNone(item['verification'])
        self.assertEqual(item['ref'], {'kind': 'post', 'id': str(parent.pk)})
        review = self.staff.post('/api/v1/moderation/' + key + '/review', {'id': key, 'expectedVersion': 1, 'action': 'publish', 'reason': 'Reviewed comment'}, format='json')
        self.assertEqual(review.status_code, 200, review.data)
        self.assertEqual(self.public.get(path).data['count'], 1)
        self.assertEqual(self.public.get('/api/v1/community/posts/' + str(parent.pk)).data['commentCount'], 1)
        self.assertEqual(Notification.objects.filter(recipient=self.reviewer, kind='comment').count(), 1)
        stale = self.staff.post('/api/v1/moderation/' + key + '/review', {'id': key, 'expectedVersion': 1, 'action': 'remove', 'reason': 'Stale review'}, format='json')
        self.assertEqual(stale.status_code, 409)

    def test_populated_queue_satisfies_nullable_verification_contract(self):
        Post.objects.create(author=self.author, text='Pending review', moderation='pending')
        queue = self.staff.get('/api/v1/moderation', {'state': 'pending', 'kind': 'publication'})
        self.assertEqual(queue.status_code, 200)
        self.assertEqual(queue.data['count'], 1)
        self.assertIn('verification', queue.data['results'][0])

    def test_animal_edits_return_to_review_and_keep_private_attachments_separate(self):
        from animals.models import Animal
        from media.models import Asset
        from social.models import AnimalInfo
        animal = Animal.objects.create(owner=self.author, name='Care cat', slug='care-cat', species='cat', description='Original note')
        info = AnimalInfo.objects.create(animal=animal, caretaker=self.author, location={'areaId': 'care-area', 'neighborhood': 'Care area', 'latitude': 7.1, 'longitude': 125.6, 'approximateRadiusMeters': 500}, published=True)
        asset = Asset.objects.create(owner=self.author, alt='Private care note', sha256='0' * 64, perceptual_hash='', width=0, height=0, byte_count=100, purpose='private_evidence', mime_type='application/pdf')
        path = '/api/v1/social/animals/' + str(animal.pk)
        update = self.member.patch(path, {'description': 'Updated private care note', 'verificationEvidenceIds': [str(asset.pk)], 'expectedVersion': 1}, format='json')
        self.assertEqual(update.status_code, 200, update.data)
        self.assertEqual(update.data['reviewState'], 'pending')
        self.assertEqual(self.public.get(path).status_code, 404)
        self.assertEqual(self.member.get(path).status_code, 200)
        info.refresh_from_db()
        self.assertEqual(list(info.private_evidence.values_list('pk', flat=True)), [asset.pk])
        self.assertEqual(self.member.delete('/api/v1/media/' + str(asset.pk)).status_code, 409)
        item = self.staff.get('/api/v1/moderation', {'state': 'pending'}).data['results'][0]
        self.assertEqual(item['evidenceIds'], [str(asset.pk)])
        self.assertFalse(item['canVerify'])
        clear = self.member.patch(path, {'verificationEvidenceIds': [], 'expectedVersion': info.version}, format='json')
        self.assertEqual(clear.status_code, 200, clear.data)
        self.assertFalse(info.private_evidence.exists())

    def test_last_withdrawn_photo_becomes_private_but_shared_public_use_is_preserved(self):
        from media.models import Asset
        asset = Asset.objects.create(owner=self.author, alt='Generated illustration', sha256='1' * 64, perceptual_hash='', width=100, height=100, byte_count=100, public=True, derivative='retained-test.jpg', purpose='public_image')
        first = Post.objects.create(author=self.author, text='First public use')
        second = Post.objects.create(author=self.author, text='Other public use')
        first.photos.add(asset)
        second.photos.add(asset)
        self.assertEqual(self.member.delete('/api/v1/community/posts/' + str(first.pk)).status_code, 204)
        asset.refresh_from_db()
        self.assertTrue(asset.public)
        self.assertEqual(self.member.delete('/api/v1/community/posts/' + str(second.pk)).status_code, 204)
        asset.refresh_from_db()
        self.assertFalse(asset.public)

    def test_campaign_update_text_has_no_publication_post_and_photo_requires_review(self):
        from media.models import Asset
        from social.models import Campaign, CampaignUpdate
        campaign = Campaign.objects.create(slug='generated-care', title='Generated care', story='Fixture only', category='community', organizer=self.author, location={}, goal_minor=10000, state='active', is_fixture=True)
        path = '/api/v1/fundraisers/' + str(campaign.pk) + '/updates'
        text = self.member.post(path, {'text': 'Generated planning note', 'mediaIds': []}, format='json')
        self.assertEqual(text.status_code, 201, text.data)
        self.assertIsNone(text.data['publicationPostId'])
        self.assertTrue(CampaignUpdate.objects.get(pk=text.data['id']).is_fixture)
        photo = Asset.objects.create(owner=self.author, alt='Generated illustration', sha256='2' * 64, perceptual_hash='', width=100, height=100, byte_count=100, public=False, purpose='public_image')
        result = self.member.post(path, {'text': 'Generated photo note', 'mediaIds': [str(photo.pk)]}, format='json')
        self.assertEqual(result.status_code, 201, result.data)
        post = Post.objects.get(pk=result.data['publicationPostId'])
        self.assertEqual(post.moderation, 'pending')
        self.assertTrue(post.is_fixture)
        self.assertEqual(len(self.public.get('/api/v1/fundraisers/' + str(campaign.pk)).data['updates']), 1)
        post.moderation = 'published'
        post.text = 'Reviewed photo note'
        post.save(update_fields=['moderation', 'text'])
        updates = self.public.get('/api/v1/fundraisers/' + str(campaign.pk)).data['updates']
        self.assertEqual(len(updates), 2)
        self.assertEqual(updates[0]['text'], 'Reviewed photo note')
        self.member.delete('/api/v1/community/posts/' + str(post.pk))
        self.assertEqual(len(self.public.get('/api/v1/fundraisers/' + str(campaign.pk)).data['updates']), 1)

    def test_generated_adoption_draft_and_submission_keep_fixture_provenance(self):
        from animals.models import Animal
        from social.models import AnimalInfo, Shelter, AdoptionApplication
        shelter = Shelter.objects.create(slug='generated-shelter', name='Generated shelter', location={}, owner=self.reviewer, published=True, is_fixture=True)
        animal = Animal.objects.create(owner=self.reviewer, name='Fixture cat', slug='fixture-cat', species='cat')
        AnimalInfo.objects.create(animal=animal, caretaker=self.reviewer, shelter=shelter, location={}, published=True, adoptable=True, status='sheltered', is_fixture=True)
        answers = {'fullName': 'Generated applicant', 'email': 'applicant@example.invalid', 'phone': '00000000000', 'livingSituation': 'Generated home', 'careExperience': 'Generated experience', 'motivation': 'Fixture workflow only', 'agreement': True}
        draft = self.member.put('/api/v1/adoption/drafts/' + str(animal.pk), {'animalId': str(animal.pk), 'answers': answers}, format='json')
        self.assertEqual(draft.status_code, 200, draft.data)
        self.assertTrue(AdoptionApplication.all_objects.get(pk=draft.data['id']).is_fixture)
        result = self.member.post('/api/v1/adoption/applications', {'animalId': str(animal.pk), 'draftId': draft.data['id'], 'expectedVersion': draft.data['expectedVersion'], 'answers': answers}, format='json')
        self.assertEqual(result.status_code, 201, result.data)
        self.assertTrue(AdoptionApplication.all_objects.get(pk=result.data['id']).is_fixture)
