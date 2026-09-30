/* TR-07 through TR-09. Registers on the shared core runner. */
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

  function cards(ctx, block, stageId) {
    var list = (block.config && block.config.cards) || [];
    var ui = shell(ctx, (block.config && block.config.intro) || "Choose from the situation.");
    var index = 0;

    function show() {
      var card = list[index];
      ui.choices.textContent = "";
      if (!card) {
        if (api.finish(ctx, block, stageId, ui.note, (block.config && block.config.doneText) || "Recorded.") === false) {
          ui.choices.appendChild(button("Record this", show));
        }
        return;
      }
      ui.prompt.textContent = card.prompt;
      ui.readout.textContent = card.readout || "";
      (card.choices || []).forEach(function (choice) {
        ui.choices.appendChild(button(choice.label, function () {
          ui.note.textContent = choice.why || "";
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
  }

  api.register("spectrum-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "Select a mode. The bar is a typical occupied width, not a promise about every radio.");
    var seen = {};
    ["cw", "ssb", "fm", "fast-scan"].forEach(function (mode) {
      ui.choices.appendChild(button(mode, function () {
        var row = sim.typicalBandwidth(mode);
        seen[mode] = true;
        var scale = Math.max(1, Math.min(24, Math.round(Math.log10(row.khz * 10) * 6)));
        ui.readout.textContent = mode + "  " + "█".repeat(scale) + "  about " + row.khz + " kHz. " + row.note;
      }));
    });
    ui.choices.appendChild(button("CW is the narrowest of these four", function () {
      if (!seen.cw || !seen.ssb || !seen.fm || !seen["fast-scan"]) {
        ui.note.textContent = "Look at all four widths first.";
        return;
      }
      if (sim.narrowerMode("cw", "ssb") !== "cw" || sim.narrowerMode("ssb", "fm") !== "ssb") {
        ui.note.textContent = "The comparison did not come out that way.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "CW is narrowest here, then a typical SSB voice signal, then FM voice, then fast-scan television. Those numbers are typical widths.");
    }));
    return ui.wrap;
  });

  api.register("sideband-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "One side of the carrier carries the voice. The other side is not sent.");
    var sawUsb = false;
    var sawLsb = false;

    function paint(kind) {
      if (kind === "usb") {
        sawUsb = true;
      }
      if (kind === "lsb") {
        sawLsb = true;
      }
      ui.readout.textContent = kind === "usb"
        ? "Carrier |==== voice above the carrier. Upper sideband."
        : "Voice ====| carrier. The voice is below the carrier. Lower sideband.";
    }

    ui.choices.appendChild(button("Show upper sideband", function () { paint("usb"); }));
    ui.choices.appendChild(button("Show lower sideband", function () { paint("lsb"); }));
    ui.choices.appendChild(button("10-meter and VHF voice SSB uses upper sideband", function () {
      if (!sawUsb || !sawLsb || sim.sidebandFor("10m") !== "usb" || sim.sidebandFor("vhf") !== "usb") {
        ui.note.textContent = "Show both pictures, then apply the convention.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "Upper sideband is the usual voice convention on 10 meters, VHF, and UHF. Lower sideband is the usual voice convention on HF below 10 MHz. The picture shows which side of the carrier is in use.");
    }));
    return ui.wrap;
  });

  api.register("digital-explorer", cards);
  api.register("image-lab", cards);
  api.register("activity-chooser", cards);
  api.register("connector-lab", cards);
  api.register("tuner-lab", cards);
  api.register("hazard-walk", cards);
  api.register("ground-lab", cards);
  api.register("site-plan", cards);

  api.register("leo-pass", function (ctx, block, stageId) {
    var ui = shell(ctx, "A low-Earth-orbit pass. Advance the clock. This track is fixed so you can see the shape of a pass.");
    var step = 0;
    var sawUp = false;
    var sawDown = false;

    function paint() {
      var row = sim.satellitePass(step);
      if (row.doppler === "up") {
        sawUp = true;
      }
      if (row.doppler === "down") {
        sawDown = true;
      }
      ui.readout.textContent = "Minute " + step + ". Elevation " + row.elevation + "°. " +
        (row.available ? "The satellite is above the horizon." : "The satellite is not in view.") +
        " Apparent frequency shift: " + row.doppler + ".";
    }

    paint();
    ui.choices.appendChild(button("Advance one minute", function () {
      if (step < sim.satellitePass(0).steps - 1) {
        step += 1;
      }
      paint();
    }));
    ui.choices.appendChild(button("Uplink is the signal you send up. Downlink is what you hear.", function () {
      if (!sawUp || !sawDown) {
        ui.note.textContent = "Run the pass until the shift goes up and then down.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "A LEO satellite is only available during the pass. Tracking tells you when and where. The signal sounds higher while the satellite approaches and lower as it leaves. That change is Doppler shift. Your uplink goes up. The downlink comes down.");
    }));
    return ui.wrap;
  });

  api.register("antenna-gallery", function (ctx, block, stageId) {
    var antennas = (block.config && block.config.antennas) || [];
    var ui = shell(ctx, "Open each antenna. None of them is the best antenna for every job.");
    var seen = {};
    antennas.forEach(function (antenna) {
      ui.choices.appendChild(button(antenna.name, function () {
        seen[antenna.id] = true;
        ui.prompt.textContent = antenna.name;
        ui.readout.textContent = antenna.behavior;
      }));
    });
    ui.choices.appendChild(button("I can match the job to the antenna", function () {
      var missing = antennas.some(function (antenna) { return !seen[antenna.id]; });
      if (missing) {
        ui.note.textContent = "Open every antenna first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "A dipole is a starting wire. A vertical stands upright. A beam concentrates one direction. A rubber duck is short and convenient, and less effective than a full quarter wave. A loading coil lets a short antenna behave electrically longer. The right choice depends on the band, the place, and the job.");
    }));
    return ui.wrap;
  });

  api.register("pattern-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "EDUCATIONAL MODEL — NOT A FIELD-STRENGTH PREDICTION. A half-wave dipole. Zero degrees is off the end of the wire.");
    var sawEnd = false;
    var sawSide = false;

    function paint(degrees) {
      var row = sim.dipoleRelative(degrees);
      if (degrees === 0) {
        sawEnd = true;
      }
      if (degrees === 90) {
        sawSide = true;
      }
      ui.readout.textContent = degrees + "° from the wire end. Relative strength " + row.relative + ". The drawing is a teaching shape, not a measurement.";
    }

    paint(90);
    ui.choices.appendChild(button("Look off the end", function () { paint(0); }));
    ui.choices.appendChild(button("Look broadside", function () { paint(90); }));
    ui.choices.appendChild(button("The strongest direction is broadside to the wire", function () {
      var end = sim.dipoleRelative(0);
      var side = sim.dipoleRelative(90);
      if (!sawEnd || !sawSide || !(side.relative > end.relative)) {
        ui.note.textContent = "Look both ways before you decide.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "In this model the dipole is strongest broadside to the wire and weakest off the ends. Rotating the wire changes which neighbors are broadside.");
    }));
    return ui.wrap;
  });

  api.register("loading-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "A full quarter-wave vertical near 146 MHz, then the same electrical job in a shorter package.");
    var full = sim.quarterWaveInches(146);
    var sawShort = false;
    ui.readout.textContent = "Full size about " + full + " inches of free-space quarter wave. A practical 2-meter vertical is a bit shorter than that free-space length, near 19 inches.";
    ui.choices.appendChild(button("Shorten it and add a loading coil", function () {
      sawShort = true;
      ui.readout.textContent = "The wire is physically shorter. The coil makes up electrical length so the antenna can still be resonant. The short antenna is easier to carry and usually less efficient.";
    }));
    ui.choices.appendChild(button("The coil does not make the short antenna a full-size one", function () {
      if (!sawShort) {
        ui.note.textContent = "Shorten the model first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "Loading lets a physically short antenna resonate. It does not give you the same antenna you would have built at full size.");
    }));
    return ui.wrap;
  });

  api.register("feed-compare", function (ctx, block, stageId) {
    var ui = shell(ctx, "Same comparison model for every cable. A larger number means more relative loss. It is not a catalog specification.");
    var sawPair = false;
    var sawFlip = false;

    function line(cable, meters, mhz) {
      return cable + " " + meters + " m at " + mhz + " MHz: relative loss " + sim.feedLineLoss(cable, meters, mhz);
    }

    ui.choices.appendChild(button("Compare 20 m of RG-58 and RG-213 at 146 MHz", function () {
      sawPair = true;
      ui.readout.textContent = line("RG-58", 20, 146) + ". " + line("RG-213", 20, 146) + ". Same length and frequency: the larger cable loses less in this model. Both are about 50-ohm coax.";
    }));
    ui.choices.appendChild(button("Compare a short RG-58 run at 28 MHz with a long RG-213 run at 440 MHz", function () {
      sawFlip = true;
      ui.readout.textContent = line("RG-58", 2, 28) + ". " + line("RG-213", 30, 440) + ". Length and frequency can outweigh the cable name. Loss also rises as frequency rises.";
    }));
    ui.choices.appendChild(button("The cable with less loss delivers more of the transmitter power", function () {
      var small = sim.feedLineLoss("RG-58", 20, 146);
      var large = sim.feedLineLoss("RG-213", 20, 146);
      if (!sawPair || !sawFlip || !(large < small)) {
        ui.note.textContent = "Run both comparisons first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "Feed-line loss is heat in the cable. Less loss means more of the transmitter power reaches the antenna. RG-213 loses less than RG-58 in the same situation. A short, low-frequency run can still favor a smaller cable.");
    }));
    return ui.wrap;
  });

  api.register("swr-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "SWR describes the match. Reflected power is the part that comes back down the line.");
    var one = sim.interpretSwr(1);
    var four = sim.interpretSwr(4);
    ui.readout.textContent = "1:1 reflection fraction " + sim.reflectionFraction(1) + ". 4:1 reflection fraction " + sim.reflectionFraction(4) + ".";
    ui.choices.appendChild(button("1:1 means essentially no reflection in this model", function () {
      if (!one || one.match !== "perfect" || sim.reflectionFraction(1) !== 0) {
        ui.note.textContent = "The 1:1 reading did not match.";
        return;
      }
      ui.note.textContent = one.note;
    }));
    ui.choices.appendChild(button("4:1 is a large mismatch, and it is not a universal danger line", function () {
      if (!four || sim.reflectionFraction(4) <= sim.reflectionFraction(1)) {
        ui.note.textContent = "Read 1:1 first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, four.note + " Water in the line or a loose connector can make the reading jump around.");
    }));
    return ui.wrap;
  });

  api.register("fuse-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "The circuit is marked 5 amperes. You are choosing a replacement fuse, not opening the equipment.");
    var oversized = sim.fuseChoice(5, 20);
    var matched = sim.fuseChoice(5, 5);
    ui.readout.textContent = "A fuse opens the circuit when current stays too high. It protects the wiring. It is not a volume control.";
    ui.choices.appendChild(button("Install another 5-ampere fuse", function () {
      ui.note.textContent = matched && matched.ok ? "The replacement matches the rating the circuit was built for." : "The model disagreed.";
    }));
    ui.choices.appendChild(button("A 20-ampere fuse lets the wiring overheat first", function () {
      if (!oversized || oversized.ok || oversized.reason !== "oversized") {
        ui.note.textContent = "Check the oversized case.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "A larger fuse can stay closed while the wire heats. Replace a fuse with the same rating. Do not defeat it with foil or a higher value.");
    }));
    return ui.wrap;
  });

  api.register("exposure-lab", function (ctx, block, stageId) {
    var ui = shell(ctx, "NOT A COMPLIANCE CALCULATOR. Average exposure in this model is transmitter power times duty cycle. The FCC limit also depends on frequency, distance, and the antenna. This screen does not certify a station.");
    var full = sim.exposureAverage(50, 1);
    var half = sim.exposureAverage(50, 0.5);
    var saw = false;
    ui.readout.textContent = "Open the FCC card in the reference before you treat any number as a limit. This bench only shows the averaging relationship.";
    ui.choices.appendChild(button("Compare 100 percent and 50 percent duty cycle at 50 watts", function () {
      saw = true;
      ui.readout.textContent = "50 W at 100 percent duty averages " + full + " W. At 50 percent duty the average is " + half + " W. The same peak power produces half the average when it is on half the time. FCC limits vary with frequency because the body absorbs RF differently. VHF is in the more restrictive range. This is still not a compliance result.";
    }));
    ui.choices.appendChild(button("Power alone does not decide exposure", function () {
      if (!saw || half * 2 !== full) {
        ui.note.textContent = "Run the duty-cycle comparison first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "Frequency, power, duty cycle, distance, and the antenna all change exposure. The station licensee is responsible for checking the station against the FCC rules. Calculation and measurement are the methods in FCC guidance. This lab does not make that determination.");
    }));
    return ui.wrap;
  });
})(typeof window !== "undefined" ? window : globalThis);
