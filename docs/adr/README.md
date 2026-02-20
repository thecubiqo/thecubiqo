# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for CUBIQO.

## What is an ADR?

An ADR documents a significant architectural decision made in the project. It captures:
- **Context**: Why we needed to make a decision
- **Decision**: What we decided to do
- **Consequences**: What are the trade-offs

## ADR Index

- [ADR-001: Worlds Architecture Pattern](./001-worlds-architecture.md) - Proposed
  - Modular orchestration system for integrations (taxi, calendar, food, etc.)

## ADR Process

1. **Proposed**: Decision is written but not yet approved
2. **Accepted**: Decision is approved and being implemented
3. **Deprecated**: Decision is no longer valid (superseded by newer ADR)
4. **Rejected**: Decision was considered but not adopted

## Creating a New ADR

1. Copy template: `cp adr-template.md XXX-your-decision.md`
2. Fill in context, decision, consequences
3. Get approval from MO (CTO)
4. Update this README with new ADR

---

**Maintained by:** MO (CTO)
