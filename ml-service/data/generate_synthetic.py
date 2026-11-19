import os
import yaml
import numpy as np
import pandas as pd

def generate_synthetic_data(output_path=None):
    base_dir = os.path.dirname(os.path.dirname(__file__))
    config_path = os.path.join(base_dir, "config", "generator.yaml")
    
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
    else:
        cfg = {}

    seed = cfg.get("seed", 42)
    N = cfg.get("sample_size", 5000)
    coeffs = cfg.get("coefficients", {})

    np.random.seed(seed)

    # 1. Age ~ N(48, 14) clipped [18, 80]
    age = np.clip(np.random.normal(48, 14, N), 18, 80).round(1)

    # 2. Sex
    sex_choices = ["Male", "Female", "Other"]
    sex_probs = [0.49, 0.49, 0.02]
    sex = np.random.choice(sex_choices, size=N, p=sex_probs)
    sex_code = np.array([1 if s == "Male" else (2 if s == "Female" else 0) for s in sex])

    # 3. Distance (km) ~ Lognormal (median 12 km), clipped [0.5, 250]
    mu_dist = np.log(12.0)
    sigma_dist = 0.8
    distance_km = np.clip(np.random.lognormal(mu_dist, sigma_dist, N), 0.5, 250.0).round(1)

    # 4. Missed visits so far (0-3 at Visit 3)
    # Higher distance slightly increases probability of missing visits
    miss_prob_base = 0.08 + 0.15 * (distance_km / 250.0)
    missed_visits = np.random.binomial(3, miss_prob_base)

    # 5. Visit compliance percentage up to Visit 3
    # If 0 missed visits: 85-100% compliance. If missed visits > 0, compliance drops
    base_compliance = np.random.uniform(85, 100, N) - (missed_visits * 22.0)
    visit_compliance_pct = np.clip(base_compliance + np.random.normal(0, 4, N), 15.0, 100.0).round(1)

    # 6. Adverse Events on or before Visit 3
    ae_count = np.random.poisson(0.7, N)
    ae_max_severity = np.zeros(N, dtype=int)
    for i in range(N):
        if ae_count[i] > 0:
            # Severity 1 (Mild), 2 (Moderate), 3 (Severe)
            ae_max_severity[i] = np.random.choice([1, 2, 3], p=[0.72, 0.22, 0.06])

    # 7. Latent logistic equation
    # Dropout rises with distance, missed visits, AE severity, with U-shaped age effect
    b0 = coeffs.get("intercept", -2.35)
    b_dist = coeffs.get("distance_scale", 0.020)
    b_miss = coeffs.get("missed_visits", 0.90)
    b_comp = coeffs.get("compliance_penalty", -0.022)
    b_sev = coeffs.get("ae_severity", 0.45)
    b_ae = coeffs.get("ae_count", 0.15)
    b_age_u = coeffs.get("age_u_shape", 0.0012)
    noise_std = coeffs.get("gaussian_noise_std", 0.35)

    age_penalty = b_age_u * ((age - 48.0) ** 2)
    noise = np.random.normal(0, noise_std, N)

    z = (
        b0
        + (b_dist * distance_km)
        + (b_miss * missed_visits)
        + (b_comp * (visit_compliance_pct - 85.0))
        + (b_sev * ae_max_severity)
        + (b_ae * ae_count)
        + age_penalty
        + noise
    )

    prob = 1.0 / (1.0 + np.exp(-z))
    labels = (prob >= 0.50).astype(int)

    # Apply 6% random label flips (noise in clinical behavioral response)
    flip_mask = np.random.rand(N) < coeffs.get("random_label_flip_pct", 0.06)
    labels[flip_mask] = 1 - labels[flip_mask]

    prevalence = np.mean(labels)
    print(f"[DataGen] Generated N={N} records. Observed dropout prevalence: {prevalence:.2%}")

    df = pd.DataFrame({
        "subject_id": [f"SYNTH-{i+1:05d}" for i in range(N)],
        "age": age,
        "sex": sex,
        "sex_code": sex_code,
        "distance_km": distance_km,
        "missed_visits_so_far": missed_visits,
        "visit_compliance_pct": visit_compliance_pct,
        "ae_count": ae_count,
        "ae_max_severity": ae_max_severity,
        "dropout": labels
    })

    if output_path is None:
        output_path = os.path.join(base_dir, "data", "synthetic_trials_data.csv")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[DataGen] Saved synthetic dataset to {output_path}")
    return df

if __name__ == "__main__":
    generate_synthetic_data()
