---
title: "What \"runs without internet\" actually requires"
description: "Offline-first is easy to claim and easy to get wrong. A single font stylesheet or icon CDN turns a working clinic into a broken one. Here is what LibreChart does about it."
pubDate: 2026-07-14
author: "Aaron Ellison"
tags: ["architecture", "offline-first"]
draft: true
---

Plenty of software claims to work offline. Most of it means "it degrades
gracefully once it has loaded" — which is a different promise, and not the one a
clinic needs.

LibreChart's rule is stricter: **no request in the application's critical path
may leave the local network.** Not on first load, not on any load.

## The failure nobody plans for

The usual way this breaks is not the application. It is an asset.

A single `<link>` to a font CDN, an icon set pulled from a public URL, an
analytics snippet — each of these is a request that will hang when there is no
route to the internet. Browsers do not fail those instantly. They wait. Your
"offline-capable" application spends thirty seconds rendering invisible text
before it gives up, and it does this on every machine, every morning.

So the constraint is not really about architecture. It is about discipline over
every asset that ships.

## What that means in practice

- **Fonts are self-hosted.** LibreChart uses Public Sans, an open typeface from
  the US Web Design System. The `.woff2` files are served from the same machine
  as the application. This site does the same thing, for the same reason.
- **No CDNs, anywhere.** Icons are inline SVG. There is no external stylesheet
  and no external script.
- **The database is local.** It runs on the same machine, on the clinic's own
  hardware.
- **No telemetry.** Nothing phones home, because there is nowhere to phone.

## The cost

Being honest about the trade: you give up the things a cloud service does for
you. There is no automatic offsite backup, no vendor watching for a failing
disk, no someone-else's-problem when the hardware dies at 6am. Somebody on the
team owns the machine, and that has to be a named person before the trip
starts, not a role you discover you needed.

In exchange, the clinic's ability to see patients does not depend on anything
outside the room.

## Built on boring technology

LibreChart is a Drupal 11 application — roughly eight custom modules over a
stack that is well understood, widely documented, and unlikely to be abandoned.
That was deliberate. Software that a volunteer has to maintain in three years,
possibly not the person who wrote it, should be built from parts other people
already know.

The source is on [GitHub](https://github.com/LibreChart/LibreChart) under
GPL-2.0-or-later.
