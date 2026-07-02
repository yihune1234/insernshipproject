# Test Users & Login Credentials

## 🔑 Common Password for ALL Test Accounts

```
TestPass123!
```

---

## 👥 Users by Role

### 🛡️ Admin User

| Email | Name | Role | Access |
|-------|------|------|--------|
| admin@credwallet.et | System Administrator | Admin | Full platform access, all organizations |

**Admin Features:**
- View all organizations and integrations
- Manage users and roles
- Approve organization registrations
- View system audit logs
- Configure trust levels
- Access admin dashboard at `/admin`

---

### 🏢 Issuer Users

| Email | Organization | Name | Access |
|-------|---------------|------|--------|
| aau.issuer@credwallet.et | Addis Ababa University | AAU Admin | Manage org integrations & syncs |
| corp.issuer@credwallet.et | TestCorp Ltd | TestCorp HR Admin | Manage org integrations & syncs |
| gov.issuer@credwallet.et | Ministry of Finance | Ministry Admin | Manage org integrations & syncs |
| hospital.issuer@credwallet.et | City Hospital | City Hospital Admin | Manage org integrations & syncs |

**Issuer Features:**
- View organization dashboard
- Manage integration settings
- Trigger credential synchronization
- Check integration health
- View sync history & analytics
- Monitor connected organizations
- Portal: `/issuer/dashboard`

**Organizations & Integrations:**

| Organization | Type | API URL | Trust Level | Credentials |
|--------------|------|---------|------------|-------------|
| Addis Ababa University | University | http://localhost:3001 | High Trust (4) | 5 synced |
| TestCorp Ltd | Private Company | http://localhost:3001 | Trusted (3) | 3 synced |
| Ministry of Finance | Government Agency | http://localhost:3001 | Government (5) | 2 synced |
| City Hospital | Hospital | http://localhost:3001 | Trusted (3) | 1 synced |

---

### ✅ Verifier Users

| Email | Organization | Name | Access |
|-------|---------------|------|--------|
| verify1@credwallet.et | EduVerify Agency | EduVerify Inspector | Verify credentials |
| verify2@credwallet.et | TrustCheck Corp | TrustCheck Analyst | Verify credentials |

**Verifier Features:**
- Verify holder credentials
- Access verification history
- View verification analytics
- Manage API keys
- Portal: `/verifier/dashboard`

---

### 👤 Holder Users

| Email | Name | NID | Credentials | Access |
|-------|------|-----|-------------|--------|
| amara.osei@holder.et | Amara Osei | NID-1234567890 | 2 active | View & manage credentials |
| kwabena.mensah@holder.et | Kwabena Mensah | NID-0987654321 | 2 active | View & manage credentials |
| aba.ansah@holder.et | Aba Ansah | NID-1111111111 | 1 active | View & manage credentials |
| kofi.asante@holder.et | Kofi Asante | NID-2222222222 | 2 active | View & manage credentials |
| efua.boateng@holder.et | Efua Boateng | NID-3333333333 | 1 active, 1 expired | View & manage credentials |

**Holder Features:**
- View credentials in wallet
- Request new credentials
- Share credentials with verifiers
- View verification history
- Manage wallet settings
- Portal: `/holder/dashboard`

---

## 🔐 Login Instructions

### Web Frontend

1. **Navigate to Login:** http://localhost:5001/login

2. **Enter Credentials:**
   - Email: `[email from table above]`
   - Password: `TestPass123!`

3. **Dashboard Access (by role):**
   - Admin: `/admin`
   - Issuer: `/issuer/dashboard`
   - Verifier: `/verifier/dashboard`
   - Holder: `/holder/dashboard`

### Mobile App (Web)

1. **Open Mobile Web:** http://localhost:18115

2. **Login:**
   - Enter email
   - Enter password: `TestPass123!`

3. **Note:** Same users can login on mobile

---

## 📊 Test Data Overview

### Total Users: 13

| Role | Count | Status |
|------|-------|--------|
| Admin | 1 | Active |
| Issuer | 4 | Active |
| Verifier | 2 | Active |
| Holder | 5 | Active |
| **Total** | **12** | **Active** |

### Organizations: 6

| Type | Count |
|------|-------|
| Issuer Orgs | 4 |
| Verifier Orgs | 2 |
| **Total** | **6** |

### Credentials: 11

| Status | Count |
|--------|-------|
| Active | 9 |
| Revoked | 1 |
| Expired | 1 |
| **Total** | **11** |

---

## 🧪 Testing Scenarios

### Scenario 1: Issuer Portal (Integration Management)

1. **Login as issuer:**
   - Email: `aau.issuer@credwallet.et`
   - Password: `TestPass123!`

2. **View Dashboard:**
   - See organization integration metrics
   - View connected organizations
   - Check synchronization status

3. **Manage Integrations:**
   - Go to `/issuer/integrations`
   - View Addis Ababa University integration
   - Check health status (Healthy)
   - Trigger sync if needed
   - View sync history

4. **Check Analytics:**
   - Go to `/issuer/analytics`
   - View sync activity statistics
   - See credentials synced
   - Review sync history by organization

### Scenario 2: Holder Wallet

1. **Login as holder:**
   - Email: `amara.osei@holder.et`
   - Password: `TestPass123!`

2. **View Credentials:**
   - Dashboard shows wallet credentials
   - View credential details
   - See issuing organization
   - Check expiration status

3. **Share Credentials:**
   - Request verifier to check credential
   - Manage credential shares
   - View verification history

### Scenario 3: Verifier Verification

1. **Login as verifier:**
   - Email: `verify1@credwallet.et`
   - Password: `TestPass123!`

2. **Verify Credentials:**
   - Use verifier portal to verify credentials
   - Input holder national ID or credential ID
   - View verification result
   - Check verification history

3. **API Keys:**
   - View API keys for programmatic access
   - Integrate with external systems

### Scenario 4: Admin Management

1. **Login as admin:**
   - Email: `admin@credwallet.et`
   - Password: `TestPass123!`

2. **Admin Panel:**
   - Access `/admin` (Django admin)
   - View all organizations
   - Manage users
   - View audit logs
   - Configure system settings

---

## 🔄 Integration Testing

### Sync Credentials Flow

1. **Login as issuer:** `aau.issuer@credwallet.et`

2. **Go to Integrations:** `/issuer/integrations`

3. **Click "Sync Now":**
   - System pulls credentials from org API
   - Updates credential status
   - Shows sync result

4. **View Sync History:**
   - See all past syncs
   - Check processed count
   - Review any errors

### Credential Verification Flow

1. **Login as holder:** `amara.osei@holder.et`

2. **View Credentials:** `/holder/credentials`

3. **Share credential:**
   - Get share link
   - Send to verifier

4. **Login as verifier:** `verify1@credwallet.et`

5. **Verify:** `/verifier/verify`
   - Enter credential details
   - Verify authenticity
   - Check holder identity

---

## 📱 API Testing

### Login to API

**Endpoint:** `POST /api/auth/login/`

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aau.issuer@credwallet.et",
    "password": "TestPass123!"
  }'
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Use Token for Integration API

**Endpoint:** `GET /api/integration/configs/`

```bash
curl -X GET http://localhost:8000/api/integration/configs/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

---

## ⚙️ Reset Test Data

To reset all test data and start fresh:

```bash
cd backend
source venv/bin/activate
python manage.py seed_test_data --reset
```

This will:
1. Delete all test users and data
2. Recreate fresh test data
3. Reset all credentials and syncs

---

## ✨ Test Data Features

### Realistic Test Organizations

- **Addis Ababa University** — Education institution, high trust level, 5 credentials
- **TestCorp Ltd** — Corporate employer, 3 employment credentials
- **Ministry of Finance** — Government agency, highest trust, 2 credentials
- **City Hospital** — Healthcare provider, 1 medical credential

### Diverse Credential States

- ✅ **Active Credentials** — Currently valid
- 🔄 **Synced Credentials** — From organization APIs
- ❌ **Revoked Credential** — TestCorp-EMP-003
- ⏰ **Expired Credential** — AAU student enrollment from 2023

### Holder Scenarios

- **Regular Holders** — 2-3 active credentials each
- **Mixed Status** — One holder with both active & expired credentials
- **NID Integration** — All holders have verified NIDs for organization matching

---

## 🔐 Security Notes

⚠️ **Test Credentials Only** — Never use these in production

- All test passwords are simple for development
- Never commit these to production environments
- Disable all test accounts before going live
- Use strong passwords in production

---

## 🚀 Quick Login Links

**Local Environment (port 5001):**

| Role | Link |
|------|------|
| Admin | [http://localhost:5001/login](http://localhost:5001/login) (admin@credwallet.et) |
| Issuer | [http://localhost:5001/login](http://localhost:5001/login) (aau.issuer@credwallet.et) |
| Verifier | [http://localhost:5001/login](http://localhost:5001/login) (verify1@credwallet.et) |
| Holder | [http://localhost:5001/login](http://localhost:5001/login) (amara.osei@holder.et) |

---

## 📞 Support

If you need to:

- **Reset test data:** Run `python manage.py seed_test_data --reset`
- **Add more users:** Edit seed_test_data command and add to users list
- **Modify organizations:** Edit seed_test_data command in `_seed_organizations()`
- **Change password:** Use Django shell: `python manage.py shell`

---

All test data is ready! Start testing the system with these accounts. ✅
