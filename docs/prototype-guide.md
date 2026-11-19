# NexTrial — Complete Prototype & User Guide

> **Project Name**: NexTrial — AI-Enabled Clinical Trial Management System (CTMS) for Ayurvedic Research  
> **Academic Context**: B.Tech CSE Minor Project, Acropolis Institute of Technology and Research (AITR), Indore  
> **Challenge Alignment**: Smart India Hackathon (SIH) Problem Statement 26046 (AIIA Clinical Trials Dashboard)  
> **Target Audience**: Students, Evaluators, Clinical Coordinators, and Ayush Researchers  

---

## 1. What is NexTrial in Simple Words?

When modern pharmaceutical companies test new medicines, they use specialized software called a **Clinical Trial Management System (CTMS)** to monitor patients, schedule hospital visits, track safety, and submit data to regulators (like CDSCO or FDA).

However, **traditional Ayurvedic clinical research** has unique challenges:
1. **Holistic Ayurvedic Parameters**: Trials must track *Prakriti* (body constitution like Vata, Pitta, Kapha), *Dosha* imbalances, *Agni* (digestive fire), and classical polyherbal formulations with specific *Anupana* (carriers like warm water or honey) and *Panchakarma* procedures.
2. **High Participant Dropout Rates**: Long-duration lifestyle and herbal regimens often experience high dropout rates (patients stopping visits mid-trial), ruining clinical studies.
3. **Regulatory Timelines**: Indian Good Clinical Practice (GCP) and CTRI require strict reporting clocks (such as reporting Serious Adverse Events to Ethics Committees within **24 hours**).

**NexTrial is an intelligent, bilingual, government-grade dashboard prototype** specifically designed for the **All India Institute of Ayurveda (AIIA)** to solve these exact problems.

---

## 2. Who Uses NexTrial? (The 6 Roles)

NexTrial implements **Role-Based Access Control (RBAC)**. What a user sees and can do depends strictly on their role:

| Role | Real-world Equivalent | What they do in NexTrial |
|---|---|---|
| **Admin** | Hospital / IT Administrator | Manages users, adjusts regulatory clock rules, reviews cryptographic audit trails, retrains the AI model. |
| **Coordinator** | Clinical Research Coordinator (CRC) | Registers participants, conducts Ayurvedic intake, schedules visits, contacts patients at risk of dropping out. |
| **Investigator** | Principal Investigator / Ayurvedic Doctor | Reviews medical diagnoses, logs Adverse Events (AEs), determines causality, inspects AI risk predictions. |
| **Ethics Member (IEC)** | Institutional Ethics Committee Member | Approves trial protocols, monitors 30-day ethics validity expirations, inspects urgent 24-hour safety notifications. |
| **PV Officer** | Pharmacovigilance / Safety Officer | Codes reported symptoms using MedDRA medical dictionaries, tracks 24h/14d SAE regulatory clocks. |
| **DSMB Reviewer** | Data & Safety Monitoring Board Member | Independent safety oversight; reviews aggregate blinded/unblinded safety signals without modifying trial data. |

---

## 3. Page-by-Page Walkthrough

### 🔐 1. Login Page (`/login`)
* **Purpose**: Secure authentication portal.
* **What you see**:
  * Saffron accent strip and official GIGW-inspired layout.
  * Email and Password login form.
  * **Quick-Fill Role Buttons**: Six one-click buttons (`Admin`, `Coordinator`, `Investigator`, `IEC Member`, `PV Officer`, `DSMB Reviewer`) to immediately switch roles during a live demonstration without having to memorize passwords.
  * Persistent notice banner reminding everyone that all data is **100% synthetic**.

---

### 📊 2. Executive Dashboard (`/dashboard`)
* **Purpose**: High-level command center giving study directors and doctors an instant birds-eye view of all trials.
* **Key Functions**:
  1. **Top Metric Cards**: Displays total active trials, total enrolled subjects (300 synthetic patients), number of high-risk participants flagged by AI (43 patients), and pending regulatory alerts.
  2. **Trial Focus Selector**: A dropdown menu to switch focus between trials (e.g., Knee Osteoarthritis vs Type 2 Diabetes).
  3. **Trial Health Score (THS) Gauge**: A visual speedometer showing the overall operational health (0–100) of the selected trial.
  4. **AI Risk Stratification Chart**: A bar chart categorizing the cohort into Green (Low Risk), Amber (Medium Risk), and Red (High Risk).
  5. **Enrollment Velocity Chart**: Compares planned recruitment vs actual enrollment over time.
  6. **Live Regulatory Alerts Feed**: Displays real-time warnings (such as SAEs needing reporting within 24 hours).

---

### 📋 3. Clinical Trials Portfolio (`/trials`)
* **Purpose**: Directory of all clinical studies running across the institution.
* **Key Functions**:
  * Search trials by study code (`NT-KNEE-01`), disease condition (*Sandhivata*), or formulation (*Yogaraja Guggulu*).
  * Filter by regulatory status: `Draft`, `IEC Pending`, `Approved`, `CTRI Registered`, `Active`, or `Closed`.
  * **Register New Trial Button**: Coordinators and Admins can launch a new trial by entering the trial title, phase, target enrollment, and protocol version.

---

### 🔬 4. Trial Detail Page (`/trials/:id`)
* **Purpose**: The core workspace for a specific study, organized into **7 specialized tabs**:
  1. **Overview & Health Score**: Shows the protocol milestones timeline (e.g., Ethics Clearance, FPI, Interim Analysis) and the mathematical breakdown of the Trial Health Score.
  2. **Regulatory (CTRI & IEC)**: Displays the CTRI registration number (with strict format validation: `CTRI/YYYY/MM/NNNNNN`) and Ethics Committee approvals, warning if approval expires within 30 days.
  3. **Participants Tab**: Complete roster of enrolled subjects. Contains the **3-Step Ayurvedic Intake Form** (Step 1: Age/Gender/Distance, Step 2: Prakriti & Doshas, Step 3: Study Arm & Informed Consent).
  4. **Visit Protocol**: Defines the exact schedule of visits (Visit 1 to 8), day offsets, and compliance windows (±3 days).
  5. **Safety (AE & SAE Clocks)**: Complete list of adverse reactions, with an active **countdown clock** for Serious Adverse Events (SAEs).
  6. **Deviations & Queries**: Tracks protocol violations and clinical data clarification queries raised by monitors.
  7. **FHIR & SDTM Exports**: One-click download buttons to export the entire trial into international formats.

---

### 👥 5. Participants & Ayurvedic Profiles (`/participants`)
* **Purpose**: Master patient registry tracking clinical and Ayurvedic baselines.
* **Key Functions**:
  * Protects patient privacy by using GCP-compliant pseudonyms (e.g., `NT01-0042`) instead of real names.
  * Search and filter by *Prakriti* constitution (*Vata-Kapha*, *Pitta-Kapha*, *Sama*, etc.).
  * Displays demographic info, travel distance to the hospital, and current clinical status (`Enrolled`, `Active`, `Completed`, `Withdrawn`).

---

### 🧘 6. Participant Detail & Explainable AI Profile (`/participants/:id`)
* **Purpose**: Complete clinical chart of an individual patient.
* **Key Functions**:
  1. **Ayurveda Clinical Profile**: Shows baseline *Prakriti*, active *Dosha* imbalance (*Vata Vriddhi*), prescribed classical formulation, dosage with *Anupana*, and *Panchakarma* procedures (e.g., *Janu Basti*).
  2. **Explainable ML Dropout Risk Card**:
     * Calculates the probability (%) of the patient dropping out before study completion.
     * **SHAP Attribution Bars**: Instead of a "black box" prediction, it clearly explains **WHY** the AI flagged them (e.g., *"Living 24.5 km away increases dropout risk by +34%"*, *"100% visit compliance decreases risk by -22%"*).
     * **Actionable Advice**: Recommends coordinator steps (e.g., *"Offer tele-consultation or travel reimbursement"*).
  3. **Informed Consent Card**: Documents written consent version, date, and witness. Allows consent withdrawal with an audit trail.
  4. **Visit Adherence Calendar**: Displays all 8 visits. Coordinators can click **"✔ Attend"** or **"✖ Missed"** to record live clinical visits.

---

### 🚨 7. At-Risk Worklist (`/at-risk`)
* **Purpose**: Proactive triage list for Clinical Coordinators to prevent trial failure.
* **Key Functions**:
  * Instead of waiting for patients to miss appointments and drop out, this page sorts all 300 patients from highest risk to lowest risk.
  * Shows the primary driver behind their risk and allows coordinators to click into their profile to contact them before their next scheduled visit.

---

### 🛡️ 8. Safety & Pharmacovigilance (`/safety`)
* **Purpose**: Dedicated workspace for Pharmacovigilance Officers and Doctors to monitor patient safety.
* **Key Functions**:
  * **24-Hour SAE Clock**: Under Indian clinical trial regulations, any hospitalization or death must be reported to the Ethics Committee within 24 hours. The page highlights expiring clocks in pulsing red.
  * **WHO-UMC Causality Assessment**: Classifies whether an adverse reaction was caused by the Ayurvedic formulation (*Certain*, *Probable*, *Possible*, *Unlikely*).
  * **Demo MedDRA Coding Assistant**: Allows the safety officer to type free-text symptoms (e.g., "stomach burn") and map them to standard international medical terms (e.g., *Dyspepsia* / *Gastrointestinal Disorders*).

---

### 🔔 9. Regulatory Alerts Centre (`/alerts`)
* **Purpose**: Centralized notification inbox for study monitors.
* **Key Functions**:
  * Aggregates critical system warnings:
    * ⚠️ **24-Hour SAE Deadlines** approaching.
    * ⚠️ **IEC Ethics Approvals** expiring in less than 30 days.
    * ⚠️ **High Dropout Risk** notifications for newly flagged patients.
  * Staff can click **"Acknowledge"** to verify that the alert has been seen and addressed.

---

### 📦 10. Interoperability & Data Exports (`/exports`)
* **Purpose**: Bridge Ayurvedic clinical research with global modern medicine databases.
* **Key Functions**:
  * **FHIR R4 JSON Export**: Downloads standard HL7 FHIR bundles containing `ResearchStudy`, pseudonymized `Patient`, `AdverseEvent`, and `Observation` resources.
  * **CDISC SDTM-Inspired CSV Export**: Downloads standard pharmaceutical submission datasets:
    * `DM.csv`: Demographics (age, sex, arm)
    * `AE.csv`: Adverse Events
    * `EX.csv`: Exposure / Formulations administered
    * `AY.csv`: **Custom Ayurvedic Domain** capturing *Prakriti*, *Vikriti*, *Agni*, and *Pathya/Apathya* compliance.

---

### ⚙️ 11. Administration & Cryptographic Audit (`/admin`)
* **Purpose**: System integrity, governance, and AI management (accessible to Admins only).
* **Key Functions**:
  1. **Hash-Chained Audit Trail**:
     * Every action (creating a trial, changing a visit, recording an adverse event) is cryptographically signed using SHA-256 hashes linking each record to the previous one (similar to a blockchain).
     * Displays a green **"VALID HASH CHAIN"** badge proving no records have been deleted or altered.
  2. **User Management**: Add new doctors or coordinators and assign them to specific trials.
  3. **Regulatory Settings**: Change system-wide rules (e.g., SAE initial due hours from 24h to 48h, THS weights).
  4. **AI Model Operations**: Inspect the Machine Learning Model Card (ROC-AUC score of 0.87, feature definitions) and trigger retraining from updated CSV datasets.

---

## 4. Key Project Innovations to Highlight in Your Viva

1. **First-of-its-kind Ayurvedic CTMS**: Tailored for AYUSH research with native support for *Prakriti*, *Dosha* diagnosis, and herbal formulations.
2. **Explainable AI (XAI)**: Uses **SHAP (SHapley Additive exPlanations)** to give transparent, clinically meaningful reasons for predictions instead of opaque risk scores.
3. **Mathematical Trial Health Score (THS)**:
   $$\text{THS} = 100 \times (0.25E + 0.25R + 0.20C + 0.15S + 0.15Q)$$
   Provides objective, quantifiable tracking of enrollment ($E$), retention ($R$), compliance ($C$), safety ($S$), and data queries ($Q$).
4. **Regulatory Readiness**: Automated 24-hour SAE reporting countdowns and bilingual (English/Hindi) GIGW design.
5. **Data Interoperability**: Bridges traditional medicine with global research through CDISC SDTM and HL7 FHIR exports.
