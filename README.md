# Waypoint Radio Lab

Local-first amateur radio training. The learner works with frequencies, controls, diagrams, and scenarios on this computer. Technician is the first curriculum target. General comes later.

This repository is the V0.1 application foundation. Lab workspaces are placeholders. Lesson content and simulations are not in this version.

Radio Lab runs without radio hardware. Hardware support, when it exists, stays optional.

## Architecture

A small Flask application serves HTML, CSS, and vanilla JavaScript. There is no front-end build step.

```
app.py                 routes and loopback server
labs/catalog.py        Technician Foundations lab list and shared stages
progress/store.py      SQLite progress database
hardware/capabilities.py   future live-lab gate (always simulation in V0.1)
templates/             pages
static/css, static/js  field-instrument interface
data/                  runtime database (not committed)
```

Learning code must not assume a radio is attached. The intended check is:

```
hardware capability available?
    yes → offer a live lab
    no  → continue in simulation
```

`hardware.capabilities.live_lab_available()` is that check. V0.1 does not detect devices. It always returns false, and the interface stays in simulation. Future detectors for RTL-SDR, scanners, amateur radios, DigiRig, audio interfaces, GPS/GNSS, and Waypoint Deck belong behind that module. They must not be required to start or use the core application.

Waypoint Deck integration is planned and separate. Deck is not embedded here.

The shared lab model, once a lab is open, is:

LEARN → SEE IT → DO IT → EXPLAIN IT → EXAM CONNECTION → FIELD TASK

## Progress storage

Progress is a SQLite file at `data/progress.sqlite`, created on startup. The path is relative to the project, not a home directory or machine name.

Tables:

| Table | Role now | Later |
| --- | --- | --- |
| `lab_progress` | Lab status: not started, in progress, complete | Same |
| `stage_progress` | Empty | Stage completion inside a lab |
| `exam_results` | Empty | Exam-question performance; weak topics are derived from misses |
| `field_tasks` | Empty | Field-task completion |

Labs that are not open still count as not started. The progress page does not invent weak topics or an exam-readiness score.

Tests can point at another file with the `RADIO_LAB_DB` environment variable.

## Setup

Python 3.9 or newer is required. Setup does not use sudo.

```bash
./setup.sh
```

The script is safe to run again. It creates `.venv` when missing, installs `requirements.txt`, and makes the `data/` and `logs/` directories.

## Running

```bash
./run.sh
```

The launcher activates `.venv` and starts the app at [http://127.0.0.1:5070/](http://127.0.0.1:5070/). It binds only to `127.0.0.1` on port `5070`.

Routes:

| Path | Page |
| --- | --- |
| `/` | Dashboard |
| `/labs` | Lab index |
| `/labs/01` | Lab 01 placeholder workspace |
| `/labs/02` … `/labs/08` | Closed labs (coming soon) |
| `/progress` | Foundations progress |
| `/about` | What Radio Lab is |

## Portability

Clone this repository onto any of the learning machines and run `./setup.sh` there. Do not hard-code usernames, home directories, hostnames, serial devices, or machine-specific configuration.

Intended computers:

- A Linux Mint laptop for learning and development
- The Meerkat running Pop!_OS for learning and, later, optional radio or SDR hardware

The working copy on the current machine is `~/projects/radio-lab`. That location is a checkout path, not something the application reads.

## Future hardware

Optional modules may later answer `capability_available(...)` for:

- `rtl_sdr`
- `scanner`
- `amateur_radio`
- `digirig`
- `audio_interface`
- `gnss`
- `waypoint_deck`

Until a module is installed and a device is actually present, labs stay in simulation. Missing hardware is the normal case, not an error.
