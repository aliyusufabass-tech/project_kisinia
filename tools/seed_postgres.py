import subprocess
import sys
import time

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

# Postgres connection info - matches kisinia_project/settings.py
PG_HOST = 'localhost'
PG_PORT = 5432
PG_USER = 'postgres'
PG_PASSWORD = '1234'
PG_DB = 'kisiniadb'

PYTHON_EXE = sys.executable
MANAGE_PY = 'manage.py'
FIXTURE = 'db_backup_utf8.json'


def run(cmd, **kwargs):
    print('> ' + ' '.join(cmd))
    res = subprocess.run(cmd, **kwargs)
    if res.returncode != 0:
        raise SystemExit(res.returncode)


def main():
    # connect to default db to manage DBs
    conn = None
    try:
        conn = psycopg2.connect(dbname='postgres', user=PG_USER, password=PG_PASSWORD, host=PG_HOST, port=PG_PORT)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        # terminate connections to the target DB
        cur.execute("SELECT pid FROM pg_stat_activity WHERE datname = %s;", (PG_DB,))
        pids = cur.fetchall()
        if pids:
            print(f"Terminating {len(pids)} connections to database {PG_DB}")
            cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s;", (PG_DB,))
            time.sleep(0.2)
        # drop db
        try:
            cur.execute(f"DROP DATABASE IF EXISTS {PG_DB};")
            print(f"Dropped database {PG_DB}")
        except Exception as e:
            print('Drop DB error:', e)
        # create db
        cur.execute(f"CREATE DATABASE {PG_DB} WITH ENCODING 'UTF8' TEMPLATE template0;")
        print(f"Created database {PG_DB}")
        cur.close()
    except Exception as e:
        print('Postgres operation failed:', e)
        sys.exit(1)
    finally:
        if conn:
            conn.close()

    # run migrations and load fixture with env var to disable auto-profile creation
    env = dict(**os.environ)
    env['DISABLE_AUTO_CREATE_PROFILE'] = '1'
    run([PYTHON_EXE, MANAGE_PY, 'migrate'], env=env)

    # load fixture
    run([PYTHON_EXE, MANAGE_PY, 'loaddata', FIXTURE], env=env)

    print('Seeding complete')

if __name__ == '__main__':
    main()
