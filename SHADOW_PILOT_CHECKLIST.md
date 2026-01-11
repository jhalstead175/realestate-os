# Shadow Pilot Configuration Checklist

## Phase 2: 30–60 Day Observation Period

---

## Pre-Pilot (Week 0)

### Executive Alignment
- [ ] Executive briefing completed
- [ ] Stakeholders identified (broker-owner, ops lead, compliance)
- [ ] Expectations set (shadow mode, no disruption)
- [ ] Pilot scope agreed (10–25 deals)

### Technical Setup
- [ ] Database provisioned (Supabase)
- [ ] Event log initialized
- [ ] Federation endpoints configured
- [ ] Authentication set up (broker + ops only, no agents)

### Deal Selection
- [ ] Identify 10–25 active transactions
- [ ] Mix of stages (under contract, pending, near closing)
- [ ] Multiple agents (representative sample)
- [ ] No "VIP" deals (real transactions, not cherry-picked)

---

## Week 1: Initial Ingestion

### Deal Ingestion
- [ ] Create `deal_created` events for all pilot deals
- [ ] Record property addresses, target close dates
- [ ] Record initial actor assignments (informational only, no authority)
- [ ] Verify events written to immutable log

### Baseline State Capture
- [ ] Document current CRM state for each deal
- [ ] Document current MLS status
- [ ] Document known blockers (if any)
- [ ] Capture "what agents think" about readiness

### System Configuration
- [ ] Enable closing readiness computation
- [ ] Enable audit narrative generation
- [ ] Disable notifications (observation only)
- [ ] Set up executive read-only access

---

## Weeks 2–4: Observation Period

### Event Recording
- [ ] Record all known state changes as events
- [ ] Record federated assertions (lender/title/insurance)
- [ ] Record contingency removals
- [ ] Record any blockers discovered

### Closing Readiness Tracking
- [ ] Compute readiness daily for all pilot deals
- [ ] Compare RealEstate-OS readiness to "agent assessment"
- [ ] Flag discrepancies (system says blocked, agent says ready)
- [ ] Document when system caught issues agents missed

### Silent Validation
- [ ] At least one deal closes successfully
- [ ] At least one deal encounters a blocker
- [ ] Compare RealEstate-OS predictions to actual outcomes
- [ ] Collect examples of "system knew, brokerage didn't"

---

## Weeks 5–6: Preparation for Readout

### Generate Artifacts
- [ ] Executive closing readiness dashboard for all deals
- [ ] Audit narrative PDF for at least 3 deals
- [ ] As-of replay example (show state 2 weeks ago vs today)
- [ ] Metrics summary (avg days to close, blockers found)

### Identify Demo Moments
- [ ] Select one "blocked deal" example
- [ ] Select one "at-risk deal" example
- [ ] Select one "ready to close" example (proved correct)
- [ ] Prepare "this is what we caught" narrative

### Executive Readout Prep
- [ ] Schedule 60-minute readout meeting
- [ ] Prepare presentation deck
- [ ] Load live system with pilot data
- [ ] Rehearse demo flow

---

## Week 7: Executive Readout

### Meeting Agenda
1. **Recap pilot scope** (5 min)
2. **Show executive readiness UI** (10 min)
3. **Demo blocked deal** (10 min)
4. **Demo audit narrative PDF** (10 min)
5. **Demo as-of replay** (5 min)
6. **Discuss policy mandate** (15 min)
7. **Q&A** (5 min)

### Key Lines
- "Everything you see here is derived from events your brokerage already experienced."
- "This deal was blocked 7 days before close. Your system didn't catch it. Ours did."
- "We can hand this audit narrative to a regulator. Today."

---

## Post-Readout (Week 8+)

### Decision Point
- [ ] Executive commits to policy mandate
- [ ] Effective date set (30–60 days out)
- [ ] Rollout plan agreed
- [ ] Pricing terms finalized

### Prepare for Expansion
- [ ] Expand to all active transactions
- [ ] Enable notifications (messages to agents/brokers)
- [ ] Prepare agent orientation materials
- [ ] Schedule policy mandate issuance

---

## Success Criteria

A successful shadow pilot means:

✅ At least one prevented failed closing (or caught blocker)
✅ Executives see "truth" vs "what we thought"
✅ Audit narrative demonstrates governance capability
✅ Zero disruption to agent workflows
✅ Executive commitment to policy mandate

---

## Red Flags (If You See These, Pause)

🚨 Brokerage wants to "customize" before proving value
🚨 Agents are asking "why are we doing this?"
🚨 Executives want to "skip" shadow mode and go live
🚨 No blockers or discrepancies found (pilot too clean, unrealistic)
🚨 Executives distracted by CRM replacement questions

---

## Pilot Metrics to Track

| Metric | Target |
|--------|--------|
| Deals observed | 10–25 |
| Blockers detected by system | ≥ 1 |
| Blockers missed by brokerage | ≥ 1 |
| Discrepancies (system vs agent) | ≥ 3 |
| Executive check-ins | Weekly |
| Agent disruption incidents | 0 |

---

## Final Note

The shadow pilot is **not about selling**. It's about **proving**.

When executives see what they didn't know, the sale closes itself.
