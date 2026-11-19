# NexTrial API Contract & Standards

## 1. Overview
All endpoints are rooted at `/api/v1` and communicate strictly via UTF-8 JSON payloads.

- **Base URL**: `http://localhost:5000/api/v1`
- **Authentication**: Bearer Access Token in `Authorization: Bearer <jwt_token>` (15-minute expiry) + HTTP-only Secure Refresh Cookie `refreshToken` (7-day expiry).
- **Security Headers**: Standard Helmet security headers, strict CORS origin allowlist, rate limiting on all endpoints with stricter thresholds on `/auth/*` (max 10 requests / 15 mins).

---

## 2. Standard Response Envelope

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 128,
    "totalPages": 6
  }
}
```

### Error Response Shape (Hard Requirement)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid participant payload",
    "details": [
      {
        "field": "ayurveda.prakriti",
        "issue": "Expected one of: vata, pitta, kapha, vata-pitta, pitta-kapha, vata-kapha, sama"
      }
    ]
  }
}
```

Standard Error Codes:
- `UNAUTHORIZED`: Missing, expired, or invalid JWT.
- `FORBIDDEN`: Insufficient role or trial access not assigned.
- `NOT_FOUND`: Target entity does not exist or has been soft-deleted.
- `VALIDATION_ERROR`: Zod schema validation failed on request body or parameters.
- `ACCOUNT_LOCKED`: Exceeded 5 consecutive failed login attempts (locked for 30 minutes).
- `ML_SERVICE_UNAVAILABLE`: ML microservice did not respond within timeout (non-blocking fallback).
- `INTERNAL_SERVER_ERROR`: Unhandled exception.

---

## 3. RBAC & Trial Access Matrix

| Role | Permitted Actions |
| :--- | :--- |
| **admin** | User CRUD, global system settings, view all trials, view complete audit logs, ML retraining trigger, full administrative access. |
| **coordinator** | Register/update participants, record consent, generate/update visit schedules, submit deviations, create data queries, view adverse events (read-only). Assigned trials only. |
| **investigator** | All coordinator read rights + log adverse events, assess AE causality/seriousness, approve status transitions, view ML risk predictions and SHAP explanations. Assigned trials only. |
| **pv_officer** | MedDRA/Ayurvedic coding of adverse events, manage SAE reporting clocks, dispatch regulatory alerts. Assigned trials only. |
| **iec_member** | Review ethics applications, record approval/amendment/continuing review decisions, track valid dates and renewal warnings. Assigned trials only. |
| **dsmb** | Read-only access to aggregate safety metrics, safety signals, SAE incidence rates, and Trial Health Score. Assigned trials only. |

### Access Middleware
1. `authenticate`: Verifies JWT from header; attaches `req.user`.
2. `authorize(roles)`: Rejects if `req.user.role` is not in allowed list (403 Forbidden).
3. `requireTrialAccess`: If user is not `admin`, verifies that the target `trialId` is included in `req.user.assignedTrials`.
4. `auditLog(action, entity)`: Intercepts request and records `{ who, what, before, after, when, ipAddress, userAgent }`.
