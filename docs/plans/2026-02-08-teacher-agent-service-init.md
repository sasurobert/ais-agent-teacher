# Teacher Agent Service Implementation Plan

**Goal:** Build the efficiency-driven Teacher Assistant microservice (`ais-agent-teacher`) to provide proactive classroom insights and operational support.

**Architecture:** An agent-native microservice using LangGraph for reasoning, Prisma for database interactions, and specialized tools for classroom management and student monitoring.

**Tech Stack:** Node.js, TypeScript, LangGraph, Prisma, PostgreSQL.

---

### Task 1: Environment & Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `prisma/schema.prisma`
- Create: `src/index.ts`

**Step 1: Write minimal package.json**
```json
{
  "name": "ais-agent-teacher",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts",
    "test": "vitest"
  }
}
```

**Step 2: Initialize Prisma and define schema**
Create `prisma/schema.prisma` with `TeacherState` and `ClassAnalytics` models.

**Step 3: Setup Express Server in `src/index.ts`**
Register `/health`, `/chat`, and `/analytics` routes.

**Step 4: Commit**
```bash
git add .
git commit -m "feat: scaffold teacher agent service"
```

---

### Task 2: Direct Efficiency Agent Logic

**Files:**
- Create: `src/agents/TeacherAgent.ts`
- Create: `src/services/AnalyticsService.ts`

**Step 1: Write the failing test for efficiency persona**
[Code block with test ensuring direct markdown output]

**Step 2: Implement `TeacherAgent` using LangGraph**
Focus on "Direct Output" rather than Socratic guidance.

**Step 3: Implement `AnalyticsService`**
Methods to aggregate data from the student tutor's `StudentState`.

**Step 4: Commit**
```bash
git add src/
git commit -m "feat: implement initial teacher agent logic"
```

---

### Task 3: Proactive Alerting (Flagging Help-Abuse)

**Files:**
- Create: `src/services/AlertService.ts`
- Modify: `src/agents/TeacherAgent.ts`

**Step 1: Implement monitoring loop for StudentState changes**
**Step 2: Define "Help Abuse" notification logic**
**Step 3: Commit**
```bash
git add src/
git commit -m "feat: implement proactive flagging for help-abuse"
```
