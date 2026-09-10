from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
resp = client.post('/api/v1/auth/login', json={'username':'NOLIMITS_PHC','password':'Nolimits@2026'})
print('status_code:', resp.status_code)
try:
    print('json:', resp.json())
except Exception as e:
    print('no json body; text:', resp.text)

# Inspect DB user record and password hash
from app.database.session import SessionLocal
from app.models.models import User
from app.core.security import verify_password

db = SessionLocal()
u = db.query(User).filter(User.username == 'NOLIMITS_PHC').first()
if u:
    print('Found user:', u.username, 'is_active=', u.is_active)
    print('Hashed password (first 60 chars):', (u.hashed_password or '')[:60])
    print('verify_password with Nolimits@2026 ->', verify_password('Nolimits@2026', u.hashed_password))
else:
    print('User not found in DB')
db.close()
