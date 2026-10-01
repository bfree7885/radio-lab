/* Final Technician gap checks. Each activity teaches, requires a decision, then assesses. */
(function (root) {
  var POWER_LINE_FEET = 10;

  function round(value, places) {
    var factor = Math.pow(10, places || 0);
    return Math.round(value * factor) / factor;
  }

  function fallClearsPowerLine(closestFeet, limitFeet) {
    var limit = limitFeet == null ? POWER_LINE_FEET : limitFeet;
    return {
      limitFeet: limit,
      closestFeet: closestFeet,
      safe: closestFeet > limit,
      rule: "If the antenna falls, no part of it can come within " + limit + " feet of the power wires.",
    };
  }

  function cwOnlyBand(mhz) {
    if (mhz >= 50 && mhz < 50.1) {
      return "50.0-50.1";
    }
    if (mhz >= 144 && mhz < 144.1) {
      return "144.0-144.1";
    }
    return null;
  }

  function emissionInCwOnlySegment(mhz, mode) {
    var band = cwOnlyBand(mhz);
    if (!band) {
      return { inSegment: false, band: null, allowed: null };
    }
    return { inSegment: true, band: band, allowed: mode === "CW" };
  }

  function messageSystem(need) {
    var table = {
      "callsign-email": "winlink",
      voice: "voice",
      aprs: "aprs",
      net: "net",
      "internet-email": "internet-email",
    };
    return table[need] || null;
  }

  function ionosphereSketch() {
    return {
      before: "linear",
      after: "elliptical",
      model: "educational",
      eitherPolarizationWorks: true,
      fadingCause: "different-paths",
    };
  }

  function polarizationFor(activity) {
    if (activity === "local-fm" || activity === "repeater") {
      return "vertical";
    }
    if (activity === "vhf-cw" || activity === "vhf-ssb") {
      return "horizontal";
    }
    return null;
  }

  function batteryHours(ampHours, averageAmps) {
    if (!(ampHours > 0) || !(averageAmps > 0)) {
      return null;
    }
    return round(ampHours / averageAmps, 2);
  }

  function mobileSupplyRating(watts) {
    if (watts !== 50) {
      return null;
    }
    return {
      volts: 13.8,
      amperes: 12,
      rfOnlyAmperes: round(watts / 13.8, 1),
    };
  }

  function stationConnection(part) {
    var table = {
      "rf-power-meter": "In the feed line, between the transmitter and the antenna.",
      "swr-meter": "In the feed line, and rated for the frequency and power you will measure.",
      "ft8-audio": "The radio's audio output and input connect to the audio input and output of a computer running FT8 software.",
      "interface-signals": "Receive audio, transmit audio, and transmitter keying.",
      "receive-audio": "Computer line in connects to the transceiver speaker connection.",
      bond: "Flat copper strap.",
    };
    return table[part] || null;
  }

  function fmReceive(offset) {
    if (offset === 0) {
      return { quality: "clear", description: "The voice is understandable." };
    }
    return { quality: "distorted", description: "The audio is distorted." };
  }

  function noiseBlankerFits(problem) {
    return problem === "impulse";
  }

  function amplifierSetting(radioMode) {
    if (radioMode === "SSB") {
      return "SSB";
    }
    if (radioMode === "CW" || radioMode === "FM") {
      return "CW-FM";
    }
    return null;
  }

  function amplifierResult(radioMode, setting) {
    var expected = amplifierSetting(radioMode);
    var matched = expected != null && setting === expected;
    return {
      expected: expected,
      matched: matched,
      note: matched
        ? "The switch sets the amplifier for proper operation in the mode the radio is using."
        : "That setting does not match the radio. The switch does not change the radio's mode or move it to another part of the band.",
    };
  }

  function interferenceRemedy(caseId) {
    if (caseId === "broadcast-fm") {
      return "band-reject";
    }
    if (caseId === "cable-tv") {
      return "connectors";
    }
    return null;
  }

  function dummyLoadMaterial(choice) {
    return choice === "noninductive-resistor-heatsink";
  }

  function meterOutcome(mode, measuring, powered) {
    if (mode === "resistance" && measuring === "voltage") {
      return { risk: true, label: "METER AT RISK", reason: "The meter is on resistance while you are trying to measure voltage." };
    }
    if (mode === "voltage" && measuring === "voltage") {
      return { risk: false, label: "SAFE MEASUREMENT", reason: "Voltage is measured on the voltage setting, across the source." };
    }
    if (mode === "resistance" && measuring === "resistance" && !powered) {
      return { risk: false, label: "SAFE MEASUREMENT", reason: "Resistance is measured with the circuit unpowered." };
    }
    return { risk: true, label: "METER AT RISK", reason: "That combination is not a safe measurement in this bench." };
  }

  function spinLevel(step) {
    var cycle = [4, 2, 1, 2];
    var index = ((step % cycle.length) + cycle.length) % cycle.length;
    return {
      step: step,
      level: cycle[index],
      model: "educational",
      cause: "rotation",
    };
  }

  function publishedSatelliteMode(satelliteId) {
    var table = { one: "SSB", two: "FM", three: "CW/data" };
    return table[satelliteId] || null;
  }

  function satelliteModeMatch(satelliteId, selected) {
    var published = publishedSatelliteMode(satelliteId);
    return { published: published, selected: selected, ok: published != null && selected === published };
  }

  function uplinkBalance(setting) {
    var beacon = 5;
    var own = setting;
    var relation = "low";
    if (Math.abs(own - beacon) <= 1) {
      relation = "matched";
    } else if (own > beacon) {
      relation = "high";
    }
    return { beacon: beacon, own: own, relation: relation, model: "educational" };
  }

  function shell(ctx, intro) {
    var wrap = document.createElement("div");
    var prompt = ctx.paragraph(intro || "");
    prompt.className = "challenge-prompt";
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    var choices = document.createElement("div");
    choices.className = "tune-pad";
    var note = ctx.feedbackNode();
    wrap.appendChild(prompt);
    wrap.appendChild(readout);
    wrap.appendChild(choices);
    wrap.appendChild(note);
    return { wrap: wrap, prompt: prompt, readout: readout, choices: choices, note: note };
  }

  function button(label, onClick) {
    var node = document.createElement("button");
    node.type = "button";
    node.textContent = label;
    node.addEventListener("click", onClick);
    return node;
  }

  function record(ctx, block, id, topicId) {
    if (ctx.recordExam) {
      ctx.recordExam(block, { id: id, topicId: topicId }, true);
    }
  }

  function finishGate(ctx, block, stageId, ui, message) {
    var api = root.RadioLabCore;
    if (api && api.finish) {
      if (api.finish(ctx, block, stageId, ui.note, message) === false) {
        ui.choices.appendChild(button("Record this check", function () {
          finishGate(ctx, block, stageId, ui, message);
        }));
      }
    } else {
      ui.note.textContent = message;
    }
  }

  function ask(ui, prompt, choices, onCorrect) {
    ui.prompt.textContent = prompt;
    ui.choices.textContent = "";
    choices.forEach(function (choice) {
      ui.choices.appendChild(button(choice.label, function () {
        ui.note.textContent = choice.why;
        if (choice.correct) {
          onCorrect();
        }
      }));
    });
  }

  function mountPowerLine(ctx, block, stageId) {
    var ui = shell(ctx, "Place the mast. The rule is about where a falling antenna would end up.");
    var tried = {};
    ui.readout.textContent = fallClearsPowerLine(18).rule + " The line at the top of each choice is the power wires. The number is how close a fall would bring the antenna.";
    [
      { id: "near", feet: 4, label: "Site A: a fall stops 4 feet from the wires" },
      { id: "edge", feet: 10, label: "Site B: a fall stops 10 feet from the wires" },
      { id: "clear", feet: 18, label: "Site C: a fall stops 18 feet from the wires" },
    ].forEach(function (site) {
      ui.choices.appendChild(button(site.label, function () {
        var row = fallClearsPowerLine(site.feet);
        tried[site.id] = true;
        ui.readout.textContent = "Power wires  |  " + site.feet + " ft to the fallen antenna. " +
          (row.safe ? "Outside the 10-foot distance." : "That fall comes within 10 feet of the wires.");
        ui.note.textContent = row.rule;
      }));
    });
    ui.choices.appendChild(button("I am placing the mast at the safe site", function () {
      if (!tried.near || !tried.edge || !tried.clear) {
        ui.note.textContent = "Open all three sites before you choose.";
        return;
      }
      ask(ui, "Which placement follows the rule?", [
        { label: "Site A, 4 feet", correct: false, why: "Four feet is within 10 feet of the wires." },
        { label: "Site B, 10 feet", correct: false, why: "Stopping 10 feet away still comes within 10 feet. The fallen antenna has to stay outside that distance." },
        { label: "Site C, 18 feet", correct: true, why: fallClearsPowerLine(18).rule },
      ], function () {
        record(ctx, block, "gap-t0b-distance", "T0B");
        finishGate(ctx, block, stageId, ui, "Site C keeps a falling antenna from coming within 10 feet of the power wires. This check does not teach you how to climb.");
      });
    }));
    return ui.wrap;
  }

  function mountCwOnly(ctx, block, stageId) {
    var ui = shell(ctx, "Two slices are CW only. Decide the emission, not just the band.");
    var seen = { six: false, two: false };
    var cases = [
      { id: "six-fm", mhz: 50.05, mode: "FM", label: "50.050 MHz, FM voice" },
      { id: "six-cw", mhz: 50.05, mode: "CW", label: "50.050 MHz, CW" },
      { id: "two-ssb", mhz: 144.05, mode: "SSB", label: "144.050 MHz, SSB voice" },
      { id: "two-cw", mhz: 144.05, mode: "CW", label: "144.050 MHz, CW" },
    ];
    cases.forEach(function (item) {
      ui.choices.appendChild(button(item.label, function () {
        var row = emissionInCwOnlySegment(item.mhz, item.mode);
        if (row.band === "50.0-50.1") {
          seen.six = true;
        }
        if (row.band === "144.0-144.1") {
          seen.two = true;
        }
        ui.readout.textContent = item.mhz + " MHz is in " + row.band + " MHz. " + item.mode +
          (row.allowed ? " is the emission this slice allows." : " is not allowed in this CW-only slice.");
        ui.note.textContent = row.allowed ? "CW can go here." : "Phone, including FM and SSB, does not belong in this slice.";
      }));
    });
    ui.choices.appendChild(button("I can apply both slices", function () {
      if (!seen.six || !seen.two) {
        ui.note.textContent = "Open a 50 MHz case and a 144 MHz case first.";
        return;
      }
      ask(ui, "A station wants SSB phone on 144.050 MHz. What is the decision?", [
        { label: "Allowed. Any voice mode is fine at the bottom of 2 meters.", correct: false, why: "144.0 to 144.1 MHz is CW only in this card." },
        { label: "Not allowed. That slice is CW only.", correct: true, why: "50.0–50.1 MHz and 144.0–144.1 MHz are the CW-only slices in this check." },
      ], function () {
        record(ctx, block, "gap-t1b-cw-only", "T1B");
        finishGate(ctx, block, stageId, ui, "Both slices are CW only. FM on 50.050 MHz and SSB on 144.050 MHz stay off. CW on those frequencies is the emission the slice allows.");
      });
    }));
    return ui.wrap;
  }

  function mountWinlink(ctx, block, stageId) {
    var ui = shell(ctx, "Pick the system that fits the job. Winlink is one of them, not all of them.");
    var needs = [
      { id: "callsign-email", label: "Move a message by radio, addressed like email with a call sign", system: "winlink" },
      { id: "voice", label: "Have a spoken conversation on a repeater", system: "voice" },
      { id: "aprs", label: "Beacon a position for other stations to see on a map", system: "aprs" },
      { id: "net", label: "Check in, in turn, on a directed voice net", system: "net" },
      { id: "internet-email", label: "Send a note from a regular mailbox with no radio in the path", system: "internet-email" },
    ];
    var opened = {};
    needs.forEach(function (need) {
      ui.choices.appendChild(button(need.label, function () {
        opened[need.id] = true;
        var names = {
          winlink: "Winlink. It relays messages using email-style addresses based on amateur call signs, over radio links where that is how the message moves.",
          voice: "Ordinary voice. Nobody is filing a message.",
          aprs: "APRS. That is a position and data beacon, not an email relay.",
          net: "A directed net. You speak when net control recognizes you.",
          "internet-email": "Ordinary internet email. A call sign in the address is what makes the amateur system different.",
        };
        ui.readout.textContent = names[need.system];
        ui.note.textContent = "This is the job, not a software installation.";
      }));
    });
    ui.choices.appendChild(button("Match the call-sign email job", function () {
      if (Object.keys(opened).length < needs.length) {
        ui.note.textContent = "Open every job before you choose.";
        return;
      }
      ask(ui, "Which system relays messages using email addresses based on amateur call signs?", [
        { label: "A directed voice net", correct: false, why: "A directed net is spoken traffic, not that email-style relay." },
        { label: "Winlink", correct: true, why: "Winlink is the amateur messaging system that uses call-sign email addresses and radio links." },
        { label: "Ordinary internet email", correct: false, why: "Ordinary email does not depend on an amateur call sign or a radio link." },
      ], function () {
        record(ctx, block, "gap-t2c-winlink", "T2C");
        finishGate(ctx, block, stageId, ui, "Winlink moves messages with call-sign email addresses. Voice, APRS, a directed net, and ordinary internet email are different jobs.");
      });
    }));
    return ui.wrap;
  }

  function mountPolarization(ctx, block, stageId) {
    var ui = shell(ctx, "Part A is one path through the ionosphere. The sketch is not a full physics model.");
    var sawEllipse = false;
    var sawPaths = false;
    ui.readout.textContent = "Start: the electric field is a straight vertical line. Press the path button.";
    ui.choices.appendChild(button("Send the wave through the simplified ionosphere", function () {
      sawEllipse = true;
      var sketch = ionosphereSketch();
      ui.readout.textContent = "After the path the field is no longer a single straight line. It is elliptical. Educational sketch only. Because of that, either a vertically or a horizontally polarized antenna can be used.";
      ui.note.textContent = "Elliptical polarization is the result of this path. It is not a promise about every contact.";
      if (sketch.after !== "elliptical") {
        ui.note.textContent = "The sketch did not load.";
      }
    }));
    ui.choices.appendChild(button("Why the ionospheric signal fades irregularly", function () {
      sawPaths = true;
      ui.readout.textContent = "Two copies of the signal arrive by different paths and combine. The combination changes as the paths change. That is a likely cause of the irregular fading.";
      ui.note.textContent = "The fading and the elliptical polarization are related ideas. They are not the same sentence.";
    }));
    ui.choices.appendChild(button("Part B: choose a polarization", function () {
      if (!sawEllipse || !sawPaths) {
        ui.note.textContent = "Open the ionospheric sketch and the fading note first.";
        return;
      }
      ui.choices.textContent = "";
      ui.choices.appendChild(button("Local FM repeater contact", function () {
        ui.readout.textContent = "Local FM and repeaters are commonly vertical. " + polarizationFor("local-fm") + ".";
      }));
      ui.choices.appendChild(button("Long-distance VHF CW", function () {
        ui.readout.textContent = "Long-distance CW and SSB on VHF and UHF commonly use horizontal polarization. " + polarizationFor("vhf-cw") + ".";
      }));
      ui.choices.appendChild(button("Long-distance UHF SSB", function () {
        ui.readout.textContent = "Same weak-signal convention: horizontal. " + polarizationFor("vhf-ssb") + ".";
      }));
      ui.choices.appendChild(button("Check both conventions", function () {
        ask(ui, "An ionospheric path has left the wave elliptically polarized. What follows?", [
          { label: "Only a horizontal antenna can hear it", correct: false, why: "Elliptical polarization means either a vertical or a horizontal antenna can be used." },
          { label: "Either a vertical or a horizontal antenna can be used", correct: true, why: "That is the result of the elliptical polarization. Irregular fading is the separate effect of signals arriving on different paths and combining." },
        ], function () {
          ask(ui, "Which polarization is the usual choice for long-distance VHF CW and SSB?", [
            { label: "Vertical, the same as the local repeater", correct: false, why: "The repeater convention is not the weak-signal convention." },
            { label: "Horizontal", correct: true, why: "Long-distance CW and SSB on VHF and UHF normally use horizontal polarization." },
          ], function () {
            record(ctx, block, "gap-t3a-polarization", "T3A");
            finishGate(ctx, block, stageId, ui, "Ionospheric paths can leave the wave elliptically polarized, so either antenna polarization can be used. Irregular fading fits signals combining from different paths. Long-distance VHF and UHF CW and SSB normally use horizontal polarization. Local FM repeaters are commonly vertical.");
          });
        });
      }));
    }));
    return ui.wrap;
  }

  function mountStationPower(ctx, block, stageId) {
    var ui = shell(ctx, "Two station-power problems. Use the relationships, do not memorize a single picture.");
    var supply = mobileSupplyRating(50);
    var hoursA = batteryHours(12, 2);
    var hoursB = batteryHours(7, 3.5);
    var sawSupply = false;
    var sawBattery = false;
    ui.choices.appendChild(button("50-watt FM mobile: what supply current?", function () {
      sawSupply = true;
      ui.readout.textContent = "50 watts divided by 13.8 volts is about " + supply.rfOnlyAmperes +
        " amperes if the radio were 100 percent efficient. It is not. An appropriate supply rating for this typical radio is " +
        supply.volts + " volts at " + supply.amperes + " amperes.";
    }));
    ui.choices.appendChild(button("12 ampere-hour battery, 2 ampere average draw", function () {
      sawBattery = true;
      ui.readout.textContent = "Time is ampere-hours divided by average current. 12 / 2 = " + hoursA + " hours.";
    }));
    ui.choices.appendChild(button("7 ampere-hour battery, 3.5 ampere average draw", function () {
      ui.readout.textContent = "7 / 3.5 = " + hoursB + " hours. Same relationship, different numbers.";
    }));
    ui.choices.appendChild(button("Answer both problems", function () {
      if (!sawSupply || !sawBattery) {
        ui.note.textContent = "Open the supply case and at least one battery case.";
        return;
      }
      ask(ui, "Which supply rating fits the typical 50-watt FM mobile?", [
        { label: "13.8 volts at 4 amperes, because 50 / 13.8 is about 4", correct: false, why: "That number ignores the radio's efficiency. The transmit current is higher." },
        { label: "13.8 volts at 12 amperes", correct: true, why: "The appropriate rating in this lab is 13.8 volts at 12 amperes." },
      ], function () {
        ask(ui, "How long will a 12 ampere-hour battery run a radio that draws 2 amperes on average?", [
          { label: "6 hours", correct: true, why: "Divide ampere-hours by average current. 12 / 2 = 6. The 7 ampere-hour battery at 3.5 amperes lasts 2 hours." },
          { label: "24 hours", correct: false, why: "Multiplying the two numbers is not the relationship." },
        ], function () {
          record(ctx, block, "gap-t4a-power", "T4A");
          finishGate(ctx, block, stageId, ui, "The 50-watt mobile needs a 13.8-volt supply that can deliver about 12 amperes. Battery time is ampere-hours divided by the average current.");
        });
      });
    }));
    return ui.wrap;
  }

  function mountStationConnect(ctx, block, stageId) {
    var ui = shell(ctx, "Place each piece in the station. One wrong slot does not finish the path.");
    var placed = {};
    var slots = [
      { id: "rf-power-meter", label: "Where does the RF power meter go?" },
      { id: "swr-meter", label: "What do you check before trusting an SWR meter?" },
      { id: "ft8-audio", label: "How does an FT8 station connect audio?" },
      { id: "interface-signals", label: "Which signals cross a computer-radio interface?" },
      { id: "receive-audio", label: "Where does receive audio enter the computer?" },
      { id: "bond", label: "Which conductor is preferred for an RF bond?" },
    ];
    slots.forEach(function (slot) {
      ui.choices.appendChild(button(slot.label, function () {
        placed[slot.id] = true;
        ui.readout.textContent = stationConnection(slot.id);
        ui.note.textContent = slot.label;
      }));
    });
    ui.choices.appendChild(button("The path is placed", function () {
      var missing = slots.some(function (slot) { return !placed[slot.id]; });
      if (missing) {
        ui.note.textContent = "Open every placement first.";
        return;
      }
      ask(ui, "The computer's line-in jack should connect to which radio connection for digital modes?", [
        { label: "The transceiver speaker connection, so receive audio reaches the computer", correct: true, why: "Receive audio goes from the radio's speaker connection to the computer's line in. Transmit audio and keying are the other interface signals. The RF power meter sits in the feed line. The bond is flat copper strap." },
        { label: "The antenna connector", correct: false, why: "The antenna connector is RF, not the audio interface." },
      ], function () {
        record(ctx, block, "gap-t4a-station", "T4A");
        finishGate(ctx, block, stageId, ui, "The meter is in the feed line and must be rated for the frequency and power. FT8 uses the computer's audio in and out. The interface carries receive audio, transmit audio, and keying. RF bonding prefers flat copper strap.");
      });
    }));
    return ui.wrap;
  }

  function mountFmTune(ctx, block, stageId) {
    var ui = shell(ctx, "Tune the simulated FM receiver. Read the audio description. There is no speaker in this lab.");
    var heard = { on: false, low: false, high: false };
    function tune(offset, name) {
      heard[name] = true;
      var row = fmReceive(offset);
      ui.readout.textContent = (offset === 0 ? "On frequency. " : "Slightly off frequency. ") + row.description;
    }
    ui.choices.appendChild(button("On frequency", function () { tune(0, "on"); }));
    ui.choices.appendChild(button("Slightly low", function () { tune(-1, "low"); }));
    ui.choices.appendChild(button("Slightly high", function () { tune(1, "high"); }));
    ui.choices.appendChild(button("Name the off-frequency result", function () {
      if (!heard.on || !heard.low || !heard.high) {
        ui.note.textContent = "Listen on frequency, slightly low, and slightly high.";
        return;
      }
      ask(ui, "The voice is distorted and the receiver is a little off the channel. What fits?", [
        { label: "The audio pitch went up, the way an SSB signal does", correct: false, why: "This FM check does not raise or lower the pitch. The audio becomes distorted." },
        { label: "The FM audio is distorted because the receiver is slightly off frequency", correct: true, why: "On frequency the voice is understandable. Slightly low or slightly high, it is distorted." },
      ], function () {
        record(ctx, block, "gap-t4b-fm", "T4B");
        finishGate(ctx, block, stageId, ui, "An FM signal received slightly off frequency has distorted audio. Centered on the channel, the voice is understandable.");
      });
    }));
    return ui.wrap;
  }

  function mountBlanker(ctx, block, stageId) {
    var ui = shell(ctx, "The noise blanker is for one kind of problem. Decide each case.");
    var cases = [
      { id: "impulse", label: "Short ignition-like pops", fit: true },
      { id: "voice", label: "Another station talking over you", fit: false },
      { id: "deviation", label: "Your own FM audio is too wide", fit: false },
    ];
    var opened = {};
    cases.forEach(function (item) {
      ui.choices.appendChild(button(item.label, function () {
        opened[item.id] = true;
        var fit = noiseBlankerFits(item.id);
        ui.readout.textContent = fit
          ? "The noise blanker can reduce those short pops. It is not a filter for a voice."
          : "Leave the noise blanker out of this repair. It does not remove another station or fix over-deviation.";
        ui.note.textContent = item.label;
      }));
    });
    ui.choices.appendChild(button("Choose the case that fits the blanker", function () {
      if (Object.keys(opened).length < cases.length) {
        ui.note.textContent = "Open every case, including the ones the blanker does not fix.";
        return;
      }
      ask(ui, "Which problem is the noise blanker for?", [
        { label: "Ignition-like impulse noise", correct: true, why: "Short pops are the job. Another station's voice, and over-deviation, need different fixes." },
        { label: "A station on the same frequency", correct: false, why: "The blanker is not a cure for another station." },
      ], function () {
        record(ctx, block, "gap-t4b-blanker", "T4B");
        finishGate(ctx, block, stageId, ui, "You had to reject the blanker for voice interference and for over-deviation, and use it for impulse noise.");
      });
    }));
    return ui.wrap;
  }

  function mountAmplifier(ctx, block, stageId) {
    var ui = shell(ctx, "The radio already has a mode. The amplifier switch has to match it.");
    var modes = ["SSB", "FM", "CW"];
    var tried = {};
    modes.forEach(function (mode) {
      ui.choices.appendChild(button("Radio is on " + mode, function () {
        var setting = amplifierSetting(mode);
        var right = amplifierResult(mode, setting);
        var wrongSetting = setting === "SSB" ? "CW-FM" : "SSB";
        var wrong = amplifierResult(mode, wrongSetting);
        tried[mode] = true;
        ui.readout.textContent = "Set the amplifier to " + setting + ". " + right.note + " If you pick " + wrongSetting + " instead: " + wrong.note;
      }));
    });
    ui.choices.appendChild(button("The switch is matched", function () {
      if (!tried.SSB || !tried.FM || !tried.CW) {
        ui.note.textContent = "Set the switch for SSB, FM, and CW.";
        return;
      }
      ask(ui, "What does the SSB / CW-FM switch on this VHF amplifier do?", [
        { label: "It changes the mode the radio is transmitting", correct: false, why: "The radio's mode stays what you set. The switch sets the amplifier." },
        { label: "It sets the amplifier for proper operation in the selected mode", correct: true, why: "SSB on the radio uses the SSB setting. CW and FM use the CW-FM setting." },
      ], function () {
        record(ctx, block, "gap-t7a-amp", "T7A");
        finishGate(ctx, block, stageId, ui, "Match the amplifier switch to the radio: SSB with SSB, and CW or FM with CW-FM. The switch does not retune the band or change the emission by itself.");
      });
    }));
    return ui.wrap;
  }

  function mountInterference(ctx, block, stageId) {
    var ui = shell(ctx, "Two interference reports. Pick the remedy that matches the evidence.");
    var sawBroadcast = false;
    var sawCable = false;
    ui.choices.appendChild(button("A nearby commercial FM broadcast is getting into the 2-meter receiver", function () {
      sawBroadcast = true;
      ui.readout.textContent = "The evidence is a strong broadcast transmitter on a nearby frequency, not a problem in your microphone. A band-reject filter can reduce that interference. A preamplifier would make the strong signal stronger.";
      ui.note.textContent = interferenceRemedy("broadcast-fm");
    }));
    ui.choices.appendChild(button("A neighbor's cable-TV picture breaks up when you transmit", function () {
      sawCable = true;
      ui.readout.textContent = "First step: be sure all of the TV feed-line connectors are installed properly. Do not start by adding a filter, and do not open the cable company's line.";
      ui.note.textContent = "Observe, then check the simple connector, then measure if it is still there.";
    }));
    ui.choices.appendChild(button("Choose the first cable-TV check", function () {
      if (!sawBroadcast || !sawCable) {
        ui.note.textContent = "Read both reports.";
        return;
      }
      ask(ui, "What is the first step for the cable-TV interference?", [
        { label: "Add a low-pass filter to the TV antenna input", correct: false, why: "The first check is the connectors, before you add hardware." },
        { label: "Make sure the TV feed-line connectors are installed properly", correct: true, why: "That is the simple check. The broadcast-FM case is different: a band-reject filter can reduce interference to the 2-meter radio." },
      ], function () {
        record(ctx, block, "gap-t7b-interference", "T7B");
        finishGate(ctx, block, stageId, ui, "Broadcast energy in the 2-meter receiver points at a band-reject filter. Cable-TV interference starts with the feed-line connectors. This is not a cable-system procedure.");
      });
    }));
    return ui.wrap;
  }

  function mountDummyLoad(ctx, block, stageId) {
    var ui = shell(ctx, "You already know a dummy load replaces the antenna for a test. What is it made of?");
    var sawLoad = false;
    var choices = [
      { id: "supply-relay", label: "A low-voltage supply and a relay", ok: false },
      { id: "noninductive-resistor-heatsink", label: "A 50-ohm non-inductive resistor on a heat sink", ok: true },
      { id: "inductive", label: "A 50-ohm inductive coil in a box", ok: false },
    ];
    choices.forEach(function (choice) {
      ui.choices.appendChild(button(choice.label, function () {
        var ok = dummyLoadMaterial(choice.id);
        if (ok) {
          sawLoad = true;
        }
        ui.readout.textContent = ok
          ? "That is the suitable part: a non-inductive resistor that can dump the heat. This is recognition, not a build."
          : "That is not the RF dummy load in this lab.";
        ui.note.textContent = choice.label;
      }));
    });
    ui.choices.appendChild(button("Select the suitable load", function () {
      if (!sawLoad) {
        ui.note.textContent = "Open the resistor choice before you select it.";
        return;
      }
      ask(ui, "Which description is a suitable RF dummy load?", [
        { label: "A 50-ohm non-inductive resistor mounted on a heat sink", correct: true, why: "The resistor takes the RF. The heat sink takes the heat. It is not an instruction to build a high-power load." },
        { label: "An antenna tuner set to bypass", correct: false, why: "A tuner is not the dummy load." },
      ], function () {
        record(ctx, block, "gap-t7c-dummy", "T7C");
        finishGate(ctx, block, stageId, ui, "A typical RF dummy load is a 50-ohm non-inductive resistor on a heat sink. You still use it in place of the antenna when you do not want to radiate.");
      });
    }));
    return ui.wrap;
  }

  function mountMeter(ctx, block, stageId) {
    var ui = shell(ctx, "This meter is a simulation. Set the mode, then the connection. Nothing here is energized on your bench.");
    var mode = "voltage";
    var sawRisk = false;
    var sawSafe = false;

    function apply(measuring, powered) {
      var row = meterOutcome(mode, measuring, powered);
      if (row.risk) {
        sawRisk = true;
      } else {
        sawSafe = true;
      }
      ui.readout.textContent = row.label + ". Mode " + mode + ". " + row.reason;
    }

    ui.choices.appendChild(button("Mode: voltage", function () {
      mode = "voltage";
      ui.note.textContent = "The meter is set to measure voltage.";
    }));
    ui.choices.appendChild(button("Mode: resistance", function () {
      mode = "resistance";
      ui.note.textContent = "The meter is set to measure resistance.";
    }));
    ui.choices.appendChild(button("Measure the live supply voltage", function () {
      apply("voltage", true);
    }));
    ui.choices.appendChild(button("Measure a resistor with power removed", function () {
      apply("resistance", false);
    }));
    ui.choices.appendChild(button("Record the safe and unsafe cases", function () {
      if (!sawRisk || !sawSafe) {
        ui.note.textContent = "Show one SAFE MEASUREMENT and one METER AT RISK result.";
        return;
      }
      ask(ui, "Which action can damage the multimeter?", [
        { label: "Trying to measure voltage while the meter is on the resistance setting", correct: true, why: "That is the misuse this bench marks METER AT RISK. Voltage belongs on the voltage setting. Resistance belongs on an unpowered part." },
        { label: "Measuring voltage on the voltage setting", correct: false, why: "That connection is the safe voltage measurement." },
      ], function () {
        record(ctx, block, "gap-t7d-meter", "T7D");
        finishGate(ctx, block, stageId, ui, "Measuring voltage on the resistance setting puts the meter at risk. Voltage mode across the supply, and resistance mode on an unpowered part, are the safe cases in this simulation.");
      });
    }));
    return ui.wrap;
  }

  function mountSatellite(ctx, block, stageId) {
    var ui = shell(ctx, "Three satellite checks. The fading picture is a simplified educational model.");
    var spinSeen = { high: false, low: false };
    var modesRead = {};
    var uplinkSeen = { low: false, high: false, matched: false };
    var phase = "spin";

    function showSpin() {
      ui.prompt.textContent = "Advance the rotation. Doppler is not changing in this picture.";
      ui.choices.textContent = "";
      var step = 0;
      function paint() {
        var row = spinLevel(step);
        if (row.level >= 4) {
          spinSeen.high = true;
        }
        if (row.level <= 1) {
          spinSeen.low = true;
        }
        ui.readout.textContent = "Rotation step " + step + ". Received level " + row.level + " of 4. The level rises and falls while the satellite turns. Educational model.";
      }
      paint();
      ui.choices.appendChild(button("Advance the rotation", function () {
        step += 1;
        paint();
      }));
      ui.choices.appendChild(button("Name the fading", function () {
        if (!spinSeen.high || !spinSeen.low) {
          ui.note.textContent = "Advance until the level has been strong and weak.";
          return;
        }
        ask(ui, "What is this periodic fading?", [
          { label: "Spin fading from the satellite and its antennas rotating", correct: true, why: "The orientation changes as the satellite rotates. This panel holds Doppler still so the two effects stay separate." },
          { label: "Doppler shift", correct: false, why: "Doppler moves the frequency. This picture is the level going up and down." },
        ], function () {
          phase = "mode";
          showModes();
        });
      }));
    }

    function showModes() {
      ui.prompt.textContent = "Read the published mode. Satellites do not all use one mode.";
      ui.choices.textContent = "";
      ["one", "two", "three"].forEach(function (id) {
        ui.choices.appendChild(button("Read satellite " + id, function () {
          modesRead[id] = true;
          ui.readout.textContent = "Satellite " + id + " publishes " + publishedSatelliteMode(id) + ". Use that mode. Do not assume the previous satellite.";
        }));
      });
      ui.choices.appendChild(button("Select the published mode for satellite two", function () {
        if (!modesRead.one || !modesRead.two || !modesRead.three) {
          ui.note.textContent = "Read all three published modes.";
          return;
        }
        var match = satelliteModeMatch("two", "FM");
        if (!match.ok) {
          ui.note.textContent = "The published mode did not match.";
          return;
        }
        ui.note.textContent = "Satellite two publishes FM. SSB would be the wrong assumption carried over from satellite one.";
        phase = "uplink";
        showUplink();
      }));
    }

    function showUplink() {
      ui.prompt.textContent = "Set uplink power so your downlink is about the same strength as the beacon.";
      ui.choices.textContent = "";
      [2, 5, 9].forEach(function (setting) {
        ui.choices.appendChild(button("Uplink setting " + setting, function () {
          var row = uplinkBalance(setting);
          uplinkSeen[row.relation] = true;
          ui.readout.textContent = "Beacon level " + row.beacon + ". Your downlink level " + row.own + ". " +
            (row.relation === "matched" ? "About the same." : row.relation === "high" ? "Your signal is stronger than the beacon." : "Your signal is weaker than the beacon.");
        }));
      });
      ui.choices.appendChild(button("The downlink matches the beacon", function () {
        if (!uplinkSeen.low || !uplinkSeen.high || !uplinkSeen.matched) {
          ui.note.textContent = "Try a low setting, a high setting, and the match.";
          return;
        }
        record(ctx, block, "gap-t8b-satellite", "T8B");
        finishGate(ctx, block, stageId, ui, "Spin fading comes from the satellite rotating. SSB, FM, and CW/data are all used; read the mode the satellite publishes. Set uplink power so your downlink is about as strong as the beacon, not far above it.");
      }));
    }

    showSpin();
    return ui.wrap;
  }

  function boot() {
    var api = root.RadioLabCore;
    if (!api || !api.register) {
      return;
    }
    api.register("power-line-site", mountPowerLine);
    api.register("cw-only-desk", mountCwOnly);
    api.register("winlink-choice", mountWinlink);
    api.register("polarization-lab", mountPolarization);
    api.register("station-power-problems", mountStationPower);
    api.register("station-connect", mountStationConnect);
    api.register("fm-offset-listen", mountFmTune);
    api.register("noise-blanker-cases", mountBlanker);
    api.register("amplifier-switch", mountAmplifier);
    api.register("interference-remedy", mountInterference);
    api.register("dummy-load-parts", mountDummyLoad);
    api.register("meter-risk", mountMeter);
    api.register("satellite-gaps", mountSatellite);
  }

  var api = {
    POWER_LINE_FEET: POWER_LINE_FEET,
    fallClearsPowerLine: fallClearsPowerLine,
    cwOnlyBand: cwOnlyBand,
    emissionInCwOnlySegment: emissionInCwOnlySegment,
    messageSystem: messageSystem,
    ionosphereSketch: ionosphereSketch,
    polarizationFor: polarizationFor,
    batteryHours: batteryHours,
    mobileSupplyRating: mobileSupplyRating,
    stationConnection: stationConnection,
    fmReceive: fmReceive,
    noiseBlankerFits: noiseBlankerFits,
    amplifierSetting: amplifierSetting,
    amplifierResult: amplifierResult,
    interferenceRemedy: interferenceRemedy,
    dummyLoadMaterial: dummyLoadMaterial,
    meterOutcome: meterOutcome,
    spinLevel: spinLevel,
    publishedSatelliteMode: publishedSatelliteMode,
    satelliteModeMatch: satelliteModeMatch,
    uplinkBalance: uplinkBalance,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.GapClosure = api;
  boot();
})(typeof window !== "undefined" ? window : globalThis);
