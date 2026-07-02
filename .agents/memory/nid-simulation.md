---
name: NID Simulation Mode
description: How the National ID service works in dev without an external MOSIP/Fayda server.
---

## Rule
`NationalIDService` in `backend2/identity/services/nid_integration/national_id_service.py` has a built-in simulation that activates when `settings.NID_SIMULATION_MODE = True` (default when `DJANGO_ENV != production`).

**Why:** The real Fayda/MOSIP server runs at `http://localhost:8001/nid` and is not available in Replit. The simulation must be bypassed only by setting `NID_SIMULATION_MODE=False` in `.env`.

## How to apply
- `check_fin(fin)` → validates FIN length ≥ 6, returns masked phone. No external call.
- `verify_otp(fin, otp)` → accepts **any 6-digit numeric OTP** (e.g. `000000`). 
- `get_profile(fin)` → returns citizen from `_SIMULATED_CITIZENS` dict; generates synthetic data for unknown FINs.
- Canonical test FINs: `123456789012` (= test holder), `ETH001234567`, `TEST001`, `TEST002`, `TEST12345678`.
- OTP hint is printed to Django console on every `nid/initiate/` call.
- External-service fallback: even when `NID_SIMULATION_MODE=False`, if the HTTP call fails, the service gracefully falls back to simulation. Circuit breaker opens after 3 consecutive failures (60s window).
