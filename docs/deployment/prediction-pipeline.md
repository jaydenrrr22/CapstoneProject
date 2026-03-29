# Prediction Pipeline Deployment & Environment Isolation

## Overview

This document describes the deployment, configuration, and production validation of the Trace financial prediction pipeline. The goal of this pipeline is to provide secure, reliable, and scalable machine-learning-based predictions through the backend API.

The prediction service was deployed on an AWS EC2 instance behind an Nginx reverse proxy and validated under concurrent load conditions.

---

## Architecture

* **Cloud Provider:** AWS
* **Compute:** EC2 (Ubuntu 22.04)
* **Web Server / Reverse Proxy:** Nginx
* **Backend Framework:** FastAPI (Uvicorn)
* **Process Management:** systemd
* **Prediction Layer:** Python-based ML execution (initially simulated)
* **Transport Security:** HTTPS (TLS)

Prediction requests flow as follows:

Client → HTTPS → Nginx Reverse Proxy → FastAPI Backend → Prediction Execution → Response

---

## Prediction Endpoint Implementation

A prediction router was implemented using FastAPI:

```
POST /predict/
```

Example request:

```
{
  "amount": 45,
  "category": "food"
}
```

Example response:

```
{
  "risk_score": 0.17,
  "message": "Prediction executed successfully"
}
```

This endpoint was successfully exposed via Nginx:

```
https://<EC2-Elastic-IP>/api/predict/
```

---

## Environment Isolation & Resource Limits

To prevent prediction jobs from destabilizing the backend service, resource constraints were enforced via systemd.

Configured limits:

* `MemoryMax=700M`
* `CPUQuota=70%`
* `TasksMax=100`

These limits ensure:

* Prediction workloads cannot exhaust system memory
* CPU usage is bounded during concurrent requests
* Backend service remains available under load

---

## Resilience Strategy (Retry Logic)

Prediction execution was wrapped with retry logic to handle transient failures.

Key design:

* Up to **3 automatic retries**
* Fixed delay between attempts
* Prevents temporary model execution failures from impacting API reliability

---

## Logging & Observability

Structured logging was implemented for prediction execution.

Logs include:

* Prediction request received
* Prediction result generated

Logs can be monitored via:

```
journalctl -u trace-backend -f
```

This enables real-time operational visibility and simplifies debugging.

---

## Load Testing & Performance Validation

The prediction pipeline was validated using ApacheBench.

Test configuration:

* Total Requests: 100
* Concurrency Level: 10
* Endpoint: `/api/predict/`

Results:

* Failed Requests: **0**
* Average Latency: **~30 ms**
* Requests per Second: **~322**
* System Stability: **Maintained throughout test**

These results confirm that the prediction pipeline performs reliably under concurrent production-like load.

---

## Deployment Verification Checklist

* Prediction endpoint reachable via HTTPS reverse proxy
* Backend service stable during repeated prediction calls
* Prediction execution observable in logs
* Resource limits enforced successfully
* Latency validated under concurrent load
* Retry logic implemented for resilience

---

## Future Improvements

* Background worker queue (Celery / Redis) for asynchronous predictions
* Model containerization for stronger environment isolation
* Metrics export (Prometheus / CloudWatch custom metrics)
* Autoscaling support
* Real ML model integration (forecasting / subscription detection)

---

## Conclusion

The prediction pipeline has been successfully deployed, isolated, and validated in a production-like AWS environment. This implementation establishes a scalable foundation for integrating real machine learning workloads into the Trace financial decision-support platform.
