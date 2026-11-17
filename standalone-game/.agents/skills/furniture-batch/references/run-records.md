# Explicit run records

Use the studio launcher path supplied by the owner/orchestrator. Examples below
use `/path/to/studio/studio.py` as a placeholder, not an installed global command.
The registry and records are local to that studio clone and are not committed.

```bash
python3 /path/to/studio/studio.py task start pawtrail candles
python3 /path/to/studio/studio.py task stage RUN_ID authoring started
# Perform the actual authoring command, then inspect its result.
python3 /path/to/studio/studio.py task stage RUN_ID authoring completed --evidence assets/furniture-studio/sprites/candles/manifest.json
python3 /path/to/studio/studio.py task stage RUN_ID interaction pending --note 'Firefox review is not yet authorized'
python3 /path/to/studio/studio.py task show RUN_ID
```

Use the real 12-character run ID returned by `task start`. Start a stage before
performing it; its recorded elapsed time includes actual waits. A completed
stage requires a preceding start. A pending/blocked/started stage prevents
`task finish`; resolve it honestly or leave the run open. A skipped stage needs
an explicit scope reason, never an invented pass. Keep existing queue/manifest
bookkeeping; this record supplies timing, not a second content inventory.
