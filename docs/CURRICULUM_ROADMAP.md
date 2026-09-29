# Radio Lab curriculum roadmap

Radio Lab is a hands-on path from no radio experience through both FCC amateur licenses, and then into operating in the field. It is the learner's primary environment for Technician and for General. Outside question pools and references can supplement it. They do not replace the teaching.

This document describes the progression. It is not a lesson inventory. Only Technician Foundations has lab entries today, and those eight labs are shells.

Machine-readable status lives in `content/roadmap.json`. Both the local app and a future hosted page read that file. There is one roadmap, not a hosted copy and a local copy.

## Who this is for

The learner may know nothing about amateur radio, electronics, antennas, propagation, repeaters, RF, modulation, formulas, operating procedure, or how the FCC amateur service is organized.

Words and tools show up inside the work, after the learner has seen the thing they name. General may assume the learner finished the Radio Lab Technician curriculum. It may not assume understanding that Radio Lab never taught.

## How every phase teaches

Technician and General use the same path:

LEARN → SEE IT → DO IT → EXPLAIN IT → EXAM CONNECTION → FIELD TASK

General is not a textbook, a stack of flashcards, a question bank, or extra reading. Later General labs should keep using simulations, virtual instruments, diagrams, signal and antenna experiments, propagation views, electrical experiments, operating scenarios, troubleshooting, band choices, and field planning.

A radio can deepen a lesson in local mode. It is never required to understand or finish the core curriculum. The same lesson file is used in the browser and on the local Flask app.

## License learning and field application

Technician and General teach the knowledge and the operating skills for the license and for competent amateur operation.

Field Radio and SOTA apply that knowledge. They are not extra license courses. SOTA-oriented material, when it exists, can cover portable radios and antennas, deployment, power planning, terrain, propagation, operating location, logging, calling procedures, spotting, weather, field safety, troubleshooting, and setting up and taking down a summit station. None of that is built yet.

## Phases

| Phase | What it is | Status |
| --- | --- | --- |
| 1. Technician Foundations | The current eight labs. First ideas: what a radio is, controls, repeaters, bands, electricity, antennas, propagation, and a first field scenario. | Labs 01–08 can be opened. Finishing them is not Technician exam readiness. |
| 2. Technician Core | The rest of Technician-level understanding and operating skill, taught the same way. | Planned. No labs yet. |
| 3. Technician Exam Readiness | Review, weak-area practice, and the current official Technician question pool. | Planned. No pool loaded. |
| 4. General Bridge | The step from Technician-level work into the deeper ideas General requires. | Planned. No labs yet. |
| 5. General Core | General-level understanding and operating skill, still hands-on. | Planned. No labs yet. |
| 6. General Exam Readiness | Review, weak-area practice, and the current official General question pool. | Planned. No pool loaded. |
| 7. Field Radio | Practical portable operating. | Planned. |
| 8. SOTA | Summits on the Air as a field application. | Planned. |

Foundations is the start of Technician preparation. Finishing those eight labs is not the same as being ready for the Technician exam.

## Exam alignment

Official question pools change. Radio Lab will attach practice to a named pool with a license level (`technician` or `general`), a version label, and the dates that pool was in effect. A question reference can also carry a subelement id and a topic tag. The empty shape is `content/exam/model.json`. No official questions are stored yet.

Two records stay separate:

- **Concept mastery** — can the learner use the idea?
- **Question-pool performance** — how did they do on a versioned pool?

A run of correct practice questions does not automatically mean the concept is mastered. Readiness screens must be able to show those as different facts. No scoring formula is defined yet.

## Progress

Technician and General progress are stored apart, keyed by curriculum id. That includes curriculum completion, concept status, weak topics derived from pool misses, exam readiness, and pool performance. The local database migrates older rows in place and labels them Technician Foundations. It does not wipe them. Hosted progress stays in the browser and is not synced with the local database.
