# Warnix Emergency Operations Center — Alibaba Cloud Proof of Deployment

This document serves as proof of deployment on **Alibaba Cloud** for the **Global AI Hackathon Series with Qwen Cloud (Track 3: Agent Society)**.

---

## 1. Instance Details
* **Deployment Model**: Elastic Compute Service (ECS)
* **Region**: Europe (Frankfurt)
* **Instance Type**: `ecs.n4.small` (1 Cores, 2 GiB RAM)
* **Public Address**: `http://8.211.27.44:3000`

---

## 2. Alibaba Cloud & Qwen Cloud Integration Codebase
The Warnix backend communicates directly with the Alibaba Cloud Maas/DashScope infrastructure using compatible API endpoints.
* **API base URL**: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
* **Target Model**: `qwen-plus`
* **Integration Code File**: Connects via `lib/qwen/client.ts`

---

## 3. Server Deployment Verification Screen

*Replace this preview with a screenshot of your Alibaba Cloud Console Workbench showing the running Next.js / PM2 server processes.*

![Alibaba Cloud Workbench Screenshot](/assets/warnix_dashboard_mockup.png)
