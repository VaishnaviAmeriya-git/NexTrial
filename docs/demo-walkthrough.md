# NexTrial: 90-Second Demo & Screen Recording Walkthrough

This step-by-step evaluator click path is designed to showcase the complete functionality of **NexTrial** (SIH PS 26046 Aligned) within a 90-second video recording.

---

## Pre-Recording Checklist
1. Ensure API server (`http://localhost:5000`) and ML service (`http://localhost:8000`) are running.
2. Open client app in Chrome at `http://localhost:3000`.
3. Set browser zoom to 100% or 110% for crisp display of GIGW typography.

---

## 90-Second Step-by-Step Script

### [0:00 - 0:15] Government Frame & Health Score Overview
- **Action**: Land on the NexTrial Login page, log in as `admin@nextrial.org` (`Admin@NexTrial2026!`).
- **Highlight**:
  - Show persistent top saffron accent strip + synthetic data notice bar.
  - Point out utility bar with font-size controls (`A-`, `A`, `A+`) and bilingual toggle (`EN / हिन्दी`).
  - Demonstrate navigation to Dashboard: highlight the **Trial Health Score (THS = 82 / 100 Green)** semi-circle gauge and its 5-part mathematical breakdown table ($E, R, C, S, Q$).

### [0:16 - 0:35] Trial Details & Ayurveda Clinical Profiling
- **Action**: Click on the active trial: *"Evaluation of Yogaraja Guggulu in Sandhivata (Knee Osteoarthritis)"*.
- **Highlight**:
  - Show CTRI Registration Number badge (`CTRI/2026/03/048123`) and Institutional Ethics Committee (IEC) validity clock.
  - Navigate to **Participants** tab: open participant `NT01-0042`.
  - Display the comprehensive **Ayurveda Profile Card**:
    - Prakriti: *Vata-Kapha*
    - Dosha Imbalance: *Vata Vriddhi*
    - Classical formulation: *Yogaraja Guggulu (500mg bid)*
    - Procedure: *Janu Basti with Mahanarayana Taila*.

### [0:36 - 0:52] Explainable AI Dropout Risk Card (SHAP)
- **Action**: Scroll to the **Dropout Risk Prediction Card** for participant `NT01-0042`.
- **Highlight**:
  - Notice the **High Risk (74%)** badge.
  - Explain the top 3 SHAP TreeExplainer drivers:
    1. *Missed visits prior to Visit 3 (+0.32)*
    2. *Travel distance: 68 km (+0.24)*
    3. *Visit window compliance: 65% (+0.18)*
  - Showcase the actionable decision support recommendations (e.g. *"Schedule coordinator telephone outreach", "Evaluate travel assistance"*).
  - Point out the disclaimer: *"Decision support only. Not a clinical decision."*

### [0:53 - 1:12] Serious Adverse Event (SAE) & 24-Hour Regulatory Clock
- **Action**: Switch to the **Safety & Pharmacovigilance** tab.
- **Highlight**:
  - Filter by Serious Adverse Events (SAE).
  - Open SAE record: *"Severe Gastric Irritation & Epigastric Burning"*.
  - Point out the countdown clock: **24-hour Initial IEC/Licensing Authority report deadline**.
  - Show the **DEMO Coding Dictionary** mapping verbatim terms to MedDRA SOC (*Gastrointestinal disorders*) and Preferred Term (*Gastric ulceration*).

### [1:13 - 1:25] Protocol Deviations & Interoperability Exports
- **Action**: Navigate to **Exports** tab.
- **Highlight**:
  - Click **Download FHIR R4 JSON Bundle**: view clinical bundle containing `ResearchStudy`, `ResearchSubject`, `AdverseEvent`, and `Observation`.
  - Click **Download CDISC SDTM Archive**: demonstrate generated CSVs for `DM` (Demographics), `AE` (Adverse Events), `EX` (Exposure), and custom `AY` (Ayurvedic Dosha/Prakriti domain).

### [1:26 - 1:30] Tamper-Evident Audit Trail & Wrap-up
- **Action**: Click **Audit Trail** in sidebar.
- **Highlight**:
  - Display immutable audit log rows showing timestamp, actor, entity, before/after diffs, and SHA-256 hash chaining.
  - Conclude: *"NexTrial delivers an AI-enabled, GCP-aligned, regulatory-ready CTMS for Indian Ayurvedic research."*
