---
title: "705 patients in five clinic days"
description: "In June 2026 a mobile clinic in Santander, Colombia charted 705 patients on LibreChart. For most of that week there was no internet, and it did not matter."
pubDate: 2026-06-30
author: "Aaron Ellison"
tags: ["field report", "colombia"]
draft: true
---

In June 2026, a medical mission run by The LAUGHH Foundation set up in García
Rovira, Santander, Colombia. Over five clinic days the team saw **705 patients**
and placed **383 lab orders**. Every one of those records was charted in
LibreChart, and for most of that week there was no usable internet connection at
the site.

That last part is the whole point.

## The problem with cloud EMRs in the field

Mission clinics get set up wherever people can reach them — a borrowed school
room, a church hall, a tent. The one thing you cannot assume is a reliable
connection. A cloud EMR in that setting has a single point of failure that is
entirely outside your control, and when it fails it fails during the busiest
hour of the busiest day.

The usual fallback is paper, then someone spends the evening transcribing. That
costs clinical time nobody has, and the transcription is where errors get in.

## What we ran instead

LibreChart runs on a local network. One machine on site holds the database and
serves the application; everyone else connects over the clinic's own Wi-Fi from
whatever laptop or tablet they brought. No external service is in the request
path — not for the application, not for fonts, not for icons. If the internet
drops, nothing changes, because nothing was depending on it.

The clinic ran seven services that week: primary care, pediatrics, gynaecology,
physical therapy, wound and ostomy care, laboratory, and pharmacy. Around twenty
medical professionals and more than fifty Colombian medical students worked
across them.

## Stations, not screens

The thing that made it usable under pressure was organising the record around
where the patient physically is, rather than around database tables. A visit
moves through stations — registration, consult, pharmacy, lab — and each station
shows the person working it what they need and little else.

That sounds obvious. It is not how most EMRs behave, and the difference shows up
in a triage line when someone has thirty seconds and one hand free.

## What we would tell another mission

Three things held up:

- **Fast patient lookup matters more than anything else.** Most interactions
  start with finding the right person, often from a partial name.
- **Alerts have to be visible without being loud.** A critical allergy needs to
  be impossible to miss; everything else needs to stay quiet, or people stop
  reading any of it.
- **Design for the machine failing, not just the network.** Backups were taken
  every day, on site, to physical media.

LibreChart is free software under GPL-2.0-or-later. If you run a mission clinic
and want to try it, [the source is on
GitHub](https://github.com/LibreChart/LibreChart) — and we would genuinely like
to hear how it goes.
