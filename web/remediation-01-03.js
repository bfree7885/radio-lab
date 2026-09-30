/* TR-01 through TR-03. Registers on the shared core runner. Requires core-sim.js to boot. */
(function (root) {
  var api = root.RadioLabCore;
  var math = root.RemediationBasics;
  if (!api || !math) {
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

  function formatNumber(value) {
    if (Math.abs(value) >= 100) {
      return String(Math.round(value));
    }
    var rounded = Math.round(value * 1000) / 1000;
    return String(rounded);
  }

  api.register("unit-bench", function (ctx, block, stageId) {
    var tasks = (block.config && block.config.tasks) || [];
    var ui = shell(ctx, "Convert the quantity. The bar shows the same amount on two scales.");
    var index = 0;

    function show() {
      var task = tasks[index];
      ui.choices.textContent = "";
      if (!task) {
        api.finish(ctx, block, stageId, ui.note, block.config.doneText || "The prefixes name the same quantity at different scales.");
        return;
      }
      var answer = math.convertPrefix(task.value, task.from, task.to);
      var scale = Math.max(1, Math.min(24, Math.round(Math.abs(answer) > Math.abs(task.value) ? 18 : 6)));
      ui.prompt.textContent = "Task " + (index + 1) + " of " + tasks.length + ". " + task.prompt;
      ui.readout.textContent = task.value + " " + task.fromLabel + "  " + "█".repeat(scale) + "  the same amount written in " + task.toLabel;
      task.choices.forEach(function (choice) {
        ui.choices.appendChild(button(choice, function () {
          if (choice === formatNumber(answer) + " " + task.toLabel || choice === task.answerLabel) {
            ui.note.textContent = task.why;
            index += 1;
            show();
            return;
          }
          ui.note.textContent = "That is a different amount. Move the prefix, and check whether the number should grow or shrink.";
        }));
      });
    }

    show();
    return ui.wrap;
  });

  api.register("db-bench", function (ctx, block, stageId) {
    var ui = shell(ctx, "These are relative power steps, not a wattmeter. +3 dB is about double. +10 dB is about ten times. A negative step divides.");
    var watts = 10;
    var seen = {};

    function paint() {
      ui.readout.textContent = "Starting power " + watts + " W. This number is the power itself. A decibel change is a ratio applied to it, not a new kind of watt.";
    }

    function step(db) {
      var row = math.applyDb(watts, db);
      if (!row) {
        return;
      }
      watts = row.outputWatts;
      seen[String(db)] = true;
      ui.readout.textContent = row.db + " dB multiplies power by about " + row.factor + ". " + row.inputWatts + " W becomes " + formatNumber(row.outputWatts) + " W. The decibel is the ratio. The watt is still the power.";
    }

    paint();
    [3, 6, 10, -3, -6, -10].forEach(function (db) {
      ui.choices.appendChild(button((db > 0 ? "+" : "") + db + " dB", function () {
        step(db);
      }));
    });
    ui.choices.appendChild(button("5 W to 10 W is about +3 dB", function () {
      var doubled = math.applyDb(5, 3);
      if (!seen["3"] || !seen["-3"] || !seen["10"] || !doubled || doubled.outputWatts !== 10) {
        ui.note.textContent = "Apply +3 dB, −3 dB, and +10 dB, and read each ratio, before you answer.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "About +3 dB doubles power. About +6 dB is four times. About +10 dB is ten times. The sign reverses the step. A decibel is not a watt.");
    }));
    return ui.wrap;
  });

  api.register("circuit-layout", function (ctx, block, stageId) {
    var ui = shell(ctx, "Two 50 ohm resistors. Switch the layout and read the total.");
    var mode = "series";
    var sawSeries = false;
    var sawParallel = false;

    function paint() {
      var foundations = root.FoundationsSim;
      var row = mode === "series" ? math.seriesOhms([50, 50]) : math.parallelOhms([50, 50]);
      if (foundations) {
        var total = mode === "series" ? foundations.seriesOhms([50, 50]) : foundations.parallelOhms([50, 50]);
        if (total != null) {
          row.totalOhms = total;
        }
      }
      if (mode === "series") {
        sawSeries = true;
      } else {
        sawParallel = true;
      }
      ui.readout.textContent = mode.toUpperCase() + ". Total about " + formatNumber(row.totalOhms) + " ohms. " + (row.currentSame ? "The same current passes through both resistors." : "The voltage across each resistor is the same, and the current splits.");
    }

    paint();
    ui.choices.appendChild(button("Series", function () {
      mode = "series";
      paint();
    }));
    ui.choices.appendChild(button("Parallel", function () {
      mode = "parallel";
      paint();
    }));
    ui.choices.appendChild(button("Series adds, and these two in parallel are about 25 ohms", function () {
      if (!sawSeries || !sawParallel) {
        ui.note.textContent = "Build both layouts first.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "Series resistance adds, and the current is the same through each part. Parallel voltage is the same across each part, and two equal resistors in parallel total half of one.");
    }));
    return ui.wrap;
  });

  api.register("quantity-bench", function (ctx, block, stageId) {
    var problems = (block.config && block.config.problems) || [];
    var ui = shell(ctx, "You are given two quantities. Choose the relationship that uses those two, then the result. The formula card is under the field reference.");
    var index = 0;
    var picked = null;

    function show() {
      var problem = problems[index];
      ui.choices.textContent = "";
      picked = null;
      if (!problem) {
        api.finish(ctx, block, stageId, ui.note, block.config.doneText || "You matched the relationship to the quantities you had.");
        return;
      }
      ui.prompt.textContent = "Problem " + (index + 1) + ". " + problem.prompt;
      ui.readout.textContent = "Known: " + problem.known + ". The bench will not name the formula until you pick one.";
      problem.relations.forEach(function (relation) {
        ui.choices.appendChild(button(relation.label, function () {
          picked = relation.id;
          ui.note.textContent = relation.id === problem.relation ? "That relationship uses these two quantities." : "That relationship needs a quantity you were not given.";
        }));
      });
      problem.results.forEach(function (result) {
        ui.choices.appendChild(button(result.label, function () {
          if (picked !== problem.relation) {
            ui.note.textContent = "Pick the relationship that fits the two known quantities first.";
            return;
          }
          if (!result.correct) {
            ui.note.textContent = "The relationship is right. The arithmetic is not.";
            return;
          }
          ui.note.textContent = problem.why;
          index += 1;
          show();
        }));
      });
    }

    show();
    return ui.wrap;
  });

  api.register("part-bench", function (ctx, block, stageId) {
    var parts = (block.config && block.config.parts) || [];
    var ui = shell(ctx, "Select a part. Read what it does, then answer from the behavior, not from a list you memorized first.");
    var seen = {};
    parts.forEach(function (part) {
      ui.choices.appendChild(button(part.name, function () {
        seen[part.id] = true;
        ui.prompt.textContent = part.name;
        ui.readout.textContent = part.behavior;
      }));
    });
    ui.choices.appendChild(button("I can tell the one-way part from the gain part", function () {
      if (!seen.diode || !seen.led || !seen.transistor || !seen.fet || !seen.pot || !seen.battery || !seen.switch) {
        ui.note.textContent = "Open the battery, the diode, the LED, the transistor, the FET, the potentiometer, and the switch.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "A diode conducts one way. An LED lights when current passes that way. A bipolar transistor has emitter, base, and collector. A FET has source, gate, and drain. A potentiometer is a variable resistor.");
    }));
    return ui.wrap;
  });

  api.register("figure-lab", function (ctx, block, stageId) {
    var figures = (block.config && block.config.figures) || [];
    var ui = shell(ctx, "These are the official NCVEC figures. Name the numbered symbol you see.");
    var index = 0;
    var image = document.createElement("img");
    image.alt = "Official NCVEC schematic figure";
    image.style.maxWidth = "100%";
    ui.wrap.insertBefore(image, ui.readout);

    function contentSrc(path) {
      var base = document.documentElement.getAttribute("data-content-base") || "/content/";
      var prefix = base.charAt(base.length - 1) === "/" ? base : base + "/";
      return prefix + path;
    }

    function show() {
      var figure = figures[index];
      ui.choices.textContent = "";
      if (!figure) {
        api.finish(ctx, block, stageId, ui.note, "You named the symbols on the official figures.");
        return;
      }
      image.src = contentSrc(figure.image);
      image.alt = figure.alt;
      ui.prompt.textContent = figure.ask;
      ui.readout.textContent = "Look at the figure, then choose.";
      figure.choices.forEach(function (choice) {
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

  api.register("supply-path", function (ctx, block, stageId) {
    var order = ["transformer", "rectifier", "filter", "regulator", "load"];
    var labels = {
      transformer: "Transformer lowers the AC voltage",
      rectifier: "Rectifier passes one direction",
      filter: "Filter smooths the pulses",
      regulator: "Regulator holds the voltage steadier",
      load: "Load uses the DC",
    };
    var picked = [];
    var ui = shell(ctx, "Build the supply from the wall toward the radio. Choose the next block.");
    ui.readout.textContent = "Nothing in the chain yet.";
    Object.keys(labels).forEach(function (id) {
      ui.choices.appendChild(button(labels[id], function () {
        if (picked.indexOf(id) >= 0) {
          return;
        }
        if (order[picked.length] !== id) {
          ui.note.textContent = "That block is in the supply, and it is not the next one. Start from the incoming AC.";
          return;
        }
        picked.push(id);
        ui.readout.textContent = picked.map(function (item) { return labels[item]; }).join(" → ");
        ui.note.textContent = "Added.";
        if (picked.length === order.length) {
          api.finish(ctx, block, stageId, ui.note, "AC is transformed, rectified into pulses, filtered, regulated, and then used by the load.");
        }
      }));
    });
    return ui.wrap;
  });

  api.register("solder-lab", function (ctx, block, stageId) {
    var joints = (block.config && block.config.joints) || [];
    var ui = shell(ctx, "Diagnose the joint from how it looks. Do not heat a real iron in this lab.");
    var index = 0;

    function show() {
      var joint = joints[index];
      ui.choices.textContent = "";
      if (!joint) {
        api.finish(ctx, block, stageId, ui.note, "A useful joint is smooth and wets both parts. A cold joint looks dull and grainy. Acid-core solder is the wrong material for radios.");
        return;
      }
      ui.prompt.textContent = joint.look;
      ui.readout.textContent = joint.picture;
      joint.choices.forEach(function (choice) {
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

  api.register("rule-deck", function (ctx, block, stageId) {
    var ids = (block.config && block.config.ids) || [];
    var options = (block.config && block.config.options) || {};
    var ui = shell(ctx, "Decide from the situation. Open the field reference when you need the card.");
    var index = 0;

    function show() {
      var item = math.rule(ids[index]);
      ui.choices.textContent = "";
      if (!item) {
        if (api.finish(ctx, block, stageId, ui.note, block.config.doneText || "Those operating decisions are recorded.") === false) {
          ui.choices.appendChild(button("Record these decisions", show));
        }
        return;
      }
      ui.prompt.textContent = "Situation " + (index + 1) + " of " + ids.length + ". " + item.prompt;
      ui.readout.textContent = "Use the reference if the limit is a number or a privilege.";
      (options[item.id] || []).forEach(function (choice) {
        ui.choices.appendChild(button(choice.label, function () {
          if (choice.id === item.accept) {
            ui.note.textContent = item.why;
            index += 1;
            show();
            return;
          }
          ui.note.textContent = choice.why || "That choice does not match the rule in the reference.";
        }));
      });
    }

    if (!math.initRules().length) {
      ui.prompt.textContent = "The rule set did not load.";
      return ui.wrap;
    }
    show();
    return ui.wrap;
  });

  api.register("control-compare", function (ctx, block, stageId) {
    var scenes = [
      { text: "You are at the radio, hand on the microphone.", answer: "local", why: "The control point is at the station. That is local control." },
      { text: "You operate a radio across town through a control link.", answer: "remote", why: "The control operator is not at the station. A control link makes that remote control." },
      { text: "A repeater keys itself when a station arrives, and nobody is at the site.", answer: "automatic", why: "The station is under automatic control. A person is not performing the control function there." },
    ];
    var ui = shell(ctx, "Who or what is performing the control function?");
    var index = 0;

    function show() {
      var scene = scenes[index];
      ui.choices.textContent = "";
      if (!scene) {
        api.finish(ctx, block, stageId, ui.note, "Local, remote, and automatic control are three different places for the control function.");
        return;
      }
      ui.prompt.textContent = scene.text;
      ["local", "remote", "automatic"].forEach(function (id) {
        ui.choices.appendChild(button(id, function () {
          if (id === scene.answer) {
            ui.note.textContent = scene.why;
            index += 1;
            show();
            return;
          }
          ui.note.textContent = "Look at where the control operator is, or whether a device is doing it alone.";
        }));
      });
    }

    show();
    return ui.wrap;
  });

  api.register("privilege-lookup", function (ctx, block, stageId) {
    var ui = shell(ctx, "Look up the slice, then decide. 28.400 MHz is inside the phone slice in this reference. 28.500 MHz is the edge, a poor place to center a signal that has width.");
    var looked = false;
    ui.choices.appendChild(button("Look up Technician HF phone", function () {
      looked = true;
      ui.readout.textContent = "Reference: Technician HF phone is 28.300 to 28.500 MHz on 10 meters. Other HF phone is not in this Technician card. HF peak envelope power in this card is 200 watts. Above 30 MHz the usual maximum is 1500 watts PEP.";
    }));
    ui.choices.appendChild(button("28.400 MHz phone is inside the Technician slice", function () {
      if (!looked || !math.technicianHfPhone(28.4)) {
        ui.note.textContent = "Open the reference first.";
        return;
      }
      ui.note.textContent = "28.400 MHz is inside 28.300 to 28.500. 7.200 MHz phone is not on this card. " + math.technicianPep(28.4).note;
    }));
    ui.choices.appendChild(button("7.200 MHz phone is a Technician privilege here", function () {
      ui.note.textContent = math.technicianHfPhone(7.2) ? "The model says yes." : "7.200 MHz is outside the Technician HF phone slice in this reference.";
    }));
    ui.choices.appendChild(button("I used the card, not a guess", function () {
      if (!looked) {
        ui.note.textContent = "Open the reference before you finish.";
        return;
      }
      api.finish(ctx, block, stageId, ui.note, "You checked the card. Technician HF phone in this reference is the 10-meter slice, at 200 watts PEP.");
    }));
    return ui.wrap;
  });
})(typeof window !== "undefined" ? window : globalThis);
