# Prediction Monitoring Dashboard & Metrics Integration

## Overview

To improve operational visibility into machine learning functionality, we implemented a custom prediction monitoring layer using **Amazon CloudWatch custom metrics**.

This integration allows the team to monitor:

* Prediction request volume
* Prediction latency
* Model confidence behavior
* System reliability (error tracking – planned)

The goal is to ensure that prediction performance is measurable and observable in real time, supporting production readiness and debugging workflows.

---

## Architecture

The monitoring pipeline follows this flow:

```
Client Request → FastAPI Prediction Route → CloudWatch Custom Metrics → CloudWatch Dashboard
```

Custom instrumentation was added directly inside the prediction execution path to emit runtime performance signals.

---

## Metrics Implemented

All metrics are published under the namespace:

```
Trace/Prediction
```

### PredictionRequests

Tracks total usage of the prediction endpoint.

* Unit: Count
* Purpose: Understand adoption and usage trends
* Statistic Used in Dashboard: Sum

---

### PredictionLatency

Measures time taken to generate a prediction.

* Unit: Seconds
* Purpose: Monitor performance degradation or infrastructure bottlenecks
* Statistic Used: Average

Latency is captured using request timing at the application layer.

---

### PredictionConfidence

Represents the model’s risk score output.

* Unit: None
* Purpose: Observe behavioral trends in model output distribution
* Statistic Used: Average

This metric supports debugging and future ML evaluation workflows.

---

### PredictionErrors (Planned)

An error counter metric has been instrumented but has not yet been triggered during testing.

* Unit: Count
* Purpose: Alert on prediction failures
* Planned Use: CloudWatch Alarm threshold

Future work includes intentionally simulating prediction failures to validate alerting behavior.

---

## Dashboard Implementation

A CloudWatch dashboard named:

```
trace-prediction-dashboard
```

was created to visualize prediction system health.

Current widgets include:

* Prediction Request Volume
* Prediction Latency
* Prediction Confidence

These widgets enable the team to quickly understand:

* how frequently predictions are executed
* whether performance remains stable
* how model output trends evolve

---

## Testing & Validation

Prediction requests were generated using HTTPS curl calls to ensure nginx redirection did not block execution.

Example:

```
curl -k -X POST https://<public-ip>/api/predict/
```

After generating multiple requests, custom metrics became visible in:

```
CloudWatch → Metrics → Custom Namespaces → Trace/Prediction
```

Dashboard graphs updated successfully after refreshing the time window.

---

## Future Enhancements

The monitoring system can be expanded by:

* Adding metric dimensions (category, model version)
* Creating CloudWatch alarms for prediction error thresholds
* Logging model drift indicators
* Integrating structured logging for prediction inputs
* Building automated anomaly detection dashboards

---

## Outcome

This integration establishes a foundational **ML observability layer**, enabling proactive monitoring of prediction system performance and supporting scalable deployment practices.
