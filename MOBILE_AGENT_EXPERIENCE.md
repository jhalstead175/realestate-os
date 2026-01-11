# Mobile Agent Experience

## Purpose

**Reassurance > Productivity**

Agents need to check deal status quickly, calmly, and without anxiety.

---

## Core Principles

### 1. No Actions
- No buttons to "Approve" or "Reject"
- No forms to fill out
- No commands to execute
- **Read-only by design**

### 2. No Urgency
- No red/yellow/green stoplight colors
- No countdown timers
- No "URGENT" banners
- No pressure signals

### 3. Large Tap Targets
- Minimum 44px touch targets
- Generous padding and spacing
- Clear visual boundaries
- Easy navigation between views

### 4. One Screen = One Idea
- Summary: Current status at a glance
- Timeline: Chronological event history
- Messages: Notification log
- **No information overload**

### 5. Text > Icons
- Labels are words, not symbols
- "Summary" not 📊
- "Timeline" not 📅
- "Messages" not 📧
- **Clear, unambiguous language**

### 6. Calm Copy
- "Status is derived from the system of record"
- "Updates automatically"
- "No events recorded yet" (not "No data!")
- **Reassuring, not alarming**

### 7. No Authority Leaks
- Mobile views are projections only
- No command execution
- No state mutation
- **Safe for agents to view anytime, anywhere**

---

## Mobile Routes

### `/m/deals/[id]/summary`
**What it shows**:
- Property address
- Current stage
- Closing readiness
- Target close date

**What it doesn't show**:
- Commands to execute
- Actions to approve
- Buttons to press

**Purpose**: Quick status check in under 5 seconds.

---

### `/m/deals/[id]/timeline`
**What it shows**:
- Chronological event history
- Human-readable summaries
- Timestamps

**What it doesn't show**:
- Raw event data
- Technical details
- Edit controls

**Purpose**: Understand what happened and when.

---

### `/m/deals/[id]/messages`
**What it shows**:
- Notifications sent
- Channel (email/SMS)
- Status (pending/sent/failed)
- Timestamps

**What it doesn't show**:
- Send buttons
- Compose forms
- Recipient management

**Purpose**: Verify notifications were sent.

---

## Design Decisions

### Why No Actions?

Mobile agents should **check status**, not **execute commands**.

Commands require:
- Careful consideration
- Full context
- Approval workflows
- Authority validation

Mobile views require:
- Quick glances
- Minimal friction
- No accidental taps
- Zero anxiety

**Separation of concerns**: View on mobile, act on desktop.

---

### Why No Urgency Colors?

Red/yellow/green creates **false urgency**:
- Red → "OH NO!"
- Yellow → "UH OH!"
- Green → "PHEW!"

This is **emotional manipulation**, not information.

**Better approach**: Calm, factual status labels:
- "Blocked" (not ❌ RED ALERT)
- "Conditional" (not ⚠️ WARNING)
- "Ready" (not ✅ ALL CLEAR)

Agents can read the status and understand it without emotional response.

---

### Why Large Tap Targets?

Mobile screens are small. Fingers are large.

44px minimum tap targets ensure:
- No accidental taps
- Easy navigation
- Accessible for all users
- Comfortable one-handed use

---

### Why Text Over Icons?

Icons require **interpretation**:
- 📊 = Dashboard? Analytics? Reports?
- 📅 = Calendar? Schedule? Timeline?
- 📧 = Email? Messages? Notifications?

Text requires **reading**:
- "Summary" = Summary
- "Timeline" = Timeline
- "Messages" = Messages

**No ambiguity.**

---

## Demo Flow (Mobile)

### Scenario: Agent at coffee shop checks deal status

1. **Open mobile browser** → Navigate to `/m/deals/[id]/summary`
2. **See property address** → "123 Main St"
3. **See current status** → "Stage: under_contract, Readiness: conditional"
4. **Read disclaimer** → "Status updates automatically"
5. **Close browser** → Done in 5 seconds

**Result**:
- ✅ Agent knows current status
- ✅ No anxiety
- ✅ No accidental actions
- ✅ No authority leaks
- ✅ Safe to check anytime, anywhere

---

## What Mobile Views DON'T Do

### ❌ No Command Execution
Mobile views do NOT:
- Approve automation proposals
- Advance deals to closing
- Grant authority
- Execute commands

**Why**: Mobile is for viewing, desktop is for acting.

### ❌ No State Mutation
Mobile views do NOT:
- Change transaction state
- Update closing readiness
- Modify events
- Alter authority

**Why**: Read-only by design.

### ❌ No "Productivity" Features
Mobile views do NOT:
- Show task lists
- Display action items
- Require agent input
- Track completion status

**Why**: Reassurance, not productivity.

---

## Technical Implementation

### Server Components Only
All mobile views are **React Server Components**:
- No client-side state
- No JavaScript interactivity
- Fast initial load
- SEO-friendly

### Projection-Only Queries
All data is **read-only projections**:
```typescript
// Good: Read-only projection
const { data: events } = await supabaseServer
  .from('events')
  .select('*')
  .eq('aggregate_id', dealId);
```

### No Command APIs
Mobile views do NOT call command APIs:
```typescript
// Bad: Don't do this on mobile
await executeCommand({ type: 'approve_automation', dealId });
```

---

## Mobile-Specific Styling

### Tailwind Classes for Mobile
```tsx
// Large tap targets
<button className="py-4 px-6">  {/* 44px+ height */}

// Generous spacing
<div className="space-y-3">  {/* 12px between items */}

// Readable text
<p className="text-sm">  {/* 14px font size */}

// Calm colors
<div className="text-gray-500">  {/* Muted, not urgent */}
```

### Responsive Design
```tsx
// Center on mobile, wider on tablet
<main className="max-w-md mx-auto p-4">
```

---

## Success Metrics

### How We Know It's Working

1. **Time to Check Status**: < 5 seconds
2. **Accidental Actions**: 0 (impossible by design)
3. **Agent Anxiety**: Reduced (calm, factual presentation)
4. **Authority Leaks**: 0 (read-only, no mutations)

### What Agents Say

**Good feedback**:
- "I can check my deals from my phone without worrying I'll break something"
- "It's so simple, I don't even have to think about it"
- "No more anxiety when I get a notification"

**Bad feedback (if we see this, we failed)**:
- "Why can't I approve this from my phone?"
- "I wish there was a button to..."
- "This makes me nervous because..."

---

## Comparison: Mobile vs Desktop

| Feature | Mobile | Desktop |
|---------|--------|---------|
| **Purpose** | Check status | Execute commands |
| **Actions** | None | All |
| **Colors** | Calm grays | Context-appropriate |
| **Buttons** | Navigation only | Commands + navigation |
| **State** | Read-only | Read + write |
| **Anxiety** | Zero | Managed |

---

## Summary

**Mobile agent experience is about:**
- ✅ Quick status checks
- ✅ Calm presentation
- ✅ Zero accidental actions
- ✅ Reassurance over productivity

**Mobile agent experience is NOT about:**
- ❌ Command execution
- ❌ Task completion
- ❌ Productivity tracking
- ❌ State mutation

**Result**: Agents can check their deals in under 5 seconds, from anywhere, without anxiety or authority leaks.
