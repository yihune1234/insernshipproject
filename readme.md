<div align="center">

<h1>Digital Credentials Wallet System</h1>

<p>
  <strong>A comprehensive verifiable credentials platform</strong><br>
  for issuing, holding, presenting, and verifying <strong>W3C-aligned digital credentials</strong>.
</p>

<p>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://www.djangoproject.com/"><img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django"></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
  <a href="https://jwt.io/"><img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT"></a>
</p>

<p>
  <em>Prepared and edited from the original document by <strong>Yihune B.,Bealu G,Yohannes G,</strong></em>
</p>

<br>

</div>

<!-- Badges row end -->

## Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Core Features](#core-features)
- [User Portals](#user-portals)
- [Database Design](#database-design)
- [API Structure](#api-structure)
- [Security](#security)
- [Getting Started](#getting-started)
- [Testing the Federated Flow](#testing-the-federated-flow)
- [Installation](#installation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Future Enhancements](#future-enhancements)
- [Documentation](#documentation)
- [Summary](#summary)

---

## System Overview

The **Digital Wallet System** is an enterprise-grade platform designed to issue, store, share, and verify **verifiable credentials** — enabling trusted digital interactions among issuers, holders, verifiers, and administrators **without paper-based workflows**.

### Core Purpose

Replace slow, manual, error-prone credential processes with **cryptographically secure, privacy-respecting digital credentials** that are:

- Easy to issue  
- Easy to validate  
- Tamper-proof and immutable  
- Interoperable across platforms  
- Fully controlled by the credential holder

### Key Capabilities

| Capability       | Description                                                                |
|------------------|----------------------------------------------------------------------------|
| **Issuance**     | Organizations issue digital credentials (degrees, licenses, certificates)  |
| **Storage**      | Holders securely store credentials in their personal digital wallet        |
| **Presentation** | Holders selectively share credentials with verifiers                       |
| **Verification** | Verifiers validate authenticity & revocation status in real-time           |
| **Revocation**   | Issuers can revoke credentials that are no longer valid                    |
| **Audit**        | Full traceable logs for system administrators                              |

---

## Architecture

### High-Level Layers

1. **Frontend** — Web + Mobile apps (role-specific)  
2. **API Gateway** — Django REST Framework + JWT authentication  
3. **Business Logic** — Users, Organizations, Credentials, Auditing  
4. **Data Access** — Django ORM  
5. **Database** — PostgreSQL (production) / SQLite (development)

### System Components

| Component              | Technology                        | Responsibility                                      |
|------------------------|-----------------------------------|-----------------------------------------------------|
| Backend API            | Django + DRF                      | Business logic, persistence, auth                   |
| Frontend Applications  | React.js • React Native • Tailwind CSS | Role-specific UI/UX (web + mobile)            |
| Database               | PostgreSQL or SQLite              | Structured persistent storage                       |
| Authentication         | JWT + SimpleJWT                   | Secure, stateless sessions                          |
| DID Management         | Custom implementation             | Support for decentralized identifiers               |

---

## Technology Stack

### Backend

- Django **6.0**  
- Django REST Framework **3.15+**  
- Simple JWT  
- PostgreSQL **14+** (prod) • SQLite (dev)  
- Redis (optional caching)  
- Celery (optional background tasks)  
- Docker + Docker Compose  
- Gunicorn + Nginx

### Frontend

- React.js  
- React Native  
- Tailwind CSS  
- JavaScript / TypeScript  
- Fetch API or Axios  
- Token-based authentication

---

## Core Features

### 1. Multi-Actor Roles

- **Admin** — system-wide management, audit, configuration  
- **Holder** — credential wallet, requests, presentations  
- **Issuer** — credential approval, issuance, revocation  
- **Verifier** — credential validation, history, bulk support

### 2. Full Credential Lifecycle

1. Request credential  
2. Review & approval  
3. Issuance  
4. Secure storage in wallet  
5. Presentation  
6. Verification  
7. Revocation / expiration

### 3. Standards Alignment

- W3C Verifiable Credentials Data Model  
- Decentralized Identifiers (DIDs)  
- Selective disclosure support  
- Real-time status & revocation checks

---

## User Portals

Modern web + mobile interfaces built with **React** family.

### 🛠 Admin Portal
- Manage users, organizations, issuers, verifiers  
- Approve entities  
- Audit log viewer  
- System configuration

### 👤 Holder Wallet
- View & organize credentials  
- Request new credentials  
- Create presentations  
- Status tracking

### 🏭 Issuer Portal
- Review credential requests  
- Issue & sign credentials  
- Revoke / suspend credentials  
- Issuance analytics

### 🔍 Verifier Portal
- Submit & verify credentials  
- View verification results  
- History & audit trail  
- Bulk verification support

---

## Database Design

**30+ table normalized schema** covering:

- Lookup / domain tables  
- Core entities (users, orgs, credentials)  
- Profiles & relationships  
- Transactions & audit logs

### Design Principles

| Principle              | How it's implemented                              |
|------------------------|---------------------------------------------------|
| 3NF                    | No redundancy, clean relational structure         |
| Referential Integrity  | Foreign keys + constraints                        |
| UUID Primary Keys      | Distributed-system friendly                       |
| Business Unique Keys   | Email, DID, etc. enforced unique                  |
| Audit Timestamps       | created_at, updated_at on most models             |
| Soft Deletes           | is_active flag instead of hard delete             |
| Extensible Metadata    | JSON / JSONB fields for flexibility               |

---

## API Structure

### Authentication

| Endpoint                        | Method | Description                          |
|---------------------------------|--------|--------------------------------------|
| `/api/users/login/`             | POST   | Obtain JWT access & refresh tokens   |
| `/api/users/token/refresh/`     | POST   | Refresh access token                 |
| `/api/users/register/`          | POST   | Register new holder                  |
| `/api/users/me/`                | GET    | Current authenticated user profile   |

### Admin Routes

| Endpoint                        | Method | Description                          |
|---------------------------------|--------|--------------------------------------|
| `/api/issuers/register/`        | POST   | Register new issuer                  |
| `/api/issuers/list/`            | GET    | List all issuers                     |
| `/api/verifiers/register/`      | POST   | Register new verifier                |
| `/api/verifiers/list/`          | GET    | List all verifiers                   |
| `/api/audit/logs/`              | GET    | System audit logs                    |

### Issuer Routes

| Endpoint                        | Method | Description                          |
|---------------------------------|--------|--------------------------------------|
| `/api/credentials/requests/`    | GET    | Pending requests                     |
| `/api/credentials/issue/`       | POST   | Issue credential                     |
| `/api/credentials/revoke/`      | POST   | Revoke credential                    |
| `/api/credentials/`             | GET    | List issued credentials              |

### Holder Routes

| Endpoint                        | Method | Description                          |
|---------------------------------|--------|--------------------------------------|
| `/api/credentials/`             | GET    | My credentials                       |
| `/api/credentials/request/`     | POST   | Request new credential               |
| `/api/presentations/create/`    | POST   | Create presentation                  |
| `/api/presentations/`           | GET    | My presentations                     |

### Verifier Routes

| Endpoint                        | Method | Description                          |
|---------------------------------|--------|--------------------------------------|
| `/api/verifications/verify/`    | POST   | Verify credential                    |
| `/api/verifications/history/`   | GET    | Verification history                 |
| `/api/verifications/bulk/`      | POST   | Bulk verification                    |

---

## Security

- HTTPS / TLS everywhere  
- JWT authentication (SimpleJWT)  
- Argon2 / PBKDF2 password hashing  
- Role-based & organization-level authorization  
- Field-level encryption for sensitive data  
- Credential cryptographic integrity checks  
- Django ORM SQL injection protection  
- Comprehensive audit logging

---

## Getting Started

### Prerequisites

Ensure the following are installed before proceeding:

- **Node.js** 20+
- **Python** 3.12+
- **Docker**
- **Docker Compose**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/digital-credential-wallet.git
cd digital-credential-wallet
```

### 2. Configure Environment Files

Copy each service's example environment file and fill in the required values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp mobile/.env.example mobile/.env
cp mock_org_api/.env.example mock_org_api/.env
```

> **Important — `backend/.env`:**
> - `ENCRYPTION_KEY` must be exactly **32 hex bytes** (64 hex characters), e.g. generated with `openssl rand -hex 32`.
> - `SECRET_KEY` must be changed from the default before running in any shared or production environment.

### 3. Start All Services

```bash
docker compose up --build
```

This starts the backend, frontend, database, and mock org API together.

### 4. Run Database Migrations

```bash
docker compose exec backend python manage.py migrate
```

### 5. Create a Superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

### 6. Access the Platform

| Service        | URL                                              |
|----------------|--------------------------------------------------|
| Platform       | http://localhost:3000                            |
| Issuer portal  | http://localhost:3000/issuer                     |
| Admin portal   | http://localhost:3000/admin                      |
| Backend API    | http://localhost:8000/api                        |
| Mock Org API   | http://localhost:4000                            |
| API docs       | http://localhost:8000/api/schema/swagger-ui/     |

### 7. Seed Test Data (Optional)

```bash
docker compose exec backend python manage.py shell -c 'exec(open("seed_test_data.py").read())'
```

### 8. Test API Key for Mock Org API

The mock org API is pre-configured with a test key defined in `mock_org_api/.env`:

```
test-api-key-change-me
```

Use this key as the `Authorization` header value (or as configured) when making requests to `http://localhost:4000`.

### Quick Development Setup (Without Docker)

If you prefer to run services individually without Docker:

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Mock Org API**
```bash
cd mock_org_api
npm install
npm start
```

---

## Testing the Federated Flow

The **mock org API** running at `http://localhost:4000` simulates an external organization's member database. It allows you to test the full federated credential issuance flow without needing a real third-party integration.

### How it works

1. The issuer portal connects to the mock org API to look up a member by their member ID.
2. If the member is found and the API key is valid, the issuer can proceed to issue a credential linked to that member's identity.

### Available Test Members

Test member records are defined in `mock_org_api/members.json`. Open that file to see the member IDs and associated data you can use during testing.

### Configuring the Issuer Portal

1. Navigate to the issuer portal at `http://localhost:3000/issuer`.
2. In the organization / integration settings, set the **Mock Org API URL** to `http://localhost:4000`.
3. Set the **API key** to the value of `TEST_API_KEY` from `mock_org_api/.env` (default: `test-api-key-change-me`).

### Running a Federated Issuance

1. Log in as an issuer.
2. Initiate a credential request for a holder.
3. Enter a member ID from `mock_org_api/members.json` when prompted for federation lookup.
4. The issuer portal queries the mock org API, retrieves the member's data, and pre-fills the credential fields.
5. Approve and issue the credential.

---

## Installation – Quick Start

```bash
git clone https://github.com/yourusername/digital-wallet-system.git
cd digital-wallet-system

# Create & activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

cd DigitalWallet
pip install -r requirements.txt

# Apply migrations & create test data
python manage.py migrate
python manage.py seed_org_types
python manage.py create_test_users

# Start server
python manage.py runserver

**Default local API URL:**  
`http://127.0.0.1:8000`

### Default Test Accounts

| Role     | Email                      | Password     | Web route (after login)       |
|----------|----------------------------|--------------|-------------------------------|
| Admin    | admin@system.com           | admin123     | `/admin/dashboard`            |
| Holder   | holder@example.com         | password123  | `/holder/dashboard`           |
| Issuer   | issuer@university.edu      | password123  | `/issuer/dashboard`           |
| Verifier | verifier@government.gov    | password123  | `/verifier/dashboard`         |

Create these accounts with: `python manage.py create_test_users` (from `backend2/`).

## Deployment

### Production Setup

A typical production deployment includes:

- **Nginx** as the reverse proxy  
- **Gunicorn** as the application server  
- **Django** as the backend service  
- **PostgreSQL** as the primary database  
- Static asset hosting for frontend resources  

### Docker Deployment

```bash
docker-compose up -d
docker-compose exec web python manage.py migrate



## Summary

The **Digital Wallet System** is presented as a complete platform for issuing and verifying digital credentials across multiple user roles.

Its main strengths are:

- Role-based workflows  
- Full credential lifecycle management  
- Standards-oriented design (W3C VC alignment)  
- Security model built around authentication, authorization, and auditing  

This README improves readability, removes broken character encoding, and presents the original content in a cleaner, more consistent, and professionally attractive format.

**Prepared with care in Addis Ababa • March 2026**  
**Yihune, Bealu G,Yohannes**

---

> "Empowering trust through secure digital credentials."
