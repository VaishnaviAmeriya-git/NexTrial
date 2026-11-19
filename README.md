# NexTrial: AI-Enabled CTMS for Ayurvedic Clinical Research

[![SIH Problem Statement](https://img.shields.io/badge/SIH%20PS-26046-blue.svg)](https://www.sih.gov.in/)
[![Architecture](https://img.shields.io/badge/Architecture-Microservices%20Docker-brightgreen.svg)]()
[![Design System](https://img.shields.io/badge/Design-GIGW--inspired%20WCAG%202.1%20AA-orange.svg)]()
[![Data Guarantee](https://img.shields.io/badge/Data-100%25%20Synthetic-lightgrey.svg)]()

> **Notice**: NexTrial is an academic research prototype developed as a B.Tech Minor Project (AITR Indore) aligned with Smart India Hackathon (SIH) PS 26046 (*AIIA Clinical Trials Dashboard*). **All data is synthetic.** This system is not an official Government of India portal or accredited medical device.

---

## 1. System Overview

NexTrial is a full-stack, AI-enabled Clinical Trial Management System (CTMS) purpose-built for Ayurvedic clinical research. It solves critical operational bottlenecks in traditional medicine clinical studies:
- **Ayurveda-Specific Clinical Profiling**: Capture of baseline Prakriti, Dosha imbalances (Vriddhi/Kshaya), classical formulations, and Ayurvedic treatment procedures.
- **Explainable Participant Dropout Prediction**: Tree-based Random Forest model with per-participant SHAP TreeExplainer attribution providing coordinators with early warning after Visit 3 of 8.
- **Trial Health Score (THS)**: Continuous 100-point composite score evaluating Enrollment (E), Retention (R), Compliance (C), Safety (S), and Data Quality (Q).
- **Safety Clocks & Pharmacovigilance**: 24-hour SAE initial reporting clocks, 14-day detailed reporting deadlines, WHO-UMC causality assessment, and demo MedDRA coding dictionaries.
- **Regulatory Timeline Tracking**: CTRI registration validation and Institutional Ethics Committee (IEC) expiry alert triggers.
- **Interoperability**: FHIR R4 JSON Bundle export and CDISC/SDTM-inspired CSV archives (DM, AE, EX, and custom AY domain).

---

## 2. Monorepo Architecture

```
NexTrial/
├── docker-compose.yml       # 4-container orchestration (web, api, ml, mongo)
├── .env.example             # Complete environment configuration template
├── README.md                # System documentation & runbook
├── docs/
│   ├── openapi.yaml         # Complete OpenAPI 3.0.3 specification
│   ├── api-contract.md      # API envelopes, RBAC matrix, and error schemas
│   ├── design-system.md     # GIGW-inspired UI tokens, typography, and accessibility
│   ├── DECISIONS.md         # Architecture and implementation decisions log
│   └── demo-walkthrough.md  # 90-second screen-recording evaluator clickpath
├── client/                  # React 18 + Vite + Tailwind CSS + Recharts
├── server/                  # Node.js 20+ + Express + Mongoose + Zod
└── ml-service/              # Python 3.11+ + FastAPI + scikit-learn + SHAP
```

---

## 3. Quick Start (Docker Compose)

The entire application boots with Docker Compose in a single command:

```bash
# 1. Clone repository and enter directory
cd NexTrial

# 2. Copy environment template
cp .env.example .env

# 3. Boot all 4 services (MongoDB, ML service, Express API, React Web)
docker compose up --build
```

### Service Endpoints
| Service | Container Name | URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | `nextrial-web` | [http://localhost:3000](http://localhost:3000) | React SPA with GIGW-inspired UI |
| **API Server** | `nextrial-api` | [http://localhost:5000/api/v1](http://localhost:5000/api/v1) | Express REST API |
| **API Health** | `nextrial-api` | [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health) | System health check |
| **ML Microservice** | `nextrial-ml` | [http://localhost:8000](http://localhost:8000) | FastAPI risk inference engine |
| **ML Health / Docs**| `nextrial-ml` | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI for ML service |
| **Database** | `nextrial-mongo`| `localhost:27017` | MongoDB 7.0 database engine |

---

## 4. Local Development (Without Docker)

You can also run all services directly on your host machine:

### 1. ML Service (FastAPI)
```bash
cd ml-service
python -m pip install -r requirements.txt
python data/generate_synthetic.py
python train.py
uvicorn app.main:app --port 8000 --reload
```

### 2. API Server (Node Express)
```bash
cd server
npm install
npm run seed     # Seeds 6 role users, 3 clinical trials, 300 participants, 60 AEs
npm run dev      # Boots on http://localhost:5000
```

### 3. Frontend (React Vite)
```bash
cd client
npm install
npm run dev      # Boots on http://localhost:3000
```

---

## 5. Seed Users & Role Credentials

Run `npm run seed` in the `server` directory to populate synthetic test accounts:

| Role | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@nextrial.org` | `Admin@NexTrial2026!` | User management, settings, model retraining, global audit log |
| **Coordinator** | `coordinator@nextrial.org` | `Coordinator@NexTrial2026!` | Participant registration, consent, visit schedule tracking |
| **Investigator** | `investigator@nextrial.org` | `Investigator@NexTrial2026!` | AE entry, causality/seriousness review, risk explanations |
| **PV Officer** | `pvofficer@nextrial.org` | `PVOfficer@NexTrial2026!` | MedDRA/Ayurvedic AE coding, SAE 24h reporting clocks |
| **IEC Member** | `iec@nextrial.org` | `IECMember@NexTrial2026!` | Ethics review, approval validity tracking, renewal alerts |
| **DSMB** | `dsmb@nextrial.org` | `DSMBReviewer@NexTrial2026!` | Read-only aggregate safety signals and Trial Health Score |
