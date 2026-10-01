# Technician coverage final audit

Third and final instructional coverage audit of the Radio Lab Technician curriculum against the NCVEC 2026–2030 Technician pool. This file does not replace the earlier audits. `docs/TECHNICIAN_COVERAGE_AUDIT.md` remains the pre-remediation record. `docs/TECHNICIAN_COVERAGE_REAUDIT.md` remains the post-remediation record.

## Authoritative source

NCVEC Question Pool Committee, 2026–2030 Technician Class, FCC Element 2, February 19, 2026 release. Effective 2026-07-01 through 2030-06-30.

- Syllabus: `content/exam/technician-2026-2030.json`
- Question stems: `content/exam/technician-2026-2030-questions.json` (409 stems, no answer choices)
- PDF: `content/exam/sources/technician-2026-2030/2026-2030-technician-ncvec-feb-19-2026.pdf`
- Provenance notes: `docs/EXAM_SOURCES.md` and `content/exam/model.json`
- Official figures T-1, T-2, and T-3, used by TR-02

Curriculum commit audited: `a4c3b8bd327602f3a5bb8f8d3f883b721dae0dbe`.

## Curriculum audited

Twenty-five Technician instructional labs:

- Foundations 01 through 08
- Technician Core TC-01 through TC-08
- Technician Remediation TR-01 through TR-09, including each new ONE MORE CHECK stage

Shared simulations, practice items, field tasks, and reference cards were read where they carry the instruction. A reference card by itself does not close a gap. Live syllabus metadata was not used as evidence.

RF-01, RF Interference and Jamming, is supplemental. It is excluded from every classification. Nothing in this file is raised because RF-01 also touches interference.

## Method

Each of the 409 official stems was read again. For each one the question was what the learner sees, what the learner has to do, and what the learner has to demonstrate.

The 23 stems that the second audit did not mark supported were checked against the current close-stage interactions and against the February 19, 2026 pool wording. The other stems were checked against lesson evidence that is still present in the current 25 labs. Foundations, Technician Core, TR-01, and TR-08 were not rewritten after the second audit. The close stages were added to TR-02, TR-03, TR-04, TR-05, TR-06, TR-07, and TR-09. Those additions were inspected as activities, not as test names.

A concept is taught when the learner gets enough instruction or guided discovery to understand it. It is practiced when the learner has to apply it. It is assessed when a required decision or practice item checks it. A glossary line, a title, or a metadata tag does not count as taught.

COMPLETE means the official topic and the conceptual breadth of that group's stems are taught, practiced, and assessed well enough for a beginner. PARTIAL means real instruction exists and at least one substantive concept is still thin. MISSING means the group has no meaningful instruction.

Stem support is a separate pass. SUPPORTED means the underlying knowledge is in the 25 labs. PARTIALLY SUPPORTED means a related idea is taught and the stem's specific point is not. UNSUPPORTED means the knowledge is absent. Official answer letters are not stored.

## Three-generation comparison

| Audit | COMPLETE | PARTIAL | MISSING |
| --- | ---: | ---: | ---: |
| 1 — pre-remediation | 0 | 34 | 1 |
| 2 — post-remediation | 24 | 11 | 0 |
| 3 — final | 35 | 0 | 0 |

Stem support:

| Audit | SUPPORTED | PARTIALLY SUPPORTED | UNSUPPORTED |
| --- | ---: | ---: | ---: |
| 2 — post-remediation | 386 | 14 | 9 |
| 3 — final | 409 | 0 | 0 |

The group that was missing in audit 1 was T5B. Audit 2 closed it. Audit 3 still finds T5B complete.

## 35-group coverage

| Group | Official topic | Status | Evidence | Remaining gap |
| --- | --- | --- | --- | --- |
| T1A | Purpose, license grant, basic rule terms, interference, RACES, phonetics, frequency coordinator, beacon | COMPLETE | TR-03 rule decisions and practice items | — |
| T1B | Allocations, emission modes, spectrum sharing, band edges, ISS contact, power | COMPLETE | TR-03 privilege decisions, plus the close-stage desk that refuses phone on 50.050 MHz and 144.050 MHz and allows CW on both slices | — |
| T1C | License classes, vanity and sequential call signs, term, renewal, grace period, international communications | COMPLETE | TR-03 grant, club, vanity, and inspection decisions | — |
| T1D | Authorized and prohibited transmissions; sale of equipment | COMPLETE | TR-03 permitted and prohibited communication decisions | — |
| T1E | Control operator, control point, automatic and remote control | COMPLETE | 03, TC-02, and TR-03 control decisions | — |
| T1F | Identification, repeaters, third-party traffic, club stations, inspection | COMPLETE | TR-03 identification and repeater decisions | — |
| T2A | Choosing a frequency, calling, test transmissions, band plans, offsets | COMPLETE | 03, TC-02, and TR-04 repeater lab | — |
| T2B | FM repeater and simplex practice, CTCSS, DTMF, DMR, Q signals | COMPLETE | TR-04 interference, net, and courtesy scenarios | — |
| T2C | Emergency and public-service operation, RACES, ARES, nets, traffic | COMPLETE | TR-04 public-service and traffic scenarios, plus the close-stage choice that matches Winlink to email addressed by a call sign | — |
| T3A | How a signal travels, fading, multipath, polarization, absorption, antenna orientation | COMPLETE | TR-05 multipath, absorption, and path labs, plus the polarization lab for elliptical polarization, path-combining fade, and horizontal weak-signal polarization | — |
| T3B | Wavelength, frequency, wave velocity, HF, VHF, and UHF | COMPLETE | TR-05 wave lab | — |
| T3C | Sporadic E, meteor scatter, aurora, ducting, F-region skip, radio horizon | COMPLETE | 07, TC-07, and TR-05 path gallery | — |
| T4A | Station setup, power source, meters, computer and digital connections, RF grounding, mobile installation | COMPLETE | TR-06 mobile-power and hotspot work, plus required supply-current and battery-time calculations and a required station-path placement | — |
| T4B | Operating controls, including the noise blanker, and digital transceiver configuration | COMPLETE | TR-06 front panel and code plug, plus a required off-frequency FM listen and a required noise-blanker case check | — |
| T5A | Current, voltage, conductors, insulators, AC and DC | COMPLETE | 05, TC-05, and TR-01 | — |
| T5B | Unit conversion and decibels | COMPLETE | TR-01 prefix and decibel benches | — |
| T5C | Capacitance, inductance, frequency, impedance, power | COMPLETE | TR-01 Ohm's law, power, series, and parallel benches | — |
| T5D | Ohm's law, series and parallel circuits | COMPLETE | TR-01 impedance bench and TR-02 resonance | — |
| T6A | Resistors, capacitors, inductors, fuses, switches, batteries | COMPLETE | TR-02 parts benches | — |
| T6B | Diodes, transistors, and gain | COMPLETE | TR-02 supply path | — |
| T6C | Schematics and symbols, including official figures T-1, T-2, and T-3 | COMPLETE | TR-02 figure-lab on official figures T-1, T-2, and T-3 | — |
| T6D | Rectifiers, relays, regulators, indicators, integrated circuits, resonance, shielding | COMPLETE | TR-02 figure-lab and terminal benches | — |
| T7A | Receivers, transmitters, amplifiers, mixers, oscillators, PTT, VFO, modulation | COMPLETE | TR-06 block diagram, plus the SSB versus CW-FM amplifier-switch scenario | — |
| T7B | Overload, distortion, and interference to consumer equipment | COMPLETE | TR-06 interference cases, plus a band-reject filter for nearby broadcast FM and a cable-television connector check | — |
| T7C | SWR, feed-line failure, coax, and dummy loads | COMPLETE | TR-02, TC-07, and TR-06, plus the component choice for what a typical RF dummy load is made of | — |
| T7D | Voltmeter, ammeter, ohmmeter, and soldering | COMPLETE | TR-02 meter connections and TR-09 rated-meter check, plus the simulated resistance-setting voltage measurement | — |
| T8A | FM and SSB characteristics, bandwidth, USB versus LSB | COMPLETE | TR-07 bandwidth and sideband benches | — |
| T8B | Satellite orbits, Doppler, modes, beacons, spin fading, and uplink power | COMPLETE | TR-07 satellite pass, plus required spin-fading, published-mode, and beacon-comparison checks | — |
| T8C | Direction finding, contests, internet linking, grid locators | COMPLETE | TR-07 digital and linking benches | — |
| T8D | Digital modes, APRS, packet, PSK, DMR, WSJT, mesh | COMPLETE | TR-07 activity bench | — |
| T9A | Antenna types, polarization, gain, loading, and resonant length | COMPLETE | 06, TC-06, and TR-08 antenna bench | — |
| T9B | Feed lines, loss, SWR, tuners, and RF connectors | COMPLETE | 06, TC-06, and TR-08 feed-line bench | — |
| T0A | Power hazards, fuses, grounding, lightning, and battery safety | COMPLETE | TR-09 safety-bench and practice items | — |
| T0B | Tower and antenna installation safety | COMPLETE | TR-09 tower-safety decisions, plus the 10-foot fall-clearance site choice | — |
| T0C | RF exposure, duty cycle, and non-ionizing radiation | COMPLETE | TR-09 exposure-bench and practice items | — |

Official topic text is stored on each group in `content/exam/technician-2026-2030-coverage-final.json`.

## Subelement summary

| Subelement | COMPLETE | PARTIAL | MISSING | Stems supported | Partial | Unsupported |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T1 | 6 | 0 | 0 | 68 | 0 | 0 |
| T2 | 3 | 0 | 0 | 37 | 0 | 0 |
| T3 | 3 | 0 | 0 | 35 | 0 | 0 |
| T4 | 2 | 0 | 0 | 23 | 0 | 0 |
| T5 | 4 | 0 | 0 | 50 | 0 | 0 |
| T6 | 4 | 0 | 0 | 46 | 0 | 0 |
| T7 | 4 | 0 | 0 | 44 | 0 | 0 |
| T8 | 4 | 0 | 0 | 47 | 0 | 0 |
| T9 | 2 | 0 | 0 | 23 | 0 | 0 |
| T0 | 3 | 0 | 0 | 36 | 0 | 0 |

## Concept inventory

133 concepts. Audit 2 had 132. The extra concept is the split of ionospheric fading from elliptical polarization, explained under Disagreement below.

| Status | Count |
| --- | ---: |
| Taught, practiced, and assessed | 133 |
| Taught and practiced, not assessed | 0 |
| Taught, not practiced | 0 |
| Reference only | 0 |
| Mentioned only | 0 |
| Missing | 0 |

## 409-stem support

| Support | Count |
| --- | ---: |
| SUPPORTED | 409 |
| PARTIALLY SUPPORTED | 0 |
| UNSUPPORTED | 0 |

Per-stem evidence is in `content/exam/technician-2026-2030-stem-support-final.json`.

## Previously incomplete concepts

Each concept that audit 2 left incomplete was opened in the current lesson and compared with the pool wording.

- T0B. The pool's minimum distance is the fall-clearance rule: if the antenna falls, no part of it may come within 10 feet of the power wires. TR-09 makes the learner reject a 4-foot site and a 10-foot site and place the mast at 18 feet. Climbing technique is not part of the check.
- T1B. 50.0–50.1 MHz and 144.0–144.1 MHz are both used as operating decisions. FM and SSB are refused. CW is allowed.
- T2C. Winlink is taught as the system that relays messages using email addresses based on amateur call signs. The learner distinguishes it from voice, APRS, a directed net, and ordinary internet email.
- T3A polarization. Long-distance VHF and UHF CW and SSB are practiced as horizontal. Local FM and repeater work stay vertical.
- T3A elliptical polarization. A simplified ionospheric sketch shows the wave becoming elliptical, and the learner is told either antenna polarization can then be used. The sketch is labeled an educational model.
- T3A irregular fading. The same lab, in a separate step, teaches that irregular ionospheric fading is a likely result of signals arriving by different paths and combining.
- T4A current and battery time. The learner uses 13.8 volts at 12 amperes for a typical 50-watt FM mobile and divides ampere-hours by average current.
- T4A station path. The learner must place the RF power meter, account for an SWR meter's frequency and power rating, connect FT8 audio, name receive audio, transmit audio, and keying, connect line-in to the speaker connection, and choose flat copper strap.
- T4B off-frequency FM. On frequency the voice is understandable. Slightly low or slightly high, the audio is distorted.
- T4B noise blanker. The control is a required gate. It fits ignition-like impulse noise and is rejected for another station's voice and for over-deviation. The current pool names the noise blanker in the T4B topic and does not give it a separate numbered stem.
- T7A. The SSB / CW-FM switch sets the amplifier for proper operation in the selected mode. SSB uses SSB. CW and FM use CW-FM.
- T7B. A nearby commercial FM broadcast into a 2-meter receiver is answered with a band-reject filter. Cable-television interference starts with checking that the TV feed-line connectors are installed properly. RF-01 is not the evidence.
- T7C. A typical RF dummy load is identified as a 50-ohm non-inductive resistor on a heat sink.
- T7D. The simulated bench marks METER AT RISK when voltage is measured on the resistance setting, and SAFE MEASUREMENT for the two safe cases.
- T8B. Spin fading is the received level rising and falling while the satellite rotates, with Doppler held still. SSB, FM, and CW/data are all read as published modes. Uplink power is judged by comparing the downlink with the beacon.

## Disagreement with audit 2

T3A08 and T3A09 were one missing concept in audit 2. The note said the ionospheric polarization mechanism was not taught, and the concept text said elliptical polarization produces irregular fading.

The pool asks two different things. Irregular fading of an ionospheric signal has a likely cause in signals that arrive by different paths and combine. Elliptical polarization has a different result: either a vertically or a horizontally polarized antenna may be used. The current TR-05 lab teaches those as separate steps and assesses them separately. This audit credits both. It does not require the curriculum to teach elliptical polarization as the cause of the fading.

## Calculation review

TR-01 still carries the numerical work: prefixes, hertz, kilohertz, and megahertz, Ohm's law in both directions, power as voltage times current, series resistance, equal parallel resistors, and decibels. Foundations 05 and TC-05 still carry the first Ohm's law and power encounters.

The two T4A calculations that audit 2 found only stated are now required. The learner selects 13.8 volts at 12 amperes rather than the 4-ampere figure from watts divided by volts, and computes battery time as ampere-hours divided by average current on two examples.

SWR is still interpreted in TC-06, TR-06, and TR-08. Feed-line loss versus frequency and length is still practiced in TR-08. The pool does not ask the learner to compute a decibel loss from a cable table.

## Readiness

READY TO BEGIN TECHNICIAN EXAM READINESS

All 35 groups are complete, and all 409 stems are supported. The instructional curriculum covers the knowledge the Technician pool represents. Building the exam-readiness layer can begin.

This is a curriculum-development decision. It is not a statement that any person has mastered the material or should sit for the exam now.
