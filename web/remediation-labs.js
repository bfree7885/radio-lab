/* TR-04 through TR-06 activities. Register before the core lab render callback runs. */
(function (root) {
  var api = root.RadioLabCore;
  var sim = root.RemediationSim;
  if (!api || !sim) {
    return;
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

  function khzLabel(khz) {
    return sim.round(khz / 1000, 3) + " MHz";
  }

  function runScenario(ctx, block, stageId) {
    var name = (block.config && block.config.scenario) || "";
    var ui = shell(ctx, "Loading the operating sequence.");
    var state = sim.initScenario(name);
    if (!state) {
      ui.prompt.textContent = "This operating sequence is not available.";
      return ui.wrap;
    }
    var index = 0;

    function show() {
      var scenario = sim.scenario(name);
      var step = scenario.steps[index];
      ui.choices.textContent = "";
      if (!step) {
        ui.prompt.textContent = block.config.doneText || scenario.title + " is complete.";
        ui.readout.textContent = scenario.title + ". " + scenario.steps.length + " steps.";
        if (api.finish(ctx, block, stageId, ui.note, ui.prompt.textContent) === false) {
          ui.choices.appendChild(button("Record this sequence", show));
        }
        return;
      }
      ui.prompt.textContent = "Step " + (index + 1) + " of " + scenario.steps.length + ". " + step.prompt;
      ui.readout.textContent = step.readout;
      step.choices.forEach(function (choice) {
        ui.choices.appendChild(button(choice.label, function () {
          var result = sim.stepScenario(name, index, choice.id);
          ui.note.textContent = result.why;
          if (!result.accepted) {
            return;
          }
          index = result.index;
          show();
        }));
      });
    }

    show();
    return ui.wrap;
  }

  api.register("operating-sequence", runScenario);

  api.register("repeater-panel", function (ctx, block, stageId) {
    var ui = shell(ctx, "Set a repeater. The offset shown is a common United States example, not a worldwide rule.");
    var band = "2m";
    var direction = "minus";
    var reverse = false;
    var output = { "2m": 146940, "70cm": 442100 };
    var seen = { "2m": false, "70cm": false, reverse: false };
    var purposeOk = false;

    function plan() {
      return sim.repeaterPlan(band, output[band], direction, reverse);
    }

    function paint() {
      var row = plan();
      seen[band] = true;
      if (reverse) {
        seen.reverse = true;
      }
      ui.readout.textContent = [
        row.note,
        "Output (repeater transmit) " + khzLabel(row.outputKhz) + ".",
        "Offset " + (row.offsetKhz > 0 ? "+" : "") + row.offsetLabel + " → input " + khzLabel(row.inputKhz) + ".",
        reverse ? "REVERSE: you are listening on the input " + khzLabel(row.listenKhz) + " and would transmit on " + khzLabel(row.transmitKhz) + "." : "Normal: you listen on " + khzLabel(row.listenKhz) + " and transmit on " + khzLabel(row.transmitKhz) + ".",
      ].join(" ");
    }

    function controls() {
      ui.choices.textContent = "";
      ui.choices.appendChild(button("2 meters", function () {
        band = "2m";
        paint();
      }));
      ui.choices.appendChild(button("70 centimeters", function () {
        band = "70cm";
        paint();
      }));
      ui.choices.appendChild(button("Minus offset", function () {
        direction = "minus";
        paint();
      }));
      ui.choices.appendChild(button("Plus offset", function () {
        direction = "plus";
        paint();
      }));
      ui.choices.appendChild(button(reverse ? "Return to normal" : "Use reverse", function () {
        reverse = !reverse;
        paint();
      }));
      ui.choices.appendChild(button("Reverse lets me hear the input", function () {
        if (!seen.reverse || !seen["2m"] || !seen["70cm"]) {
          ui.note.textContent = "Try both bands and turn reverse on before you answer.";
          return;
        }
        purposeOk = true;
        ui.note.textContent = "Reverse listens on the repeater input. You can hear a station that is not quite opening the machine, or check whether you could work them directly.";
        api.finish(ctx, block, stageId, ui.note, "You configured 2-meter and 70-centimeter offsets and used reverse.");
      }));
      ui.choices.appendChild(button("Reverse raises my power", function () {
        ui.note.textContent = "Reverse does not add power. It swaps which side of the pair you listen to.";
      }));
    }

    paint();
    controls();
    return ui.wrap;
  });

  api.register("dtmf-pad", function (ctx, block, stageId) {
    var ui = shell(ctx, "Press a key. DTMF sends two tones at the same time. CTCSS is the access tone that rides along with your voice.");
    var pressed = false;
    "123456789*0#".split("").forEach(function (key) {
      ui.choices.appendChild(button(key, function () {
        var tone = sim.dtmf(key);
        pressed = true;
        ui.readout.textContent = "Key " + key + " is " + tone.lowHz + " Hz and " + tone.highHz + " Hz together. That pair is DTMF, used for commands such as a repeater link control. It is not the CTCSS tone that opens the squelch.";
      }));
    });
    ui.choices.appendChild(button("This is an access tone that stays on with my voice", function () {
      ui.note.textContent = "That description is CTCSS, a low tone under the voice. DTMF is a short pair of tones, like a keypad command.";
    }));
    ui.choices.appendChild(button("This keypad sends a command, not the squelch tone", function () {
      if (!pressed) {
        ui.note.textContent = "Press a key first so you can see the two tones.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "DTMF is two tones at once. CTCSS is the separate access tone.");
    }));
    return ui.wrap;
  });

  api.register("dmr-setup", function (ctx, block, stageId) {
    var ui = shell(ctx, "A DMR radio can be on the right frequency and still be in the wrong conversation. This is not a programming app.");
    var frequency = false;
    var talkgroup = false;
    var color = false;
    ui.readout.textContent = "Frequency not confirmed. Talkgroup not selected. Color code not selected. A code plug is the file of these settings, not the repeater itself.";
    function paint() {
      ui.readout.textContent = [
        frequency ? "Frequency set." : "Frequency not confirmed.",
        talkgroup ? "Talkgroup selected." : "No talkgroup.",
        color ? "Color code matches this repeater." : "Color code not set.",
        "A hotspot is a low-power personal link into a network. It is not the same thing as this wide-area repeater.",
      ].join(" ");
    }
    ui.choices.appendChild(button("Set the frequency only", function () {
      frequency = true;
      paint();
      ui.note.textContent = "The frequency is only the radio channel. A talkgroup chooses the group of stations. A color code is the digital gate, similar in job to CTCSS.";
    }));
    ui.choices.appendChild(button("Select the talkgroup", function () {
      talkgroup = true;
      paint();
      ui.note.textContent = "You join a talkgroup by selecting it. You do not shout the group name on an analog channel.";
    }));
    ui.choices.appendChild(button("Set the color code", function () {
      color = true;
      paint();
      ui.note.textContent = "The color code has to match the repeater or the digital squelch stays closed.";
    }));
    ui.choices.appendChild(button("Store this in a code plug", function () {
      if (!frequency || !talkgroup || !color) {
        ui.note.textContent = "Set the frequency, the talkgroup, and the color code first. The code plug is where those settings live.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "A code plug stores the channel, talkgroup, and color code. A hotspot is still a different kind of station.");
    }));
    return ui.wrap;
  });

  api.register("wave-model", function (ctx, block, stageId) {
    var ui = shell(ctx, "Watch the model, then say which field sets the polarization.");
    var polarization = "vertical";
    function paint() {
      var wave = sim.waveModel(polarization);
      ui.readout.textContent = "Travel: " + wave.travel + ". Electric field: " + wave.electric + ". Magnetic field: " + wave.magnetic + ". They are perpendicular. Speed in free space: " + wave.velocityMps + " m/s for every frequency. " + wave.note;
    }
    paint();
    ui.choices.appendChild(button("Make the electric field horizontal", function () {
      polarization = "horizontal";
      paint();
    }));
    ui.choices.appendChild(button("Make the electric field vertical", function () {
      polarization = "vertical";
      paint();
    }));
    ui.choices.appendChild(button("Polarization follows the electric field", function () {
      api.finish(ctx, block, stageId, ui.note, "Polarization is the direction of the electric field. The magnetic field is at a right angle to it.");
    }));
    ui.choices.appendChild(button("Polarization follows the magnetic field", function () {
      ui.note.textContent = "The magnetic field is part of the wave, and it is perpendicular to the electric field. Polarization is named from the electric field.";
    }));
    return ui.wrap;
  });

  api.register("speed-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "Two frequencies in free space. Apply the 300/f shortcut. Do not rebuild Lab 01; use it.");
    var low = 14.3;
    var high = 146.52;
    ui.readout.textContent = low + " MHz is " + sim.bandName(low) + ", wavelength about " + sim.wavelengthM(low) + " m. " + high + " MHz is " + sim.bandName(high) + ", wavelength about " + sim.wavelengthM(high) + " m. Free-space speed for both: " + sim.FREE_SPACE_M_PER_S + " m/s.";
    ui.choices.appendChild(button("The higher frequency is faster", function () {
      ui.note.textContent = "In free space they travel at the same speed. The higher frequency has the shorter wavelength.";
    }));
    ui.choices.appendChild(button("Same speed, shorter wavelength at 146.52 MHz", function () {
      if (!sim.sameFreeSpaceSpeed(low, high) || !(sim.wavelengthM(high) < sim.wavelengthM(low))) {
        ui.note.textContent = "The model did not show that. Check the readout.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "Free-space speed does not depend on frequency. Wavelength is about 300 divided by megahertz.");
    }));
    return ui.wrap;
  });

  api.register("horizon-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "Raise the antenna. This is a classroom horizon, not a survey.");
    var height = 2;
    var compared = false;
    function paint() {
      var visual = sim.horizonKm(height, "visual");
      var radio = sim.horizonKm(height, "radio");
      ui.readout.textContent = "Antenna height " + height + " m. Visual horizon about " + visual + " km. Radio horizon about " + radio + " km. The radio horizon is farther because the atmosphere bends VHF and UHF slightly. Not a coverage map.";
    }
    paint();
    [2, 10, 30].forEach(function (meters) {
      ui.choices.appendChild(button(meters + " m high", function () {
        if (meters !== height) {
          compared = true;
        }
        height = meters;
        paint();
      }));
    });
    ui.choices.appendChild(button("The radio horizon is farther than the visual horizon", function () {
      var visual = sim.horizonKm(height, "visual");
      var radio = sim.horizonKm(height, "radio");
      if (!compared || !(radio > visual)) {
        ui.note.textContent = "Change the height and read both numbers first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "VHF and UHF usually stay inside the radio horizon. That horizon is still a bit past the one you see.");
    }));
    return ui.wrap;
  });

  api.register("multipath-drive", function (ctx, block, stageId) {
    var ui = shell(ctx, "A vehicle is moving. Watch the signal before you name it.");
    var step = 0;
    var levels = [];
    function paint() {
      var level = sim.multipathLevel(step);
      levels.push(level);
      var bars = Math.max(1, Math.round(level * 4));
      ui.readout.textContent = "Position " + step + ". Relative strength " + level + " " + "█".repeat(bars) + "░".repeat(Math.max(0, 6 - bars)) + ". More than one reflected path is arriving.";
    }
    paint();
    ui.choices.appendChild(button("Move the vehicle", function () {
      step += 1;
      paint();
      ui.note.textContent = "The strength changed without anyone touching the power knob.";
    }));
    ui.choices.appendChild(button("This flutter is picket fencing", function () {
      var unique = {};
      levels.forEach(function (level) {
        unique[level] = true;
      });
      if (step < 4 || Object.keys(unique).length < 2) {
        ui.note.textContent = "Move farther. The name comes after you see the flutter.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "Multipath means several paths arrive together. The rapid mobile flutter is called picket fencing. Data can break up when those paths collide.");
    }));
    ui.choices.appendChild(button("This is F-region skip", function () {
      ui.note.textContent = "Nothing in this picture left the local area or used the ionosphere. The flutter is from local reflections.";
    }));
    return ui.wrap;
  });

  api.register("absorption-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "Open a path. Decide whether the wave is being absorbed or returned.");
    var seenReturn = false;
    var seenAbsorb = false;
    ["uhf-trees", "rain-10m", "rain-microwave", "hf-day-absorption", "hf-f-region"].forEach(function (id) {
      ui.choices.appendChild(button(id.replace(/-/g, " "), function () {
        var row = sim.pathBehavior(id);
        ui.readout.textContent = row.summary;
        ui.prompt.textContent = "This path is: " + row.kind + ".";
        if (row.kind === "absorption") {
          seenAbsorb = true;
        }
        if (row.kind === "return") {
          seenReturn = true;
        }
      }));
    });
    ui.choices.appendChild(button("Absorption and an F-region return are different", function () {
      if (!seenAbsorb || !seenReturn) {
        ui.note.textContent = "Open a path that absorbs and the F-region return before you compare them.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "Absorption removes energy. An F-region return bends HF back. Fog and rain matter much more at microwave frequencies than on 10 or 6 meters.");
    }));
    return ui.wrap;
  });

  api.register("ionosphere-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "Change the band and the time. HF is 3 to 30 MHz. This sketch is not a forecast.");
    var mhz = 7.2;
    var day = true;
    var spots = false;
    function paint() {
      var row = sim.hfSketch(mhz, day, spots);
      ui.readout.textContent = sim.bandName(mhz) + " at " + mhz + " MHz. " + (day ? "Day." : "Night.") + (spots ? " High sunspots." : " Quiet sun.") + " " + row.note;
    }
    paint();
    [[7.2, "7 MHz"], [28.4, "10 meters"], [146.52, "2 meters"]].forEach(function (pair) {
      ui.choices.appendChild(button(pair[1], function () {
        mhz = pair[0];
        paint();
      }));
    });
    ui.choices.appendChild(button("Toggle day and night", function () {
      day = !day;
      paint();
    }));
    ui.choices.appendChild(button("Toggle sunspot level", function () {
      spots = !spots;
      paint();
    }));
    ui.choices.appendChild(button("10 meters can open on the F region in a high-sunspot day", function () {
      var opened = sim.hfSketch(28.4, true, true);
      if (opened.mode !== "f-region") {
        ui.note.textContent = "Set 10 meters, daytime, and high sunspots, then read the sketch.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "HF can travel beyond the horizon by F-region skip. A quiet 2-meter path does not. Long 10-meter openings favor daytime at the peak of the sunspot cycle.");
    }));
    return ui.wrap;
  });

  api.register("propagation-gallery", function (ctx, block, stageId) {
    var ui = shell(ctx, "Each card is a situation. Name the mode after you read what made the path.");
    var items = sim.gallery();
    var index = 0;
    function show() {
      var item = items[index];
      ui.choices.textContent = "";
      if (!item) {
        ui.prompt.textContent = "You matched each special path.";
        ui.readout.textContent = items.map(function (row) { return row.title; }).join(", ");
        if (api.finish(ctx, block, stageId, ui.note, "Sporadic E, meteor scatter, aurora, ducting, and knife-edge diffraction are different paths.") === false) {
          ui.choices.appendChild(button("Record the gallery", show));
        }
        return;
      }
      ui.prompt.textContent = item.title + ". " + item.cause + " " + item.result;
      ui.readout.textContent = item.recognize;
      items.forEach(function (candidate) {
        ui.choices.appendChild(button(candidate.title, function () {
          if (candidate.id === item.id) {
            ui.note.textContent = "That situation matches " + item.title + ".";
            index += 1;
            show();
            return;
          }
          ui.note.textContent = candidate.title + " does not fit this report. Read the cause again.";
        }));
      });
    }
    if (!sim.initGallery().length) {
      ui.prompt.textContent = "The gallery did not load.";
      return ui.wrap;
    }
    show();
    return ui.wrap;
  });

  api.register("path-compare", function (ctx, block, stageId) {
    var ui = shell(ctx, "Pick the idea that fits the report. Use only the paths from this lab.");
    var reports = [
      {
        text: "A mobile station's signal flutters rapidly while the car moves a few feet.",
        answer: "picket fencing",
        why: "That rapid variation is multipath, called picket fencing.",
      },
      {
        text: "A 6-meter signal appears in short bursts during a meteor shower.",
        answer: "meteor scatter",
        why: "Meteor trails scatter brief signals. Six meters is a common band for it.",
      },
      {
        text: "Two HF stations hundreds of miles apart talk at night on 40 meters. Neither has a line of sight.",
        answer: "F-region skip",
        why: "HF beyond the horizon is the F-region return you sketched, not a VHF line-of-sight path.",
      },
      {
        text: "VHF repeaters a few hundred miles away become steady during a temperature inversion.",
        answer: "tropospheric ducting",
        why: "The inversion can duct VHF and UHF well past the ordinary radio horizon.",
      },
    ];
    var index = 0;
    function show() {
      var report = reports[index];
      ui.choices.textContent = "";
      if (!report) {
        if (api.finish(ctx, block, stageId, ui.note, "Each report matched a path you had already seen.") === false) {
          ui.choices.appendChild(button("Record the comparison", show));
        }
        return;
      }
      ui.prompt.textContent = report.text;
      ["picket fencing", "meteor scatter", "F-region skip", "tropospheric ducting"].forEach(function (label) {
        ui.choices.appendChild(button(label, function () {
          if (label === report.answer) {
            ui.note.textContent = report.why;
            index += 1;
            show();
            return;
          }
          ui.note.textContent = "That mode does not fit this report.";
        }));
      });
    }
    show();
    return ui.wrap;
  });

  api.register("propagation-reports", function (ctx, block, stageId) {
    var ui = shell(ctx, "Operators sent these notes. This is reasoning from the lab, not a live forecast.");
    var reports = (block.config && block.config.reports) || [];
    var index = 0;
    function show() {
      var report = reports[index];
      ui.choices.textContent = "";
      if (!report) {
        ui.prompt.textContent = block.config.doneText || "You named a fitting concept for each report.";
        if (api.finish(ctx, block, stageId, ui.note, ui.prompt.textContent) === false) {
          ui.choices.appendChild(button("Record the investigation", show));
        }
        return;
      }
      ui.prompt.textContent = report.text;
      ui.readout.textContent = report.context;
      report.choices.forEach(function (choice) {
        ui.choices.appendChild(button(choice.label, function () {
          ui.note.textContent = choice.why;
          if (!choice.correct) {
            return;
          }
          index += 1;
          show();
        }));
      });
    }
    show();
    return ui.wrap;
  });

  api.register("front-panel", function (ctx, block, stageId) {
    var ui = shell(ctx, "Change a control and read what the radio does. This is not a glossary.");
    var tried = {};
    var pairs = [
      ["agc", "fast", "AGC on"],
      ["agc", "off", "AGC off"],
      ["rit", "offset", "RIT offset"],
      ["scan", "running", "Start scanning"],
      ["keyer", "paddle", "Use the keyer"],
      ["squelch", "tight", "Tighten squelch"],
      ["mic-gain", "high", "Microphone gain high"],
      ["filter", "ssb", "SSB-width filter"],
      ["noise-blanker", "on", "Noise blanker on"],
    ];
    pairs.forEach(function (pair) {
      ui.choices.appendChild(button(pair[2], function () {
        tried[pair[0]] = true;
        ui.readout.textContent = pair[2] + ": " + sim.controlEffect(pair[0], pair[1]);
      }));
    });
    ui.choices.appendChild(button("I used AGC, RIT, scan, and the keyer", function () {
      if (!tried.agc || !tried.rit || !tried.scan || !tried.keyer) {
        ui.note.textContent = "Try AGC, RIT, scanning, and the keyer before you finish.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "AGC levels loud signals. RIT moves only the receiver. Scanning searches memories. A keyer times the code from a paddle.");
    }));
    return ui.wrap;
  });

  api.register("hotspot-config", function (ctx, block, stageId) {
    var ui = shell(ctx, "A hotspot and a repeater can both carry digital voice. They are not the same station.");
    var seen = { hotspot: false, plug: false, dstar: false };
    ui.choices.appendChild(button("What a hotspot does", function () {
      seen.hotspot = true;
      ui.readout.textContent = "A digital hotspot is a low-power access point for nearby radios. It connects them to a network. It does not replace a hilltop repeater, and it is not required for ordinary simplex.";
    }));
    ui.choices.appendChild(button("What a code plug stores", function () {
      seen.plug = true;
      ui.readout.textContent = "A DMR code plug stores channels, color codes, and talkgroups. You select a talkgroup from that configuration. This screen does not program a real radio.";
    }));
    ui.choices.appendChild(button("D-STAR before you transmit", function () {
      seen.dstar = true;
      ui.readout.textContent = "A D-STAR radio needs your call sign programmed in before you transmit. The network uses that identity.";
    }));
    ui.choices.appendChild(button("A hotspot is just a small repeater", function () {
      ui.note.textContent = "A repeater retransmits RF over a service area. A hotspot is a low-power gateway for nearby radios. Treating them as the same station will set up the wrong expectations.";
    }));
    ui.choices.appendChild(button("These are different jobs", function () {
      if (!seen.hotspot || !seen.plug || !seen.dstar) {
        ui.note.textContent = "Open each description first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "A hotspot is a personal digital gateway. A code plug holds DMR settings. D-STAR wants your call sign in the radio.");
    }));
    return ui.wrap;
  });

  api.register("mobile-power", function (ctx, block, stageId) {
    var ui = shell(ctx, "Wire a mobile radio on the diagram. Do not do this on a live vehicle in the driveway.");
    var accepted = {};
    function choose(id) {
      var row = sim.wiringChoice(id);
      ui.note.textContent = row.why;
      if (row.ok) {
        accepted[id] = true;
      }
      var ready = accepted["fuse-at-battery"] && accepted["heavy-short"] && accepted["negative-to-battery"];
      if (ready) {
        api.finish(ctx, block, stageId, ui.note, "Fuse the positive lead at the battery, keep the wires short and heavy, and return the negative to the battery.");
      }
    }
    ["fuse-at-battery", "fuse-at-radio-only", "heavy-short", "thin-long", "negative-to-battery", "negative-to-random-screw"].forEach(function (id) {
      ui.choices.appendChild(button(id.replace(/-/g, " "), function () {
        choose(id);
      }));
    });
    ui.readout.textContent = "Positive lead, fuse, heavy wire, negative return. A 50-watt FM mobile needs a supply that can deliver the radio's transmit current at about 13.8 volts, often well above the RF watts divided by 13.8, because the radio is not 100 percent efficient. Battery time is about amp-hours divided by the current you draw.";
    return ui.wrap;
  });

  api.register("receiver-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "Sensitivity is whether a weak signal is still there. Selectivity is whether you can separate it from the neighbor.");
    var level = 5;
    function paint() {
      var ordinary = sim.sensitivityCopy("ordinary", level);
      var sensitive = sim.sensitivityCopy("sensitive", level);
      ui.readout.textContent = "Signal level " + level + " on a classroom scale. Ordinary receiver " + (ordinary.copied ? "copies it" : "loses it") + ". More sensitive receiver " + (sensitive.copied ? "copies it" : "loses it") + ". " + ordinary.note;
    }
    paint();
    ui.choices.appendChild(button("Weaken the signal", function () {
      level = Math.max(0, level - 1);
      paint();
    }));
    ui.choices.appendChild(button("Strengthen the signal", function () {
      level = Math.min(6, level + 1);
      paint();
    }));
    ui.choices.appendChild(button("Sensitivity is detecting a weak signal", function () {
      var weak = sim.sensitivityCopy("ordinary", level);
      var keen = sim.sensitivityCopy("sensitive", level);
      if (level > 1 || !weak || weak.copied || !keen.copied) {
        ui.note.textContent = "Drop the level until the ordinary receiver loses it and the sensitive one still copies.";
        return;
      }
      ui.note.textContent = "Selectivity is the other idea: a narrower filter can keep a nearby signal out. An oscillator makes one frequency. A mixer combines that with the incoming signal to shift it. A transverter uses that idea to put the whole radio on another band.";
      api.finish(ctx, block, stageId, ui.note, "You saw sensitivity change with signal level. Selectivity, the mixer, and the transverter are the matching receiver ideas.");
    }));
    return ui.wrap;
  });

  api.register("converter-blocks", function (ctx, block, stageId) {
    var ui = shell(ctx, "Follow a block diagram. No circuit design.");
    var mixed = sim.convertFrequency(146.52, 136.52);
    var shifted = sim.transvert(28.3, 118);
    ui.readout.textContent = "Mixer: 146.52 MHz with a 136.52 MHz oscillator becomes " + mixed.outputMhz + " MHz. " + mixed.note + " Transverter: a 28.3 MHz radio plus a 118 MHz shift is on " + shifted.onAirMhz + " MHz. " + shifted.note;
    ui.choices.appendChild(button("A mixer changes frequency", function () {
      ui.note.textContent = "Yes. The oscillator provides the second frequency. The VFO is the oscillator you tune when you pick an operating frequency. PTT switches the radio from receive to transmit.";
    }));
    ui.choices.appendChild(button("A transverter moves the radio to another band", function () {
      if (!mixed || !shifted) {
        ui.note.textContent = "The diagram did not load.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "A mixer shifts a frequency. A transverter shifts the radio's whole band. An RF power amplifier increases output. A preamplifier can help a weak received signal and can also overload.");
    }));
    return ui.wrap;
  });

  api.register("coax-cutaway", function (ctx, block, stageId) {
    var ui = shell(ctx, "Name the layer that keeps the signal in and outside noise out.");
    var opened = {};
    sim.coaxLayers().forEach(function (layer) {
      ui.choices.appendChild(button(layer.name, function () {
        opened[layer.id] = true;
        ui.readout.textContent = layer.name + ". " + layer.role;
      }));
    });
    ui.choices.appendChild(button("The shield is that layer", function () {
      if (!opened.center || !opened.dielectric || !opened.shield || !opened.jacket) {
        ui.note.textContent = "Open every layer first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "Center conductor, dielectric, shield, jacket. Water, crushing, and sunlight cracking the jacket are how coax fails. Lost power in the line becomes heat.");
    }));
    return ui.wrap;
  });

  api.register("swr-read", function (ctx, block, stageId) {
    var ui = shell(ctx, "Read 1:1 and 4:1. This meter does not invent a universal safe limit.");
    var saw1 = false;
    var saw4 = false;
    ui.choices.appendChild(button("Show 1:1", function () {
      var row = sim.interpretSwr(1);
      saw1 = true;
      ui.readout.textContent = row.ratio + " is a " + row.match + " match. Reflected power: " + row.lostPower + ". " + row.note;
    }));
    ui.choices.appendChild(button("Show 4:1", function () {
      var row = sim.interpretSwr(4);
      saw4 = true;
      ui.readout.textContent = row.ratio + " is a " + row.match + " match. Foldback is likely: " + row.foldback + ". " + row.note;
    }));
    ui.choices.appendChild(button("1:1 matches and 4:1 is a large mismatch", function () {
      if (!saw1 || !saw4) {
        ui.note.textContent = "Display both readings first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "1:1 is a perfect match in this model. 4:1 is a serious mismatch. Many radios then reduce power. The lab still does not name one SWR number as safe for every radio.");
    }));
    return ui.wrap;
  });

  api.register("neighbor-case", function (ctx, block, stageId) {
    var caseId = (block.config && block.config.caseId) || "neighbor-overload";
    var ui = shell(ctx, "A neighbor says your station is getting into their radio. Collect evidence before you pick a fix.");
    var seen = [];
    var observations = (block.config && block.config.observations) || [];
    var actions = (block.config && block.config.actions) || [];
    observations.forEach(function (item) {
      ui.choices.appendChild(button(item.label, function () {
        if (seen.indexOf(item.id) < 0) {
          seen.push(item.id);
        }
        ui.readout.textContent = item.detail;
        ui.note.textContent = "Recorded: " + seen.join(", ");
      }));
    });
    actions.forEach(function (action) {
      ui.choices.appendChild(button(action.label, function () {
        var result = sim.diagnose(caseId, seen, action.id);
        ui.note.textContent = result.why;
        if (result.accepted) {
          api.finish(ctx, block, stageId, ui.note, result.why);
        }
      }));
    });
    return ui.wrap;
  });

  api.register("station-diagnosis", function (ctx, block, stageId) {
    var ui = shell(ctx, "Several observations are on the bench. Pick the next action only after the matching check.");
    var cases = (block.config && block.config.cases) || [];
    var index = 0;
    var seen = [];
    function show() {
      var item = cases[index];
      ui.choices.textContent = "";
      if (!item) {
        ui.prompt.textContent = block.config.doneText || "You chose the next action from the evidence.";
        if (api.finish(ctx, block, stageId, ui.note, ui.prompt.textContent) === false) {
          ui.choices.appendChild(button("Record the diagnostic", show));
        }
        return;
      }
      seen = [];
      ui.prompt.textContent = "Case " + (index + 1) + ". " + item.prompt;
      ui.readout.textContent = "Inspect before you choose.";
      item.observations.forEach(function (observation) {
        ui.choices.appendChild(button(observation.label, function () {
          if (seen.indexOf(observation.id) < 0) {
            seen.push(observation.id);
          }
          ui.readout.textContent = observation.detail;
        }));
      });
      item.actions.forEach(function (action) {
        ui.choices.appendChild(button(action.label, function () {
          var result = sim.diagnose(item.caseId, seen, action.id);
          ui.note.textContent = result.why;
          if (result.accepted) {
            index += 1;
            show();
          }
        }));
      });
    }
    show();
    return ui.wrap;
  });
})(typeof window !== "undefined" ? window : globalThis);
