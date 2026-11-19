# Model Card: NexTrial Participant Dropout Risk Predictor

## 1. Model Overview
- **Model Name**: NexTrial Dropout Risk Classifier
- **Model Version**: v1.0-rf
- **Architecture**: Calibrated Random Forest Classifier (`RandomForestClassifier` with isotonic calibration via `CalibratedClassifierCV`)
- **Intended Purpose**: Decision support tool for clinical coordinators and investigators to identify participants at elevated risk of missing visits or dropping out of Ayurvedic clinical trials prior to study completion.
- **Explainability**: SHAP (`TreeExplainer`) feature attribution returning the top 3 contributing drivers and directional impact for each prediction.

> [!WARNING]
> **Synthetic Data & Clinical Scope Limitation**:
> This model was trained entirely on **synthetic data** ($N = 5,000$) designed to simulate clinical trial dynamics. Metrics reflect the recoverability of a designed statistical signal, **not real-world clinical performance**.
> The intended use of this model is **decision support and coordinator alerting only**, NOT clinical decision-making or altering medical interventions.

---

## 2. Feature Window & Prediction Point
- **Observation Boundary**: Strict cutoff after **Visit 3 of 8** (approx. Day 28–42).
- **Features Used**:
  - `age`: Participant age (years, 18–80)
  - `sex`: Gender category (Male, Female, Other)
  - `distance_km`: Travel distance from participant residence to clinical trial site (0.5–250 km)
  - `missed_visits_so_far`: Count of missed scheduled visits up to Visit 3 (0–3)
  - `visit_compliance_pct`: Percentage of visits attended within the allowable protocol window up to Visit 3
  - `ae_count`: Total adverse events logged on or before Visit 3
  - `ae_max_severity`: Maximum AE severity observed up to Visit 3 (0 = None, 1 = Mild, 2 = Moderate, 3 = Severe)
- **Zero Label Leakage**: No post-Visit-3 data (subsequent AEs, visits 4–8, or final completion status) is ever ingested by the feature pipeline.

---

## 3. Risk Band Thresholds
Calibrated predicted probabilities $p \in [0, 1]$ are categorized into clinical action bands:
- **Low Risk**: $p < 0.30$ (Routine visit monitoring)
- **Medium Risk**: $0.30 \le p < 0.60$ (Proactive reminder calls, adherence check)
- **High Risk**: $p \ge 0.60$ (Coordinator outreach, travel support review, investigator notification)

---

## 4. Ethical & Privacy Considerations
- **No Direct Identifiers**: Participant names, phone numbers, addresses, and hospital registration numbers are never transmitted to or processed by the ML service.
- **De-biasing**: Equalized odds and calibration monitoring across gender and age cohorts.
