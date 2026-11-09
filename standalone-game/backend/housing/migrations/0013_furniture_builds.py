import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('housing', '0012_player_abilities')]
    operations = [migrations.CreateModel(name='FurnitureBuild', fields=[
        ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False, editable=False)),
        ('item', models.CharField(max_length=80)),
        ('mode', models.CharField(max_length=12)),
        ('cost', models.PositiveIntegerField(default=0)),
        ('materials', models.JSONField(default=list)),
        ('created', models.DateTimeField(auto_now_add=True)),
        ('ready_at', models.DateTimeField()),
        ('claimed_at', models.DateTimeField(null=True, blank=True)),
        ('player', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='housing.playergameprofile')),
    ])]
