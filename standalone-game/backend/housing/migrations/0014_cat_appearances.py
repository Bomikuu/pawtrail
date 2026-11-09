from django.db import migrations,models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies=[('housing','0013_furniture_builds')]
    operations=[migrations.CreateModel(name='PlayerCatAppearance',fields=[
        ('id',models.CharField(primary_key=True,max_length=40,serialize=False)),
        ('name',models.CharField(max_length=64)),
        ('appearance',models.JSONField(default=dict)),
        ('thumbnail',models.TextField(blank=True)),
        ('revision',models.PositiveIntegerField(default=1)),
        ('created',models.DateTimeField(auto_now_add=True)),
        ('updated',models.DateTimeField(auto_now=True)),
        ('owner',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name='cat_appearances',to='housing.playergameprofile')),
    ])]
