from .models import GalleryState

def lock_gallery():
    # Every writer and accepting transaction takes this lock before observation/animal locks.
    GalleryState.objects.get_or_create(pk=1)
    return GalleryState.objects.select_for_update().get(pk=1)
