# Warnix EOC — Implementation & Capabilities Registry

This document registers the active functions, dashboard controls, interactive buttons, and database schemas deployed in the **Warnix AI Emergency Operations Center** (Primary Submission for **Track 3: Agent Society**).

---

## 🚦 System Architecture & Routing

Warnix is structured as a Next.js App Router project leveraging a dual-page tactical flow:

* **Root Landing Page (`/`)**: A dark matte command portal explaining the platform's vision, demonstrating Track 3 compliance, detailing the 7 agent roles using hover-glow cards, displaying generated tactical mockups (`warnix_dashboard_mockup.png` & `warnix_agent_network.png`), and running a live telemetry log feed via React `useEffect` loops.
* **EOC Mission Control (`/dashboard`)**: The active real-time dashboard displaying GIS maps, agent chat logs, resource lists, timeline logs, and commander controls.

---

## 🕹️ Dashboard Controls & Interactive Buttons

Every UI controller is wired to direct database actions or orchestrator triggers:

### 1. EOC Incident Controls
* **`[+] REPORT EMERGENCY` Button**: Opens the dispatch reporting overlay. It features a backdrop blur and is set to `zIndex: 10000` to render in front of the map tiles.
  * **Submit Form (`DISPATCH AGENTS`)**: Submits title, type, location, severity, and latitude/longitude to `/api/incidents`.
  * **Double-Click Guard**: On submit, the button immediately disables, transitions to a greyed-out loading style, displays `DISPATCHING...`, and prevents duplicate database entry creations.
  * **Coordinate Randomizer (`GENERATE RANDOM COORDINATES`)**: Computes random offsets near central London to scatter tactical markers on the radar map.
* **`ONE-CLICK DEMO` Button**: Pre-creates the Riverside Flooding scenario, retrieves its ID, auto-selects/focuses the dashboard view, and launches subsequent earthquake and fire incidents sequentially in the background. It also injects road blockages to test agent re-routing in real-time.

### 2. Human-in-the-Loop Command Toolbar
Located at the bottom center of the dashboard, this panel allows the human commander to review AI-generated action plans:
* **`APPROVE DISPATCH` Button**: Triggers `/api/incidents/[id]/approve`. Marks the run status as `COMPLETED`, updates deployment statuses to `DEPLOYED`, and draws routes on the map.
* **`REJECT PLAN` Button**: Triggers `/api/incidents/[id]/reject`. Aborts dispatch, sets run status to `FAILED`, and releases allocated assets.
* **`INJECT CUSTOM INSTRUCTION` Input & Submit (`RE-DELIBERATE`)**: Triggers `/api/incidents/[id]/override`. Injects custom constraints (e.g. *"Bypass Sector 4 due to chemical leak"*), updates `sharedMemory` flags, and executes a full agent society re-run with live debate updates.

### 3. Agent & Fleet Panels
* **Agent Workspace Selector (Roster Buttons)**: Clicking any of the 7 agent rows (SIGMA, AXIOM, etc.) focuses the right-hand panel, loading that specific agent's avatar, role metrics, socratic inbox, individual reasoning logs, and short-term memory influence weight.
* **Resource Filter Tabs (`ALL`, `AMBULANCE`, `FIRE TRUCK`, `RESCUE TEAM`, `HELICOPTER`)**: Filters active responder fleets inside the left panel. Displays active status tags (`AVAILABLE` or `DEPLOYED`) and calls signs (e.g. `AMB-01`).

---

## 🧠 Autonomous Agent Cognitive Functions

The 7 agents inside the society run specific backend logic compiled using `qwen-plus`:

1. **SIGMA (Incident Analysis)**
   * *Function*: Classifies incoming reports (FLOOD, EARTHQUAKE, FIRE), evaluates severity (1–10), projects casualties, and logs baseline facts to the shared blackboard.
2. **AXIOM (Evidence Verification)**
   * *Function*: Acts as a skeptic. Cross-checks observation confidence, weeds out rumor indices, and verifies reported blockage claims before dispatch clearance.
3. **HERALD (Live Intelligence)**
   * *Function*: Monitors weather sensors, tracks hazard directions, and registers road blocks (e.g. landslides) as active blackboard interrupts.
4. **AEGIS (Resource Optimization)**
   * *Function*: Evaluates ambulance and truck counts, runs resource scarcity math ($EOC\_Scarcity = \frac{UnitsRequired}{UnitsAvailable}$), and flags resource deficits.
5. **ATLAS (Routing & Deployment)**
   * *Function*: Plots geographical rescue routes, maps safe bypasses, and designates triage evacuation shelters.
6. **ARCHIVE (Historical Memory)**
   * *Function*: Queries a vector database of 25 historical precedents to match strategies (e.g. Cologne river Floods) and extract lessons learned.
7. **NEXUS (Coordinator & Decision Engine)**
   * *Function*: Moderates debates, detects resource contentions, triggers Round 2 interrogation questions, collects revised votes, and compiles the final natural language XAI decision summary.

---

## 💾 Database Schema Mappings (Neon PostgreSQL)

All relational models are persisted via Prisma:

```prisma
model Incident {
  id           String             @id @default(cuid())
  title        String
  type         String             // FLOOD | EARTHQUAKE | FIRE
  severity     Int
  location     String
  latitude     Float
  longitude    Float
  description  String
  status       String             // ACTIVE | RESOLVED | ABORTED
  demoMode     Boolean            @default(false)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  agentRuns    AgentRun[]
  deployments  ResourceDeployment[]
  resources    IncidentResource[]
  timeline     TimelineEntry[]
}

model AgentRun {
  id                   String             @id @default(cuid())
  incidentId           String
  incident             Incident           @relation(fields: [incidentId], references: [id])
  status               String             // RUNNING | ROUND_2 | AWAITING_HUMAN | COMPLETED | FAILED
  currentRound         Int                @default(1)
  startedAt            DateTime           @default(now())
  completedAt          DateTime?
  finalDecision        Json?              // Compiled CoordinatorDecision
  sharedMemorySnapshot Json?              // Blackboard data snapshot
  votes                AgentVote[]
  messages             AgentMessage[]
}

model AgentMessage {
  id           String   @id @default(cuid())
  agentRunId   String
  agentRun     AgentRun @relation(fields: [agentRunId], references: [id])
  incidentId   String
  incident     Incident @relation(fields: [incidentId], references: [id])
  fromAgent    String   // AgentId | 'SYSTEM'
  toAgent      String?  // AgentId | null (broadcast)
  messageType  String   // STATEMENT | CHALLENGE | REVISION
  content      String
  round        Int      @default(1)
  evidenceTier Int?     // 1 | 2 | 3
  timestamp    DateTime @default(now())
}

model AgentVote {
  id              String   @id @default(cuid())
  agentRunId      String
  agentRun        AgentRun @relation(fields: [agentRunId], references: [id])
  incidentId      String
  agentId         String   // AgentId
  round           Int      @default(1)
  confidence      Float
  urgency         Float
  vote            String   // AGREE | PARTIAL | DISAGREE
  recommendation  String
  reasoning       String
  risks           String[]
  memoryUsed      Boolean  @default(false)
  memoryInfluence Float?
  rawOutput       Json?
  detectedAt      DateTime @default(now())
}

model TimelineEntry {
  id         String   @id @default(cuid())
  incidentId String
  incident   Incident @relation(fields: [incidentId], references: [id])
  agentId    String?  // AgentId
  category   String   // ANALYSIS | DEBATE | DECISION
  title      String
  detail     String
  severity   String   // INFO | WARNING | CRITICAL
  timestamp  DateTime @default(now())
}

model Resource {
  id          String               @id @default(cuid())
  type        String               // AMBULANCE | FIRE_TRUCK | RESCUE_TEAM | HELICOPTER
  name        String
  callSign    String               @unique
  status      String               // AVAILABLE | DEPLOYED
  latitude    Float?
  longitude   Float?
  homeBase    String
  deployments ResourceDeployment[]
  incidents   IncidentResource[]
}
```

---

## 🚦 System Completion Status: 100% (READY FOR DEPLOYMENT)
Every control flow, Qwen API integration, database schema constraint, map interaction, and UI overlay has been successfully deployed and verified with strict type-safety compilation.
