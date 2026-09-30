# Technician instructional coverage audit

Audit date: 2026-09-29. Curriculum measured: Foundations 01–08 and Technician Core TC-01 through TC-08, as they existed at commit `000513ef799068aaf215f344bd1f517569b8625c`. No lesson was changed for this audit.

## 1. Authoritative target

NCVEC Question Pool Committee, 2026–2030 Technician Class, FCC Element 2, February 19, 2026 release. Effective 2026-07-01 through 2030-06-30.

- Source: `content/exam/sources/technician-2026-2030/`
- Syllabus: `content/exam/technician-2026-2030.json` (10 subelements, 35 groups, official topic text)
- Question index: `content/exam/technician-2026-2030-questions.json` (409 stems and group ids; no answer key)

The machine-readable result is `content/exam/technician-2026-2030-coverage.json`.

## 2. Methodology

Official topic text defined each group. The 409 stems were read to see which skills that group actually represents. A stem was not treated as covered because its identifier appears in a lesson.

For each concept the question was: if a beginner had no other Technician material, would this curriculum teach it, make them use it, and make them show that they understand it?

Evidence came from lesson text, interactive tasks, Radio Lab practice questions, field tasks, and reference cards. A lab title was not evidence. A reference card alone is reference-only. Naming a fact inside an answer explanation, without a task, is mentioned-only.

## 3. Definitions

**COMPLETE.** The meaningful concepts in the group are taught, practiced, and assessed well enough for a beginner using only Radio Lab.

**PARTIAL.** Real instruction exists, and at least one important concept or dimension is still missing.

**MISSING.** The group is absent, or what exists is too weak to call it instructional coverage.

Concept statuses inside a group:

- complete: taught, practiced, and assessed
- taught-not-practiced
- taught-practiced-not-assessed
- reference-only
- mentioned-only
- missing

A practice question, field task, or diagnostic choice counts as assessment. Completing a stage does not.

## 4. Overall results

### Group-level coverage

Each of the 35 official groups has equal weight. A broad group and a narrow group count the same. This is not a percentage of exam readiness and not a percentage of the 409 questions.

| Classification | Groups | Group-level share |
| --- | --- | --- |
| COMPLETE | 0 | 0/35 |
| PARTIAL | 34 | 34/35 |
| MISSING | 1 | 1/35 |

The missing group is T5B, math for electronics: unit conversion and decibels.

No group is COMPLETE. Every other group contains at least one real Radio Lab activity and at least one concept a beginner would not learn here.

### Concept-level coverage

This audit named 130 concepts from the topic text and the stems. That list is not an official NCVEC outline. Do not add it to the 35-group metric.

| Concept status | Count |
| --- | --- |
| Taught, practiced, and assessed | 82 |
| Taught, not practiced | 2 |
| Taught and practiced, not assessed | 0 |
| Reference only | 2 |
| Mentioned only | 2 |
| Missing | 42 |

## 5. Results by T0–T9

| Area | Groups | Result |
| --- | --- | --- |
| T0 Safety | T0A, T0B, T0C | All partial. Avoidance and the exposure model are real. Tower hardware, AC wiring, and compliance methods are not. |
| T1 Rules | T1A–T1F | All partial. Purpose, privileges, term, grace, control operator, and identification are practiced. Most of the regulatory list is not. |
| T2 Procedures | T2A–T2C | All partial. Listen, call, simplex, a 2-meter offset, squelch, and nets are practiced. CQ, DMR, traffic format, RACES, and ARES are not. |
| T3 Propagation | T3A–T3C | All partial. Line of sight, wavelength, and a first skywave picture are practiced. Named ionospheric and scatter modes are not. |
| T4 Practices | T4A, T4B | All partial. Digital path, SWR check, squelch, VFO, memory, and microphone gain are practiced. Mobile wiring and digital code plugs are not. |
| T5 Electrical | T5A, T5C, T5D partial; T5B missing | Ohm's law, power, and parallel loads are practiced. Decibels, prefix math, impedance, and series circuits are not. |
| T6 Components | T6A–T6D | All partial. The power-path parts, diode, transistor, relay, and a short schematic are practiced. Chemistry, electrodes, and power-supply parts are not. |
| T7 Practical circuits | T7A–T7D | All partial. The signal path, station faults, SWR, dummy load, and meter setups are practiced. Neighbor interference and soldering are not. |
| T8 Signals | T8A–T8D | All partial. Modes, relative bandwidth, a digital path, APRS, a satellite pass, and a direction-finding check are practiced. Bandwidths in kilohertz, LEO, contests, and WSJT are not. |
| T9 Antennas | T9A, T9B | All partial. Length, polarization, aim, loss, and SWR are practiced. Named antennas, tuners, and connector families are not. |

## 6. Detailed group analysis

### T0 Safety

**T0A, partial.** TC-08 makes the learner remove a jumpered fuse, reject a damaged cord, and move a badly placed battery. TC-03 and TC-07 use a fuse as a part that opens. Not taught: current through the body, AC wire color, where a fuse or breaker goes, installing a larger fuse, a lightning arrestor, bonding ground rods, charge left in a supply, and high-voltage meter technique.

**T0B, partial.** TC-08 site and field choices keep the antenna off the overhead line and off a utility pole, and they stop the outing for a thunderstorm. The lab says not to climb. It does not teach tower grounding, guys, turnbuckles, crank-up towers, a helper, or a clearance distance.

**T0C, partial.** The TC-08 model changes power, distance, and duty cycle and is labeled an educational model, not a compliance calculator. Not taught: non-ionizing versus ionizing radiation, why limits change with frequency, how a station is actually evaluated, who is responsible, or the burn from touching a transmitting antenna.

### T1 Commission's rules

**T1A, partial.** TC-01 refuses paid messages and music broadcasts and treats emergency and personal contacts as the service. TC-02 uses phonetics without letting them replace the call sign. The statement that one grant covers the operator and the station is only in the lesson text. RACES, beacons, frequency coordinators, and the Part 97 space-station definition are absent.

**T1B, partial.** Lab 04 makes the learner accept or refuse a transmit frequency against a privilege reference, including two 10-meter voice examples. TC-01 shows that a signal has width near a band edge and that the legal maximum is not the power to use. Not taught: HF phone limits, CW-only segments, secondary status, who may contact the ISS, and peak-envelope-power ceilings.

**T1C, partial.** TC-01 teaches Technician, General, and Amateur Extra, a 10-year term, and a grace period that is not permission to transmit. Not taught: vanity calls, Group D format, the license database, renewal timing, email reachability, or international waters.

**T1D, partial.** TC-01 and TC-02 cover hire, broadcasting, and identified test transmissions. Not taught: prohibited countries, encoded messages, indecent language, equipment sales, auxiliary stations, or news gathering.

**T1E, partial.** TC-01 requires a control operator at the control point, including when someone else speaks. Not taught: who designates the control operator, privileges following that operator's class, automatic control, or remote control.

**T1F, partial.** TC-01 times identification to 10 minutes and the end of the contact, and it keeps a third-party hello under the control operator. Lab 03 shows a repeater as a retransmission on another frequency. Not taught: tactical calls, self-assigned indicators, club licenses, or inspection.

### T2 Operating procedures

**T2A, partial.** TC-02 listens and calls. Labs 01 and 02 tune 146.520 MHz as the 2-meter simplex calling example. Lab 03 uses a minus 600 kHz offset as a common 2-meter case, not as a rule for every band. Lab 08 reuses that simplex frequency and the same offset on a summit outing. Lab 04 separates a band-plan custom from a privilege. CQ procedure and the 70-centimeter offset are absent.

**T2B, partial.** Lab 03 and TC-07 use simplex, offset, and an access tone. Lab 02 practices squelch. Lab 08 asks whether a valley contact is simplex or a repeater, then fixes a wrong repeater tone. QSY is only a sentence on the reference card. Reverse, DTMF, linked repeaters, DMR talkgroups, color codes, and QRM are absent.

**T2C, partial.** TC-02 and TC-08 follow net control, give emergency traffic the frequency, and refuse self-deployment. RACES, ARES, radiogram preamble and check, and email-based traffic systems are absent.

### T3 Radio wave characteristics

**T3A, partial.** Lab 07 opens a hill by raising antennas and shows that power does not remove a ridge. TC-06 matches vertical to vertical and shows the cross-polarized case as weaker. Picket fencing, vegetation, rain, multipath data errors, and ionospheric polarization are absent.

**T3B, partial.** Lab 01 relates frequency and wavelength, uses the 300/f shortcut, converts Hz, kHz, and MHz, and labels VHF and UHF ranges. The electric and magnetic fields, equal velocity for every frequency, and an HF frequency-range definition are absent.

**T3C, partial.** Lab 07 treats a typical VHF/UHF path as line of sight and introduces HF skywave as an ionospheric return that is not guaranteed. Sporadic E, meteor scatter, aurora, tropospheric ducting, F-region skip, and the radio horizon versus the visual horizon are absent.

### T4 Amateur radio practices

**T4A, partial.** TC-05 builds computer, interface, radio, RF, receiving radio, decoder. TC-06 and TC-07 place an SWR or power check and a dummy load in the path. Lab 08 connects supply, radio, feed line, and antenna before the station is called ready. Lab 05 separates supply watts from RF output. Mobile wiring, bonding, battery ampere-hours, hotspots, and keyers are absent.

**T4B, partial.** Lab 02 practices squelch, VFO, and memory. TC-02 and TC-04 show microphone-gain distortion and a filter that is too wide or too narrow. AGC, noise blanker, RIT, scanning, DMR code plugs, and D-STAR programming are absent.

### T5 Electrical principles

**T5A, partial.** Lab 05 varies voltage and resistance and reads current. It computes supply power as voltage times current. Lab 08 repeats that supply-watt calculation for receive and transmit current and says those watts are not RF output. Lab 01 defines the hertz. TC-07 measures voltage. Conductors, insulators, and AC versus DC appear only on the Technician Core reference card.

**T5B, missing.** No lesson converts milliamperes, microvolts, milliwatts, or picofarads, and no lesson teaches decibels. Lab 01's hertz, kilohertz, and megahertz converter is real, and it is counted under T3B. It does not teach this group's math.

**T5C, partial.** Lab 05 calculates DC power. TC-03 shows a capacitor storing charge and an inductor opposing a change in current. Farad, henry, and impedance are not defined.

**T5D, partial.** Lab 05 uses current = voltage / resistance, including a numeric practice question, and it measures two equal loads in parallel as a lower total. Series addition is only a sentence in that question's explanation. There is no series task.

### T6 Components

**T6A, partial.** TC-03 builds and names a resistor, switch, fuse, capacitor, and inductor. The battery is the supply in Lab 05 and TC-03. Potentiometers and rechargeable versus non-rechargeable chemistries are absent.

**T6B, partial.** TC-03 lets the learner try a one-way diode and a transistor model. The reference card restates gain. Forward voltage, the cathode mark, LEDs, FETs, and bipolar electrode names are absent.

**T6C, partial.** TC-03 matches battery, fuse, switch, and resistor symbols to a physical chain and asks why a schematic is not a photograph. The pool's figure symbols for transistor, lamp, ground, capacitor, inductor, and regulator are absent.

**T6D, partial.** TC-03 operates a relay. TC-07 uses a meter. Rectifiers, regulators, transformers, shielding, indicators, integrated circuits, and resonant circuits are absent.

### T7 Practical circuits

**T7A, partial.** TC-04 walks microphone or data, modulation, transmitter, RF output, feed line, and antenna, and the receive path the other way. Lab 02 uses a VFO. Sensitivity, selectivity, mixers, PTT, preamplifiers, and transverters are absent.

**T7B, partial.** TC-04 traces weak transmit audio to microphone gain. TC-04 and TC-07 diagnose a dark radio, a wrong tone, high SWR, and a weak signal before blaming an internal part. Over-deviation, overload of a neighbor's receiver, RF feedback, and the interference conversation with a neighbor are absent.

**T7C, partial.** Lab 06, TC-06, and TC-07 use SWR and a dummy load. TC-06 changes length, frequency, and cable quality in a relative loss model and treats a bad connector as a path fault. A 1:1 reading, foldback, water, ultraviolet damage, and foam versus solid dielectric are absent. The labs deliberately do not teach a universal safe SWR number.

**T7D, partial.** TC-07 refuses a live resistance measurement and an across-the-supply current measurement, and it assesses those choices. Soldering and cold joints are absent.

### T8 Signals and emissions

**T8A, partial.** TC-04 draws AM, FM, SSB, and CW. TC-05 makes the learner set FM voice, SSB voice, CW, or digital to match the signal, and it compares relative occupied width. USB versus LSB, kilohertz bandwidths, and fast-scan television are absent. The width bars are labeled as a comparison, not a specification.

**T8B, partial.** TC-05 separates uplink, downlink, line of sight, and a frequency shift during a pass. LEO, tracking programs, beacons, telemetry, spin fading, U/V mode, and uplink power are absent.

**T8C, partial.** TC-05 has one direction-finding choice: turn a directional antenna until the signal peaks. Contests, grid locators, IRLP, EchoLink, and VoIP are absent.

**T8D, partial.** TC-05 assembles the digital path and treats APRS as a radio packet of station, location, or status. CW is on-off keying in TC-04 and TC-05. NTSC, PSK, FT8 and the other WSJT modes, DMR, ARQ, and mesh networks are absent.

### T9 Antennas and feed lines

**T9A, partial.** Lab 06 shortens a wire when the frequency rises. Lab 08 chooses among three wire lengths for a 2-meter outing. TC-06 matches polarization, aims a directional antenna, and treats gain as redistributed energy. Beam names, loading coils, rubber-duck and vehicle antennas, the 5/8-wave whip, and the dipole's broadside pattern are absent.

**T9B, partial.** TC-06 shows relative loss and a bad connector. Lab 06, TC-06, and TC-07 use SWR and a dummy load. Fifty-ohm coax, antenna tuners, PL-259 and N connectors, weather sealing, and RG-58 versus RG-213 are absent.

## 7. Missing concepts

The 42 missing concepts are listed on each group in the coverage file. The clusters are:

- AC house wiring, lightning hardware, stored charge, and tower-construction details
- RF exposure as a compliance evaluation, including ionizing versus non-ionizing
- Most of the Part 97 list beyond the decisions already practiced
- CQ, 70-centimeter offset, reverse, DTMF, DMR, Q signals, RACES, ARES, and formal traffic
- Multipath, picket fencing, absorption, and every named propagation mode beyond line of sight and a first skywave
- Electric and magnetic fields, equal wave speed, and the HF frequency range
- Mobile power wiring, hotspots, keyers, AGC, RIT, scanning, and digital code plugs
- Decibels, metric prefixes other than hertz, farad, henry, and impedance
- Potentiometers, battery chemistry, diode and transistor electrodes, LEDs, FETs, and the rest of the schematic figures
- Rectifiers, regulators, transformers, shielding, integrated circuits, and resonance
- Sensitivity, mixers, transverters, neighbor interference, coax construction, and soldering
- Sideband choice, kilohertz bandwidths, fast-scan television, satellite tracking and LEO, contests, grid locators, internet linking, FT8, PSK, NTSC, ARQ, and mesh
- Named antennas, tuners, and connector families

## 8. Partial concepts

Every group except T5B is partial. The strongest partials, where a beginner does learn the center of the idea and still misses the edges, are T5D (Ohm's law and parallel, not series), T7D (meter setups, not soldering), T7C (SWR and loss, not coax construction), T2A (calling and a 2-meter offset, not CQ), and T8A (mode match and relative width, not kilohertz figures).

The thinnest partials, where one activity stands in for a much larger group, are T8C (direction finding only), T8B (a pass without orbits), T6D (a relay and a meter), T0B (avoid the line; do not learn the tower), and T3C (line of sight and one skywave sentence).

## 9. Reference-only concepts

- Conductors, insulators, direct current, and alternating current: Technician Core reference card. No lab task.
- Gain as a word for the transistor model: the same card. TC-06 teaches antenna gain separately, as redistributed energy.

## 10. Mentioned-only concepts

- QSY: one sentence on the Technician Core reference card.
- Series resistance adds: one sentence in the explanation of Lab 05's parallel question. There is no series circuit to build.

## 11. Taught but not practiced

- One license grant covers the operator and the primary station: stated in TC-01, never used in a task.
- Do not climb a tower: stated as a limit of TC-08, with no tower task. That is appropriate. The course does not practice climbing.

No concept in this audit is taught and practiced but left unassessed. Where a task exists, a practice question, field choice, or diagnostic choice also exists. The holes are missing concepts, not missing tests for concepts that were fully taught.

## 12. Taught and practiced but not assessed

None identified at the concept level used in this audit.

## 13. Calculation gaps

| Relationship | Taught | Practiced | Assessed |
| --- | --- | --- | --- |
| Frequency versus wavelength, about 300/f | Yes, Lab 01 and Lab 06 | Yes | Yes |
| Hertz, kilohertz, and megahertz for one frequency | Yes, Lab 01 | Yes | Yes |
| Current = voltage / resistance | Yes, Lab 05 | Yes | Yes |
| Power = voltage times current, supply watts only | Yes, Lab 05 | Yes | Yes |
| Two equal resistors in parallel | Yes, Lab 05 | Yes | Yes |
| Series resistance | Mentioned only | No | No |
| Milli, micro, pico, and kilo conversions for amperes, volts, watts, and farads | No | No | No |
| Decibels | No | No | No |
| Farad, henry, impedance | No | No | No |
| Feed-line loss | Relative model only, TC-06 | Yes | Yes |
| SWR as a number such as 1:1 or 4:1 | No | No | No |

## 14. Regulatory gaps

The practiced rules are purpose, a privilege check, band-edge width, minimum useful power, license term and grace, control operator, identification, and a few prohibited uses.

Not taught: RACES enrollment, beacons, frequency coordinators, secondary allocations, specific HF privileges, peak envelope power, vanity and call-sign format, the license database, international operation, prohibited countries, encoding, indecent language, sales, auxiliary stations, news support, automatic and remote control, tactical identification, club stations, and inspection.

## 15. Safety gaps

Practiced: damaged cords, jumpered fuses, battery placement, overhead lines, storms, distance and power and duty cycle as an educational comparison, and not sitting people against the antenna.

Not taught: shock current through the body, AC wiring, fuse rating, lightning arrestors, ground rods, stored charge, tower construction, non-ionizing versus ionizing radiation, how to evaluate exposure under the current rules, and who is responsible for that evaluation.

## 16. Recommended remediation modules

These are not lessons. They are the smallest set of hands-on modules that would close the gaps above. They are grouped by the work a beginner would do, not by one module per question.

### Electrical quantities and circuit math

- Groups: T5A, T5B, T5C, T5D
- Gaps: AC versus DC, conductors and insulators, metric prefixes, decibels, farad, henry, impedance, series circuits
- Why together: they are one bench. The learner already changes voltage and resistance.
- Mechanism: circuit bench. Convert prefixes, compute power and Ohm's law, build series and parallel, and compare a few powers in decibels as ratios.

### Parts, symbols, and soldering

- Groups: T6A, T6B, T6C, T6D, T7D
- Gaps: potentiometer, battery chemistry, diode and transistor electrodes, LED, FET, the remaining schematic symbols, rectifier, regulator, transformer, shield, integrated circuit, resonance, solder
- Why together: the learner already has a component bench and a short schematic. These are the missing parts of that bench.
- Mechanism: component and schematic bench, plus a soldering inspection that shows a sound joint and a cold joint without asking the learner to perform a dangerous procedure.

### Rules as operating decisions

- Groups: T1A, T1B, T1C, T1D, T1E, T1F
- Gaps: the regulatory list in sections 7 and 14
- Why together: each gap is a situation the control operator has to accept or refuse, not a table to memorize.
- Mechanism: operating scenarios. One situation, one decision, with the rule visible after the choice.

### Repeater, net, and public-service procedure

- Groups: T2A, T2B, T2C
- Gaps: CQ, 70-centimeter offset, reverse, DTMF, DMR talkgroups, Q signals, RACES, ARES, formal traffic
- Why together: they are what the operator does with the radio after the frequency is chosen.
- Mechanism: operating simulator on the existing handheld, plus a short directed-net and one formal message.

### How radio waves travel

- Groups: T3A, T3B, T3C
- Gaps: fields and speed, HF range, multipath and picket fencing, absorption, and the named propagation modes and radio horizon
- Why together: Lab 07 already switches path pictures. The missing modes belong on that picture, not in a glossary.
- Mechanism: propagation visualization. Choose a band and a condition and see which path is available.

### Station wiring, interference, and measurements

- Groups: T4A, T4B, T7A, T7B, T7C
- Gaps: mobile power wiring, bonding, hotspots, keyers, AGC, RIT, scanning, code plugs, sensitivity and mixers, neighbor interference, and coax construction
- Why together: they are the station once the basic path exists.
- Mechanism: virtual radio plus a troubleshooting mission whose symptom is interference or a damaged cable, not another dark-radio case.

### Modes, satellites, and digital activities

- Groups: T8A, T8B, T8C, T8D
- Gaps: sideband choice, kilohertz bandwidths, fast-scan television, LEO and tracking, contests and grid locators, internet linking, FT8, PSK, DMR, NTSC, ARQ, mesh
- Why together: TC-05 already switches modes, builds a data path, and shows one pass. The missing items are the rest of that activity set.
- Mechanism: signal comparison for bandwidth and sideband, a deeper but still non-orbital satellite pass, and an activity chooser for contests, grids, and linking.

### Antennas, feed lines, and connectors

- Groups: T9A, T9B
- Gaps: beams, loading, mobile whips, dipole pattern, 50-ohm line, tuners, connector types, weather sealing, cable types
- Why together: TC-06 already assembles the path and aims an antenna.
- Mechanism: antenna and feed-line bench. Swap a short antenna, a beam, a tuner, and a connector and read the educational model.

### Safety beyond the first inspection

- Groups: T0A, T0B, T0C
- Gaps: AC wiring, fuse rating, lightning hardware, stored charge, tower awareness without a climb, non-ionizing radiation, and what an exposure evaluation is
- Why together: TC-08 already walks a site. These are the hazards that walk does not yet include.
- Mechanism: safety inspection and an exposure explanation that stays labeled as not a compliance calculator. No simulated climbing and no simulated work on a live tower.

## 17. What this audit does not say

Finishing Foundations and the eight Core labs does not mean the Technician syllabus has been taught. Group-level coverage is 0/35 complete, 34/35 partial, and 1/35 missing. That ratio is not exam readiness. Exam readiness was not built. General was not started.
