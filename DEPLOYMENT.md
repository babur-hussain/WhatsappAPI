# LoomiFlow Server Architecture & Deployment Guide

This document outlines the deployment strategies to host the LoomiFlow Enterprise SaaS Platform on cloud providers. It strictly guarantees scaling to thousands of concurrent WhatsApp Factories via aggressive node parallelization, isolated Docker environments, and aggressive Redis configurations.

## The Architecture Stack
- **Database:** PostgreSQL (v15+)
- **Cache/Rate Limiting:** Redis (v7+)
- **Backend Core:** Node.js (v20) + Express + Prisma 
- **Frontend Panel:** Next.js (v14+) Standalone

---

## 🚀 Scenario 1: Deploying via Railway.app (Highly Recommended / Easiest)
Railway completely abstracts the container orchestration layer. It seamlessly ingests the existing monolithic repo without deep-diving into Docker Swarm/K8s.

1. **Link your Repo to Railway**
2. **Provision The Heavy Infrastructure:**
   - Create a `PostgreSQL` Database cluster.
   - Create a `Redis` instance. 
3. **Provisioning The Backend App:**
   - Go to `Settings > Build` on the Backend instance, and set the **Root Directory** to `/backend`.
   - Setup Environment Variables importing `DATABASE_URL` and `REDIS_URL` automatically from the instances via Railway's Variable Linker. 
   - Add `FIREBASE_*` credentials directly.
   - Set the `PORT` automatically exposed by Railway, and override the start command to `npm run start:prod` (or strictly rely on the Dockerfile automatically picked up by Railway).
4. **Provisioning The Frontend App:**
   - Spin up a new Railway Service pointing to the same Repo, but set the **Root Directory** to `/frontend`.
   - Setup `NEXT_PUBLIC_API_URL` to point to the Backend's generated Public Domain URL. 
   - Railway natively respects `output: "standalone"` via the Dockerfile resolving cold starts immensely faster than Vercel for continuous polling SaaS platforms.

---

## 🚀 Scenario 2: Deploying via AWS (EC2 & Advanced Architecture)
For heavily scaled multi-region compliance mapping.

1. **RDS & ElastiCache**
   - Provision a PostgreSQL RDS Multi-AZ Server for high availability. Ensure it scales vertically efficiently across bursts of DB operations triggered from inbound Metas webhooks.
   - Provision a Redis node via ElastiCache. Ensure `maxRetriesPerRequest: null` bounds hold up to aggressive BullMQ job parsing.
2. **Application Layer (EC2 Auto Scaling Groups / Elastic Beanstalk)**
   - Utilize Docker logic natively. Build the `loomiflow-backend` utilizing the custom `backend/Dockerfile` and push the image utilizing Github Actions into **Amazon ECR**.
   - Create an ECS / Fargate cluster leveraging the images directly. Fargate guarantees that as CPU hits roughly ~70% from inbound message arrays, a new identical Node.js clone will boot and share the Redis cache smoothly.
   - Attach Application Load Balancers directly to the `/api/v1/health` endpoint which natively pings DB/Redis sanity. Fargate will autonomously drop unhealthy containers returning `DOWN`.

---

## 🚀 Scenario 3: Deploying via DigitalOcean (Docker Compose / Single Node Power)
Ideal for testing scaling up to roughly ~5,000 tenants out-of-the-box before horizontal clustering is fundamentally necessary.

1. **Provision Droplet**
   - Use a Droplet using `Docker on Ubuntu` layout (Minimum 4GB RAM + 2 vCPU).
2. **Transfer Repositories**
   - Clone repository directly into the droplet inside `/opt/loomiflow`.
3. **Fill Variables**
   - Edit `/backend/.env` and `/frontend/.env` carefully via `nano`. 
4. **Initiate Compose**
   - Execute `docker-compose -f docker-compose.prod.yml up -d --build`.
   - The manifest file automatically provisions an isolated internal `loomiflow_network` bridging the Web processes strictly over a virtual LAN without openly exposing Redis or Postgres DBs blindly to the public. 

> *Tip on Backups:* Inject a continuous Cron-job bridging host OS to container via `docker exec -it loomiflow-backend node dist/scripts/backup.js` and pipe directly into S3 instances for fail-safes.
