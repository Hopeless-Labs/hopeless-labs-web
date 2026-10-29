---
title: "What the runtime actually executes"
summary: "A short tour of the bytecode a Ruso script compiles to: why it exists, what a validator checks, and where the fast path is."
date: 2026-10-14
author: Kenji Subagja
tags: [internals, bytecode]
---

A Ruso script is source you can read. A `.rbc` file is the same check in a form
the runtime can execute without re-parsing text on every run. This post explains
the gap between the two.

## Why compile at all

Re-parsing a script on every scan is fine for one host and wasteful for a
thousand. Compiling once gives three things:

1. **Validation up front.** Unknown verbs and bad placeholders fail at compile
   time, not in the middle of a run.
2. **A stable artifact.** Scripts are content-addressed, so the registry can
   ship exactly the bytes you reviewed.
3. **A simpler runtime.** The VM executes instructions; it does not interpret
   syntax.

## Shape of a program

A compiled check is a flat instruction list plus a constant pool — hosts, ports,
header names, byte strings:

```text
CONST     0        ; "host"
CONST     1        ; 6379
PROBE_TCP 0, 1     ; declare a tcp probe
SEND      0        ; open the connection
WRITE     2        ; write the PING bytes
READ      -> r0    ; read the response
CONTAINS  r0, 3    ; match against "+PONG"
FINDING   HIGH     ; emit a finding
```

The exact mnemonics live in the
[bytecode reference](https://docs.ruso.hopeless-labs.com/internals/bytecode.html).
The shape is what matters here: no jumps unless a script asks for them, no
closures, no dynamic dispatch.

## The validator

Before a program is accepted, the validator walks it once and rejects:

- reads of registers that were never written,
- probes referenced but never declared,
- placeholders with no binding at run time,
- findings without a severity.

That pass is why a malformed script cannot reach production: the failure
happens at `ruso compile`, on a laptop, in CI — not against a customer.

## Where the time goes

Scan time is dominated by network I/O, not by interpretation. Keeping the
instruction set small keeps the VM cache-friendly, and that is usually enough:
one runtime, running many scripts concurrently, with the slow part being the
target's latency rather than ours.
