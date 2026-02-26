import sys
import json
from pathlib import Path

def filter_fixture(in_path, out_path, remove_model):
    p = Path(in_path)
    data = json.loads(p.read_text(encoding='utf-8'))
    filtered = [o for o in data if o.get('model') != remove_model]
    Path(out_path).write_text(json.dumps(filtered, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"Wrote {len(filtered)} objects to {out_path} (removed model={remove_model})")

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print('Usage: python filter_fixture.py input.json output.json app.label')
        sys.exit(1)
    filter_fixture(sys.argv[1], sys.argv[2], sys.argv[3])
