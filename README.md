# PerfTrack – Employee Performance Management System

## Overview

PerfTrack is a full-stack Employee Performance Management System designed to streamline workforce management, performance evaluation, goal tracking, and employee engagement within organizations.

The platform provides a centralized solution for managing employees, projects, OKRs (Objectives and Key Results), performance reviews, feedback, onboarding, notifications, and reporting.

## Features

### Employee Management

* Employee profiles and records
* Department and role management
* Employee lifecycle tracking

### Performance Management

* Performance evaluation workflows
* KPI tracking
* Review cycles and assessments

### OKR Management

* Create and manage objectives
* Track key results
* Progress monitoring

### Feedback System

* Peer-to-peer feedback
* Manager reviews
* Continuous performance feedback

### Project Management

* Project assignment
* Employee participation tracking
* Progress monitoring

### Onboarding

* Employee onboarding workflow
* Task tracking for new hires

### Notifications

* Real-time updates and alerts
* Event-based notifications

### Reporting & Analytics

* Performance reports
* Employee insights
* Organizational analytics

---

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* HTML/CSS

### Backend

* Django
* Django REST Framework
* SQLite/PostgreSQL

### Deployment

* Vercel (Frontend)
* Django Backend

---

## Project Structure

```text
PerfTrack/
│
├── perftrack_backend/
│   ├── accounts/
│   ├── employees/
│   ├── feedback/
│   ├── notifications/
│   ├── okr/
│   ├── onboarding/
│   ├── performance/
│   ├── projects/
│   ├── reports/
│   └── perftrack/
│
├── perftrack_frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── implementation.md
├── requirements.txt
└── README.md
```

## Installation

### Backend Setup

```bash
cd perftrack_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd perftrack_frontend
npm install
npm run dev
```

---

## Future Enhancements

* AI-powered performance insights
* Predictive employee analytics
* Advanced reporting dashboard
* Mobile application support
* Multi-organization support

---

## Authors

Haripriya A R
B.Tech Artificial Intelligence Engineering

Developed as part of the Software Engineering course project.
