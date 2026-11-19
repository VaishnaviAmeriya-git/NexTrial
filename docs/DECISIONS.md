# NexTrial Architectural & Implementation Decisions

This document records architectural, technical, and domain-specific decisions made for **NexTrial**, an AI-enabled Clinical Trial Management System (CTMS) for Ayurvedic clinical research aligned to Smart India Hackathon PS 26046 (AIIA Clinical Trials Dashboard).

---

## 1. Stack and Monorepo Architecture

- **Stack Chosen (Hard Constraint)**:
  - **Client**: React 18, Vite, Tailwind CSS, React Router v6, TanStack Query v5, Recharts, Lucide React (standard icons).
  - **API Server**: Node.js (20+ / 24+ LTS), Express 4, Mongoose 8, Zod (schema validation), Helmet, bcryptjs, jsonwebtoken, cookie-parser, cors, express-rate-limit.
  - **Database**: MongoDB 7. Supported natively via Docker Compose (`mongo:7.0`) and configurable connection URI for local standalone development.
  - **ML Service**: Python 3.11+ / 3.14+, FastAPI, scikit-learn, pandas, SHAP (TreeExplainer), joblib, pyyaml.
  - **Container Orchestration**: Docker Compose with 4 services (`web`, `api`, `ml`, `mongo`) connected via dedicated bridge network with explicit container health checks.
- **Repository Layout**:
  - `docs/`: OpenAPI spec (`openapi.yaml`), API contract, decisions log, design system, demo walkthrough.
  - `client/`: Single-page application with GIGW-inspired UI.
  - `server/`: REST API server with layered architecture (`config`, `models`, `routes`, `controllers`, `middleware`, `services`, `utils`, `seed`).
  - `ml-service/`: FastAPI service with data generation, model training, SHAP explainability, and inference endpoints.

---

## 2. Regulatory and Compliance Tone

- **Regulatory Neutrality**:
  - All wording uses strictly *"GCP-aligned"*, *"SDTM-inspired export"*, *"FHIR R4 JSON export (prototype)"*, and *"GIGW-inspired design"*.
  - Explicit avoidance of false claims of regulatory certification, ISO accreditation, or official government sanction.
  - Notice banner present on every screen: *"Prototype - synthetic data. Academic project, not an official Government of India website."*
  - Neutral branding: NexTrial stylized logo, no State Emblem of India, no Ashoka Chakra artwork, no official Ministry of Ayush or AIIA logos.
- **Regulatory Timelines & Settings**:
  - Regulatory clock defaults are stored in a dedicated `settings` collection and loaded dynamically:
    - SAE Initial Report Due: **24 hours**
    - SAE Detailed Follow-up Report Due: **14 days**
    - Ethics Committee (IEC) Expiry Warning: **30 days**
    - Data Query Overdue: **14 days**
  - Settings are administrative and configurable via UI/API without code redeployment.

---

## 3. Data Integrity, Synthetic Dictionaries, and Security

- **Synthetic Data Guarantee**:
  - All participants, investigator names, trial records, and adverse events are 100% synthetically generated.
  - No real patient identifiers (PHI/PII) exist in any database or seed file.
  - Synthetic pseudonym format: `NT{trialIndex}-{4-digit-number}` (e.g., `NT01-0042`).
- **Demo Dictionaries (MedDRA & WHODrug Abstraction)**:
  - Real MedDRA and WHODrug are proprietary and licensed.
  - A `CodingService` interface abstracts terminology lookups behind pluggable providers.
  - Included seed dictionaries:
    - ~80 MedDRA-style System Organ Classes (SOC) to Preferred Terms (PT) mappings labeled `DEMO DICTIONARY`.
    - ~40 classical Ayurvedic formulations (e.g., Yogaraja Guggulu, Ashwagandharishta, Triphala Guggulu, Dashamula Kwatha) labeled `DEMO DICTIONARY`.
- **Audit Trail & Soft Deletion**:
  - Immutable audit logs capture: `who`, `what`, `before`, `after`, `when`, `ipAddress`, `userAgent`.
  - No hard deletions are permitted on clinical entities. A `softDeleted: true` flag and query filter enforce retention.
  - For Phase 2 (P2), audit logs incorporate SHA-256 hash chaining (`previousHash` -> `hash`) to ensure tamper-evidence.

---

## 4. Machine Learning & Resiliency Decisions

- **Feature Window & Leakage Prevention**:
  - Prediction point is fixed after **Visit 3 of 8** (Day ~28-42).
  - ML features strictly utilize data available on or before Visit 3: `age`, `sex`, `distance_km`, `missed_visits_so_far`, `visit_compliance_pct`, `ae_count`, `ae_max_severity`.
  - No data computed after Visit 3 is passed to training or inference (zero label leakage).
- **Graceful ML Degradation**:
  - Clinical workflows must never be blocked if the ML service is unreachable.
  - If the FastAPI service times out or fails, API returns `{ riskAvailable: false, message: "Prediction unavailable" }`.
  - Frontend renders a clear, non-blocking status badge: *"Prediction unavailable"* and enables all clinical data entry.
- **Explainability**:
  - Fast tree-based explanations via SHAP (`TreeExplainer`) for each individual prediction, delivering the top 3 contributing factors with positive/negative direction and human-readable clinical actions.

---

## 5. Trial Health Score (THS) Formula

The composite Trial Health Score is computed as:
$$\text{THS} = 100 \times (0.25 E + 0.25 R + 0.20 C + 0.15 S + 0.15 Q)$$
Where each normalized sub-score is bounded in $[0, 1]$:
- $E = \min(1, \text{enrolled} / \text{expectedEnrolledByNow})$ (Enrolment Velocity)
- $R = 1 - (\text{dropouts} / \text{enrolled})$ (Retention Rate)
- $C = \text{visits completed in window} / \text{visits due}$ (Protocol Compliance)
- $S = 1 - \min(1, (\text{SAE} + 0.3 \times \text{severeAE}) / \text{enrolled} \times 5)$ (Safety Score)
- $Q = 1 - (\text{overdueQueries} / \text{totalQueries})$ (Data Quality, defaults to 1 if no queries)

Bands:
- $\ge 80$: **Green (Healthy)**
- $60 - 79$: **Amber (Moderate Attention Required)**
- $< 60$: **Red (Critical Risk)**
