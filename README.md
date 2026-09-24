# NexTrial — Final README.md

# NexTrial

> AI-Powered Clinical Trial Management System with Intelligent Participant Dropout Risk Prediction

NexTrial is an AI-enabled Clinical Trial Management System (CTMS) developed as an **8-week B.Tech Minor Project**. The platform streamlines clinical trial operations by managing trials, participants, visits, and adverse events while integrating an explainable **Random Forest** machine learning model to predict participant dropout risk.

---

## Project Overview

Clinical trials generate large volumes of participant and operational data that are often managed through fragmented systems or manual records. NexTrial provides a centralized, secure, and intelligent platform that helps research teams improve participant retention through predictive analytics.

**Research Focus:** AI-based Participant Dropout Risk Prediction

---

## MVP Features

- Secure JWT Authentication
- Role-Based Access Control (Admin, Research Coordinator, Investigator)
- Clinical Trial Management
- Participant Enrollment & Management
- Visit Scheduling & Records
- Basic Adverse Event Tracking
- Executive Analytics Dashboard
- Trial Health Score
- AI Dropout Risk Prediction
- Basic Activity Logs

---

## Tech Stack

| **Layer** | **Technology** |
|:----------|:---------------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| AI/ML | Python, Scikit-learn (Random Forest) |
| Authentication | JWT |
| Deployment | Docker & Docker Compose |
| Version Control | Git & GitHub |

## System Architecture

Users
↓
React + Tailwind Frontend
↓
Node.js + Express REST APIs
↓
MongoDB + Random Forest ML Model
↓
Executive Analytics Dashboard


## AI Module

**Model:** Random Forest Classifier

### Input Features
- Age
- Gender
- Distance from Trial Site
- Missed Visits
- Adverse Event History
- Visit Compliance

### Output
- Low Risk
- Medium Risk
- High Risk

The model predicts the likelihood of participant dropout and displays the result on the analytics dashboard to support early intervention.

---

## Project Structure

text
NexTrial/
│
├── client/                  # React Frontend
├── server/                  # Node.js + Express Backend
├── ai-model/                # Random Forest ML Model
├── database/                # MongoDB Schema & Seed Data
├── docs/                    # Synopsis, UML & Screenshots
├── docker-compose.yml
├── .gitignore
└── README.md

## Getting Started

### Clone Repository

bash
git clone https://github.com/VaishnaviAmeriya-git/NexTrial.git
cd NexTrial

### Run with Docker

bash
docker-compose up --build

### Local Development

| Service | Port |
|----------|------|
| Frontend | 3000 |
| Backend API | 5000 |
| MongoDB | 27017 |
| AI Service | 8000 |


## 8-Week Development Roadmap

| Week | Deliverable |
|------|-------------|
| 1 | Research & System Design |
| 2 | Database & Frontend |
| 3 | Authentication & RBAC |
| 4 | Participant Lifecycle |
| 5 | AI Dropout Prediction |
| 6 | Analytics Dashboard |
| 7 | Testing & Docker Deployment |
| 8 | Documentation & Final Demo |


## Expected Outcomes

- Digitized clinical trial workflow
- AI-assisted participant retention analysis
- Real-time trial health monitoring
- Reduced manual record management
- Explainable machine learning for healthcare research


## Future Scope

- Multi-centre Clinical Trials
- FHIR/ABDM Integration
- LLM-based Protocol Assistant
- Advanced Pharmacovigilance Analytics

## License

This project is developed for **academic and research purposes**.
