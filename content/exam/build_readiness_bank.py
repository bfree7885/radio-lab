"""Author the original Technician readiness bank. Not an official question import."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "content" / "exam" / "technician-readiness-v1.json"

REVIEW = {
    "T0A": ("tr-09", "do"),
    "T0B": ("tr-09", "close"),
    "T0C": ("tr-09", "do"),
    "T1A": ("tr-03", "do"),
    "T1B": ("tr-03", "close"),
    "T1C": ("tr-03", "do"),
    "T1D": ("tr-03", "do"),
    "T1E": ("tr-03", "do"),
    "T1F": ("tr-03", "do"),
    "T2A": ("tr-04", "do"),
    "T2B": ("tr-04", "do"),
    "T2C": ("tr-04", "close"),
    "T3A": ("tr-05", "close"),
    "T3B": ("tr-05", "do"),
    "T3C": ("tr-05", "do"),
    "T4A": ("tr-06", "close"),
    "T4B": ("tr-06", "close"),
    "T5A": ("tr-01", "do"),
    "T5B": ("tr-01", "do"),
    "T5C": ("tr-01", "do"),
    "T5D": ("tr-01", "do"),
    "T6A": ("tr-02", "do"),
    "T6B": ("tr-02", "do"),
    "T6C": ("tr-02", "see"),
    "T6D": ("tr-02", "do"),
    "T7A": ("tr-06", "close"),
    "T7B": ("tr-06", "close"),
    "T7C": ("tr-06", "close"),
    "T7D": ("tr-02", "close"),
    "T8A": ("tr-07", "do"),
    "T8B": ("tr-07", "close"),
    "T8C": ("tr-07", "do"),
    "T8D": ("tr-07", "do"),
    "T9A": ("tr-08", "do"),
    "T9B": ("tr-08", "do"),
}

FIGURES = {
    "T-1": "exam/sources/technician-2026-2030/diagrams/technician-diagram-t1.jpg",
    "T-2": "exam/sources/technician-2026-2030/diagrams/technician-diagram-t2.jpg",
    "T-3": "exam/sources/technician-2026-2030/diagrams/technician-diagram-t3.jpg",
}

ITEMS: list[tuple] = []


def add(group, concept, label, kind, stem, choices, correct, why, wrongs, stems, difficulty="core", figure=None, lessons=None):
    lab, stage = REVIEW[group]
    notes = []
    wrong_at = 0
    for index in range(len(choices)):
        if index == correct:
            notes.append("")
        else:
            notes.append(wrongs[wrong_at])
            wrong_at += 1
    item = {
        "id": f"rl-{group.lower()}-{concept}-{len([row for row in ITEMS if row['groupId'] == group]) + 1:02d}",
        "license": "technician",
        "pool": "2026-2030",
        "subelement": group[:2],
        "groupId": group,
        "conceptId": f"{group.lower()}-{concept}",
        "conceptLabel": label,
        "difficulty": difficulty,
        "type": kind,
        "sourceLessons": lessons or [lab],
        "alignsTo": stems,
        "stem": stem,
        "choices": choices,
        "correctIndex": correct,
        "explanation": why,
        "distractorNotes": notes,
        "review": {"labId": lab, "stageId": stage, "curriculumId": "technician-remediation"},
    }
    if figure:
        item["figure"] = {
            "id": figure,
            "src": FIGURES[figure],
            "alt": f"Official NCVEC Figure {figure}",
        }
        item["type"] = "figure"
    if not stems:
        item["syllabusTopic"] = "T4B topic text names the noise blanker. The February 19, 2026 pool has no numbered stem for it."
    ITEMS.append(item)


def gen(group, concept, label, generator, stems, lessons=None):
    lab, stage = REVIEW[group]
    ITEMS.append({
        "id": f"rl-gen-{generator}",
        "license": "technician",
        "pool": "2026-2030",
        "subelement": group[:2],
        "groupId": group,
        "conceptId": f"{group.lower()}-{concept}",
        "conceptLabel": label,
        "difficulty": "core",
        "type": "calculation",
        "generator": generator,
        "seedCount": 6,
        "sourceLessons": lessons or [lab],
        "alignsTo": stems,
        "review": {"labId": lab, "stageId": stage, "curriculumId": "technician-remediation"},
    })


# T1A
add("T1A", "purpose", "Purpose of the Amateur Service", "choice",
    "Which purpose fits the Amateur Radio Service?",
    ["Self-training, intercommunication, and technical investigation", "Selling broadcast time to local businesses", "Providing a paid telephone substitute", "Operating a commercial taxi dispatch system"],
    0, "The Amateur Service is for self-training, intercommunication, and technical investigation, without a pecuniary interest.",
    ["Broadcasting for hire is not the Amateur Service.", "A paid telephone service is not the Amateur Service.", "Commercial dispatch is not the Amateur Service."],
    ["T1A01"])
add("T1A", "fcc", "Who regulates the Amateur Service", "choice",
    "Which agency regulates and enforces Amateur Radio rules in the United States?",
    ["The Federal Communications Commission", "The National Weather Service", "A local frequency coordinator", "The amateur radio club trustee"],
    0, "The FCC regulates and enforces the Amateur Service in the United States.",
    ["The weather service forecasts weather. It does not grant amateur licenses.", "A coordinator recommends repeater pairs. The coordinator is not the regulator.", "A trustee holds a club station. The trustee is not the regulator."],
    ["T1A02"])
add("T1A", "beacon", "Where automatic beacons are found", "choice",
    "You want an automatically controlled propagation beacon. Where does the Technician reference place those beacons?",
    ["On 10 meters, between 28.200 and 28.300 MHz", "On the 2-meter calling frequency, 146.520 MHz", "Anywhere a Technician has phone privileges", "Only on a coordinated repeater output"],
    0, "Automatically controlled amateur propagation beacons in this pool are on 10 meters, from 28.200 to 28.300 MHz.",
    ["146.520 MHz is the FM simplex calling frequency, not the beacon segment.", "Phone privileges are not a beacon allocation.", "A repeater output is not the beacon segment."],
    ["T1A06"])
add("T1A", "races", "What else a RACES operator needs", "choice",
    "You have a new Technician license. A city official asks you to be the control operator of a RACES station tonight. What else is required?",
    ["Enrollment with the civil defense organization", "A vanity call sign", "A club trustee certificate", "Permission to use any Extra class frequency"],
    0, "A license is not enough for RACES. The operator also enrolls with the civil defense organization.",
    ["A vanity call is optional and does not enroll you.", "A club trustee certificate is a different station arrangement.", "RACES does not expand your frequency privileges."],
    ["T1A10"])

# T1B
add("T1B", "cw-only", "CW-only VHF and UHF segments", "decision",
    "A station wants to use SSB phone on 144.050 MHz. What is the decision?",
    ["Not allowed. 144.0 to 144.1 MHz is CW only", "Allowed, because all of 2 meters is phone", "Allowed, because SSB is a weak-signal mode", "Allowed above 50 MHz with no mode limits"],
    0, "144.0–144.1 MHz and 50.0–50.1 MHz are limited to CW. Phone, including SSB and FM, does not belong there.",
    ["2 meters is not all phone.", "A weak-signal mode still has to fit the segment.", "Bands above 50 MHz still have mode segments."],
    ["T1B07"])
add("T1B", "cw-six", "The 6-meter CW-only segment", "decision",
    "Is FM voice on 50.050 MHz inside the Technician privileges for that segment?",
    ["No. 50.0 to 50.1 MHz is CW only", "Yes. Any mode is allowed on 6 meters", "Yes, if the power stays under 200 watts PEP", "Yes, because 50.050 MHz is inside a phone sub-band"],
    0, "50.0–50.1 MHz is a CW-only segment. FM voice is not the emission that segment allows.",
    ["6 meters has a CW-only slice at the bottom.", "The HF power limit does not turn a CW segment into phone.", "50.050 MHz is inside the CW slice, not a phone sub-band."],
    ["T1B07"])
add("T1B", "hf-phone", "Technician HF phone privileges", "choice",
    "Where may a Technician use phone on HF, and at what power?",
    ["28.300 to 28.500 MHz, at 200 watts PEP", "Every HF band, at 1500 watts PEP", "7.200 MHz, at 200 watts PEP", "146.520 MHz only"],
    0, "Technician HF phone in this pool is the 10-meter segment 28.300–28.500 MHz, and the HF power limit is 200 watts PEP.",
    ["Technician HF privileges are not every band at 1500 watts.", "7.200 MHz is not a Technician phone privilege.", "146.520 MHz is a VHF calling frequency, not the HF phone segment."],
    ["T1B06", "T1B11"])
add("T1B", "iss", "Who may contact the ISS", "choice",
    "Who may contact the International Space Station on a VHF frequency?",
    ["Any amateur whose license gives that frequency privilege", "Only Extra class licensees", "Only stations enrolled in RACES", "Only the trustee of a club station"],
    0, "Any amateur station with the frequency privilege may contact the ISS. A space station is an amateur station more than 50 km above the Earth.",
    ["The contact is not limited to Extra class.", "RACES enrollment is a separate operating arrangement.", "A club trustee is not required for an ISS contact."],
    ["T1B02"])

# T1C
add("T1C", "term", "License term and grace period", "choice",
    "How long is a normal amateur license term, and what happens during the grace period after it expires?",
    ["Ten years. You may renew during the two-year grace period, and you may not transmit until the grant is renewed", "Five years, with transmitting allowed through the grace period", "Two years, then the call sign is reassigned the next day", "Ten years, and transmitting continues until the FCC sends a letter"],
    0, "The normal term is ten years. The grace period lets you renew without a new exam. It does not let you transmit.",
    ["The term is not five years, and the grace period is not permission to transmit.", "The term is not two years.", "An expired license does not keep transmitting authority during the grace period."],
    ["T1C08", "T1C09", "T1C11"])
add("T1C", "grant", "When you may first transmit", "choice",
    "You just passed the exam. When may you transmit?",
    ["When the FCC license grant shows in the license database", "The moment the exam session ends", "During the two-year grace period before any grant exists", "After a club trustee approves the session"],
    0, "You wait until the FCC grant appears in the license database. Passing the session is not itself the grant.",
    ["The end of the session is not the grant.", "A grace period applies after a license expires, not before the first grant.", "A trustee is not the person who creates your first grant."],
    ["T1C10"])
add("T1C", "group-d", "Group D call sign shape", "choice",
    "Which shape matches the Group D call sign format used for a sequential Technician grant?",
    ["Two letters, one digit, and three letters", "One letter, one digit, and two letters", "Three letters, one digit, and one letter", "A self-assigned tactical name"],
    0, "Group D is two letters, one digit, and three letters. You identify with the grant, not with a format you prefer.",
    ["That shorter shape is not Group D.", "That is not the Group D pattern.", "A tactical name does not replace the FCC call sign."],
    ["T1C05"])

# T1D
add("T1D", "music", "Music on a phone emission", "choice",
    "A friend asks you to play a song on phone. What is the rule?",
    ["Music is not permitted, except when it is incidental to an authorized retransmission of a space station", "Music is allowed on any simplex frequency", "Music is allowed if you identify every song", "Music is allowed below 30 MHz only"],
    0, "Phone music is prohibited except for incidental music in an authorized space-station retransmission.",
    ["Simplex does not authorize music.", "Identification does not authorize music.", "The HF boundary does not authorize music."],
    ["T1D04"])
add("T1D", "codes", "Transmissions that hide meaning", "choice",
    "Which transmission is encoded to obscure its meaning?",
    ["Scrambled speech meant to hide the meaning", "A plain-language schedule for a club picnic", "Your call sign in English", "A standard Q signal such as QRM"],
    0, "Messages encoded to hide the meaning are prohibited, with narrow exceptions that do not include casual scrambled speech.",
    ["A plain schedule is not obscured.", "A call sign in English is identification.", "A published Q signal is not a cipher."],
    ["T1D03"])
add("T1D", "broadcast", "What broadcasting means here", "choice",
    "Which activity fits the amateur rule against broadcasting?",
    ["Transmitting to the general public, rather than to a particular amateur station", "Calling CQ to any amateur who can hear you", "Sending a one-way beacon in the beacon segment", "Identifying your station at the end of a contact"],
    0, "Broadcasting, in this service, is a transmission intended for the general public rather than for particular amateur stations.",
    ["CQ is a call to other amateurs, not a broadcast to the public.", "A beacon in its segment is a recognized one-way transmission.", "Identification is required. It is not broadcasting."],
    ["T1D10"])

# T1E
add("T1E", "control-op", "A station needs a control operator", "choice",
    "When may an amateur station transmit with nobody responsible as control operator?",
    ["It may not. A control operator is required", "Whenever the radio is in automatic mode", "During the license grace period", "When a tactical name is used instead of a call sign"],
    0, "An amateur station may not transmit without a control operator.",
    ["Automatic control still has a control operator arrangement. It is not 'nobody responsible'.", "The grace period does not remove the control operator.", "A tactical name does not replace the control operator."],
    ["T1E01"])
add("T1E", "remote", "Remote control still has you as control operator", "choice",
    "You operate your home radio from a laptop elsewhere, over a control link. What kind of control is that?",
    ["Remote control, and you are still the control operator", "Automatic control, because a network is involved", "No control operator is required", "Third-party traffic, because you are not at home"],
    0, "Remote control means the control point is somewhere other than the radio. You remain the control operator.",
    ["A network path does not by itself make the station automatic.", "Someone is still the control operator.", "Being away from home is the remote-control fact, not the definition of third-party traffic."],
    ["T1E10"])
add("T1E", "automatic", "What automatic control means", "choice",
    "Which situation is automatic control?",
    ["A device operates the station under the rules without a person at the control point for each transmission", "You are sitting at the radio with the microphone in your hand", "You are at a distant control point, deciding each transmission", "A friend who is not licensed picks up the microphone"],
    0, "Automatic control is a station operating under the rules without a control operator present at a control point for each transmission.",
    ["That is local control.", "That is remote control.", "An unlicensed person on the microphone is not automatic control."],
    ["T1E08"])

# T1F
add("T1F", "identify", "When to identify", "choice",
    "You are using the tactical name Race Headquarters on a phone net. How do you identify?",
    ["With your FCC call sign in English, at least every 10 minutes and at the end", "With the tactical name alone for the whole net", "With a self-assigned indicator instead of any call sign", "Only at the beginning of the day"],
    0, "A tactical name does not replace the FCC call sign. Identify in English at least every 10 minutes during the communication and at the end.",
    ["The tactical name alone is not the required identification.", "A self-assigned indicator is not a substitute for the call sign.", "Identification is also required during the contact, not only at the start of the day."],
    ["T1F02", "T1F03"])
add("T1F", "repeater", "What a repeater station does", "choice",
    "What does a repeater station do?",
    ["It retransmits another amateur station's signal on a different channel at the same time", "It stores a message and forwards it the next day", "It assigns vanity call signs", "It coordinates band plans for the FCC"],
    0, "A repeater simultaneously retransmits another amateur station on a different channel.",
    ["Store-and-forward is a different kind of operation.", "Call signs come from the FCC, not from a repeater.", "Coordination is a recommendation service, not the definition of a repeater."],
    ["T1F09"])
add("T1F", "inspection", "When records must be available", "choice",
    "The FCC asks to inspect your station and its records. What do you do?",
    ["Make the station and its records available", "Offer the club call sign instead", "Wait for a two-week appointment before any response", "Identify with a tactical name and end the contact"],
    0, "The station licensee makes the station and its records available for inspection when the FCC asks.",
    ["Another call sign does not take the place of the inspection.", "The rule is availability, not a delay you invent.", "A tactical identification does not answer an inspection request."],
    ["T1F01"])

# T2A
add("T2A", "offset-2m", "2-meter repeater offset", "choice",
    "What is a common repeater offset on 2 meters?",
    ["600 kHz", "5 MHz", "100 Hz", "20 kHz"],
    0, "A common 2-meter repeater offset is 600 kHz, plus or minus.",
    ["5 MHz is the common 70-centimeter offset.", "100 Hz is not a repeater split.", "20 kHz is much smaller than the usual 2-meter split."],
    ["T2A01"])
add("T2A", "offset-70", "70-centimeter repeater offset", "choice",
    "What is a common repeater offset on 70 centimeters?",
    ["5 MHz", "600 kHz", "The same frequency, because 70 centimeters is simplex only", "28.300 MHz"],
    0, "A common 70-centimeter offset is 5 MHz.",
    ["600 kHz is the common 2-meter offset.", "70 centimeters uses repeaters. It is not simplex only.", "28.300 MHz is a 10-meter frequency, not an offset."],
    ["T2A03"])
add("T2A", "simplex", "Same frequency in both directions", "choice",
    "You are transmitting and receiving on 146.520 MHz. What is that called?",
    ["Simplex", "A plus offset", "Reverse split", "A linked repeater"],
    0, "Simplex means transmitting and receiving on the same frequency.",
    ["An offset means the input and output differ.", "Reverse swaps which side of a split you listen to.", "A linked repeater connects repeaters. It is not the name for one shared frequency."],
    ["T2A11"])
add("T2A", "calling", "2-meter FM calling frequency", "choice",
    "Which frequency is the national FM simplex calling frequency on 2 meters?",
    ["146.520 MHz", "144.050 MHz", "147.000 MHz plus 600 kHz", "28.400 MHz"],
    0, "146.520 MHz is the national 2-meter FM simplex calling frequency.",
    ["144.050 MHz is inside the CW-only segment.", "A repeater pair is not the simplex calling frequency.", "28.400 MHz is 10-meter phone."],
    ["T2A02"])

# T2B
add("T2B", "reverse", "What reverse does", "choice",
    "You can hear a repeater output, and you want to hear the station that is talking into it. Which control listens on the repeater input?",
    ["Reverse", "CTCSS encode only", "Scan", "RIT"],
    0, "Reverse listens on the input of the repeater pair so you can hear the other station directly.",
    ["A tone may be needed to access the repeater. It does not swap the frequency.", "Scan looks across channels. It does not listen on the input.", "RIT shifts the receiver a little for SSB. It is not the reverse function."],
    ["T2B01"])
add("T2B", "ctcss", "Sub-audible access tone", "choice",
    "The repeater output is strong, and your carrier does not open it. The listing shows a tone of 100.0 Hz. What is that tone for?",
    ["A sub-audible tone sent with your voice so the repeater squelch opens", "A 5 MHz transmit offset", "The color code of a DMR talkgroup", "A request to reverse the split"],
    0, "CTCSS is a sub-audible tone transmitted with the voice audio to open a receiver's squelch.",
    ["The offset is the frequency split, not the tone.", "A DMR color code is a digital access value, not a 100 Hz analog tone.", "Reverse changes which side you listen on."],
    ["T2B02"])
add("T2B", "q-signals", "QRM and QSY", "choice",
    "Another station's signal is covering the one you want. Which Q signal reports that interference, and which one says you are changing frequency?",
    ["QRM reports interference from other stations. QSY says you are changing frequency", "QSY reports interference. QRM says you are changing frequency", "Both mean the same thing: the repeater is linked", "QRM is a CTCSS tone and QSY is a DMR color code"],
    0, "QRM is interference from other stations. QSY means changing frequency.",
    ["Those meanings are swapped.", "Neither Q signal means a linked repeater.", "They are operating signals, not a tone or a color code."],
    ["T2B10", "T2B11"])

# T2C
add("T2C", "winlink", "Winlink call-sign email", "decision",
    "You need to move a message by radio, addressed like email with an amateur call sign. Which system fits?",
    ["Winlink", "An ordinary voice contact", "APRS position beacons", "A mailbox on the public internet with no radio in the path"],
    0, "Winlink relays messages using email addresses based on amateur call signs.",
    ["Voice is a conversation, not call-sign email.", "APRS beacons a position and short data. It is not that email system.", "Ordinary internet email does not use the amateur call-sign addressing this question is about."],
    ["T2C08"])
add("T2C", "net", "Directed net check-in", "choice",
    "You join a directed net. What is the usual practice?",
    ["Listen, then transmit when the net control asks for your traffic or check-in", "Call CQ on the net frequency until someone answers", "Transmit whenever the frequency is quiet for a second", "Send the message on a repeater input without checking in"],
    0, "On a directed net you follow the net control. You check in and pass traffic when asked.",
    ["CQ is how you seek a general contact, not how you enter a directed net.", "A short pause is not an invitation to transmit over the net.", "The net has a procedure. Skipping the check-in misses it."],
    ["T2C07"])
add("T2C", "ares", "What ARES is", "choice",
    "Which description fits the Amateur Radio Emergency Service?",
    ["ARES is amateur volunteers registered with ARRL for emergency communications", "ARES is the FCC license database", "ARES is a type of repeater offset", "ARES replaces Part 97 during any public event"],
    0, "ARES is the Amateur Radio Emergency Service, volunteers enrolled for emergency communications. Part 97 still applies.",
    ["The license database is the FCC's, not ARES.", "An offset is a frequency split.", "Part 97 still applies to amateur stations in an emergency, with specific emergency provisions. ARES does not repeal it."],
    ["T2C06"])
add("T2C", "preamble", "What a preamble carries", "choice",
    "A formal radiogram has a preamble. What belongs there?",
    ["The message number, precedence, handling notes, the station of origin, the check, the place, and the time", "Only the recipient's phone number", "The repeater offset and tone", "A recording of the sender's voice"],
    0, "The preamble carries the bookkeeping of a formal message: number, precedence, handling, origin, check, place, and time.",
    ["A phone number may be in the address, not the whole preamble.", "Offset and tone are repeater settings.", "A voice recording is not the preamble."],
    ["T2C10"])

# T3A
add("T3A", "horizontal", "Horizontal polarization for weak-signal VHF", "decision",
    "You are setting up for a long-distance VHF CW contact. Which polarization is the usual choice?",
    ["Horizontal", "Vertical, the same as the local repeater", "Either, because polarization does not matter on VHF", "Right-hand circular only"],
    0, "Long-distance CW and SSB on VHF and UHF normally use horizontal polarization. Local FM repeaters are commonly vertical.",
    ["The repeater convention is not the weak-signal convention.", "A polarization mismatch still weakens a line-of-sight signal.", "Circular polarization is not the usual choice for that CW contact."],
    ["T3A03"])
add("T3A", "elliptical", "Elliptical polarization after the ionosphere", "choice",
    "A signal has traveled through the ionosphere and is elliptically polarized. What follows for the antennas?",
    ["Either a vertical or a horizontal antenna can be used", "Only a horizontal antenna can hear it", "FM voice becomes unusable", "The two stations must use identical polarization or nothing is heard"],
    0, "Elliptical polarization means either a vertically or a horizontally polarized antenna can be used. This is not the cause of irregular fading.",
    ["Horizontal-only is the weak-signal convention, not the ionospheric result.", "The polarization result is about the antenna, not a ban on FM.", "The point of elliptical polarization is that a matched pair is not required."],
    ["T3A09"])
add("T3A", "fading", "Irregular ionospheric fading", "choice",
    "An HF signal propagated by the ionosphere fades irregularly. What is a likely cause?",
    ["Signals arriving by different paths combine, and the combination changes", "The wave became elliptical, and that ellipse is the fade", "The receiver is tuned slightly off an FM channel", "The satellite is rotating"],
    0, "Irregular ionospheric fading is a likely result of signals that arrive by different paths and combine. Elliptical polarization is a separate fact.",
    ["Elliptical polarization explains why either antenna polarization can work. It is not this fading cause.", "Off-frequency FM is a different receiving problem.", "Spin fading is a satellite effect."],
    ["T3A08"])
add("T3A", "picket", "Picket fencing", "choice",
    "A mobile VHF signal flutters as the vehicle moves a short distance. What is that flutter called?",
    ["Picket fencing, from multipath reflections", "F-region skip", "Spin fading", "Tropospheric ducting"],
    0, "Picket fencing is the rapid flutter from multipath, often heard on a moving VHF station.",
    ["F-region skip is an HF ionospheric path.", "Spin fading comes from a satellite rotating.", "Ducting can extend VHF range. It is not the name of that flutter."],
    ["T3A06"])

# T3B
add("T3B", "speed", "Speed of a radio wave in free space", "choice",
    "About how fast does a radio wave travel in free space?",
    ["300 million meters per second, the speed of light", "The speed of sound", "300 meters per second", "It depends on the license class of the operator"],
    0, "In free space, radio waves travel at the speed of light, about 300 million meters per second. Frequency does not change that speed.",
    ["Sound is much slower.", "300 meters per second is far too slow.", "The license class does not change the speed of the wave."],
    ["T3B04", "T3B11"])
add("T3B", "polarization", "What sets polarization", "choice",
    "Polarization describes which property of a radio wave?",
    ["The orientation of the electric field", "The power supply voltage", "The repeater offset", "The call sign of the transmitting station"],
    0, "Polarization is the orientation of the electric field.",
    ["Supply voltage is a station fact, not the wave's polarization.", "An offset is a frequency split.", "The call sign identifies the station. It does not define polarization."],
    ["T3B02"])
add("T3B", "vhf", "Which frequencies are VHF", "choice",
    "Which range is called VHF?",
    ["30 to 300 MHz", "3 to 30 MHz", "300 to 3000 MHz", "300 to 3000 kHz"],
    0, "VHF is 30 to 300 MHz. HF is 3 to 30 MHz. UHF is 300 to 3000 MHz.",
    ["That is HF.", "That is UHF.", "That span in kilohertz is not the VHF definition."],
    ["T3B08"])

# T3C
add("T3C", "horizon", "Why UHF simplex stops at the horizon", "choice",
    "Why are simplex UHF signals rarely heard beyond the radio horizon?",
    ["UHF waves usually travel line of sight, and the horizon blocks them", "UHF is absorbed by the F region every night", "UHF cannot pass through air", "A Technician license ends at the horizon"],
    0, "UHF and VHF are normally line-of-sight. The radio horizon, a bit past the visual horizon, is the usual limit.",
    ["The F region is an HF path, not a nightly UHF absorber.", "Air is not a wall for UHF.", "The license does not set a geographic horizon."],
    ["T3C01"])
add("T3C", "sporadic-e", "Sporadic E on 10, 6, and 2 meters", "choice",
    "Strong signals suddenly appear on 6 meters from far beyond the horizon, then fade. Which propagation fits?",
    ["Sporadic E", "A repeater linked by the internet", "Spin fading", "A dummy load on the far station"],
    0, "Sporadic E is the occasional strong beyond-horizon path associated with 10, 6, and 2 meters.",
    ["An internet link is not an ionospheric opening.", "Spin fading is a satellite effect.", "A dummy load is a test resistor, not a propagation path."],
    ["T3C04"])
add("T3C", "ducting", "What causes tropospheric ducting", "choice",
    "VHF signals are reaching a few hundred miles, day after day, along a weather boundary. What propagation is that?",
    ["Tropospheric ducting", "Meteor scatter", "F-region skip at noon on 160 meters", "Picket fencing"],
    0, "Tropospheric ducting can carry VHF and UHF well beyond the horizon, on the order of 300 miles, when the atmosphere forms a duct.",
    ["Meteor scatter is brief bursts from meteor trails.", "160 meters is not the band this VHF path is about.", "Picket fencing is short-range flutter."],
    ["T3C06", "T3C08"])

# T4A
add("T4A", "supply", "Current for a 50-watt mobile", "choice",
    "Which supply rating fits a typical 50-watt FM mobile?",
    ["13.8 volts at 12 amperes", "13.8 volts at 4 amperes, because 50 divided by 13.8 is about 4", "24 volts at 4 amperes", "120 volts at 1 ampere"],
    0, "The radio is not 100 percent efficient. A typical rating for this mobile is 13.8 volts at about 12 amperes, not the RF watts divided by 13.8.",
    ["That 4-ampere figure ignores the radio's efficiency.", "24 volts is not the usual mobile supply.", "120 volts is household AC, not the mobile DC connection."],
    ["T4A01"])
add("T4A", "meter", "Where the RF power meter goes", "choice",
    "An RF power meter is measuring transmitter output. Where does it belong in the station?",
    ["In the feed line, between the transmitter and the antenna", "Across the power supply output", "In parallel with the microphone plug", "In the vehicle's speaker wire"],
    0, "The RF power meter belongs in the feed line between the transmitter and the antenna. An SWR meter in that line also has to be rated for the frequency and power.",
    ["The supply output is DC, not the RF output.", "The microphone plug is audio.", "The speaker wire is receive audio, not transmitted RF."],
    ["T4A05", "T4A02"])
add("T4A", "interface", "Computer audio interface", "choice",
    "Which signals cross a computer-radio interface for digital modes?",
    ["Receive audio, transmit audio, and transmitter keying", "Only the antenna connector", "GPS location and DC power", "The repeater tone and the color code"],
    0, "The interface carries receive audio, transmit audio, and transmitter keying. FT8 uses the computer's audio in and out. Line-in connects to the radio's speaker connection.",
    ["The antenna connector is RF, not the audio interface.", "GPS and DC power are not the digital-mode audio interface.", "A tone and a color code are repeater access settings."],
    ["T4A06", "T4A07", "T4A04"])
add("T4A", "strap", "Flat strap for an RF bond", "choice",
    "Which conductor is preferred for bonding at RF?",
    ["Flat copper strap", "Coax braid removed from a cable", "A twisted pair from a telephone cord", "Copper-clad steel wire"],
    0, "Flat copper strap is the preferred RF bonding conductor.",
    ["Braid removed from coax is a poorer RF bond.", "Twisted pair is not the preferred RF bond.", "Copper-clad steel wire is not the preferred RF bond."],
    ["T4A08"])

# T4B
add("T4B", "fm-offset", "FM audio slightly off frequency", "choice",
    "An FM voice sounds distorted, and the receiver is a little off the channel. What fits?",
    ["The audio is distorted because the receiver is slightly off frequency", "The pitch rose, the way an SSB signal does when you are off frequency", "FM audio is unchanged until the signal disappears", "The noise blanker is removing the voice"],
    0, "On frequency, FM voice is understandable. Slightly off frequency, the audio becomes distorted. It does not shift pitch the way SSB does.",
    ["A pitch change is the SSB clue, not this FM result.", "The audio does change before the signal simply vanishes.", "The noise blanker is for impulse noise, not for this tuning error."],
    ["T4B04"])
add("T4B", "blanker", "When a noise blanker helps", "diagnosis",
    "The speaker is full of short ignition-like pops. Which control is meant for that problem?",
    ["The noise blanker", "More microphone gain", "A wider FM filter", "Reverse"],
    0, "The noise blanker is for short impulse noise. It does not remove another station's voice, and it does not fix over-deviation.",
    ["Microphone gain changes your transmitted audio.", "A wider filter passes more noise. It is not the blanker.", "Reverse listens on a repeater input."],
    [])
add("T4B", "blanker-no", "When not to use the noise blanker", "diagnosis",
    "Another station is talking on the same frequency as you. Will the noise blanker clear that voice?",
    ["No. The blanker is not a cure for another station", "Yes. It removes any unwanted voice", "Yes, if you switch it to CW-FM", "Yes, if the other station is using horizontal polarization"],
    0, "The noise blanker reduces ignition-like pops. Another station's voice needs a different response, such as changing frequency or waiting.",
    ["It does not strip a voice out of the channel.", "CW-FM is an amplifier-switch setting, not a blanker mode.", "Polarization does not decide whether the blanker fits."],
    [])
add("T4B", "rit", "RIT moves the receiver, not the transmitter", "choice",
    "An SSB station answers your CQ and the voice pitch sounds too high. Which control is the usual one to try?",
    ["Receiver incremental tuning (RIT)", "The repeater reverse control", "A DMR color code", "The noise blanker"],
    0, "RIT shifts the receiver a little so the voice pitch comes back without moving your transmit frequency off the contact.",
    ["Reverse is a repeater split control.", "A color code selects a digital repeater access value.", "The blanker is for impulse noise."],
    ["T4B06"])

# T5A
add("T5A", "ampere", "Current is measured in amperes", "choice",
    "Electrical current is measured in which unit?",
    ["Amperes", "Volts", "Ohms", "Farads"],
    0, "Current is amperes. Voltage is volts. Resistance is ohms. Capacitance is farads.",
    ["Volts measure electrical pressure.", "Ohms measure opposition to current.", "Farads measure capacitance."],
    ["T5A01"])
add("T5A", "watt", "Power is measured in watts", "choice",
    "Electrical power is measured in which unit?",
    ["Watts", "Amperes", "Henrys", "Hertz"],
    0, "Power is watts. It is the rate of energy use.",
    ["Amperes measure current.", "Henrys measure inductance.", "Hertz measure frequency."],
    ["T5A02"])
add("T5A", "current", "Current is electron flow", "choice",
    "What is the flow of electrons in a circuit called?",
    ["Current", "Resistance", "Capacitance", "Gain"],
    0, "Current is the flow of electrons. A difference in voltage causes that flow.",
    ["Resistance opposes the flow.", "Capacitance stores energy in an electric field.", "Gain is amplification."],
    ["T5A03"])

# T5B
add("T5B", "milli", "Milliamperes from amperes", "choice",
    "A circuit draws 2.2 amperes. How many milliamperes is that?",
    ["2200 milliamperes", "22 milliamperes", "0.22 milliamperes", "2.2 milliamperes"],
    0, "A milliampere is a thousandth of an ampere. 2.2 amperes is 2200 milliamperes.",
    ["That divides by 100 instead of multiplying by 1,000.", "That moves the prefix the wrong way.", "The numbers are equal only if you ignore the prefix."],
    ["T5B02"])
add("T5B", "db", "What plus 3 dB means", "choice",
    "A power change of about plus 3 dB means the power has become about how many times larger?",
    ["Twice", "Ten times", "Three times", "Half"],
    0, "About plus 3 dB doubles power. About plus 10 dB multiplies power by ten. About minus 3 dB cuts it in half.",
    ["Ten times is about plus 10 dB.", "The '3' is not a multiplication by three.", "Half would be about minus 3 dB."],
    ["T5B09"])
add("T5B", "micro", "A microvolt is a millionth of a volt", "choice",
    "One microvolt is which fraction of a volt?",
    ["One millionth of a volt", "One thousandth of a volt", "One thousand volts", "One million volts"],
    0, "Micro means one millionth. A microvolt is a millionth of a volt.",
    ["One thousandth is milli.", "One thousand volts would be a kilovolt.", "One million volts is not a microvolt."],
    ["T5B04"])

# T5C
add("T5C", "power", "Power is voltage times current", "choice",
    "Which relationship gives electrical power?",
    ["Voltage times current", "Voltage divided by resistance, then added to current", "Resistance times frequency", "Current divided by voltage"],
    0, "Power in watts is voltage times current.",
    ["That mixes two relationships.", "Resistance times frequency is not power.", "Current divided by voltage is not power."],
    ["T5C10"])
add("T5C", "capacitor", "A capacitor stores energy in an electric field", "choice",
    "Which component stores energy in an electric field?",
    ["A capacitor", "An inductor", "A fuse", "A resistor"],
    0, "A capacitor stores energy in an electric field. An inductor stores energy in a magnetic field.",
    ["An inductor stores energy in a magnetic field.", "A fuse opens a circuit when current is too high.", "A resistor turns electrical energy into heat. It is not the storage component."],
    ["T5C01"])
add("T5C", "frequency", "Frequency is cycles per second", "choice",
    "What does a frequency of 1 hertz mean?",
    ["One cycle per second", "One volt per second", "One ohm per meter", "One watt per hour"],
    0, "Frequency is cycles per second, measured in hertz.",
    ["Volts are electrical pressure.", "Ohms per meter is not frequency.", "Watts are power."],
    ["T5C05"])

# T5D
add("T5D", "series", "Series current is the same", "choice",
    "In which circuit is the current the same through every component?",
    ["A series circuit", "A parallel circuit", "An open circuit", "A dummy load used as an antenna"],
    0, "Series current is the same through each component. Parallel voltage is the same across each branch.",
    ["Parallel branches share current. The voltage is what they share.", "An open circuit has no current.", "A dummy load is a test resistor, not a circuit topology."],
    ["T5D13"])
add("T5D", "parallel", "Parallel voltage is the same", "choice",
    "In which circuit is the voltage the same across every branch?",
    ["A parallel circuit", "A series circuit", "A circuit with the fuse removed", "A feed line with infinite SWR only"],
    0, "Parallel components have the same voltage across them.",
    ["Series components share the current. Their voltages can differ.", "A removed fuse opens the circuit.", "SWR is a feed-line measurement, not the definition of parallel voltage."],
    ["T5D14"])
add("T5D", "ohm-check", "A remembered Ohm's law pair", "choice",
    "Two amperes flow through a 25-ohm resistor. What is the voltage across the resistor?",
    ["50 volts", "12.5 volts", "27 volts", "0.08 volts"],
    0, "Voltage equals current times resistance. 2 × 25 = 50 volts.",
    ["12.5 would be 25 divided by 2.", "27 adds the numbers.", "0.08 divides current by resistance."],
    ["T5D02"])

# T6A
add("T6A", "resistor", "A resistor opposes current", "choice",
    "Which component opposes the flow of current in a DC circuit?",
    ["A resistor", "An antenna", "A microphone", "A call sign"],
    0, "A resistor opposes current. Its value is in ohms.",
    ["An antenna radiates or receives. It is not the DC opposition component.", "A microphone turns sound into an electrical signal.", "A call sign identifies a station."],
    ["T6A01"])
add("T6A", "pot", "A potentiometer is a variable resistor", "choice",
    "Which part is often used as a volume control?",
    ["A potentiometer", "A fuse", "A fixed capacitor", "A light-emitting diode"],
    0, "A potentiometer is a variable resistor, often used as a volume control.",
    ["A fuse protects a circuit.", "A fixed capacitor does not give a volume adjustment.", "An LED is an indicator."],
    ["T6A02"])
add("T6A", "battery", "Which battery chemistry is rechargeable", "choice",
    "Which battery chemistry is rechargeable?",
    ["A nickel-metal hydride or lithium-ion pack", "A carbon-zinc cell", "An alkaline cell used as a primary battery", "A fuse rated in amperes"],
    0, "Nickel-metal hydride and lithium-ion cells are rechargeable. Carbon-zinc and ordinary alkaline cells are primary cells.",
    ["Carbon-zinc is a primary chemistry.", "An alkaline primary cell is not the rechargeable example.", "A fuse is not a battery."],
    ["T6A10"])

# T6B
add("T6B", "diode", "A diode conducts one way", "choice",
    "Which component lets current flow in only one direction?",
    ["A diode", "A resistor", "A fuse", "A potentiometer"],
    0, "A diode conducts one way. The electrodes are the anode and the cathode.",
    ["A resistor opposes current in either direction.", "A fuse opens on excess current. It is not a one-way conductor.", "A potentiometer is a variable resistor."],
    ["T6B02"])
add("T6B", "fet", "A FET has gate, drain, and source", "choice",
    "Which transistor has a gate, a drain, and a source?",
    ["A field-effect transistor", "A bipolar junction transistor", "A diode", "A relay"],
    0, "A FET uses gate, drain, and source. A bipolar transistor uses emitter, base, and collector.",
    ["A bipolar transistor uses emitter, base, and collector.", "A diode has an anode and a cathode.", "A relay is a switch operated by a coil."],
    ["T6B05"])
add("T6B", "gain", "Gain means amplification", "choice",
    "What does gain mean in an amplifier?",
    ["The amplifier makes the signal larger", "The amplifier identifies the station", "The amplifier changes a call sign into a grid square", "The amplifier measures SWR by itself"],
    0, "Gain means the output is larger than the input. Power gain is one form of that.",
    ["Identification is a station practice, not gain.", "A grid square is a location name.", "An SWR meter measures the match. Gain is amplification."],
    ["T6B11"])

# T6C
add("T6C", "schematic", "A schematic uses symbols", "choice",
    "What is a drawing that uses standard symbols for electrical parts called?",
    ["A schematic", "A band plan", "A radiogram preamble", "A color code"],
    0, "A schematic is the diagram of symbols. It shows the electrical jobs, not a photograph of the parts.",
    ["A band plan is a frequency agreement.", "A preamble is message bookkeeping.", "A color code is a digital access number or a wire color."],
    ["T6C01"], figure="T-1")
add("T6C", "zigzag", "The zigzag is a resistor", "figure",
    "On official Figure T-1, the zigzag in the line is which part?",
    ["A resistor", "A battery", "An antenna", "A microphone"],
    0, "The zigzag is the resistor. The battery is the stacked lines. The antenna symbol is the triangle on Figure T-3.",
    ["The battery is the stack of unequal lines.", "The antenna is the triangle on Figure T-3.", "A microphone is not that zigzag."],
    ["T6C02"], figure="T-1")
add("T6C", "antenna", "The triangle on Figure T-3", "figure",
    "On official Figure T-3, the triangle at the top of the drawing is which part?",
    ["An antenna", "A fuse", "A speaker", "A relay coil"],
    0, "The triangle on Figure T-3 is the antenna.",
    ["A fuse has its own symbol. It is not that triangle.", "A speaker is not the antenna triangle.", "A relay coil is a coil symbol."],
    ["T6C11"], figure="T-3")
add("T6C", "t2-transformer", "Figure T-2 coils are a transformer", "figure",
    "On official Figure T-2, component 4 is two coils side by side. Which part is that?",
    ["A transformer", "A fixed resistor", "An antenna", "A battery"],
    0, "The pair of coils is the transformer. A fixed resistor is a zigzag without an arrow.",
    ["A resistor is a zigzag.", "The antenna is the triangle on Figure T-3.", "The battery is the stacked lines on Figure T-1."],
    ["T6C09"], figure="T-2")
add("T6A", "t2-switch", "Figure T-2 break is a single on-off switch", "figure",
    "On official Figure T-2, component 3 is a simple break in the line. Which switch is that?",
    ["A single on-off switch", "A transformer", "A light-emitting diode", "A variable resistor"],
    0, "That break opens or closes one path. It is a single on-off switch. A switch with two throws would show two destinations.",
    ["The transformer is the pair of coils, component 4.", "The light-emitting diode is the diode with arrows, component 8.", "The variable resistor is the zigzag with an arrow, component 9."],
    ["T6A09"], figure="T-2")

# T6D
add("T6D", "rectifier", "A rectifier changes AC to pulses of one direction", "choice",
    "Which job does a rectifier do?",
    ["It changes alternating current into pulses of one direction", "It raises transmitter power by 10 dB", "It assigns a vanity call sign", "It measures SWR"],
    0, "A rectifier changes AC into pulses of one polarity. A following filter and regulator can turn that into a steadier DC supply.",
    ["A 10 dB change is a power ratio, not the rectifier's job.", "Call signs come from the FCC.", "An SWR meter measures the feed line."],
    ["T6D01"])
add("T6D", "relay", "A relay is a switched contact", "choice",
    "Which description fits a relay?",
    ["A switch operated by a coil", "A rechargeable battery chemistry", "A type of coaxial connector", "The preamble of a radiogram"],
    0, "A relay uses a coil to operate switch contacts.",
    ["Battery chemistry is not a relay.", "A connector joins cables.", "A preamble is message header information."],
    ["T6D02"])
add("T6D", "shield", "Shielded wire keeps energy in or out", "choice",
    "Why would you choose shielded wire?",
    ["To keep unwanted energy from getting in or out of the conductor", "To increase the license term", "To change USB into LSB", "To remove the need for a control operator"],
    0, "Shielding reduces coupling of unwanted energy into or out of the wire.",
    ["The license term is ten years regardless of the wire.", "Sideband selection is a mode choice.", "Shielding does not remove the control operator."],
    ["T6D03"])

# T7A
add("T7A", "sensitivity", "Sensitivity is hearing a weak signal", "choice",
    "Which word means a receiver can detect a weak signal?",
    ["Sensitivity", "Selectivity", "Offset", "Check"],
    0, "Sensitivity is the ability to detect a signal. Selectivity is the ability to separate signals.",
    ["Selectivity is discrimination between signals.", "Offset is a repeater split.", "The check is the word count in a formal message."],
    ["T7A01"])
add("T7A", "mixer", "A mixer changes frequency", "choice",
    "Which circuit converts a signal from one frequency to another?",
    ["A mixer", "A fuse", "A dummy load", "A noise blanker"],
    0, "A mixer combines signals to produce a new frequency.",
    ["A fuse protects against too much current.", "A dummy load absorbs RF in a test.", "A noise blanker reduces impulse noise."],
    ["T7A03"])
add("T7A", "amp-switch", "The VHF amplifier mode switch", "decision",
    "A VHF power amplifier has a switch marked SSB and CW-FM. The radio is on FM. What does the matching switch position do?",
    ["It sets the amplifier for proper operation in the selected mode", "It changes the radio from FM to SSB", "It moves the radio to a different part of the band", "It reduces received noise"],
    0, "The switch sets the amplifier for the mode the radio is already using. FM and CW use CW-FM. SSB uses SSB. The switch does not retune the radio.",
    ["The radio's mode stays what you set.", "The switch does not change the frequency range.", "Received noise is a receiver issue, not this switch."],
    ["T7A09"])
add("T7A", "transverter", "A transverter moves the radio to another band", "choice",
    "What can move the RF input and output of a transceiver to another band?",
    ["A transverter", "A noise blanker", "A Group D call sign", "A radiogram check"],
    0, "A transverter converts the transceiver's RF to another band.",
    ["A noise blanker is a receiver control.", "A call sign identifies a station.", "The check counts words in a message."],
    ["T7A06"])

# T7B
add("T7B", "deviation", "Over-deviation is too much FM swing", "diagnosis",
    "Listeners say your FM audio is loud and breaking up, and the signal is wider than it should be. What do you check first?",
    ["Microphone gain, because the radio is over-deviating", "A band-reject filter on a neighbor's television", "The satellite beacon level", "Whether the call sign is Group D"],
    0, "Too much microphone gain can over-deviate an FM transmitter. Turn the gain down.",
    ["A band-reject filter addresses a strong broadcast signal in your receiver.", "The beacon comparison is a satellite uplink check.", "Call sign format is not the cause of wide FM audio."],
    ["T7B01"])
add("T7B", "band-reject", "Band-reject filter for nearby broadcast FM", "diagnosis",
    "A strong nearby commercial FM broadcast is getting into your 2-meter receiver. Which part can reduce that interference?",
    ["A band-reject filter", "An RF preamplifier ahead of the receiver", "More microphone gain", "A noise blanker aimed at the broadcast voice"],
    0, "A band-reject filter can reduce interference from a nearby commercial FM station. A preamplifier would make the strong signal stronger.",
    ["A preamplifier strengthens signals, including the unwanted one.", "Microphone gain changes your transmitted audio.", "The noise blanker is for impulse noise, not a broadcast station."],
    ["T7B07"])
add("T7B", "cable", "First check for cable-TV interference", "next-step",
    "A neighbor's non-fiber cable-TV picture breaks up when you transmit. What is the first step?",
    ["Be sure all TV feed-line connectors are installed properly", "Add a low-pass filter to the TV antenna input", "Open the cable company's line and retune it", "Install a preamplifier on the television"],
    0, "The first step is the simple connector check. Do not start by adding filters, and do not open the cable company's line.",
    ["A filter is not the first step in this report.", "You do not interfere with the cable system.", "A preamplifier is not the first check."],
    ["T7B09"])

# T7C
add("T7C", "dummy-job", "Why a dummy load is used", "choice",
    "Why connect a dummy load when you test a transmitter?",
    ["So you can test without radiating a signal from an antenna", "So the transmitter can reach a satellite", "So the license term becomes ten years", "So the receiver hears weaker signals"],
    0, "A dummy load takes the transmitter output in place of the antenna, so the test does not radiate.",
    ["A dummy load is not an uplink path.", "The license term does not depend on the load.", "The load is on the transmitter test, not a receive preamplifier."],
    ["T7C01"])
add("T7C", "dummy-parts", "What a dummy load is made of", "choice",
    "Which parts make up a typical RF dummy load?",
    ["A 50-ohm non-inductive resistor on a heat sink", "A low-voltage supply and a relay", "A 50-ohm inductive coil in a box", "An antenna tuner set to bypass"],
    0, "A typical RF dummy load is a 50-ohm non-inductive resistor mounted on a heat sink. This is recognition, not a construction project.",
    ["A supply and a relay are not the load.", "An inductive coil is not the non-inductive resistor.", "A tuner does not replace the dummy load."],
    ["T7C03"])
add("T7C", "swr", "What 1 to 1 and 4 to 1 mean", "choice",
    "An SWR meter reads 4:1. What does that tell you, compared with 1:1?",
    ["1:1 is a match. 4:1 is a poor match, and many radios then reduce power", "4:1 is a perfect match", "1:1 means the feed line is open", "4:1 means the battery will last four hours"],
    0, "1:1 indicates a match. A high SWR such as 4:1 means a poor match, and solid-state radios often fold back power as SWR rises.",
    ["4:1 is not a perfect match.", "1:1 is a match, not an open line.", "SWR is not battery time."],
    ["T7C04", "T7C06"])

# T7D
add("T7D", "voltmeter", "A voltmeter connects across the part", "choice",
    "How do you connect a voltmeter to measure the voltage across a component?",
    ["In parallel with the component", "In series, so all the current flows through the meter", "Across the antenna connector while transmitting full power into the meter", "In place of the ground wire only"],
    0, "Voltage is measured in parallel, across the component. Current is measured in series.",
    ["Series connection is how you measure current.", "The antenna connector is not a voltmeter port.", "Removing the ground is not how a voltmeter is connected."],
    ["T7D02"])
add("T7D", "damage", "Resistance mode on a live voltage", "diagnosis",
    "Which action can damage a multimeter?",
    ["Trying to measure voltage while the meter is set to resistance", "Measuring voltage with the meter set to voltage, across the source", "Measuring an unpowered resistor on the resistance setting", "Reading a schematic before you touch the meter"],
    0, "Attempting to measure voltage on the resistance setting can damage the meter. Voltage belongs on the voltage setting. Resistance belongs on an unpowered part.",
    ["That is the safe voltage measurement.", "That is the safe resistance measurement.", "Reading a drawing does not stress the meter."],
    ["T7D06"])
add("T7D", "solder", "A cold joint looks dull and grainy", "choice",
    "What does a cold tin-lead solder joint look like?",
    ["Dull and grainy, rather than smooth and shiny", "A bright smooth fillet", "A length of flat copper strap", "A 50-ohm non-inductive resistor"],
    0, "A good tin-lead joint is smooth and shiny. A cold joint looks dull or grainy.",
    ["A bright smooth fillet is the good joint.", "Flat strap is an RF bonding conductor.", "The resistor is a dummy-load part, not a solder appearance."],
    ["T7D09"])

# T8A
add("T8A", "fm-repeater", "FM is the usual repeater voice mode", "choice",
    "Which voice mode is commonly used on VHF and UHF repeaters?",
    ["FM", "LSB on 160 meters", "Fast-scan television", "A radiogram preamble"],
    0, "FM is the usual voice mode on VHF and UHF repeaters. It is also common for VHF packet.",
    ["LSB is the lower-HF sideband convention, not the repeater voice mode.", "Fast-scan television is a wide picture emission.", "A preamble is message header text."],
    ["T8A04"])
add("T8A", "ssb-weak", "SSB for weak-signal VHF", "choice",
    "Which voice mode is often used for weak-signal VHF and UHF contacts?",
    ["SSB", "Wide FM through a local repeater", "AM broadcast", "DMR color code 1"],
    0, "SSB is the weak-signal voice mode on VHF and UHF. Those contacts normally use horizontal polarization.",
    ["Wide FM is the local repeater mode.", "AM broadcast is not the amateur weak-signal choice.", "A color code is a digital access setting, not the weak-signal voice mode."],
    ["T8A03"])
add("T8A", "usb", "USB above 10 meters", "choice",
    "Which sideband is normally used for SSB on 10 meters, VHF, and UHF?",
    ["Upper sideband", "Lower sideband", "Either, if the repeater offset is 600 kHz", "Neither. Those bands are CW only"],
    0, "USB is the normal sideband on 10 meters and on VHF and UHF SSB. LSB is the usual choice on 40 meters and below.",
    ["Lower sideband is the lower-HF convention.", "The offset does not choose the sideband.", "Those bands are not CW only."],
    ["T8A06"])
add("T8A", "bandwidth", "CW is narrower than FM", "choice",
    "Which emission usually occupies the narrowest bandwidth?",
    ["CW", "FM voice", "AM fast-scan television", "SSB voice"],
    0, "CW is the narrowest of these. SSB is a few kilohertz. FM voice is wider. Fast-scan television is very wide.",
    ["FM voice is wider than CW.", "Fast-scan television is the widest of these.", "SSB is wider than CW."],
    ["T8A05"])

# T8B
add("T8B", "spin", "Spin fading", "choice",
    "A satellite signal rises and falls in a regular way while Doppler is not the thing changing. What is that called?",
    ["Spin fading, from the satellite and its antennas rotating", "Picket fencing from a moving car", "F-region skip", "Over-deviation"],
    0, "Spin fading comes from rotation of the satellite and its antennas. Doppler is the frequency shift, not this level change.",
    ["Picket fencing is terrestrial multipath.", "F-region skip is an HF path.", "Over-deviation is an FM transmitter problem."],
    ["T8B09"])
add("T8B", "modes", "Satellites use more than one mode", "decision",
    "Three amateur satellites publish SSB, FM, and CW/data. Which conclusion fits?",
    ["Read the mode the satellite publishes. Satellites do not all use one mode", "Every satellite is FM, so ignore the published mode", "Every satellite is USB on 14.300 MHz", "A satellite contact does not need a mode"],
    0, "SSB, FM, and CW/data are all commonly used. Use the mode that satellite publishes.",
    ["FM is common. It is not universal.", "14.300 MHz is not a satellite rule.", "The contact still has a mode."],
    ["T8B04"])
add("T8B", "beacon", "Compare your downlink with the beacon", "decision",
    "You are setting uplink power into a linear transponder. How do you tell that your power is neither too low nor too high?",
    ["Your downlink should be about the same strength as the beacon", "Your downlink should be as strong as you can make it", "Turn the uplink up until the beacon disappears", "Match the uplink to a 1500-watt HF limit"],
    0, "Your signal on the downlink should be about the same strength as the beacon. Much stronger wastes the transponder and hurts other users.",
    ["Maximum strength is too much.", "Burying the beacon is the overload you are trying to avoid.", "The HF power limit is not the satellite uplink setting."],
    ["T8B12"])
add("T8B", "doppler", "Doppler raises the frequency on approach", "choice",
    "A LEO satellite is approaching. What does Doppler do to the received frequency?",
    ["The frequency sounds higher while the satellite approaches, then lower as it leaves", "The frequency stays fixed because LEO satellites do not move", "The frequency drops to audio", "The frequency becomes the repeater offset"],
    0, "Doppler shift raises the apparent frequency on approach and lowers it as the satellite leaves. LEO means a low Earth orbit, so the pass is short.",
    ["The satellite is moving. That motion is the Doppler.", "The RF carrier does not become audio.", "An offset is a repeater split, not Doppler."],
    ["T8B07"])

# T8C
add("T8C", "contest", "A contest is many contacts in a period", "choice",
    "Which activity asks you to contact as many stations as possible in a set time?",
    ["A contest", "A noise-blanker adjustment", "A license grace period", "A dummy-load test"],
    0, "A contest is an operating event built around many contacts in a limited time.",
    ["The blanker is a receiver control.", "The grace period is a license renewal window.", "A dummy load is a bench test."],
    ["T8C03"])
add("T8C", "grid", "A grid locator names a place", "choice",
    "In a VHF contact, what is a grid locator used for?",
    ["A compact name for a place on Earth, used in contacts and contests", "The FCC call sign database", "A DMR color code", "The SWR of a feed line"],
    0, "A grid locator identifies a location. Operators exchange them, especially in VHF work and contests.",
    ["The call sign database is the license record.", "A color code is digital repeater access.", "SWR is a match measurement."],
    ["T8C05"])
add("T8C", "irlp", "IRLP is reached with DTMF", "choice",
    "How do you reach an IRLP node over the air?",
    ["Send DTMF tones from the radio", "Mail a radiogram to the node", "Change the license class to Extra", "Connect a dummy load to the node"],
    0, "IRLP nodes are accessed over the air with DTMF. EchoLink, by contrast, checks a call sign before use.",
    ["A radiogram is formal traffic, not the IRLP access method.", "License class is not the access method.", "A dummy load does not connect you to a node."],
    ["T8C06"])

# T8D
add("T8D", "ft8", "FT8 is a digital mode", "choice",
    "Which description fits the FT8 mode?",
    ["A digital mode that exchanges structured messages with a computer", "A 600 kHz repeater offset", "A rechargeable battery chemistry", "A tower-climbing harness"],
    0, "FT8 is a digital mode. The station connects the radio's audio to a computer running the software.",
    ["600 kHz is a 2-meter offset.", "Battery chemistry is not a mode.", "A harness is safety gear."],
    ["T8D02"])
add("T8D", "aprs", "APRS can carry position", "choice",
    "Which data can APRS carry?",
    ["A station's position, along with short status or messages", "A continuous fast-scan television picture", "The text of Part 97", "A replacement for the FCC call sign"],
    0, "APRS commonly carries position and short related data for other stations to see.",
    ["Fast-scan television is a wide picture emission.", "APRS is not the rulebook.", "You still identify with your call sign."],
    ["T8D03"])
add("T8D", "arq", "ARQ asks for a repeat", "choice",
    "What does ARQ do in a digital contact?",
    ["It detects an error and asks for the data to be sent again", "It chooses horizontal polarization", "It sets a 5 MHz repeater offset", "It enrolls you in RACES"],
    0, "ARQ is automatic repeat request. The system asks for a retransmission when it finds an error.",
    ["Polarization is an antenna choice.", "The offset is a repeater split.", "RACES enrollment is a civil-defense step."],
    ["T8D11"])

# T9A
add("T9A", "dipole", "A dipole radiates broadside", "choice",
    "In which direction does a half-wave dipole radiate the strongest signal?",
    ["Broadside to the wire", "Off the ends of the wire", "Straight down the feed line only", "Only toward the north magnetic pole"],
    0, "A half-wave dipole radiates best broadside to the wire, not off the ends.",
    ["The ends are the weaker directions.", "The feed line is not the radiation direction.", "The pattern is about the wire, not the magnetic pole."],
    ["T9A10"])
add("T9A", "rubber-duck", "A short handheld antenna is a compromise", "choice",
    "What is a disadvantage of the short flexible antenna on a handheld, compared with a full-size quarter-wave?",
    ["It is less efficient, so the signal is weaker", "It raises the license power limit", "It converts FM into SSB", "It removes feed-line loss"],
    0, "A short rubber-duck antenna is a compromise. It is generally less efficient than a full-size quarter-wave.",
    ["The antenna does not change the license power limit.", "It does not change the emission mode.", "A short antenna does not remove feed-line loss."],
    ["T9A04"])
add("T9A", "loading", "A loading coil shortens an antenna", "choice",
    "What does a loading coil do for a mobile antenna?",
    ["It electrically lengthens an antenna that is physically short", "It measures SWR", "It identifies the station every 10 minutes", "It selects USB or LSB"],
    0, "A loading coil lets a physically short antenna resonate as if it were longer.",
    ["An SWR meter measures the match.", "Identification is an operating rule.", "Sideband choice is a mode decision."],
    ["T9A02"])

# T9B
add("T9B", "impedance", "Amateur coax is usually 50 ohms", "choice",
    "What is the most common impedance of coaxial cable used in amateur stations?",
    ["50 ohms", "300 ohms", "600 ohms", "12 ohms"],
    0, "Amateur coaxial feed line is usually 50 ohms.",
    ["300 ohms is a common twin-lead value, not the usual coax.", "600 ohms is a ladder-line neighborhood, not the usual coax.", "12 ohms is not the standard amateur coax impedance."],
    ["T9B02"])
add("T9B", "loss", "Loss rises with frequency and length", "choice",
    "What happens to loss in coaxial cable as the frequency goes up?",
    ["Loss increases", "Loss falls to zero", "Loss is unchanged at any frequency", "Loss becomes the license power limit"],
    0, "Coax loss increases as frequency increases. A longer cable also loses more. RG-58 loses more than larger cable such as RG-213 at the same frequency.",
    ["Loss does not disappear.", "Frequency does change the loss.", "The power limit is a license rule, not a cable loss."],
    ["T9B05"])
add("T9B", "tuner", "A tuner does not reduce feed-line loss", "choice",
    "What is the main job of an antenna tuner?",
    ["To present a match the transmitter will accept", "To make a lossy feed line lossless", "To increase the legal power limit", "To change a CW segment into a phone segment"],
    0, "A tuner matches the transmitter to the load it sees. It does not remove loss in the feed line, and it does not change the license.",
    ["Loss in the cable is still loss.", "The power limit is set by the license.", "A tuner does not rewrite the band plan."],
    ["T9B04"])
add("T9B", "connector", "N connectors above 400 MHz", "choice",
    "Which connector is the better RF choice above 400 MHz?",
    ["A type N connector", "A PL-259 left loose so it can drip", "An unshielded twisted pair", "A microphone plug"],
    0, "Type N connectors are the usual choice above 400 MHz. A PL-259 is common at lower frequencies and should be kept weather-tight outdoors.",
    ["A loose connector is a water path, not a better RF joint.", "Twisted pair is not a constant-impedance RF connector.", "A microphone plug is audio."],
    ["T9B06"])

# T0A
add("T0A", "shock", "Current through the body is the hazard", "choice",
    "What injures a person in an electrical shock?",
    ["Current flowing through the body", "The color of the wire insulation by itself", "The call sign printed on the radio", "A low SWR reading"],
    0, "Shock injury comes from current through the body. Even a 12-volt system can be dangerous in the wrong conditions, and higher voltages are more able to push that current.",
    ["Insulation color identifies a conductor. The color itself is not the injury.", "The call sign does not shock anyone.", "SWR is a match reading."],
    ["T0A02"])
add("T0A", "fuse", "Do not replace a fuse with a larger one", "choice",
    "Why should a 5-ampere fuse not be replaced with a 20-ampere fuse?",
    ["The larger fuse may not open before the wiring overheats", "The larger fuse lowers the station's SWR", "The larger fuse changes USB to LSB", "The larger fuse extends the license term"],
    0, "A fuse protects the wiring. A much larger fuse can let damaging current flow.",
    ["SWR is not set by the fuse rating.", "Sideband is not set by the fuse.", "The license term is not set by the fuse."],
    ["T0A05"])
add("T0A", "black", "Black wire in US 120-volt cable", "choice",
    "In a US three-wire 120-volt cable, what does black insulation usually indicate?",
    ["The hot conductor", "The safety ground", "The antenna", "The neutral only, in every country"],
    0, "In US house wiring, black is the hot conductor, white is neutral, and green or bare is the equipment ground. The fuse belongs in the hot side.",
    ["Safety ground is green or bare.", "The antenna is not the black house wire.", "Neutral is white in this US convention, and the convention is not universal."],
    ["T0A03"])

# T0B
add("T0B", "distance", "Ten feet from a power line", "decision",
    "You are placing a mast near a power line. A fall at one site would stop 4 feet from the wires, another would stop at 10 feet, and a third would stop at 18 feet. Which site follows the rule?",
    ["The 18-foot site, so no part of a falling antenna comes within 10 feet of the wires", "The 4-foot site, because the mast is still on your property", "The 10-foot site, because 10 feet is close enough", "Any site, if you climb the tower alone"],
    0, "If the antenna falls, no part of it may come within 10 feet of the power wires. Four feet and ten feet both fail that test. This check is not a climbing lesson.",
    ["Property lines do not replace the 10-foot fall clearance.", "Stopping at 10 feet still comes within 10 feet.", "Climbing alone is a separate hazard, and it does not fix the power-line distance."],
    ["T0B06"])
add("T0B", "pole", "Do not use a utility pole as an antenna support", "choice",
    "What is the hazard in using a utility pole as an antenna support?",
    ["The pole carries power wiring, and the antenna can contact it", "Utility poles are required antenna supports", "The pole cancels feed-line loss", "The pole extends a Technician license to Extra privileges"],
    0, "A utility pole is not an antenna support. The wires on it are the hazard.",
    ["They are not required supports.", "A pole does not remove cable loss.", "A pole does not change the license."],
    ["T0B09"])
add("T0B", "crank", "Lower a crank-up tower before climbing", "choice",
    "What is the safety rule for climbing a crank-up tower?",
    ["Do not climb it unless it is retracted or the safety locks are in place", "Climb it fully extended so you can reach farther", "Climb it alone so nobody is in the way", "Paint it before every climb and skip the ground"],
    0, "A crank-up tower is climbed only when it is retracted or mechanically locked. You do not climb alone.",
    ["Climbing it extended is the hazard.", "Climbing alone removes the person who could help.", "Paint and an ungrounded tower are not the climbing rule."],
    ["T0B07"])

# T0C
add("T0C", "exposure", "Exposure depends on power, distance, and duty cycle", "choice",
    "Which factors affect RF exposure near an amateur antenna?",
    ["Power, distance, frequency, and duty cycle", "Only the color of the coaxial jacket", "Only the operator's call sign group", "Only the repeater offset"],
    0, "Exposure depends on power, distance, frequency, and how much of the time you are transmitting. The exposure bench is an educational model, not an MPE certificate.",
    ["Jacket color does not set exposure.", "The call sign format does not set exposure.", "The offset does not set exposure."],
    ["T0C04"])
add("T0C", "duty", "A lower duty cycle lowers average exposure", "choice",
    "If the duty cycle drops from 100 percent to 50 percent, and nothing else changes, what happens to the average exposure?",
    ["It is about half", "It doubles", "It becomes ionizing radiation", "It is unchanged because duty cycle is not an exposure factor"],
    0, "Average exposure follows the fraction of time you transmit. Half the duty cycle is about half the average, for the same power.",
    ["Less transmitting does not increase the average.", "RF from the station is non-ionizing. Duty cycle does not make it radioactive.", "Duty cycle is one of the exposure factors."],
    ["T0C03", "T0C10"])
add("T0C", "burn", "Touching an antenna while transmitting", "choice",
    "What hazard comes from touching an antenna while it is transmitting?",
    ["An RF burn", "A change in the license term", "A lower SWR", "A new Group D call sign"],
    0, "Touching an antenna during transmission can cause an RF burn.",
    ["The license term does not change.", "Touching the antenna is not an SWR adjustment.", "Call signs are not assigned by touching an antenna."],
    ["T0C07"])

gen("T5D", "ohm-v", "Voltage from current and resistance", "ohms-voltage", ["T5D01", "T5D02", "T5D10"])
gen("T5D", "ohm-i", "Current from voltage and resistance", "ohms-current", ["T5D01", "T5D04"])
gen("T5C", "power-vi", "Power from voltage and current", "power-product", ["T5C10"])
gen("T5D", "series-r", "Series resistors add", "series-resistance", ["T5D13"])
gen("T5D", "parallel-r", "Parallel resistors combine by product over sum", "parallel-resistance", ["T5D14"])
gen("T5B", "hz-units", "Kilohertz and megahertz", "frequency-units", ["T5B07"])
gen("T3B", "wavelength", "Wavelength from frequency", "wavelength", ["T3B06"])
gen("T4A", "battery", "Battery time from ampere-hours and current", "battery-time", ["T4A09"])
gen("T5B", "db-power", "Decibel power ratios", "decibels", ["T5B09", "T5B10"])

# Generator ids collided because gen() uses generator name only once. Good.
# Static ids are unique per group count. Generator ids are rl-gen-name. Check duplicates.

ids = [item["id"] for item in ITEMS]
if len(ids) != len(set(ids)):
    raise SystemExit(f"duplicate ids: {[i for i in ids if ids.count(i) > 1]}")

bank = {
    "schemaVersion": 1,
    "id": "radio-lab-technician-readiness-v1",
    "label": "RADIO LAB PRACTICE",
    "mockLabel": "RADIO LAB MOCK EXAM",
    "license": "technician",
    "pool": "2026-2030",
    "note": "Original Radio Lab questions for retrieval practice. Official stem ids are alignment metadata. These are not FCC or NCVEC questions, and the official answer choices are not included.",
    "questions": ITEMS,
}
OUT.write_text(json.dumps(bank, indent=2) + "\n", encoding="utf-8")
print(f"wrote {len(ITEMS)} entries")
from collections import Counter
print(Counter(item["groupId"] for item in ITEMS))
