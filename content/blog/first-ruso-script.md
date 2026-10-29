---
title: "Your first Ruso script, from install to finding"
summary: "A walk through the CLI: write a check, compile it, run it against a lab host, and read the report."
date: 2026-10-21
author: Choirul Huda
tags: [tutorial, cli]
---

This is the shortest path from a clean machine to your first structured
finding. You need a terminal and a host you are allowed to scan. Everything
below was run against a local lab container.

## 1. Install the CLI

```bash
curl -fsSL https://docs.ruso.hopeless-labs.com/install.sh | sh
ruso --version
```

## 2. Write the check

Create `headers.rsl` — a check for a missing security header:

```text
name "Missing X-Frame-Options"
severity low

http page { url "https://{{scan_host}}/" }

send page
match page.response.headers not_contains "x-frame-options"
```

Three ideas, three lines: a probe (`http`), an action (`send`), and a condition
(`match`). The `{{scan_host}}` placeholder is filled at run time, so the same
script works against any host.

## 3. Compile it

```bash
ruso compile headers.rsl -o headers.rbc
```

Compilation validates the script — unknown verbs, bad placeholders, and
malformed matches are rejected before anything touches the network. That is the
artifact the registry ships and the CLI runs.

## 4. Run it

```bash
ruso scan --target lab.internal --script headers.rbc
```

Output is grouped by target and prints one line per finding:

```text
lab.internal  low  Missing X-Frame-Options  /  (headers.rsl)
```

## 5. Take it to CI

The same command returns a non-zero exit code when findings meet your severity
threshold, which is all a pipeline needs:

```bash
ruso scan --target "$TARGET" --script headers.rbc --fail-on high
```

Next stop: publish the script to the registry so the rest of us can install it
with one command. The [quick start](https://docs.ruso.hopeless-labs.com/guide/quick-start.html)
covers that path.
