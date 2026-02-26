import json
from pathlib import Path
p=Path('db_backup_utf8.json')
data=json.loads(p.read_text(encoding='utf-8'))
profiles=[o for o in data if o.get('model')=='core.userprofile']
print('Found',len(profiles),'core.userprofile entries')
user_ids = {}
for o in profiles:
    pk=o.get('pk')
    user=o.get('fields',{}).get('user')
    print('PK=',pk,'user=',user)
    user_ids.setdefault(user,0)
    user_ids[user]+=1

dupes = {u:c for u,c in user_ids.items() if c>1}
print('\nDuplicates by user id:',dupes)
