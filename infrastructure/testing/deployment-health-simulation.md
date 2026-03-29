# Production Deployment Health Simulation Testing

## Overview

To validate production readiness of the deployed application stack, deployment health simulations were performed under concurrent request load and service restart conditions.

The objective was to evaluate:

* prediction endpoint stability
* backend recovery behavior
* infrastructure fault tolerance
* runtime memory characteristics

---

## Concurrent Load Simulation

Concurrent traffic was generated using ApacheBench.

Test parameters:

* Total Requests: 200
* Concurrency Level: 20
* Target Endpoint: `/api/predict/`

Observed performance:

* Throughput: ~48–50 requests per second
* Mean latency: ~370–410 ms
* No connection failures
* No runtime exceptions

Some requests were marked as failed due to dynamic response payload size differences, not processing or availability issues.

This confirms the prediction service remained responsive under burst load.

---

## Backend Restart Recovery Test

During testing, the backend service was restarted using:

```
sudo systemctl restart trace-backend
```

After restart:

* nginx continued serving HTTPS traffic
* backend recovered automatically
* prediction requests resumed successfully
* throughput remained within expected range

This demonstrates successful service recovery and stateless deployment behavior.

---

## Memory Observation

System memory utilization was monitored using `htop` during repeated forecasting load.

Findings:

* No abnormal memory growth observed
* in-memory cache remained bounded
* Python process memory stabilized after burst traffic

This suggests no immediate memory leak or runaway caching behavior.

---

## Conclusion

The deployment stack demonstrated stable behavior under realistic concurrent usage and service restart scenarios.

These results indicate the system is suitable for moderate production workloads and resilient to common operational events such as service restarts.
