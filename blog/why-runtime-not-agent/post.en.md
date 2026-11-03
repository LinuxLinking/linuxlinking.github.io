---
title: Why a Runtime, Not Another Agent Framework
date: 2026-10-31
tag: INTENT OS
lede: Every agent framework eventually hits the same wall, so I built Intent OS, an agent runtime that compiles intent into a Plan DAG, gates every side effect and hash-chains every receipt.
---

## Why I stopped building agent frameworks and started an agent runtime

There is a version of me that would write one more agent framework: a smarter planner, a nicer router, a config file for everything.

No bug made me stop. A pattern did. My local Ollama harness, LangGraph, three nodes, about 1200 lines, needed one more guard rule for every new kind of task. The model wrote the file, announced the exit code, kept going. I wrote a rule. It dropped the thread elsewhere; I wrote another.

Every fix landed outside the model, in code that decides what may happen. "It will probably be fine this time" is not a contract you can hand to whoever's files you are about to touch.

Run enough agents on enough real tasks and I kept seeing the same four endings: the intent was a single prompt, so what it would do you learned afterwards; side effects followed the model's mood; the result lived in the chat log; one failed step stalled the chain.

Every framework promises better scheduling, finer prompts, more tools. That is LLM orchestration: all of it asks the model to be more reliable.

So I stopped asking which framework to use and asked where the guarantees should live: one layer above the model, below every agent. I did not want to be the eightieth.

## What exactly is an agent runtime?

The runtime is the deterministic half: it compiles, checks, gates and records.

> The model decides **how** to do the work. The runtime decides **whether it was done, whether it was allowed to happen and what gets written down**.

The agent underneath is replaceable scaffolding: a local small model, a big cloud model, an MCP toolchain. The runtime sees the same in all three, something that can execute a node. Swap it and compilation, acceptance checks, approval scheduling, the audit chain and rerouting stay put. Swap the agent, keep the layer.

The PyPilot executor from [my previous essay on harness guards](../../blog/harness-guard-design/) is **just a replaceable L2 executor** here: those guards police one step, the runtime polices the chain.

One run:

```mermaid
flowchart TD
    I([Intent]) --> C["Compile: Plan DAG<br/>every node carries acceptance criteria"]
    C --> G1{Plan-level approval}
    G1 -- Rejected --> X([Terminated])
    G1 -- Approved --> N[Execute one node]
    N --> S{Has side effects?}
    S -- Yes --> G2{Side-effect approval}
    G2 -- Rejected --> R[Reroute or suspend]
    G2 -- Approved --> E[Execute]
    S -- No --> E
    E --> V{Acceptance criteria}
    V -- Pass --> A[Receipt written to the hash chain]
    V -- Fail --> R
    R -- Alternative executor exists --> N
    R -- Needs a human --> SU([Suspended · awaiting recovery])
    A --> Q{More nodes?}
    Q -- Yes --> N
    Q -- No --> D([Done])
```

## How does an intent become a Plan DAG?

An intent arrives as text and becomes a structured plan: nodes, dependencies, parameters, and the part I care about most, **the acceptance criteria each node carries**.

Acceptance is a machine-decidable predicate; the model's opinion of its own work plays no part:

- `exit_code`: the target script exited with code 0
- `file_exists`: the artefact file exists
- `file_contains`: the artefact's contents contain a marker

Each check returns **evidence**, not a bare boolean. When something fails I can print the criterion that failed and what it saw. That cleared most of the "it says it worked but it didn't" bugs.

A DAG rather than a list: real intent has ordering and parallelism, and a failing node retries without re-running its parents.

## Who approves a side effect?

Side effects are the entire risk surface, so they get two approvals, not one:

- **Plan level**: the whole plan first. What gets touched, how wide the blast radius is, whether it can be undone.
- **Side-effect level**: every node with a side effect is confirmed again before it runs. Which tool, what parameters, what it touches.

The gates ask different questions. The plan gate asks whether this is reasonable at all. The side-effect gate asks whether this call, with these arguments, is acceptable now. A plan can be sound and one node in it still wrong.

Current state: the gates are CLI question and answer. The rules engine I want, where sandbox writes are auto-approved and anything outside asks a human, is next. Getting the gate in the right *place* mattered more than making it automatic.

AI agent safety lives here: no policy document, just approvals.

## Can the audit log be trusted?

Every approval, execution and acceptance writes a receipt carrying `prev_hash` and `hash`:

```text
hash = SHA256(prev_hash + canonical payload)        # no key
hash = HMAC-SHA256(key, prev_hash + payload)         # with a key (root-only)
```

`prev_hash` points back at the previous record, so **if you change a single record, every hash after it stops matching**. The log can be verified, replayed, and sealed when a run ends.

When somebody asks what the agent did that afternoon, the answer is not a chat transcript but a chain you can check. The SHA256 variant is tamper-evident; the HMAC variant needs a root of trust.

## Rerouting, suspension and what rollback really buys

A failed acceptance is a normal state. The rerouting engine picks an alternative executor by severity and records which were used, which are blacklisted. When none is left, or the residual risk is too high, it **suspends**: the scene is sealed into a task file, a human decides, and the run resumes from it.

I did not expect to need this part. Rollback buys less than I assumed. Reverting a file is easy; un-sending a request, undoing a database write, reversing a payment: no runtime does that alone. What rollback buys is the ability to **stop** at a known point and hand the decision to a person.

That is a smaller promise than "failed steps roll back", and I prefer the smaller one.

## Where it breaks and what it costs

The README says it outright: **prototype / research implementation, the public API will change.**

What runs end to end today: intent → plan → approval → execution → acceptance → receipt. The rules engine, multi-tenancy and concurrent scheduling are not built yet.

The costs I did not price in:

- Every gate is latency: a human answering a question is not cheap in a pipeline.
- The CLI approval UI is the product right now, not the layer.
- The plan compiler has never seen a plan with real branching.

## What I would do differently

I would build the rules engine before the second executor. Auto-approving sandbox writes has to work first: a gate that always asks is a gate nobody keeps answering.

I would keep the acceptance criteria at the centre of the plan. Every idea about a cleverer planner died when I had to write its acceptance predicate. The criteria are the contract; the rest is scheduling.

Next: the rules engine, then a replay viewer that runs a sealed log back through the checker, because I still verify receipts by reading them.

The repository is [LinuxLinking/Local_Agent_IntentOS](https://github.com/LinuxLinking/Local_Agent_IntentOS), MIT licensed.
