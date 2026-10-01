# Technician coverage re-audit

Post-remediation audit of the Radio Lab Technician curriculum against the NCVEC 2026–2030 Technician pool. This file is the second audit. `docs/TECHNICIAN_COVERAGE_AUDIT.md` and `content/exam/technician-2026-2030-coverage.json` remain the pre-remediation record.

## Authoritative source

NCVEC Question Pool Committee, 2026–2030 Technician Class, FCC Element 2, February 19, 2026 release. Effective 2026-07-01 through 2030-06-30.

- Syllabus: `content/exam/technician-2026-2030.json`
- Question stems: `content/exam/technician-2026-2030-questions.json` (409 stems, no answer choices)
- PDF: `content/exam/sources/technician-2026-2030/2026-2030-technician-ncvec-feb-19-2026.pdf`
- Provenance notes: `docs/EXAM_SOURCES.md` and `content/exam/model.json`
- Official figures T-1, T-2, and T-3, used by TR-02

Curriculum commit audited: `e83aeaac9d078369f965d5e9ae445caa899692f2`.

## Curriculum audited

Twenty-five Technician instructional labs:

- Foundations 01 through 08
- Technician Core TC-01 through TC-08
- Technician Remediation TR-01 through TR-09

Reference cards, shared simulations, practice items, and field tasks were read where they carry the instruction. Live syllabus metadata was not used as evidence. A group listed on a lesson is not treated as taught.

RF-01, RF Interference and Jamming, is supplemental. It is excluded from every classification in this audit. Nothing in this file is raised because RF-01 also touches interference.

## Method

Each official group was compared with the lesson text, interactions, practice items, and field tasks that actually develop its concepts. A concept is taught when the learner gets enough instruction or guided discovery to understand it. It is practiced when the learner has to apply it. It is assessed when a practice item, decision, or field task checks it. A glossary line, a title, or a metadata tag does not count as taught.

COMPLETE means the official topic and the conceptual breadth of that group's stems are taught, practiced, and assessed well enough for a beginner. PARTIAL means real instruction exists and at least one substantive concept is still thin. MISSING means the group has no meaningful instruction.

Stem support is a separate pass over all 409 stems. SUPPORTED means the underlying knowledge is in the 25 labs. PARTIALLY SUPPORTED means a related idea is taught and the stem's specific point is not. UNSUPPORTED means the knowledge is absent. Official answer letters are not stored.

## Before and after

| | COMPLETE | PARTIAL | MISSING |
| --- | ---: | ---: | ---: |
| Before remediation | 0 | 34 | 1 |
| After remediation | 24 | 11 | 0 |

The group that was missing before remediation was T5B. TR-01 now teaches, practices, and assesses metric prefixes and decibels, so T5B is complete.

## 35-group coverage

| Group | Status | Strongest evidence | Remaining gap |
| --- | --- | --- | --- |
| T1A | COMPLETE | TR-03 rule decisions and practice items | — |
| T1B | PARTIAL | 04, TC-01, and TR-03 privilege decisions | CW-only VHF and UHF segments are named in the TR-03 stage text and are not practiced. |
| T1C | COMPLETE | TR-03 grant, club, vanity, and inspection decisions | — |
| T1D | COMPLETE | TR-03 permitted and prohibited communication decisions | — |
| T1E | COMPLETE | 03, TC-02, and TR-03 control decisions | — |
| T1F | COMPLETE | TR-03 identification and repeater decisions | — |
| T2A | COMPLETE | 03, TC-02, and TR-04 repeater lab | — |
| T2B | COMPLETE | TR-04 interference, net, and courtesy scenarios | — |
| T2C | PARTIAL | TR-04 public-service and traffic scenarios | Winlink, or any equivalent system that sends messages as email addressed by a call sign, is not taught. |
| T3A | PARTIAL | TR-05 multipath and absorption labs | Elliptical polarization of ionospheric signals, and the usual horizontal polarization for long-distance VHF and UHF CW and SSB, are not taught. |
| T3B | COMPLETE | TR-05 wave lab | — |
| T3C | COMPLETE | 07, TC-07, and TR-05 path gallery | — |
| T4A | PARTIAL | TR-06 mobile-power and hotspot interactions | Battery runtime, mobile supply current, and the FT8 audio connection are stated but not practiced. Meter placement, the computer interface, and flat-strap bonding are only mentioned. |
| T4B | PARTIAL | TR-06 front panel and code plug | The sound of an FM signal received slightly off frequency is not taught. The noise blanker is explained on the front panel and is not required to finish the lab. |
| T5A | COMPLETE | 05, TC-05, and TR-01 | — |
| T5B | COMPLETE | TR-01 prefix and decibel benches | — |
| T5C | COMPLETE | TR-01 Ohm's law, power, series, and parallel benches | — |
| T5D | COMPLETE | TR-01 impedance bench and TR-02 resonance | — |
| T6A | COMPLETE | TR-02 parts, diode, and transistor benches | — |
| T6B | COMPLETE | TR-02 supply path | — |
| T6C | COMPLETE | TR-02 figure-lab on official figures T-1, T-2, and T-3 | — |
| T6D | COMPLETE | TR-02 figure-lab and terminal benches | — |
| T7A | PARTIAL | TR-06 block diagram | The SSB versus CW-FM switch on some VHF power amplifiers is not taught. |
| T7B | PARTIAL | TR-06 interference cases | The cable-television connector check and a band-reject filter for a nearby commercial FM broadcast are not taught. |
| T7C | PARTIAL | TR-02 soldering and meter; TR-06 coax layers | The purpose of a dummy load is taught. What a typical dummy load consists of is not. |
| T7D | PARTIAL | TR-02 meter and TR-09 rated-meter check | How to connect a meter is taught. What damages a multimeter is not. |
| T8A | COMPLETE | TR-07 bandwidth and sideband benches | — |
| T8B | PARTIAL | TR-07 satellite pass | Spin fading, the fact that satellites use several modes, and judging uplink power against the beacon are not taught. |
| T8C | COMPLETE | TR-07 digital and linking benches | — |
| T8D | COMPLETE | TR-07 activity bench | — |
| T9A | COMPLETE | 06, TC-06, and TR-08 antenna bench | — |
| T9B | COMPLETE | 06, TC-06, and TR-08 feed-line bench | — |
| T0A | COMPLETE | TR-09 safety-bench and practice items | — |
| T0B | PARTIAL | TR-09 tower-safety and practice items | The minimum safe distance from a power line is not taught. The lesson practices the rule that a falling antenna must not be able to reach the line. |
| T0C | COMPLETE | TR-09 exposure-bench and practice items | — |

Official topic text is stored on each group in `content/exam/technician-2026-2030-coverage-post-remediation.json`.

## Subelement summary

| Subelement | COMPLETE | PARTIAL | MISSING | Stems supported | Partial | Unsupported |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T1 | 5 | 1 | 0 | 67 | 1 | 0 |
| T2 | 2 | 1 | 0 | 36 | 0 | 1 |
| T3 | 2 | 1 | 0 | 32 | 1 | 2 |
| T4 | 0 | 2 | 0 | 14 | 8 | 1 |
| T5 | 4 | 0 | 0 | 50 | 0 | 0 |
| T6 | 4 | 0 | 0 | 46 | 0 | 0 |
| T7 | 0 | 4 | 0 | 39 | 2 | 3 |
| T8 | 3 | 1 | 0 | 44 | 1 | 2 |
| T9 | 2 | 0 | 0 | 23 | 0 | 0 |
| T0 | 2 | 1 | 0 | 35 | 1 | 0 |

## Concept inventory

132 concepts, derived from the official topic text, the stems, and the current lessons.

| Status | Count |
| --- | ---: |
| Taught, practiced, and assessed | 114 |
| Taught and practiced, not assessed | 0 |
| Taught, not practiced | 2 |
| Reference only | 0 |
| Mentioned only | 3 |
| Missing | 13 |

## 409-stem support

| Support | Count |
| --- | ---: |
| SUPPORTED | 386 |
| PARTIALLY SUPPORTED | 14 |
| UNSUPPORTED | 9 |

Per-subelement counts are in the table above and in `content/exam/technician-2026-2030-stem-support.json`.

## Calculation review

TR-01 is the calculation lab. The learner converts prefixes (including 1.5 A to mA, 1 kV, 1 µV, 500 mW, picofarads, and MHz/kHz/GHz), applies Ohm's law both directions, computes power as voltage times current, adds series resistors, combines equal parallel resistors, and uses decibels at +3 dB, −3 dB, and +10 dB, with +6 dB stated as four times. Foundations 05 and TC-05 still carry the first Ohm's law and power encounters. The relationships are practiced on more than one numeric pair.

Two calculation ideas in T4A are only stated. The TR-06 mobile-power readout says a 50-watt radio draws more supply current than 50 divided by 13.8, and that battery time is about amp-hours divided by the current drawn. The wiring task does not ask the learner to use either one.

SWR is interpreted (1:1 versus a high value, and the foldback that follows) in TC-06, TR-06, and TR-08. Feed-line loss versus frequency and length is practiced in TR-08. The curriculum does not ask the learner to compute a decibel loss from a cable table, and the pool does not require that arithmetic.

## Regulatory review (T1)

TR-03 practices the T1 decisions: purpose, FCC authority, license classes and term, grace period and renewal, operator and station license, control operator, control point, local, remote, and automatic control, identification, tactical calls, third-party traffic, international contacts, countries that object, prohibited music and broadcasting, codes that hide meaning, identified test transmissions, beacons, RACES as a rules topic, club stations, vanity calls, inspection, band edges, Technician HF phone, secondary allocations, PEP, and repeater coordination. Foundations 01, 03, and 04 and Technician Core TC-01 and TC-02 carry the first version of several of those ideas. T1A and T1C through T1F are complete.

T1B stays partial. Technician HF phone, the 200-watt HF limit, secondary status, and the ISS contact rule are practiced. The CW-only slices at 50.0–50.1 MHz and 144.0–144.1 MHz are named in the stage text and never turned into a decision.

## Operating review (T2)

TR-04 practices simplex, the 600 kHz and 5 MHz offsets, reverse, CTCSS, DTMF, DMR color code and talkgroup, CQ, phonetics, QRM, QSY, a directed net, formal traffic with a preamble and a check, ARES, and RACES. A linked repeater is practiced as a reason to move a local chat to simplex.

T2C stays partial because Winlink is absent. Nothing in the 25 labs names a system that moves amateur messages as email addressed by a call sign.

## Propagation review (T3)

TR-05 teaches the electric and magnetic fields, polarization, free-space speed, the frequency and wavelength relationship, the radio horizon, multipath and picket fencing, vegetation and rain, knife-edge diffraction, F-region skip, sporadic E, meteor scatter, aurora, and tropospheric ducting. T3B and T3C are complete.

T3A stays partial. The learner can match polarization and still not know that long-distance VHF and UHF CW and SSB usually use horizontal polarization, or that an ionospheric path often leaves the wave elliptically polarized.

## Station and control review (T4)

TR-06 practices microphone gain, squelch, VFO, memory, scan, RIT, AGC, bandwidth, a keyer, a DMR code plug, a D-STAR radio that needs a call sign before it transmits, and a hotspot. Those controls are enough for most of T4B.

T4B stays partial. Nothing describes what an FM signal sounds like when the receiver is slightly off frequency. The noise blanker is on the front panel and explains itself when selected, and the lab can be finished without using it.

T4A is partial. Fuse location, wire size, and the negative return are practiced. Battery runtime, supply current, the FT8 audio connection, meter placement and rating, and flat-strap bonding are stated and not practiced.

## Electrical review (T5)

The old T5B hole is closed. TR-01 teaches voltage, current, resistance, power, conductors and insulators, AC and DC, prefixes, decibels, Ohm's law, series and parallel resistance, impedance, capacitance, and inductance, and each of those is practiced and assessed. T5A through T5D are complete.

## Component review (T6)

TR-02 teaches the resistor, potentiometer, capacitor, inductor, switch, fuse, battery chemistry at the rechargeable-versus-primary level, diode, LED, transistor, FET, the rectifier-filter-regulator path, relay, integrated circuit, shielding, and resonance. The learner identifies parts on official figures T-1, T-2, and T-3 rather than only seeing the drawings. T6A through T6D are complete.

## Practical and troubleshooting review (T7)

TR-06 teaches the transceiver blocks, sensitivity versus selectivity, the mixer, the RF power amplifier, and the transverter. TR-02, TC-07, and TR-06 teach the dummy load's job, the multimeter connections, soldering, coax layers including foam dielectric, and SWR. Neighbor overload, over-deviation, and high-SWR foldback are practiced cases.

T7A stays partial because the SSB versus CW-FM switch on some VHF power amplifiers is absent. T7C stays partial because the labs never say what a dummy load is made of. T7D stays partial because nothing teaches which measurement damages a multimeter.

T7B stays partial. Two pool-specific remedies are missing: a band-reject filter for a strong nearby broadcast transmitter, and checking cable-television connectors as the first step. RF-01 also demonstrates receiver overload. It is not used to fill this gap.

## Modes, digital, and satellite review (T8)

TR-07 practices CW, SSB, FM, and fast-scan bandwidths, USB versus LSB, FT8, PSK, packet, APRS, ARQ, mesh, NTSC, contesting, grid locators, direction finding, and internet linking. T8A, T8C, and T8D are complete.

T8B stays partial. The LEO pass, Doppler, tracking data, the U/V frequency pair, beacon telemetry, and transponder overload are taught. Spin fading, the range of satellite modes, and the beacon-comparison method for uplink power are not.

## Antenna and feed-line review (T9)

TR-08, with Foundations 06 and TC-06, practices the dipole, vertical, beam, rubber duck, mobile antennas, the loading coil, radiation pattern, polarization, 50-ohm coax, RG-58 versus RG-213, loss versus frequency and length, the PL-259 and the N connector, SWR, and what an antenna tuner does and does not do. T9A and T9B are complete.

## Safety review (T0)

TR-09 practices shock as current through the body, wiring colors, fuse sizing, stored charge, rated meters, tower grounding, climbing practice, lightning protection and bonding, and RF exposure. The exposure bench is an educational model. It cites FCC evaluation by calculation or measurement and does not present itself as an MPE calculator. `content/regulations/fcc-rf-exposure.json` is the source note, marked as not the official FCC text. The radiation item's explanation also states that touching an antenna while transmitting can cause an RF burn. T0A and T0C are complete.

T0B stays partial. The learner practices the rule that a falling antenna must not be able to reach a power line, and that a utility pole is not an antenna support. The pool also asks for a minimum safe distance, and that distance is not taught.

## Remaining gaps

### T0B — minimum distance from a power line

Current state: the clearance principle is taught and practiced. The minimum distance is missing.

Needed: teaching, practice, and assessment. One decision that uses the minimum distance the pool expects, plus one practice item. Keep the existing fall-clearance choice.

### T1B — CW-only segments

Current state: mentioned only. The TR-03 stage text names 50.0–50.1 MHz and 144.0–144.1 MHz.

Needed: practice and assessment. One privilege decision that refuses phone in one of those slices, plus one practice item.

### T2C — Winlink

Current state: missing.

The public-service lab teaches ARES, RACES, directed nets, and formal voice traffic. It never introduces a system that files messages as email addressed by a call sign.

Needed: teaching, practice, and assessment. One short explanation of what Winlink is for, one decision that distinguishes it from a voice net, and one practice item.

### T3A — elliptical polarization

Current state: missing.

Skywave and ordinary polarization are taught. The learner is not told that an ionospheric path often makes the wave elliptical, which is why fading is irregular and either antenna polarization can hear it.

Needed: teaching, practice, and assessment. One guided comparison and one practice item.

### T3A — horizontal polarization for long-distance VHF and UHF CW and SSB

Current state: missing as a convention. Polarization matching is already taught.

Needed: teaching, practice, and assessment. One decision that picks horizontal for that case, plus one practice item. Do not treat it as already covered by the matching exercise.

### T4B — FM received slightly off frequency

Current state: missing.

Needed: teaching, practice, and assessment. One listening comparison on the front panel, plus one practice item.

### T4B — noise blanker

Current state: taught, not practiced. The control explains itself when selected, and the finish check does not require it.

Needed: practice and assessment. Require the noise-blanker control before the stage finishes, and add one practice item.

### T4A — battery runtime and mobile supply current

Current state: taught, not practiced. Both sentences appear in the TR-06 mobile-power readout.

Needed: practice and assessment. One numeric battery-time decision and one supply-current decision, each with a practice item.

### T4A — meter placement, computer interface, and flat-strap bonding

Current state: mentioned only, in the TR-06 station-setup paragraph.

Needed: teaching, practice, and assessment. One station-setup interaction that places the meter, connects the sound interface, and chooses flat strap, plus practice items for those three facts.

### T7A — VHF amplifier mode switch

Current state: missing. The RF power amplifier itself is taught.

Needed: teaching, practice, and assessment. One block-diagram decision about the SSB versus CW-FM switch, plus one practice item.

### T7B — band-reject filter

Current state: missing.

The interference cases cover overload, microphone gain, and SWR foldback. They do not cover a strong nearby broadcast transmitter and the band-reject filter used against it.

Needed: teaching, practice, and assessment. One interference case and one practice item. Do not count RF-01.

### T7B — cable-television connectors

Current state: missing as a first step. A general neighbor response is taught.

Needed: teaching, practice, and assessment. One case whose correct first action is to have the neighbor check the television connectors, plus one practice item.

### T7C — dummy-load construction

Current state: missing. The job of a dummy load is already practiced.

Needed: teaching, practice, and assessment. One short identification of what the load is made of, plus one practice item.

### T7D — multimeter damage

Current state: missing. Connecting a voltmeter, ammeter, and ohmmeter is already practiced.

Needed: teaching, practice, and assessment. One meter choice that avoids the damaging setup, plus one practice item.

### T8B — spin fading

Current state: missing.

Needed: teaching, practice, and assessment. One addition to the satellite pass that identifies rotation of the satellite as the cause, plus one practice item.

### T8B — satellite operating modes

Current state: missing. The U/V frequency pair is taught, which is not the same fact.

Needed: teaching, practice, and assessment. One decision that selects the mode the satellite publishes, plus one practice item.

### T8B — judging uplink power

Current state: missing. The lab does teach that too much uplink overloads a linear transponder.

Needed: teaching, practice, and assessment. One decision that compares the downlink signal with the beacon, plus one practice item.

## Readiness

NO — targeted instructional remediation is still required first.

24 of 35 groups are complete, and 386 of 409 stems are supported. 11 groups remain partial and none are missing. The unsupported stems are facts a learner cannot derive from the surrounding instruction: Winlink, elliptical polarization, the sound of off-frequency FM, the VHF amplifier mode switch, a band-reject filter, multimeter damage, spin fading, and the set of satellite modes.

Fix the gaps in this order before building Technician Exam Readiness:

1. T2C Winlink, T8B satellite modes, spin fading, and uplink-power comparison, and T3A elliptical polarization. These are absent, not merely unpracticed.
2. T7B band-reject filter and cable-television connector check, T7A amplifier switch, T7D multimeter damage, T7C dummy-load construction, and T4B off-frequency FM.
3. T4A station-setup facts, T4B noise blanker, T1B CW-only segments, T0B power-line distance, and T3A horizontal weak-signal polarization. Related ideas are already on the page.

This is a curriculum-development decision. It is not a statement about any person sitting for the FCC exam.

