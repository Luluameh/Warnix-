# WARNIX — AI Emergency Operations Center (EOC)

WARNIX is an autonomous AI Emergency Operations Center built as a collaborative Multi-Agent Society. It coordinates complex disaster responses in real-time. 

Developed specifically for the **Qwen Cloud Global AI Hackathon (Track 3: Agent Society)**, Warnix demonstrates how six specialized autonomous agents negotiate, disagree, challenge assumptions, and resolve resource conflicts under the orchestration of a master coordination model (NEXUS), with human-in-the-loop overrides.

---

## ⚡ Key Highlights
* **True Agent Society Architecture**: Avoids simple sequential pipelines. Every specialist has distinct personas, priorities, system prompts, memory logs, and confidence vectors.
* **Double-Round Negotiation Protocol**: Parallel assessments followed by target-focused socratic questioning rounds where agents revise opinions based on new evidence.
* **Automated Conflict Detection & AEGIS Allocation**: Formal resource contention equations resolving conflicting demands for ambulance and rescue teams.
* **Human-in-the-Loop Review Controls**: Complete override triggers allowing human commanders to inject commands and force full society re-deliberations.
* **Realtime SSE Streaming Engine**: Module-based Node.js SSE endpoints mapping debate chat streams, cognitive conflict alerts, and historical archives matches.

---

## 🌐 Agent Society Roster
Warnix coordinates six expert specialists and one master decision model:

1. **SIGMA (Incident Classification & Severity)**: Methodical and terse. Establishes the type, epicenter coordinates, and estimated casualty counts.
2. **AXIOM (Verification & Rumor Control)**: Socratic skeptic. Verifies external feeds, challenges exaggerations, and assigns believability metrics.
3. **HERALD (External Intelligence & Live Hazards)**: Fast, urgent. Monitors weather conditions, path blockages, and issues real-time emergency events.
4. **AEGIS (Resource Optimization)**: Numbers-driven allocator. Tracks availability metrics for ambulances, fire engines, and helicopters.
5. **ATLAS (Evacuation & Safe Routing)**: Safety-obsessed strategist. Plots optimal routes, identifies blockages, and assigns triage shelters.
6. **ARCHIVE (Institutional Memory)**: Measured historian. Performs vector-like lookups against 25 historical precedents to extract key lessons.
7. **NEXUS (Master Coordinator)**: Orchestrator. Analyzes Round 1 outputs, detects contentions, runs socratic negotiations, and synthesizes the final plan.

---

## 🔄 Deliberation Flow
```mermaid
graph TD
    A[Emergency Incident Dispatched] --> B[Phase 1: Parallel Assessments]
    B -->|Agent Outputs Shared| C{NEXUS Cognitive Review}
    C -->|Contention Detected| D[Phase 2: Round 2 Targeted Interrogation]
    C -->|No Contention| E[Synthesize Final Action Plan]
    D -->|Refined Agent Consensus| E
    E --> F{Human commander review}
    F -->|Authorize| G[Dispatch Vehicles]
    F -->|Reject| H[Incident Terminated]
    F -->|Commander Override Injection| I[Force Society Re-deliberation]
    I --> B
```

---

## 🛠️ Tech Stack & Database Schema
* **Framework**: Next.js 14 (App Router, TypeScript)
* **Styling**: NASA-themed Dark Matte design system (`globals.css`)
* **Database**: Neon Serverless PostgreSQL & Prisma Client ORM
* **Maps**: Leaflet JS viewport mapping with dark tile layering
* **LLM Engine**: Qwen-Plus (Alibaba Dashscope API)

### Schema Layout
```
+------------------+         +-------------------+         +--------------------+
|     Incident     | <-----> |     AgentRun      | <-----> |     AgentVote      |
+------------------+         +-------------------+         +--------------------+
| title, type,     |         | status,           |         | agentId, round,    |
| severity, lat,   |         | start/end times,  |         | confidence, vote,  |
| lng, status      |         | finalDecision     |         | recommendation     |
+------------------+         +-------------------+         +--------------------+
         ^                             ^
         |                             |
         v                             v
+------------------+         +-------------------+
|  TimelineEntry   |         |   AgentMessage    |
+------------------+         +-------------------+
| category, title, |         | messageType,      |
| detail, severity |         | content, round,   |
| timestamp        |         | from/to agents    |
+------------------+         +-------------------+
```

---

## ⚙️ Installation & Running Locally

### 1. Configure Environmental Variables
Create `.env.local` at the root of the project:
```bash
# Neon Serverless PostgreSQL Connection String
DATABASE_URL="postgresql://neondb_owner:YOUR_PASS@ep-square-fog.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Alibaba DashScope (Qwen Cloud) API Key
DASHSCOPE_API_KEY="your-dashscope-api-key"
```

### 2. Install Dependencies & Setup DB
```bash
# Install NPM packages
npm install

# Push database schema to Neon PostgreSQL
npx prisma db push

# Seed 25 historical precedents and default resource units
npx prisma db seed
```

### 3. Launch Development Server
```bash
# Start local Next.js server
npm run dev
```
Open **`http://localhost:3000`** in your browser to access the EOC control center.

---

## ⚡ Simulation Scenarios
Click **⚡ ONE-CLICK DEMO** in the control panel to inject 3 simultaneous disaster scenarios:
1. **Flooding at Riverside Road** (Sector 4 - High severity, requires route diversion due to weather hazards).
2. **Explosion at Industrial Zone B** (High severity, triggers heavy AEGIS resource contentions).
3. **Suspected Chemical Leak at City Centre** (Axiom challenges the believability of reports, triggering a consensus negotiation round).
