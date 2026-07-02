"""
Seed the SQLite database with test data for development.
Run with: cd backend && python ../seed_db.py
"""
import sqlite3, uuid, json
from datetime import datetime

conn = sqlite3.connect('backend/db.sqlite3')
c = conn.cursor()

# Check if org types exist
c.execute('SELECT COUNT(*) FROM organization_types')
if c.fetchone()[0] == 0:
    types = ['University', 'Government Agency', 'Financial Institution', 'Hospital', 'Private Company']
    for t in types:
        tid = uuid.uuid4().hex
        c.execute('INSERT INTO organization_types (id, name, description, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?)',
                  [tid, t, t, 1, datetime.now().isoformat(), datetime.now().isoformat()])
    print('Created organization types')

# Get org type IDs
c.execute('SELECT id, name FROM organization_types')
type_map = dict(c.fetchall())

# Check if orgs exist
c.execute('SELECT COUNT(*) FROM organizations')
if c.fetchone()[0] == 0:
    now = datetime.now().isoformat()
    orgs_data = [
        ('Addis Ababa University', list(type_map.keys())[0], 'University'),
        ('Ministry of Education', list(type_map.keys())[1], 'Government Agency'),
        ('Commercial Bank of Ethiopia', list(type_map.keys())[2], 'Financial Institution'),
    ]
    for name, type_id, _ in orgs_data:
        oid = uuid.uuid4().hex
        email = f'info@{name.lower().replace(" ", "")}.et'
        c.execute('''
            INSERT INTO organizations 
            (id, name, organization_type_id, is_active, created_at, updated_at, 
             organization_did, public_key, private_key_encrypted, status, trust_level,
             document_types, is_authorized_representative, legal_agreement_accepted,
             production_enabled, sandbox_enabled, brand_color, issuer_status,
             notification_preferences, security_settings, email, phone, website,
             contact_person_name, contact_person_email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', [
            oid, name, type_id, 1, now, now,
            f'did:key:z{oid[:24]}', 'pubkey', 'encrypted',
            'approved', 'medium',
            json.dumps([]), 1, 1, 1, 1, '#000000', 'active',
            json.dumps({}), json.dumps({}),
            email, '+251-111-000000',
            f'https://{name.lower().replace(" ", "")}.et',
            'Contact Person', f'contact@{name.lower().replace(" ", "")}.et'
        ])
        print(f'Created org: {name}')
else:
    print('Organizations already exist')

# Create test user accounts
User = ['admin', 'testuser']
for user in User:
    email = f'{user}@example.com'
    c.execute('SELECT COUNT(*) FROM accounts_user WHERE email=?', [email])
    if c.fetchone()[0] == 0:
        uid = uuid.uuid4().hex
        c.execute('''
            INSERT INTO accounts_user 
            (id, password, email, user_status, is_staff, is_superuser, is_active, 
             date_joined, username, first_name, last_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', [uid, 'pbkdf2_sha256$...', email, 'active', 1 if user == 'admin' else 0, 
              1 if user == 'admin' else 0, 1, now, email.split('@')[0], '', ''])
        print(f'Created user: {email}')

conn.commit()
conn.close()
print('Seed complete!')