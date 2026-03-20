# Infrastructure & Deployment Documentation

## Trace Architecture Overview

* **Region:** us-east-2 (Ohio)
* **EC2:** Ubuntu 22.04
* **Backend:** FastAPI (Uvicorn)
* **Frontend:** React (Vite)
* **Database:** MySQL (running on EC2)
* **Monitoring:** AWS CloudWatch Agent
* **IAM:** Role-based permissions (no static credentials stored on instance)

---

## EC2 Setup

1. Launch Ubuntu 22.04 EC2 instance.
2. Configure Security Group inbound rules:

   * `22` – SSH
   * `8000` – Backend API
   * `5173` – Frontend (Vite dev server)
3. Attach IAM Role: `Trace-EC2-Role`
4. Install and configure CloudWatch Agent.
5. Enable detailed monitoring (1-minute metrics).

---

## Deployment Process

### Pull Latest Code

```bash
cd CapstoneProject
git checkout main
git pull origin main
```

---

### Start Backend

```bash
cd CapstoneProject
source venv/bin/activate
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000
```

---

### Start Frontend

```bash
cd frontend
npm install
npm run dev -- --host
```

---

## Monitoring Configuration

* **Metrics Collected:**

  * CPU
  * Memory
  * Disk
  * Network

* **Logs Monitored:**

  * `/var/log/syslog`

* **CloudWatch Log Group:**

  ```
  /aws/ec2/trace-backend
  ```

* **Log Retention:**

  * 30 days

---

## IAM Configuration

* EC2 instance uses IAM role: `Trace-EC2-Role`
* Attached policy: `CloudWatchAgentServerPolicy`
* No AWS access keys stored on instance
* IMDSv2 enforced for metadata access
