/* TC-05 through TC-08 activities. Registered before the core lab boots. */
(function (root) {
  var api = root.RadioLabCore;
  if (!api) {
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

  function bars(width) {
    return "█".repeat(width) + "░".repeat(Math.max(0, 4 - width));
  }

  api.register("mode-bench", function (ctx, block, stageId) {
    var config = block.config || {};
    var ui = shell(ctx, config.intro || "EDUCATIONAL MODEL. Match the receiver mode to the signal.");
    var signals = config.signals || [];
    var index = 0;

    function show() {
      var signal = signals[index];
      ui.choices.textContent = "";
      if (!signal) {
        ui.prompt.textContent = config.doneText || "The receiver mode matches the signal.";
        ui.readout.textContent = "EDUCATIONAL MODEL. A correct frequency still needs a receiver set for that kind of signal.";
        api.finish(ctx, block, stageId, ui.note, config.doneText || "Receiver mode matched.");
        return;
      }
      var width = CoreSim.modeWidth(signal.mode);
      ui.prompt.textContent = "Signal " + (index + 1) + " of " + signals.length + ". " + signal.info;
      ui.readout.textContent = "EDUCATIONAL MODEL. RF carrying " + signal.kind + ". Relative occupied width " + bars(width) + ".";
      (config.receivers || []).forEach(function (receiver) {
        ui.choices.appendChild(button(receiver.label, function () {
          if (CoreSim.modeMatches(signal.mode, receiver.id)) {
            ui.note.textContent = "The receiver is set for this signal. The information can be recovered.";
            index += 1;
            show();
            return;
          }
          ui.note.textContent = "That receiver mode does not match this signal. The frequency can be right and the message still stays unreadable.";
        }));
      });
    }

    show();
    return ui.wrap;
  });

  api.register("bandwidth-compare", function (ctx, block, stageId) {
    var config = block.config || {};
    var ui = shell(ctx, config.intro || "EDUCATIONAL MODEL. Compare occupied width. These bars are not a specification.");
    var left = config.left;
    var right = config.right;
    ui.readout.textContent = left.label + " " + bars(CoreSim.modeWidth(left.mode)) + "    " + right.label + " " + bars(CoreSim.modeWidth(right.mode));
    (config.choices || []).forEach(function (choice) {
      ui.choices.appendChild(button(choice.label, function () {
        var wider = CoreSim.widerMode(left.mode, right.mode);
        var picked = choice.mode === wider;
        ui.note.textContent = choice.why || "";
        if (picked) {
          api.finish(ctx, block, stageId, ui.note, config.doneText || "The wider emission occupies more spectrum in this model.");
        }
      }));
    });
    return ui.wrap;
  });

  api.register("ordered-path", function (ctx, block, stageId) {
    var config = block.config || {};
    var ui = shell(ctx, config.intro || "Select the next stage.");
    var steps = config.steps || [];
    var index = 0;
    ui.readout.textContent = "Path: (nothing selected yet)";

    function paint() {
      ui.choices.textContent = "";
      if (index >= steps.length) {
        if (config.followUp && !config._followDone) {
          askFollow();
          return;
        }
        ui.prompt.textContent = config.doneText || "The path is assembled.";
        if (api.finish(ctx, block, stageId, ui.note, config.doneText || "The path is assembled.") === false) {
          ui.choices.appendChild(button("Record this path", function () {
            paint();
          }));
        }
        return;
      }
      ui.prompt.textContent = "Next stage " + (index + 1) + " of " + steps.length + ".";
      steps.forEach(function (step, stepIndex) {
        ui.choices.appendChild(button(step.label, function () {
          if (stepIndex !== index) {
            ui.note.textContent = config.wrong || "That piece is in the path, but not at this point.";
            return;
          }
          index += 1;
          ui.readout.textContent = "Path: " + steps.slice(0, index).map(function (item) { return item.label; }).join(" → ");
          ui.note.textContent = step.note || "";
          paint();
        }));
      });
    }

    function askFollow() {
      var follow = config.followUp;
      ui.prompt.textContent = follow.prompt;
      ui.choices.textContent = "";
      follow.choices.forEach(function (choice) {
        ui.choices.appendChild(button(choice.label, function () {
          ui.note.textContent = choice.why;
          if (!choice.correct) {
            return;
          }
          config._followDone = true;
          paint();
        }));
      });
    }

    paint();
    return ui.wrap;
  });

  api.register("satellite-pass", function (ctx, block, stageId) {
    var config = block.config || {};
    var ui = shell(ctx, config.intro || "Ground station → satellite → another ground station.");
    ui.readout.textContent = "EDUCATIONAL MODEL. Uplink goes up to the satellite. Downlink comes down. A pass is the time it is in line of sight. Frequency can shift during the pass.";
    var scenes = config.scenes || [];
    var index = 0;

    function show() {
      var scene = scenes[index];
      ui.choices.textContent = "";
      if (!scene) {
        ui.prompt.textContent = config.doneText || "Uplink, downlink, and the pass are separated.";
        api.finish(ctx, block, stageId, ui.note, config.doneText || "Satellite path recorded.");
        return;
      }
      ui.prompt.textContent = scene.prompt;
      scene.choices.forEach(function (choice) {
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

  api.register("feed-loss", function (ctx, block, stageId) {
    var ui = shell(ctx, "EDUCATIONAL MODEL. Relative feed-line loss, not a cable datasheet.");
    var lengthM = 20;
    var mhz = 146;
    var quality = "fair";
    var start = CoreSim.feedLoss(lengthM, mhz, quality);
    var changed = false;

    function paint() {
      var loss = CoreSim.feedLoss(lengthM, mhz, quality);
      ui.readout.textContent = "Length " + lengthM + " m, " + mhz + " MHz, " + quality + " cable. Relative loss " + loss + ".";
      return loss;
    }

    function set(nextLength, nextMhz, nextQuality, why) {
      lengthM = nextLength;
      mhz = nextMhz;
      quality = nextQuality;
      changed = true;
      var loss = paint();
      ui.note.textContent = why + " Relative loss is now " + loss + ".";
      if (loss < start) {
        api.finish(ctx, block, stageId, ui.note, "Relative loss is lower than the starting run. Longer cable, higher frequency, and poorer cable each raised it in this model.");
      }
    }

    paint();
    ui.choices.appendChild(button("Use a longer cable", function () {
      set(40, mhz, quality, "A longer run generally loses more.");
    }));
    ui.choices.appendChild(button("Use a shorter cable", function () {
      set(5, mhz, quality, "A shorter run generally loses less.");
    }));
    ui.choices.appendChild(button("Move to a higher frequency", function () {
      set(lengthM, 440, quality, "The same cable usually loses more as frequency goes up.");
    }));
    ui.choices.appendChild(button("Move to a lower frequency", function () {
      set(lengthM, 50, quality, "The same cable usually loses less at a lower frequency.");
    }));
    ui.choices.appendChild(button("Use a poorer cable", function () {
      set(lengthM, mhz, "poor", "Cable type changes the loss. This is still a relative model.");
    }));
    ui.choices.appendChild(button("Use a better cable", function () {
      set(lengthM, mhz, "good", "A better cable in this model loses less for the same length and frequency.");
    }));
    if (!changed) {
      ui.note.textContent = "Change the run and watch the relative loss. This number is not a published cable specification.";
    }
    return ui.wrap;
  });

  api.register("polarization", function (ctx, block, stageId) {
    var ui = shell(ctx, "EDUCATIONAL MODEL. The incoming local FM signal is vertical. Polarization is not the only thing that sets signal strength.");
    var station = "horizontal";

    function paint() {
      var coupling = CoreSim.polarizationCoupling("vertical", station);
      ui.readout.textContent = "Incoming vertical. Station antenna " + station + ". Relative coupling " + coupling + ".";
      return coupling;
    }

    paint();
    ui.choices.appendChild(button("HORIZONTAL", function () {
      station = "horizontal";
      paint();
      ui.note.textContent = "The antennas do not share an orientation. Coupling in this model is weak. Terrain, power, and distance still matter too.";
    }));
    ui.choices.appendChild(button("VERTICAL", function () {
      station = "vertical";
      paint();
      ui.note.textContent = "Both antennas are vertical, so relative coupling is stronger. That does not guarantee a contact.";
      api.finish(ctx, block, stageId, ui.note, "Polarization matches. Signal strength still depends on more than orientation.");
    }));
    return ui.wrap;
  });

  api.register("pattern-aim", function (ctx, block, stageId) {
    var ui = shell(ctx, "EDUCATIONAL MODEL. The other station is north. A directional antenna redistributes energy. It does not create it.");
    var aimed = false;

    function show(kind, bearing) {
      var read = CoreSim.patternRead(kind, bearing, 0);
      ui.readout.textContent = kind + " antenna, aim " + read.aim + ", relative strength " + read.strength + ".";
      return read;
    }

    show("directional", 180);
    ui.choices.appendChild(button("Aim the directional antenna away", function () {
      show("directional", 180);
      ui.note.textContent = "Most of the redistributed energy is pointed away from the station. Transmitter power did not change.";
    }));
    ui.choices.appendChild(button("Aim the directional antenna toward the station", function () {
      show("directional", 0);
      aimed = true;
      ui.note.textContent = "More of the same energy is aimed at the station. The radio did not get a bigger transmitter.";
      api.finish(ctx, block, stageId, ui.note, "The directional antenna is aimed toward the station. Gain here means redistributed energy.");
    }));
    ui.choices.appendChild(button("Compare an omnidirectional antenna", function () {
      show("omni", 0);
      ui.note.textContent = "The omnidirectional pattern is similar all around. It does not favor the station the way the aimed antenna does.";
      if (!aimed) {
        ui.note.textContent += " Aim the directional antenna when you want that station.";
      }
    }));
    return ui.wrap;
  });

  api.register("workbench", function (ctx, block, stageId) {
    var config = block.config || {};
    var ui = shell(ctx, config.intro || "Choose a meter and a setup. Voltage and resistance are not measured the same way.");
    var live = config.circuitLive !== false;
    var tried = {};

    function ready() {
      return tried.voltage && tried.resistance && tried.current;
    }

    ui.readout.textContent = live ? "The supply is connected. The circuit is live." : "The part is unpowered and isolated.";
    (config.actions || []).forEach(function (action) {
      ui.choices.appendChild(button(action.label, function () {
        var setup = CoreSim.meterSetup(action.mode, live);
        tried[action.mode] = true;
        if (!setup.ok && setup.reason === "live-resistance") {
          ui.note.textContent = "Stop. Resistance is measured on an unpowered, isolated part. A voltmeter is the tool for a live supply.";
          if (ready()) {
            api.finish(ctx, block, stageId, ui.note, config.doneText || "Voltage, resistance, and current are different setups.");
          }
          return;
        }
        if (!setup.ok && setup.reason === "series-current") {
          ui.note.textContent = "Current is measured in series, with the meter as part of the path. It is not connected across the supply the way a voltmeter is.";
          if (ready()) {
            api.finish(ctx, block, stageId, ui.note, config.doneText || "Voltage, resistance, and current are different setups.");
          }
          return;
        }
        ui.note.textContent = action.reading;
        if (ready()) {
          api.finish(ctx, block, stageId, ui.note, config.doneText || "The three setups are distinct.");
        }
      }));
    });
    return ui.wrap;
  });

  api.register("fault-case", function (ctx, block, stageId) {
    var config = block.config || {};
    var ui = shell(ctx, config.intro || "The cause is hidden. Observe, then measure, then decide.");
    var cases = config.cases || [];
    var index = 0;
    var seen = {};

    function show() {
      var item = cases[index];
      ui.choices.textContent = "";
      seen = {};
      if (!item) {
        ui.prompt.textContent = config.doneText || "The faults were isolated one at a time.";
        ui.readout.textContent = "OBSERVE → CHECK SIMPLE THINGS → MEASURE → ISOLATE → CONFIRM";
        api.finish(ctx, block, stageId, ui.note, config.doneText || "Diagnostics recorded.");
        return;
      }
      ui.prompt.textContent = "Case " + (index + 1) + " of " + cases.length + ". " + item.symptom;
      ui.readout.textContent = "Cause hidden. Measure before you change parts.";
      (item.evidence || []).forEach(function (probe) {
        ui.choices.appendChild(button(probe.label, function () {
          seen[probe.id] = true;
          ui.note.textContent = probe.reading;
        }));
      });
      (item.conclusions || []).forEach(function (choice) {
        ui.choices.appendChild(button(choice.label, function () {
          var missing = (item.requires || []).filter(function (id) { return !seen[id]; });
          if (missing.length) {
            ui.note.textContent = "Measure first. Changing parts before the evidence is how several fixes get mixed together.";
            return;
          }
          ui.note.textContent = choice.why;
          if (!choice.correct) {
            return;
          }
          if (choice.cause !== item.cause) {
            ui.note.textContent = "That fix does not match the measurement.";
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

  api.register("site-inspection", function (ctx, block, stageId) {
    var config = block.config || {};
    var ui = shell(ctx, config.intro || "Walk the station. Select each condition that should be corrected.");
    var found = {};
    var hazards = (config.spots || []).filter(function (spot) { return spot.hazard; });
    ui.readout.textContent = hazards.length + " conditions need a correction. Safe items can stay.";
    (config.spots || []).forEach(function (spot) {
      ui.choices.appendChild(button(spot.label, function () {
        ui.note.textContent = spot.why;
        if (!spot.hazard) {
          return;
        }
        found[spot.id] = true;
        var remaining = hazards.filter(function (item) { return !found[item.id]; });
        if (!remaining.length) {
          api.finish(ctx, block, stageId, ui.note, config.doneText || "The unsafe conditions are identified.");
        }
      }));
    });
    return ui.wrap;
  });

  api.register("exposure-model", function (ctx, block, stageId) {
    var ui = shell(ctx, "EDUCATIONAL MODEL — NOT A COMPLIANCE CALCULATOR. Actual FCC compliance uses the current rules and evaluation methods. This index is only a comparison.");
    var watts = 5;
    var meters = 10;
    var duty = 0.2;
    var changed = { power: false, distance: false, duty: false };

    function paint() {
      var index = CoreSim.exposureIndex(watts, meters, duty);
      ui.readout.textContent = "EDUCATIONAL MODEL — NOT A COMPLIANCE CALCULATOR. " + watts + " W, " + meters + " m, duty " + duty + ". Relative index " + index + ". Not a pass or fail.";
      return index;
    }

    function touch(key, why) {
      changed[key] = true;
      paint();
      ui.note.textContent = why;
      if (changed.power && changed.distance && changed.duty) {
        api.finish(ctx, block, stageId, ui.note, "Power, distance, and duty cycle each changed the educational index. That is not a compliance result.");
      }
    }

    paint();
    ui.choices.appendChild(button("Raise transmitter power", function () {
      watts = 50;
      touch("power", "More power raises the index when distance and duty stay the same.");
    }));
    ui.choices.appendChild(button("Lower transmitter power", function () {
      watts = 5;
      touch("power", "Less power lowers the index in this model. Use the lowest power that completes the contact.");
    }));
    ui.choices.appendChild(button("Move people closer", function () {
      meters = 1;
      touch("distance", "Closer to the antenna raises the index. Distance is part of an evaluation.");
    }));
    ui.choices.appendChild(button("Move people farther away", function () {
      meters = 10;
      touch("distance", "More distance lowers the index in this model.");
    }));
    ui.choices.appendChild(button("Use a high duty cycle", function () {
      duty = 1;
      touch("duty", "A transmission that stays on, such as FM voice or a long data exchange, counts more than a brief one.");
    }));
    ui.choices.appendChild(button("Use a low duty cycle", function () {
      duty = 0.2;
      touch("duty", "A lower duty cycle lowers the index. Duty cycle is one factor, not the whole evaluation.");
    }));
    return ui.wrap;
  });

  api.register("outing-prep", function (ctx, block, stageId) {
    var config = block.config || {};
    var ui = shell(ctx, config.intro || "Prepare the outing. Each check is a decision.");
    var steps = config.steps || [];
    var index = 0;

    function show() {
      var step = steps[index];
      ui.choices.textContent = "";
      if (!step) {
        ui.prompt.textContent = config.doneText || "The outing checks are done.";
        ui.readout.textContent = "Radio, site, power, weather, exposure awareness, and a communication plan.";
        api.finish(ctx, block, stageId, ui.note, config.doneText || "Preparation recorded.");
        return;
      }
      ui.prompt.textContent = step.title + ". " + step.prompt;
      ui.readout.textContent = "Check " + (index + 1) + " of " + steps.length + ".";
      step.choices.forEach(function (choice) {
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
})(typeof window !== "undefined" ? window : globalThis);
