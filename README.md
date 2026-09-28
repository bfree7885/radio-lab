# Waypoint Radio Lab

Hands-on amateur radio training for someone who may know nothing about radio.

A learner can begin at Lab 01 with no amateur-radio background, no electronics background, and no radio or SDR of their own. That includes someone who wants to try Summits on the Air later and is starting from zero.

This repository is the application foundation. Lab 01 is a workspace shell. Lesson text and simulations are not written yet.

## Beginner-first

Radio Lab is for people who may know nothing about radio.

Do not assume a term has already been learned. New ideas follow this path:

LEARN → SEE IT → DO IT → EXPLAIN IT → EXAM CONNECTION → FIELD TASK

Prefer letting the learner watch and try something before asking them to memorize a name or a formula. Exam preparation should reinforce that understanding. It should not replace it.

A radio is optional. Real hardware can deepen a lesson later. It is not required to understand or finish the core curriculum.

## Two delivery modes, one curriculum

The same lessons and simulations serve both modes. There is not a public copy of a lesson and a local copy of that lesson.

```
RADIO LAB CORE
    |
    +-- curriculum          content/curriculum.json
    +-- lessons             content/labs/<id>/lesson.json
    +-- simulations         described in lesson blocks; built later
    +-- exam connections    lesson blocks
    +-- field tasks         lesson blocks
    |
    +-- HOSTED ADAPTER
    |      browser
    |      browser progress (localStorage)
    |      simulation only
    |
    +-- LOCAL ADAPTER
           Flask
           SQLite
           optional hardware
           LIVE LAB when hardware is actually available
```

**Hosted mode** is for anyone in a normal browser, including people who are not the owner. It will be published through Waypoint Studio. The visitor does not install Python or Flask. No radio hardware is required. Progress stays in that browser. This mode is not published yet, and Waypoint Studio is not wired up yet.

**Local mode** is this Flask application. It runs on the owner's Linux computers: a Linux Mint laptop, the Meerkat running Pop!_OS, and eventually Waypoint Deck. It teaches the same lessons. It may later add a live lab when compatible hardware is attached. Hardware is never required for the core curriculum.

## Layout

```
content/curriculum.json     Technician Foundations labs and the six stages
content/roadmap.json        Technician, General, Field Radio, and SOTA status
content/exam/model.json     versioned question-pool shape; no questions yet
content/capabilities.json   shared capability ids
content/labs/01/lesson.json lesson shell for Lab 01
web/radiollab.js            browser core (curriculum, lesson, adapters)
web/progress-browser.js     hosted progress adapter
web/capabilities-public.js  hosted capabilities: simulation on, hardware off
web/capabilities-local.js   reads the local capability snapshot
web/boot-hosted.js          future hosted page boot; ignored unless data-delivery="hosted"
labs/catalog.py             Python reader for the same JSON
progress/store.py           local SQLite progress adapter
hardware/capabilities.py    local capability adapter; no device detection yet
app.py                      local server
templates, static/          local pages and field-instrument styling
```

Python does not keep its own lab list. JavaScript does not keep its own lab list. Both read `content/curriculum.json`.

## Lesson files

A future lesson is one JSON file. Lab 01 establishes the shape and is otherwise empty. Each stage holds blocks:

| Stage | Block type | What it will hold |
| --- | --- | --- |
| LEARN | `text` | Explanatory text in `body` |
| SEE IT | `simulation` | `component` name and `config` |
| DO IT | `interaction` | `component` name and `config` |
| EXPLAIN IT | `explain` | The learner's prompt in `prompt` |
| EXAM CONNECTION | `exam` | `questionIds` and `topics` |
| FIELD TASK | `fieldTask` | `taskId` and `prompt` |

Topic tags for the lab live on the lab entry in `content/curriculum.json`. Exam blocks can name topics when questions exist.

The local lab page shows a short reserved line while those fields are empty. When a `body` or `prompt` is filled in, the local page shows that text from the lesson file. A hosted page should read the same blocks through `RadioLab.lesson`. Write the lesson once.

## Browser core

`web/radiollab.js` exposes:

- `RadioLab.curriculum` — load and look up labs and stages by id
- `RadioLab.lesson` — load a lab's lesson file and a stage inside it
- `RadioLab.progress` — set by the progress adapter
- `RadioLab.capabilities` — set by the capability adapter

The core does not import Flask or talk to SQLite. The page that hosts it chooses the adapters.

Local pages set `data-delivery="local"` and install the capability snapshot embedded by Flask. They do not install the browser progress adapter.

A future Studio page sets `data-delivery="hosted"` and loads `web/boot-hosted.js`. That boot installs browser progress and the public capability adapter, then loads the curriculum. It does nothing if the page is local.

## Progress

Hosted progress lives in the browser under the localStorage key `waypoint-radio-lab.progress.v1`.

Local progress lives in SQLite at `data/progress.sqlite`, created on startup. The path stays inside the project. Tests can point at another file with `RADIO_LAB_DB`.

Both adapters can record:

- lab status (`not_started`, `in_progress`, `complete`)
- stage completion
- exam-question results
- field-task completion

Weak topics are derived from exam misses in both adapters. They are not a second list that can drift, and they are not invented when no exams have been recorded.

There is no account, no cloud service, and no sync between hosted and local progress. That stays out of scope.

The local pages still render progress from SQLite. They do not write localStorage. When a later lesson records progress from the browser inside local mode, add a local progress adapter that calls the server. Do not point that lesson at the hosted store.

## Capabilities

Capability ids are listed once in `content/capabilities.json`.

The educational UI asks `RadioLab.capabilities.available(name)` and does not care which adapter answered.

| Adapter | Simulation ids | Hardware ids |
| --- | --- | --- |
| Public (`web/capabilities-public.js`) | available | unavailable |
| Local (`hardware/capabilities.py`) | available | unavailable until a detector is added |

Examples: `simulation.frequency` and `simulation.swr` are available. `hardware.rtl_sdr` and `hardware.gnss` are not. A true simulation flag means a lesson is allowed to use a simulation. It does not mean that simulation has been built.

No adapter detects devices. Missing hardware is the normal case. Local mode may later offer a live lab only when a hardware capability becomes available. Otherwise the lesson continues in simulation.

Short names such as `rtl_sdr` still resolve to `hardware.rtl_sdr` in the local adapter.

## Future hosted mount

Do not publish this yet. Do not point Waypoint Studio at it yet.

When Studio hosts Radio Lab, it should serve these paths itself. The public site does not call the owner's Flask process.

Include:

- `content/` — curriculum, lesson JSON, capability ids
- `web/radiollab.js`
- `web/progress-browser.js`
- `web/capabilities-public.js`
- `web/boot-hosted.js`
- `static/css/lab.css` and `static/favicon.svg`

Leave on the local machine:

- `app.py`, `templates/`, and `static/js/lab.js` (the local page shell)
- `progress/store.py` and `data/`
- `hardware/capabilities.py` and `web/capabilities-local.js`
- `.venv`

Set `data-delivery="hosted"` and `data-content-base` to the URL where Studio serves `content/`. Simulations, when they exist, should be scripts or components named by lesson blocks, shared by both modes, not copied into a second lesson tree.

## Technician and General

Radio Lab teaches both FCC Amateur Radio licenses: Technician and General. Technician Foundations is the beginning of the Technician journey, not the whole license. The same six-stage path is used for both licenses. General is not a question bank or a reading appendix.

The learner may start with no radio background. General may build on the Radio Lab Technician curriculum. It does not assume ideas Radio Lab has never taught.

License learning and field application are different. Technician and General teach the ideas and operating skills. Field Radio and SOTA apply them. The full progression is in `docs/CURRICULUM_ROADMAP.md`. Machine-readable status is `content/roadmap.json`.

Question pools are not stored in this repository yet. `content/exam/model.json` is the shape for a versioned pool and for a question reference. Concept mastery and question-pool performance are stored separately. A passing practice set does not mark a concept mastered.

Progress records include a curriculum id, so Technician and General do not share one lab list. Hosted storage still uses `waypoint-radio-lab.progress.v1`. An older flat browser store is read as Technician Foundations.

## Setup

Python 3.9 or newer. Node is used only to run the browser-core tests. Setup does not use sudo.

```bash
./setup.sh
```

The script is safe to run again. It creates `.venv` when missing, installs `requirements.txt`, and makes the `data/` and `logs/` directories.

## Running local mode

```bash
./run.sh
```

The launcher activates `.venv` and starts the app at [http://127.0.0.1:5070/](http://127.0.0.1:5070/). It binds only to `127.0.0.1` on port `5070`.

| Path | Page |
| --- | --- |
| `/` | Dashboard |
| `/labs` | Lab index |
| `/labs/01` | Lab 01 placeholder workspace |
| `/labs/02` … `/labs/08` | Closed labs |
| `/progress` | Foundations progress from SQLite |
| `/about` | What Radio Lab is |
| `/content/...` | Shared JSON |
| `/web/...` | Browser core and adapters |

## Portability

Clone this repository onto any of the learning machines and run `./setup.sh` there. Do not hard-code usernames, home directories, hostnames, serial devices, or machine-specific configuration.

The working copy on the current machine is `~/projects/radio-lab`. That location is a checkout path, not something the application reads.

## Hardware

Optional later detectors may answer for:

- `hardware.rtl_sdr`
- `hardware.scanner`
- `hardware.amateur_radio`
- `hardware.digirig`
- `hardware.audio_interface`
- `hardware.gnss`
- `hardware.waypoint_deck`

Waypoint Deck integration is planned and separate. Deck is not embedded here, and Radio Lab does not require it.
