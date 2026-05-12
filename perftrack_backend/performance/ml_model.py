import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import logging

logger = logging.getLogger(__name__)

WEIGHTS = {
    'task_completion': 0.35,
    'productivity': 0.30,
    'attendance': 0.20,
    'rating_scaled': 0.15,
}


def _build_features(task_completion, productivity, attendance, rating):
    return np.array([[task_completion, productivity, attendance, rating * 20]])


def _formula_predict(task_completion, productivity, attendance, rating):
    return round(
        task_completion * WEIGHTS['task_completion'] +
        productivity * WEIGHTS['productivity'] +
        attendance * WEIGHTS['attendance'] +
        (rating * 20) * WEIGHTS['rating_scaled'],
        2
    )


class PredictionEngine:
    _instance = None
    _pipeline = None
    _trained_on = 0
    MIN_SAMPLES = 10

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _get_training_data(self):
        from performance.models import PerformanceRecord
        records = list(
            PerformanceRecord.objects
            .select_related('employee', 'period')
            .order_by('employee_id', 'period__start_date')
        )
        X, y = [], []
        from itertools import groupby
        from operator import attrgetter
        records.sort(key=attrgetter('employee_id', 'period.start_date'))
        for _, group in groupby(records, key=attrgetter('employee_id')):
            emp_records = list(group)
            for i in range(len(emp_records) - 1):
                curr = emp_records[i]
                nxt = emp_records[i + 1]
                X.append([
                    curr.task_completion,
                    curr.productivity,
                    curr.attendance,
                    curr.rating * 20,
                ])
                y.append(nxt.composite_score)
        return np.array(X), np.array(y)

    def train(self, force=False):
        X, y = self._get_training_data()
        n = len(y)
        if n < self.MIN_SAMPLES and not force:
            self._pipeline = None
            self._trained_on = n
            return {'status': 'fallback', 'samples': n}
        if n == self._trained_on and not force:
            return {'status': 'cached', 'samples': n}
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('reg', LinearRegression()),
        ])
        if n >= 20:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            pipeline.fit(X_train, y_train)
            y_pred = pipeline.predict(X_test)
            metrics = {
                'status': 'trained',
                'samples': n,
                'r2': round(r2_score(y_test, y_pred), 4),
                'rmse': round(mean_squared_error(y_test, y_pred) ** 0.5, 4),
            }
        else:
            pipeline.fit(X, y)
            metrics = {'status': 'trained', 'samples': n}
        self._pipeline = pipeline
        self._trained_on = n
        return metrics

    def predict(self, task_completion, productivity, attendance, rating):
        if self._pipeline is not None:
            try:
                X = _build_features(task_completion, productivity, attendance, rating)
                score = float(self._pipeline.predict(X)[0])
                score = max(0, min(100, round(score, 2)))
                return {'score': score, 'method': 'ml', 'confidence': 'high'}
            except Exception as e:
                logger.warning(f'ML prediction failed: {e}')
        score = _formula_predict(task_completion, productivity, attendance, rating)
        return {'score': score, 'method': 'formula', 'confidence': 'medium'}

    def invalidate(self):
        self._trained_on = -1


engine = PredictionEngine()


def calculate_attrition_risk(employee_data: dict) -> dict:
    """
    Heuristic attrition risk scoring.
    Returns risk_score (0–100) and risk_level.
    """
    risk = 0
    factors = []

    ai_score = employee_data.get('ai_score', 100)
    if ai_score < 50:
        risk += 30
        factors.append("Consistently low performance score")

    tenure_years = employee_data.get('tenure_years', 10)
    if tenure_years < 1:
        risk += 20
        factors.append("Less than 1 year tenure")

    feedback_avg = employee_data.get('feedback_avg', 5)
    if feedback_avg < 2.5:
        risk += 25
        factors.append("Low peer feedback rating")

    has_active_okr = employee_data.get('has_active_okr', True)
    if not has_active_okr:
        risk += 15
        factors.append("No active OKR goals")

    absenteeism = employee_data.get('absenteeism_rate', 0)
    if absenteeism > 15:
        risk += 10
        factors.append("High absenteeism rate")

    risk = min(risk, 100)
    if risk >= 60:
        level = 'high'
    elif risk >= 30:
        level = 'medium'
    else:
        level = 'low'

    return {'risk_score': risk, 'risk_level': level, 'factors': factors}