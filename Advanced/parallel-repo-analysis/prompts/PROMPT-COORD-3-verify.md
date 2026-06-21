# PROMPT-COORD-3 — Cross-Verification (Phase 3)

> Coordinator role (NOT a lane agent). Inputs: the 6 lane reports. Output:
> `docs/agent-analysis/A1_verification_report.md`.

**Mission:** Independently cross-verify the 6 reports against source — the agents did not read each
other, so agreements are genuine corroboration and disagreements are real contradictions.

**Procedure:**
1. **Contradictions** — diff overlapping claims (e.g. Retrofit service count, module count). For each,
   re-grep source and resolve with evidence; the cited `file:line` wins. Record final value.
2. **Corroborations** — note findings independently reached by ≥2 agents (raises confidence).
3. **Missing/complementary** — note what one agent saw that an overlapping agent missed.
4. **Unverified assumptions** — surface INFERRED/UNVERIFIED claims that matter.
5. **Independent spot-checks** — re-run a sample of each agent's headline claims as commands; record
   the command and result in a table.
6. **Phase 3b adversarial pass** — a *separate blind* agent (not given the reports) confirms/refutes
   the top findings from source. Fold any correction back (e.g. CI gap accurate for Bitbucket but
   GitLab scope UNVERIFIED).
7. Give each major finding a review trail: Discovered by → Verified by → Independently re-verified by
   → Final status.

**Must include:** a Contradictions section, a spot-checks table, and the count of
CONFIRMED/PARTIAL/REFUTED from the adversarial pass.
