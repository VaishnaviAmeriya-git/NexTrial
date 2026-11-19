import os
import json
import logging
import numpy as np
import pandas as pd
import joblib
import shap

from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
)
from sklearn.inspection import permutation_importance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nextrial-train")

def train_model(data_path=None, artifacts_dir=None):
    base_dir = os.path.dirname(__file__)
    if data_path is None:
        data_path = os.path.join(base_dir, "data", "synthetic_trials_data.csv")
    if artifacts_dir is None:
        artifacts_dir = os.path.join(base_dir, "artifacts")

    os.makedirs(artifacts_dir, exist_ok=True)

    if not os.path.exists(data_path):
        logger.info("Data file not found. Generating synthetic dataset first...")
        from data.generate_synthetic import generate_synthetic_data
        generate_synthetic_data(data_path)

    df = pd.read_csv(data_path)
    logger.info("Loaded dataset with shape %s", df.shape)

    feature_cols = [
        "age",
        "sex_code",
        "distance_km",
        "missed_visits_so_far",
        "visit_compliance_pct",
        "ae_count",
        "ae_max_severity",
    ]
    target_col = "dropout"

    X = df[feature_cols]
    y = df[target_col]

    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    logger.info("Training set: %d samples, Test set: %d samples", len(X_train), len(X_test))

    # --- 1. Baselines ---
    # Majority class baseline
    dummy = DummyClassifier(strategy="most_frequent")
    dummy.fit(X_train, y_train)
    dummy_probs = dummy.predict_proba(X_test)[:, 1]
    dummy_auc = roc_auc_score(y_test, dummy_probs)

    # Logistic Regression baseline
    lr = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
    lr.fit(X_train, y_train)
    lr_probs = lr.predict_proba(X_test)[:, 1]
    lr_auc = roc_auc_score(y_test, lr_probs)
    lr_pr = average_precision_score(y_test, lr_probs)
    logger.info("Baseline Dummy ROC-AUC: %.4f | Logistic Regression ROC-AUC: %.4f", dummy_auc, lr_auc)

    # --- 2. Random Forest & Hyperparameter Tuning ---
    base_rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=5,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1,
    )

    param_dist = {
        "n_estimators": [150, 250, 300, 350],
        "max_depth": [6, 8, 10, 12, None],
        "min_samples_leaf": [3, 5, 8],
        "max_features": ["sqrt", "log2", 0.5],
    }

    cv_strat = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    search = RandomizedSearchCV(
        base_rf,
        param_distributions=param_dist,
        n_iter=8,
        scoring="roc_auc",
        cv=cv_strat,
        random_state=42,
        n_jobs=-1,
    )
    search.fit(X_train, y_train)
    best_rf = search.best_estimator_
    logger.info("Best RF Parameters: %s (CV ROC-AUC: %.4f)", search.best_params_, search.best_score_)

    # --- 3. Calibration via CalibratedClassifierCV (isotonic) ---
    calibrated_model = CalibratedClassifierCV(
        estimator=best_rf,
        method="isotonic",
        cv=3,
    )
    calibrated_model.fit(X_train, y_train)

    # Predictions & Probabilities
    test_probs = calibrated_model.predict_proba(X_test)[:, 1]
    test_preds = (test_probs >= 0.50).astype(int)

    # Metrics computation
    roc_auc = float(roc_auc_score(y_test, test_probs))
    pr_auc = float(average_precision_score(y_test, test_probs))
    brier = float(brier_score_loss(y_test, test_probs))
    cm = confusion_matrix(y_test, test_preds).tolist()
    report = classification_report(y_test, test_preds, output_dict=True)

    # Band-level metrics (Low <0.30, Med 0.30-0.60, High >=0.60)
    band_preds = []
    for p in test_probs:
        if p >= 0.60:
            band_preds.append("High")
        elif p >= 0.30:
            band_preds.append("Medium")
        else:
            band_preds.append("Low")

    # Feature Importance & Permutation Importance
    global_importances = {
        col: float(imp) for col, imp in zip(feature_cols, best_rf.feature_importances_)
    }
    perm = permutation_importance(best_rf, X_test, y_test, n_repeats=5, random_state=42)
    perm_importances = {
        col: float(mean) for col, mean in zip(feature_cols, perm.importances_mean)
    }

    # --- 4. SHAP TreeExplainer ---
    logger.info("Fitting SHAP TreeExplainer on base Random Forest...")
    explainer = shap.TreeExplainer(best_rf)

    # Save artifacts
    model_save_path = os.path.join(artifacts_dir, "model.joblib")
    explainer_save_path = os.path.join(artifacts_dir, "explainer.joblib")
    metrics_save_path = os.path.join(artifacts_dir, "metrics.json")

    joblib.dump(calibrated_model, model_save_path)
    joblib.dump(explainer, explainer_save_path)

    metrics_payload = {
        "modelVersion": "v1.0-rf",
        "algorithm": "Calibrated Random Forest (isotonic)",
        "trainedOn": f"Synthetic clinical trials dataset (N={len(df)}, 80/20 train/test)",
        "features": feature_cols,
        "metrics": {
            "rocAuc": round(roc_auc, 4),
            "prAuc": round(pr_auc, 4),
            "brierScore": round(brier, 4),
            "baselineMajorityAuc": round(dummy_auc, 4),
            "baselineLogisticAuc": round(lr_auc, 4),
            "confusionMatrix": cm,
            "classificationReport": report,
            "globalFeatureImportances": global_importances,
            "permutationImportances": perm_importances,
            "bands": {
                "low": {"threshold": "<0.30", "testSampleCount": band_preds.count("Low")},
                "medium": {"threshold": "0.30-0.60", "testSampleCount": band_preds.count("Medium")},
                "high": {"threshold": ">=0.60", "testSampleCount": band_preds.count("High")},
            },
        },
        "disclaimer": "Academic prototype. Model trained entirely on synthetic data. Decisions support only.",
    }

    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    logger.info("Saved model artifacts to %s", artifacts_dir)

    # Generate and save diagnostic curves if matplotlib is available
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        # 1. ROC and PR Curve
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5))
        fpr, tpr, _ = roc_curve(y_test, test_probs)
        ax1.plot(fpr, tpr, label=f"RF (AUC = {roc_auc:.3f})", color="#1F3A5F", lw=2)
        ax1.plot([0, 1], [0, 1], "k--", alpha=0.5)
        ax1.set_title("ROC Curve")
        ax1.set_xlabel("False Positive Rate")
        ax1.set_ylabel("True Positive Rate")
        ax1.legend(loc="lower right")
        ax1.grid(True, alpha=0.3)

        prec, rec, _ = precision_recall_curve(y_test, test_probs)
        ax2.plot(rec, prec, label=f"RF (PR-AUC = {pr_auc:.3f})", color="#E8892B", lw=2)
        ax2.set_title("Precision-Recall Curve")
        ax2.set_xlabel("Recall")
        ax2.set_ylabel("Precision")
        ax2.legend(loc="lower left")
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(os.path.join(artifacts_dir, "roc_pr_curves.png"), dpi=150)
        plt.close()

        # 2. Calibration Curve
        prob_true, prob_pred = calibration_curve(y_test, test_probs, n_bins=10)
        plt.figure(figsize=(6, 5))
        plt.plot(prob_pred, prob_true, "s-", color="#2F6DB5", label="Calibrated RF (Isotonic)")
        plt.plot([0, 1], [0, 1], "k--", label="Perfect Calibration")
        plt.title("Reliability Diagram (Calibration Curve)")
        plt.xlabel("Mean Predicted Probability")
        plt.ylabel("Fraction of Positives")
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(os.path.join(artifacts_dir, "calibration_curve.png"), dpi=150)
        plt.close()

        logger.info("Generated and saved diagnostic curve plots in artifacts/")
    except Exception as e:
        logger.warning("Could not generate plots: %s", e)

    return metrics_payload

if __name__ == "__main__":
    train_model()
