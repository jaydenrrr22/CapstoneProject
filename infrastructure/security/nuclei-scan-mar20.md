# Nuclei Security Scan Integration – Initial Scan Report

## Overview

To validate the deployed application's external security posture, an automated vulnerability scan was performed using **ProjectDiscovery Nuclei** on the production EC2 environment.

This scan targeted the publicly exposed backend API and related endpoints to identify:

* Missing security headers
* Technology fingerprinting exposure
* Configuration weaknesses
* Documentation / schema exposure
* Network service risks

Security tooling was intentionally isolated from the application repository under:

```
/opt/trace-security/
```

This ensured repository cleanliness and deterministic deployment behavior.

---

## Scan Environment

| Attribute         | Value               |
| ----------------- | ------------------- |
| Instance Name     | trace-backend-ec2   |
| Instance ID       | i-03dbbc111987c2c07 |
| Public IP         | 3.151.137.239       |
| Region            | us-east-2           |
| Instance Type     | t3.micro            |
| OS                | Ubuntu              |
| Reverse Proxy     | nginx               |
| Backend Framework | FastAPI             |
| Scan Tool         | Nuclei v3.7.1       |
| Templates Version | v10.4.0             |

---

## Scan Targets

The following externally reachable endpoints were included:

```
http://3.151.137.239
http://3.151.137.239/api
http://3.151.137.239/docs
http://3.151.137.239/openapi.json
```

These represent the application's primary attack surface.

---

## Scan Command

```
nuclei -l /opt/trace-security/scans/targets.txt \
-t /opt/trace-security/nuclei/nuclei-templates \
-tags misconfig,exposure,tech,headers \
-o /opt/trace-security/scans/first_scan.txt
```

---

## Scan Summary

* Templates Loaded: 2764
* Signed Templates Executed: 2749
* Targets Scanned: 4
* Total Findings: **72**

Scan duration: ~14 minutes

---

## Key Findings

### 1. Missing Security Headers

Multiple critical HTTP security headers were not present across several endpoints:

* Content-Security-Policy
* Strict-Transport-Security
* X-Frame-Options
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* Cross-Origin-* policies

This increases risk of:

* Clickjacking
* MIME-type sniffing
* XSS exploitation
* downgrade attacks

---

### 2. Technology Fingerprinting Exposure

Nuclei detected nginx across multiple endpoints:

```
tech-detect:nginx
nginx-eol:version 1.24.0
```

This allows attackers to tailor exploit strategies.

---

### 3. API Documentation Exposure

Swagger UI and OpenAPI schema were publicly accessible:

```
fingerprinthub-web-fingerprints:swagger
credentials-disclosure (openapi.json structure)
```

While useful for development, public exposure increases reconnaissance risk.

---

### 4. SSH Cryptographic Configuration Warning

Detection:

```
ssh-sha1-hmac-algo on port 22
```

Indicates legacy cryptographic algorithm support.

---

### 5. Missing Subresource Integrity (SRI)

Swagger UI dependencies loaded from CDN without integrity validation:

```
missing-sri
```

This introduces supply-chain risk if CDN content is compromised.

---

## Initial Risk Categorization

| Severity | Issue                    | Recommended Action           |
| -------- | ------------------------ | ---------------------------- |
| Medium   | Missing security headers | Configure nginx headers      |
| Medium   | Public API docs exposure | Restrict /docs in production |
| Low      | nginx version disclosure | Disable server tokens        |
| Low      | Missing SRI              | Add integrity attributes     |
| Low      | SSH crypto warning       | Harden SSH config            |

---

## Next Steps

Following this initial scan:

* Infrastructure-level security headers will be implemented in nginx
* API documentation exposure will be evaluated
* SSH configuration hardening will be considered
* A follow-up scan will validate remediation effectiveness

This process establishes a repeatable **DevSecOps validation workflow** for the deployed system.

---
