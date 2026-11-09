from django.db import migrations

def install(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    statements = [
        "CREATE EXTENSION IF NOT EXISTS postgis",
        "CREATE EXTENSION IF NOT EXISTS vector",
        "ALTER TABLE identity_reference ADD COLUMN embedding_vector vector",
        "CREATE INDEX reference_model_active_idx ON identity_reference(model_version) WHERE active",
        "ALTER TABLE observations_capture ADD COLUMN location_geog geography(Point,4326) GENERATED ALWAYS AS (CASE WHEN latitude IS NULL OR longitude IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint(longitude,latitude),4326)::geography END) STORED",
        "CREATE INDEX capture_location_idx ON observations_capture USING GIST(location_geog)",
    ]
    with schema_editor.connection.cursor() as cursor:
        for statement in statements:
            cursor.execute(statement)

def remove(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("ALTER TABLE identity_reference DROP COLUMN embedding_vector")
        cursor.execute("DROP INDEX IF EXISTS reference_model_active_idx")
        cursor.execute("ALTER TABLE observations_capture DROP COLUMN location_geog")

class Migration(migrations.Migration):
    dependencies = [("identity", "0002_gallerystate"), ("observations", "0002_sighting_content_digest_and_more")]
    operations = [migrations.RunPython(install, remove)]
