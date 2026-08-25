---
layout: ../../layouts/DocsLayout.astro
title: Getting started
heading: Getting started
description: How to try LibreChart on a laptop, deploy it on a clinic server, and run it during a mission. Requirements, install steps, and an honest note on what it is not.
lede: Try it on a laptop in about fifteen minutes, or deploy it on a clinic server. Here is what it needs and what running it actually involves.
---

## Is LibreChart right for your clinic?

Worth being honest before you spend an afternoon on it.

**It fits well if** you run a mission or pop-up clinic where the internet is
unreliable or absent, you see patients across several stations in one visit,
you have at least one technically confident person on the team, and you want
your records to stay on hardware you control.

**It fits badly if** you need insurance billing or claims, HL7 or FHIR
interchange with a hospital system, e-prescribing to external pharmacies, or a
formal certification such as ONC. LibreChart does none of those, and there is
no plan for it to. It also assumes somebody owns the server — see
[running it during a mission](#running-it-during-a-mission) below.

If you are evaluating rather than deploying, start with the laptop install.
Nothing below touches a clinic machine.

## Try it on a laptop

The quickest path uses [DDEV](https://ddev.com), which runs the whole stack in
containers so you do not have to install PHP or MariaDB yourself. Budget about
fifteen minutes, most of it waiting for downloads.

```
git clone https://github.com/LibreChart/LibreChart.git librechart
cd librechart
ddev start
ddev composer install
ddev drush site:install --existing-config -y
ddev launch
```

That last command opens the site in your browser. `site:install --existing-config`
builds the database from the YAML in `config/sync/`, so you get the real content
types, roles, and station permissions rather than a blank Drupal.

The installer prints an admin password on the last line. If it scrolls past,
`ddev drush user:login` gives you a one-time login link.

### Useful commands while you are poking around

| Task | Command |
|---|---|
| Clear the cache | `ddev drush cache:rebuild` |
| See recent errors | `ddev drush watchdog:show --count=20` |
| Re-import config | `ddev drush config:import -y` |
| Export config changes | `ddev drush config:export -y` |
| One-time login link | `ddev drush user:login` |

All site configuration lives as YAML in `config/sync/` and is checked into git.
If you change something in the admin UI and want to keep it, export it — a
plain `git diff` then shows exactly what changed.

## What the clinic workflow looks like

A visit moves through stations, and each station shows the person working it
what they need and little else. Not every station applies to every patient.

1. **Registration and check-in** — look up an existing patient by ID or name
   and date of birth, or create a new record. Opens a visit.
2. **Triage** — chief complaint, allergies, medications, past medical history,
   then vitals with BMI calculated. Adult patients get pregnancy history; it is
   hidden for paediatric patients rather than left blank.
3. **Lab orders and results** — the technician sees what was ordered and enters
   results against each test.
4. **Clinical evaluation** — the clinician reviews triage and labs, records
   notes (dictation supported), assesses body systems, assigns diagnoses, and
   writes orders and referrals.
5. **Physical therapy** — appears only when the clinician ordered a PT referral.
6. **Teaching and referrals** — teaching topics covered with the patient, plus
   any external referral.
7. **Pharmacy** — the pharmacist reviews the prescription, dispenses per drug,
   and inventory decrements automatically. Dispensing more than the recorded
   stock requires a written override reason before it will save.

The visit is then marked complete. Revision history is retained throughout, so
you can see who changed what.

## Deploy on a clinic server

### What the machine needs

- Ubuntu 22.04 LTS or Debian 12
- 2 GB RAM minimum, 4 GB recommended
- 20 GB disk
- PHP 8.3 with the `fpm`, `mysql`, `gd`, `xml`, `mbstring`, `curl`, `zip`,
  `intl`, and `opcache` extensions
- MariaDB 10.11 or MySQL 8.0
- Apache 2.4 or Nginx 1.24+

A mini-PC or a spare laptop is genuinely enough. The constraint is reliable
power far more than CPU.

### Install

```
cd /var/www
git clone https://github.com/LibreChart/LibreChart.git librechart
cd librechart
composer install --no-dev --optimize-autoloader

cp web/sites/default/default.settings.php web/sites/default/settings.php
# Edit settings.php: database credentials and $settings['config_sync_directory']

vendor/bin/drush site:install --existing-config -y
vendor/bin/drush cache:rebuild
```

Point your web server's document root at `/var/www/librechart/web` — the
`web/` subdirectory, not the repository root. Serving the repository root
would expose `vendor/` and your `settings.php`.

Then fix permissions:

```
sudo chown -R www-data:www-data /var/www/librechart/web/sites/default/files
sudo chmod -R 755 /var/www/librechart/web/sites/default/files
sudo chmod 444 /var/www/librechart/web/sites/default/settings.php
```

And add cron, which Drupal needs for routine maintenance:

```
*/15 * * * * www-data /var/www/librechart/vendor/bin/drush --root=/var/www/librechart/web cron
```

### Updating an existing install

```
cd /var/www/librechart
git pull
composer install --no-dev --optimize-autoloader
vendor/bin/drush updatedb -y
vendor/bin/drush config:import -y
vendor/bin/drush cache:rebuild
```

Do this before a mission, not during one.

## Running it during a mission

The part that matters more than the install.

**Name the person who owns the server.** Not a role — a person, decided before
the trip. Self-hosting means there is no vendor watching for a failing disk at
six in the morning. This is the real cost of no cloud lock-in, and it is worth
paying deliberately rather than discovering it.

**Back up daily, to physical media, on site.** A database dump onto a USB drive
someone carries separately is worth more than any amount of clever replication
you cannot reach without internet.

```
vendor/bin/drush sql:dump --gzip --result-file=/path/to/usb/librechart-$(date +%F).sql.gz
```

**Think about power before bandwidth.** Unstable mains is a more common cause
of trouble than anything on the network. A cheap AVR or UPS is a better
investment than a faster switch.

**Test the whole thing on the clinic's actual network before day one.** Every
device that will be used, on the Wi-Fi that will be used. Problems found the
evening before are inconvenient; the same problems found with forty people
waiting are not.

## Getting help

LibreChart is free software under GPL-2.0-or-later, so you can read, run,
modify, and redistribute it.

- [Source code and issue tracker](https://github.com/LibreChart/LibreChart)
- [Contributor guide](https://github.com/LibreChart/LibreChart/blob/main/CONTRIBUTING.md)
- [Get in touch](/contact) if you are considering it for a clinic and want to
  talk it through first

If you deploy it somewhere, we would genuinely like to hear how it went —
including the parts that did not work.
