# Multi-Agent Execution Mode

## Overview

Multi-Agent Execution Mode is an advanced execution strategy for implementing complex specifications with strict adherence to SDD (Specification-Driven Development) principles. This mode simulates multiple specialized agents working in parallel across isolated domains while enforcing architectural constraints and validation gates.

## When to Use

Use Multi-Agent Mode when:
- Implementing large features with multiple isolated domains (e.g., Profile, Address, Orders)
- Strict SDD compliance is required
- Parallel execution opportunities exist
- Complex dependency management is needed
- Architectural boundaries must be enforced
- Multiple validation gates are required

## Activation

To activate Multi-Agent Mode, use the following command structure:

```
Execute the spec: [spec-name]
Use MULTI-AGENT MODE with SDD enforcement.

Instructions:
Activate the GLOBAL MULTI-AGENT EXECUTION mode
All agents MUST follow the SDD specification strictly
All previously defined project rules MUST be enforced without exception
```

## Execution Phases

### Phase 1: Planner Mode

**Purpose**: Parse the specification and create an execution plan

**Activities**:
- Parse requirements.md, design.md, and tasks.md
- Build a complete task DAG (Directed Acyclic Graph)
- Identify task dependencies
- Identify parallelization opportunities
- Map tasks to domains

**Output**:
- Task dependency graph
- Domain separation plan
- Parallelization map
- Critical path identification

**Example DAG**:
```
Task 1 (Foundation) ← BLOCKING
    ↓
Task 2 (Utils) ← PARALLEL SAFE
Task 3 (Utils) ← PARALLEL SAFE
    ↓
Task 4 (Domain A) ← SEQUENTIAL
Task 5 (Domain B) ← PARALLEL with Task 4
Task 6 (Domain C) ← PARALLEL with Task 4, 5
    ↓
Task 7 (Integration) ← BLOCKING
    ↓
Task 8 (Validation) ← BLOCKING
```

### Phase 2: Architect Mode

**Purpose**: Lock architectural decisions before execution

**Activities**:
- Define layer boundaries (UI, State, Data)
- Define domain boundaries
- Lock architectural constraints
- Define security boundaries
- Define data flow patterns

**Output**:
- Architecture diagram
- Locked constraints
- Domain boundaries
- Security rules
- Data flow patterns

**Architecture Lock Example**:
```
┌─────────────────────────────────────┐
│           UI LAYER                   │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │Dom A │  │Dom B │  │Dom C │      │
│  └──────┘  └──────┘  └──────┘      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      STATE MANAGEMENT LAYER          │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │Hook A│  │Hook B│  │Hook C│      │
│  └──────┘  └──────┘  └──────┘      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       DATA ACCESS LAYER              │
│  ┌──────────┐  ┌──────────┐        │
│  │ Database │  │ External │        │
│  │  Client  │  │   APIs   │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

**Architectural Constraints (LOCKED)**:
1. Separation of Concerns
2. Security Boundaries
3. Data Flow Rules
4. Component Boundaries

### Phase 3: Domain Execution Mode

**Purpose**: Execute tasks grouped by domain

**Domain Rules**:
- Each domain owns its data and logic
- No cross-domain mutations
- No shared state assumptions
- Domains communicate via defined contracts

**Execution Waves**:

**Wave 1: Foundation** (Sequential - BLOCKING)
- Database schema
- Core infrastructure
- Must complete before other waves

**Wave 2: Utilities** (Parallel - SAFE)
- Validation utilities
- Helper functions
- Pure functions with no side effects

**Wave 3: Domain Components** (Parallel across domains, Sequential within)
- Domain A: Component A1 → A2 → A3
- Domain B: Component B1 → B2 (parallel with Domain A)
- Domain C: Component C1 → C2 (parallel with Domain A, B)

**Wave 4: Integration** (Sequential - BLOCKING)
- Integrate all domains
- Wire up data flow
- Connect components

**Wave 5: Validation Gates** (Sequential - BLOCKING)
- Checkpoint validations
- Final integration tests
- Acceptance criteria validation

### Phase 4: Integration Mode

**Purpose**: Merge all domains and ensure consistency

**Activities**:
- Merge domain outputs
- Resolve boundaries
- Ensure data consistency
- Validate cross-domain interactions

**Integration Checks**:
- ✅ Domain boundaries respected
- ✅ No cross-domain mutations
- ✅ Shared utilities are stateless
- ✅ Data flow is unidirectional
- ✅ Integration points are well-defined

### Phase 5: Validation Mode (MANDATORY GATE)

**Purpose**: Validate all requirements and properties

**Validation Checklist**:

**Acceptance Criteria Validation**:
- Validate ALL acceptance criteria from requirements.md
- Group by requirement
- Track completion status

**Correctness Properties Validation**:
- Validate ALL correctness properties
- Run property-based tests (if implemented)
- Verify invariants hold

**Business Constraints Validation**:
- Verify global invariants (e.g., max 5 addresses, only 1 default)
- Verify security rules (RLS, ownership)
- Verify data integrity rules

**Project Rules Validation**:
- No code generation deviations
- Architecture constraints respected
- Validation rules enforced
- Security rules enforced

**Failure Handling**:
- If ANY violation is found → STOP execution
- Return to responsible agent/domain
- Fix violation before continuing
- Re-run validation

## Domain Separation Strategy

### Profile Domain
**Responsibilities**:
- User personal information (name, email, phone, CPF)
- Avatar management
- Profile validation

**Components**:
- ProfileEditor
- AvatarSelector
- Profile validation utilities

**State**:
- User profile data
- Edit mode state
- Avatar modal state

### Address Domain
**Responsibilities**:
- Address CRUD operations
- CEP lookup integration
- Default address management
- Address limit enforcement (max 5)

**Components**:
- AddressManager
- AddressForm
- Address validation utilities

**State**:
- Address list
- Form modal state
- Loading/error states

### Orders Domain
**Responsibilities**:
- Order history display (READ-ONLY)
- Order status visualization
- Order details expansion

**Components**:
- OrderHistoryViewer
- OrderList
- OrderCard

**State**:
- Orders list
- Loading/error states
- Expansion state

## Parallelization Rules

### Safe to Parallelize ✅

**Conditions**:
- Domains are isolated
- No shared mutation exists
- No invariant conflict risk
- No dependencies between tasks

**Examples**:
- Profile validation + Address validation (different domains, no shared state)
- OrderHistoryViewer + AddressManager (isolated domains)
- Utility functions (pure functions, no side effects)

### Must be Sequential ❌

**Conditions**:
- Shared invariants exist
- Auth-sensitive flows
- Database schema dependencies
- Integration points

**Examples**:
- Database schema must complete before components
- ProfileEditor depends on validation utilities
- Integration must wait for all domains
- Validation gates are blocking

## Invariant Enforcement (GLOBAL)

These invariants MUST NEVER be violated:

### Data Invariants
- Max 5 addresses per user
- Only 1 default address per user
- Orders are read-only (no mutations)
- User data isolation (RLS enforced)

### UI Invariants
- UI must reflect persisted state
- Optimistic updates must rollback on failure
- Loading states must be shown during operations
- Error states must display user-friendly messages

### Security Invariants
- RLS policies enforce user data isolation
- No cross-user data access
- Sensitive changes require verification
- Session expiry redirects to login

## Communication Rules

### Agents MUST communicate via:
- Defined contracts (TypeScript interfaces)
- SDD terminology (from glossary)
- Explicit interfaces (no implicit coupling)

### Agents MUST NOT:
- Access another agent's internal logic
- Modify another agent's output
- Share implicit state
- Bypass defined interfaces

## Failure Strategy

### Agent Failure
1. Retry once
2. If persistent failure → escalate to Planner Agent
3. Planner reassesses and creates new plan

### Integration Failure
1. Rollback conflicting changes
2. Re-run conflicting agents with updated context
3. Validate integration again

### Validation Failure
1. STOP execution immediately
2. Identify responsible agent/domain
3. Return to that agent for fixes
4. Re-run validation after fixes

## Determinism Rule

Agents MUST:
- Produce deterministic outputs
- Avoid interpretation beyond SDD
- Avoid "creative" decisions
- Follow specifications exactly

Agents MUST NOT:
- Improvise solutions
- Deviate from specifications
- Make assumptions
- Introduce undocumented behavior

## Anti-Deviation Rule (CRITICAL)

Agents MUST NOT:
- Ignore project-level constraints
- Generate unauthorized patterns
- Introduce undocumented behavior
- Bypass validation rules

**If any doubt exists**:
→ Follow SDD + Project Rules
→ NEVER improvise

## Execution Guarantee

This system MUST ensure:
- Consistency across all agents
- Zero rule violations
- Full alignment with SDD
- Production-level structural quality

## Example: User Profile Page

### Specification
- **Feature**: User Profile Page (/perfil)
- **Domains**: Profile, Address, Orders
- **Tasks**: 14 main tasks, 48 sub-tasks
- **Requirements**: 12 requirements, 88 acceptance criteria
- **Properties**: 12 correctness properties

### Phase 1: Planner Output
```
Task DAG:
Task 1 (DB Schema) ← FOUNDATION
    ↓
Task 2 (Validation) ← PARALLEL
Task 3 (Image Utils) ← PARALLEL
    ↓
Task 4 (ProfileEditor) ← Profile Domain
Task 5 (AddressManager) ← Address Domain
Task 7 (OrderViewer) ← Orders Domain
    ↓
Task 9 (ProfilePage) ← Integration
    ↓
Task 12 (Checkpoint) ← Validation Gate
```

### Phase 2: Architect Output
```
Architecture Lock:
- 3 Layers: UI → State → Data
- 3 Domains: Profile, Address, Orders
- Security: RLS policies, user isolation
- Invariants: Max 5 addresses, 1 default, orders read-only
```

### Phase 3: Domain Execution
```
Wave 1: Task 1 (DB Schema) ✅
Wave 2: Task 2 + Task 3 (parallel) ✅
Wave 3: Task 4 + Task 5 + Task 7 (parallel) ✅
Wave 4: Task 9 (Integration) ✅
Wave 5: Task 12 (Validation) ✅
```

### Phase 4: Integration
```
✅ ProfileEditor integrated with AuthContext
✅ AddressManager integrated with Supabase
✅ OrderViewer integrated with Supabase
✅ All domains wired to ProfilePage
```

### Phase 5: Validation
```
✅ 88 acceptance criteria validated
✅ 12 correctness properties verified
✅ 4 global invariants enforced
✅ RLS policies tested
✅ All project rules followed
```

## Benefits

### Consistency
- All agents follow same rules
- No deviations from specifications
- Deterministic execution

### Parallelization
- Faster execution for large features
- Isolated domains work independently
- Clear dependency management

### Quality
- Multiple validation gates
- Architectural constraints enforced
- Security rules enforced

### Traceability
- Clear execution phases
- Documented decisions
- Validation checkpoints

## Limitations

### Overhead
- More planning required upfront
- More coordination between agents
- More validation checkpoints

### Complexity
- Requires clear domain boundaries
- Requires well-defined specifications
- Not suitable for small features

### When NOT to Use
- Small features with < 5 tasks
- Features with unclear domain boundaries
- Exploratory/prototype work
- Quick fixes or patches

## Best Practices

### 1. Clear Domain Boundaries
Define domains with:
- Clear responsibilities
- No overlapping concerns
- Isolated state
- Defined interfaces

### 2. Explicit Dependencies
Document:
- Task dependencies
- Data dependencies
- Component dependencies
- Integration points

### 3. Validation Gates
Place validation gates:
- After foundation tasks
- After domain execution
- After integration
- Before final delivery

### 4. Rollback Strategy
Always have:
- Optimistic updates with rollback
- Error handling at all levels
- Retry mechanisms
- Fallback UI states

### 5. Documentation
Document:
- Architecture decisions
- Domain boundaries
- Invariants
- Integration points

## Troubleshooting

### Problem: Circular Dependencies
**Solution**: Refactor to break the cycle, introduce abstraction layer

### Problem: Domain Boundaries Unclear
**Solution**: Return to Architect Mode, redefine boundaries

### Problem: Validation Failures
**Solution**: Stop execution, fix violations, re-run validation

### Problem: Integration Conflicts
**Solution**: Rollback, re-run conflicting agents with updated context

### Problem: Performance Issues
**Solution**: Increase parallelization, optimize critical path

## Conclusion

Multi-Agent Execution Mode provides a structured, deterministic approach to implementing complex features with strict SDD compliance. By simulating multiple specialized agents working across isolated domains with clear validation gates, it ensures consistency, quality, and traceability throughout the execution process.

Use this mode for large, complex features where architectural integrity and specification adherence are critical.
