---
title: Ollama Coding Agent, Distrust the 3B Model, Encode the Guard
date: 2026-10-31
tag: LOCAL OLLAMA HARNESS
lede: Building a local Ollama coding agent on LangGraph, I learned that a 3B model's real problem is unreliability, so every known failure mode became a deterministic guard rule in code.
---

## The failure that set the design: qwen2.5-coder:3b claiming exit code 0

The first thing I asked qwen2.5-coder:3b to do was write a file. It wrote the file, announced "created and verified, exit code 0, all good", and stopped. It had never run anything. No process, no output, no exit code. It had written the sentence it expected a careful agent to write.

That single message is the whole design brief. A 3B model is not stupid. It writes a correct FizzBuzz and it fixes a broken indentation. What it cannot do is judge its own work. So I stopped asking it to grade itself and made the harness grade it instead.

The rest of the catalogue showed up within a few sessions:

- keeping calling tools after the verification passed, not knowing it was already finished;
- hammering the same `read_file` five times with byte-identical input;
- returning an empty string for an entire turn;
- writing the Action Input as single quotes, or triple quotes, or with a sentence of commentary trailing after the closing brace;
- hallucinating its own `Observation:` and building on a result nobody executed.

None of that is hypothetical. It is the daily routine of a 3B model, and the stance came straight out of it: **the model only proposes, the harness disposes.** A prompt can guide the model. It cannot be relied on.

## How does a LangGraph pipeline let the harness overrule the model?

The project is roughly 1200 lines on LangGraph, and the graph has three nodes on a single spine:

```mermaid
flowchart LR
    S([START]) --> M[model]
    M --> G{guard}
    G -- TOOL --> A[act]
    G -- HARNESS_VERIFY --> A
    G -- OBSERVE --> L[loopback]
    A --> L
    G -- FINAL / STOP --> E([END])
    L --> M
```

`model` calls the model and parses what comes back. `guard` decides what is allowed to happen this step. `act` runs the tool and wraps the result into an Observation that goes back into the loop.

The guard is the only reason any of this works, because it sits between `model` and `act` on every turn. The model wants a tool, the guard agrees or it doesn't. The model wants to wrap up, the guard decides whether that wrap-up is earned. The model refuses to cooperate, and the guard hands the turn to `act` anyway. That last case is `HARNESS_VERIFY`: the harness runs the verification itself and feeds the real exit code back.

### Why ReAct text and not JSON function calling

Strict JSON tool calls do exist; Ollama takes a JSON schema on that side. A 3B model follows them badly. It turns the Action Input into single quotes, or triple quotes, or a schema followed by a sentence of commentary.

So the agent speaks the classic ReAct text protocol instead, `Thought / Action / Action Input`, and the parser carries three fallbacks: `json.loads` first, then `raw_decode` to swallow trailing nonsense, then `ast.literal_eval` to accept Python literal syntax. When all three fail, the output is tagged `__PARSE_FAILED__` and handed to the guard. A parse failure is an ordinary state inside the flow, not an exception.

The system prompt spells out the workflow and the anti-loop rules too, and writing them twice is deliberate. The prompt is the soft constraint: it shows the model where to go. The guard is the hard constraint: it hauls the model back when it drifts. One layer is read by the model, the other is executed by the runtime.

## What does the path guard actually keep inside the sandbox?

Tools are the only place side effects happen, so all four of them, `read_file`, `write_file`, `list_dir` and `run_python`, go through one entry point:

```python
def safe_path(rel: str) -> Path:
    abs_path = ... .resolve()          # expand ../ and symlinks
    try:
        abs_path.relative_to(SANDBOX_DIR.resolve())
    except ValueError:
        raise ValueError(f"path escapes the sandbox, only files inside are allowed: {rel}")
```

Eighteen lines, no allowlist to extend, no exception branch to negotiate. `resolve()` expands symlinks and `../`, `relative_to` tests containment, and anything outside is refused with `path escapes the sandbox, only files inside are allowed`. `run_python` stacks three more rules on top: only `.py` files run, the working directory is pinned to the sandbox, and the process gets 30 seconds.

The tools also fail softly. Every exception is caught and turned into a string Observation, so a bad path never crashes the loop, and the error message itself becomes feedback for the model.

## How does the policy decide whether the model may act?

The path guard answers where you may touch. The behaviour guard answers what you are allowed to do. Both live in `guards/policy.py`, and the core of it is `evaluate_guards()`, roughly 170 lines:

```text
GuardView  ──>  evaluate_guards()  ──>  GuardOutcome
(input: this step's action + counters)   (output: verdict + counter deltas)
```

It walks a fixed priority list, and each rule maps to one failure mode from the catalogue above:

1. **Write then verify**: after a `write_file`, the next step has to be `run_python`. If the model wants to `read_file` the file back first, it gets a reminder; if it sidesteps twice, the harness runs the verification on its behalf and feeds back the real exit code and output. This is not a retry. It is running the command for the model, because the model is not going to.
2. **Stop after verifying**: after a `run_python` returns exit code 0, further tool calls are intercepted with "verification passed, please give the Final Answer". The classic small-model disease: it fixed the thing without knowing that it had fixed it.
3. **Loop breaker**: consecutive identical (Action, Input) pairs start counting. First time, a vague warning, "please move on to the next step". Second time, a three-line template it can copy verbatim. Fourth time, a hard stop that ends the turn.
4. **Empty-output fallback**: an empty string does not get to be a Final Answer. One empty reply would otherwise end the whole task silently, so it gets "the output is empty, please wrap up" and one more turn.
5. **Parse-failure retry**: one chance to rewrite the format, three misses and the turn stops.
6. None of the above: run the tool.

### The ladder of intervention

Read the six rules as a sequence and one shape shows up: **remind, give a template, run it for them, hard stop.** It is the way you onboard a new hire. First a reminder; if that does not land, hand over something to copy; if that still fails, do it yourself; if the person cannot do it at all, call it and wrap up. Every rung has a counter behind it, so no rung can loop forever.

Hallucinated Observations have two gates of their own: `Observation:` is a stop sequence at generation time, and the parse side truncates the output at the first `Observation:` it finds. An Observation can only come from a real execution.

### Why the guards are pure functions

`GuardView` and `GuardOutcome` are frozen dataclasses, and `evaluate_guards` makes no model calls, does no IO and touches no global state. You feed it a view, it hands back a verdict, and the counters come back as deltas that the graph node accumulates. It does not even own the wording of the nudges; those are injected from the `nudges` module.

That buys me something concrete in `tests/test_guards.py`: a FakeLLM replays scripted outputs, and six cases cover every failure mode: verify-first fallback, finalize-after-verify fallback, forced verification fallback, loop-break escalation, empty-output fallback and the loop-break hard stop. No model download, no GPU, under a second to run. The test names are the design intent.

Pure functions also take the fear out of touching this code. The last thing I wanted was a guard layer where changing one threshold broke something three rules away. The scripted tests are what make me willing to tune the numbers at all.

## What did the guards cost, and what do they not solve?

The bill is about 170 lines of arbitration, a parser with three fallbacks, and a system prompt that states the rules twice, inside a project of roughly 1200 lines. That is a lot of harness for a 3B model, and I chose it anyway: an agent that reports success without running anything is worse than no agent, because you believe it.

What the guards do not solve deserves bluntness. `run_python` executes inside the sandbox directory, but it can import any installed library and it can reach the network, and the guards do not care. The threat model here is the foreseeable mistakes of a 3B model, not an adversarial attacker. Defending against a genuinely untrusted model is a different craft; my other project, Lockdown, is the one that tries it.

The guards do not raise the ceiling either. They seal the floor: no more infinite loops, no more false reports of completion. A bug a 3B model cannot solve does not become solvable because I added guards.

## What I would change next

Two things. First, the four tools are hardcoded into the harness, and I would expose them over MCP so another client, or another model, could use the same sandboxed tool surface instead of my REPL. Second, `evaluate_guards` is one long function with a priority list, and the right shape is probably a set of small rule objects that each own their counter. I left it as a long function because the priority order is the design, and when the order is the point, a long function reads better than a clever dispatcher.

The repository is [LinuxLinking/local_ollama_harness](https://github.com/LinuxLinking/local_ollama_harness), MIT licensed: four tools, one guard, one scripted test suite, `uv run main.py` to run it. The next change is the MCP rewrite, and when I do it the guard rules stay exactly where they are. Those 170 lines were never part of the prompt.
