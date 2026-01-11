# Execution Spine - Test Matrix

## Testing Philosophy

**We do not test behavior. We test law.**

Every test answers one question: **"Could the system ever allow something illegal to happen?"**

If yes → fail.

## Test Layers

### 1. Pure Function Unit Tests
- **Location:** `__tests__/eventFolding.test.ts`, `__tests__/commandResolution.test.ts`
- **Purpose:** Verify pure functions are deterministic and correct
- **No I/O:** These tests use only in-memory data
- **Coverage:** 100% of pure function logic

### 2. Decision Context Integration Tests
- **Location:** `__tests__/buildContext.integration.test.ts`
- **Purpose:** Verify full pipeline with controlled event logs
- **Simulates:** Real database scenarios with mocked data
- **Focus:** End-to-end context assembly

### 3. Command Resolution Adversarial Tests
- **Location:** `__tests__/commandResolution.adversarial.test.ts`
- **Purpose:** Verify system cannot be tricked into illegal actions
- **Approach:** Attempt to break the law, expect failure

## Test Matrix

### Pure Function Unit Tests

#### foldTransactionState()

| Test Case | Input | Expected Output | Invariant |
|-----------|-------|-----------------|-----------|
| No events | `[]` | `'initiated'` | Default state is always initiated |
| Valid transition | `[{ event_type: 'TransactionStateAdvanced', payload: { to_state: 'qualified' }}]` | `'qualified'` | Only TransactionStateAdvanced events change state |
| Illegal transition | `[qualified → closing]` | `'qualified'` | Illegal transitions are ignored |
| Sequential transitions | `[initiated → qualified → offer_issued → under_contract]` | `'under_contract'` | Multiple valid transitions fold correctly |
| Terminal state | `[... → completed → failed]` | `'completed'` | Terminal states cannot advance |

**Invariant:** State can only advance via legal transitions defined in state machine.

#### foldAuthority()

| Test Case | Input | Expected Output | Invariant |
|-----------|-------|-----------------|-----------|
| Authority granted | `[AuthorityGranted]` | `{ mayAdvanceToClosing: true }` | Granted authority is active |
| Authority revoked | `[Granted, Revoked]` | `{}` | Revoke overrides all grants |
| Expired authority | `[Granted with valid_until < now]` | `{}` | Expired authority is inactive |
| Future authority | `[Granted with valid_from > now]` | `{}` | Not-yet-valid authority is inactive |
| Multiple grants | `[Grant A, Grant B]` | Merged scopes | Multiple grants merge |

**Invariant:** Authority is temporal and revocable.

#### deriveRoleFromAuthority()

| Test Case | Input | Expected Output | Invariant |
|-----------|-------|-----------------|-----------|
| Agent authority | `{ mayAdvanceToClosing: true }` | `'agent'` | Advance scope → agent role |
| Lender authority | `{ mayIssueAttestation: ['LoanClearedToClose'] }` | `'lender'` | Loan attestation → lender role |
| Title authority | `{ mayIssueAttestation: ['TitleClearToClose'] }` | `'title'` | Title attestation → title role |
| Insurance authority | `{ mayIssueAttestation: ['BinderIssued'] }` | `'insurance'` | Insurance attestation → insurance role |
| Multiple matches | `{ mayAdvanceToClosing: true, mayIssueAttestation: [...] }` | `null` | Ambiguous → fail closed |
| No matches | `{}` | `null` | No authority → no role |

**Invariant:** Role is DERIVED from authority, never assumed. Ambiguity fails closed.

#### detectBlockingEvent()

| Test Case | Input | Expected Output | Invariant |
|-----------|-------|-----------------|-----------|
| FinancingWithdrawn | `[{ event_type: 'FinancingWithdrawn' }]` | `{ reason: '...' }` | Withdrawal blocks |
| TitleDefectDetected | `[{ event_type: 'TitleDefectDetected' }]` | `{ reason: '...' }` | Defect blocks |
| CoverageWithdrawn | `[{ event_type: 'CoverageWithdrawn' }]` | `{ reason: '...' }` | Coverage withdrawal blocks |
| AuthorityRevoked | `[{ event_type: 'AuthorityRevoked' }]` | `{ reason: '...' }` | Revocation blocks |
| ContingencyFailed | `[{ event_type: 'ContingencyFailed' }]` | `{ reason: '...' }` | Failed contingency blocks |
| No blocking events | `[{ event_type: 'OtherEvent' }]` | `null` | Non-blocking events ignored |

**Invariant:** Any blocking event prevents closing.

#### hasUnresolvedContingencies()

| Test Case | Input | Expected Output | Invariant |
|-----------|-------|-----------------|-----------|
| Created, not resolved | `[ContingencyCreated]` | `true` | Unresolved contingencies exist |
| Created and resolved | `[Created, Resolved]` | `false` | Resolved contingencies don't block |
| Created and failed | `[Created, Failed]` | `false` | Failed contingencies counted as resolved |
| Multiple contingencies | `[Created, Created, Resolved]` | `true` | Counts net unresolved |
| No contingencies | `[]` | `false` | No contingencies = ready |

**Invariant:** Unresolved contingencies prevent closing.

### Integration Tests

#### buildDecisionContext()

| Test Case | Scenario | Expected Context | Invariant |
|-----------|----------|------------------|-----------|
| Happy path | Full authority + attestations | `{ closingReadiness: 'ready', role: 'agent' }` | Perfect conditions → ready |
| Authority revoked | Granted then revoked | `{ closingReadiness: 'blocked' }` | Revocation blocks |
| Attestation expired | Expired lender attestation | `{ closingReadiness: 'expired' or 'not_ready' }` | Expiration downgrades |
| Conflicting attestations | Clearance then withdrawal | `{ closingReadiness: 'blocked' }` | Withdrawal blocks |
| Partial data load | Error loading attestations | `{ closingReadiness: 'blocked' }` | Errors fail closed |

**Invariant:** buildDecisionContext never throws, always returns valid context. Failures fail closed.

### Adversarial Tests

#### Command Resolution

| Attack Scenario | Context | Command Result | Invariant |
|----------------|---------|----------------|-----------|
| Agent advance not ready | `{ closingReadiness: 'not_ready' }` | `{ type: 'none' }` | Cannot advance when not ready |
| Agent advance conditionally ready | `{ closingReadiness: 'conditionally_ready' }` | `{ type: 'none' }` | Conditional requires review |
| Agent without authority | `{ authority: {} }` | `{ type: 'none' }` | No authority → no command |
| Lender attempts state change | `{ role: 'lender' }` | `NOT 'advance_to_closing'` | Lender cannot advance state |
| Automation without scope | `{ authority: {} }` | `{ type: 'none' }` | Automation requires explicit scope |
| Wrong attestation type | Lender with title scope | Attestation type mismatch | Can only issue authorized types |
| Withdrawal without issuance | No prior attestation | `{ type: 'issue_attestation' }` | Issue before withdraw |
| Expired readiness | `{ closingReadiness: 'expired' }` | `{ type: 'none' }` | Expiration blocks |
| Completed transaction | `{ transactionState: 'completed' }` | `{ type: 'none' }` | Terminal states block |
| Blocking overrides authority | `{ closingReadiness: 'blocked' }` | `{ type: 'none' }` | Blocking dominates |

**Invariant:** No combination of inputs can produce illegal command.

## Invariants (The Law)

These are the absolute truths the system enforces:

### 1. State Transition Invariants
- ✅ State can only advance via legal transitions
- ✅ Terminal states (completed, failed) cannot advance
- ✅ Only TransactionStateAdvanced events change state

### 2. Authority Invariants
- ✅ Authority is temporal (valid_from → valid_until)
- ✅ Authority is revocable (Revoked overrides Granted)
- ✅ Role is DERIVED from authority, not assumed
- ✅ Ambiguous authority fails closed (null role)

### 3. Closing Readiness Invariants
- ✅ All attestations required for ready state
- ✅ Any blocking event prevents closing
- ✅ Unresolved contingencies prevent closing
- ✅ Expired attestations downgrade readiness

### 4. Command Resolution Invariants
- ✅ Blocking dominates all other conditions
- ✅ Only agent can advance_to_closing
- ✅ Agent can only advance when ready + authority + under_contract
- ✅ Lender/title/insurance can only issue/withdraw attestations
- ✅ Empty authority scope → no command

### 5. Failure Mode Invariants
- ✅ Errors fail closed (blocked context)
- ✅ Missing data fails closed
- ✅ buildDecisionContext never throws
- ✅ All paths return valid DecisionContext

## Test Coverage Requirements

| Module | Coverage Target | Current Status |
|--------|----------------|----------------|
| `eventFolding.ts` | 100% | ✅ Complete |
| `commandResolution.ts` | 100% | ✅ Complete |
| `buildContext.ts` | 90%+ | ✅ Complete |
| `apiGuard.ts` | 100% | ⏳ Pending |

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test eventFolding.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Test Success Criteria

Tests pass when:
1. ✅ All pure functions return expected outputs
2. ✅ Integration tests verify full pipeline
3. ✅ Adversarial tests cannot break the law
4. ✅ Coverage meets requirements
5. ✅ No invariants violated

## Failure is Success

**If any test fails:**
- ❌ UI must not render commands
- ❌ Automation must halt
- ❌ System must degrade safely

**Silence is acceptable. Wrong action is not.**

## Property-Based Testing (Future)

### Invariant Properties

```typescript
// Property 1: Ready implies all conditions met
property('ready implies all conditions met', () => {
  forAll(arbitraryDecisionContext, (ctx) => {
    const command = resolveAvailableCommand(ctx);

    if (command.type === 'advance_to_closing') {
      return (
        ctx.closingReadiness === 'ready' &&
        ctx.authority.mayAdvanceToClosing === true &&
        ctx.transactionState === 'under_contract' &&
        !ctx.unresolvedContingencies
      );
    }
    return true;
  });
});

// Property 2: Blocking always prevents advance
property('blocking always prevents advance', () => {
  forAll(arbitraryDecisionContext, (ctx) => {
    if (ctx.closingReadiness === 'blocked') {
      const command = resolveAvailableCommand(ctx);
      return command.type === 'none';
    }
    return true;
  });
});

// Property 3: Role derivation is deterministic
property('role derivation is deterministic', () => {
  forAll(arbitraryAuthorityScope, (auth) => {
    const role1 = deriveRoleFromAuthority(auth);
    const role2 = deriveRoleFromAuthority(auth);
    return role1 === role2;
  });
});
```

## Continuous Validation

### Pre-Commit Hooks
- Run all unit tests
- Verify coverage thresholds
- Lint test files

### CI/CD Pipeline
- Run full test suite on every commit
- Block merge if tests fail
- Report coverage metrics

### Production Monitoring
- Log guard rejections (illegal command attempts)
- Alert on role derivation failures
- Track context build errors

## Maintenance

### Adding New Test Cases

When adding new functionality:

1. **Add pure function tests first**
   - Test happy path
   - Test edge cases
   - Test failure modes

2. **Add integration tests**
   - Test full pipeline
   - Test with real-world scenarios

3. **Add adversarial tests**
   - Try to break the law
   - Expect failures

4. **Update invariants**
   - Document new invariants
   - Update test matrix

### Test Hygiene

- ✅ Each test has clear name describing what it tests
- ✅ Tests are independent (no shared state)
- ✅ Tests use minimal setup
- ✅ Tests verify ONE invariant each
- ✅ Assertions are explicit and clear

## Final Law

**If these tests pass, the system is correct.**

Not "probably." Not "for now."

**Correct.**

The Execution Spine is the foundation. If it holds, everything built on top is safe.

---

**Version:** 1.0.0
**Last Updated:** 2026-01-11
**Status:** CANONICAL
