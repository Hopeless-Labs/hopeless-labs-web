---
title: "Why we wrote a language instead of another plugin API"
summary: "Every scanner grows a plugin system, and every plugin system grows a config file nobody reads. Ruso takes the other road: a check is plain text."
date: 2026-10-27
author: jeagercoder
tags: [design, rsl]
---

Most scanners start the same way. A small engine, a handful of built-in
checks, and then a request: "can I add my own?" So the project grows a plugin
API. Then the plugin API grows a loader, a version negotiation layer, and a
config file that describes which plugins run in which order.

Two years later nobody can answer a simple question — *what does this scanner
actually send to my target?* — without reading three files and one README.

## A check should be readable on its own

Ruso's answer is a small script format, RSL. A check describes probes, the
traffic it sends, and the condition that turns a response into a finding:

```text
name "Exposed Redis"
severity high

tcp redis { host "{{scan_host}}" port 6379 }

send redis
redis.write "PING\r\n"
match redis.response contains "+PONG"   # no auth required
```

There is no registration step, no lifecycle callbacks, no hidden state. What
you read is what runs.

## Boring on purpose

The DSL is deliberately small. If a check needs something the language cannot
express, that is a conversation about the language — not a reason to bolt on an
escape hatch that only two people understand. Small languages stay reviewable,
and reviewable tooling is the whole point of a security scanner.

## What this buys you

- **Diffable checks.** A new detection is a small text diff in a pull request.
- **Portable artifacts.** The same script runs locally, in CI, and from the
  registry — the compiler emits bytecode, the runtime executes it.
- **Honest reviews.** A reviewer can see every byte a check sends.

The trade-off is real: a DSL cannot do everything a general-purpose language
can. We think that constraint is a feature. If you want to argue about it, the
[issue tracker](https://github.com/Hopeless-Labs) is open.
