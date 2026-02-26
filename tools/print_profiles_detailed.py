import json
from pathlib import Path
p=Path('db_backup_utf8.json')
data=json.loads(p.read_text(encoding='utf-8'))
profiles=[o for o in data if o.get('model')=='core.userprofile']
print('Found',len(profiles),'core.userprofile entries')
for o in profiles:
    print(json.dumps(o, indent=2, ensure_ascii=False))
    print('---')
