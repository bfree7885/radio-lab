/* Lab 05 — Electricity without the textbook. */
(function () {
  var sim = function () {
    return window.FoundationsSim;
  };

  function boot() {
    if (!window.LessonKit || !window.FoundationsSim) {
      return;
    }
    LessonKit.boot(function (ctx) {
      ctx.lesson.stages.forEach(function (stage) {
        var mount = ctx.mount(stage.id);
        if (!mount) {
          return;
        }
        stage.blocks.forEach(function (block) {
          mount.appendChild(renderBlock(ctx, block));
        });
      });
    });
  }

  function renderBlock(ctx, block) {
    if (block.type === "text") {
      return ctx.paragraph(block.body);
    }
    if (block.component === "circuit-discover") {
      return discover(ctx, block.config || {});
    }
    if (block.component === "circuit-reveal") {
      return reveal(ctx, block.config || {});
    }
    if (block.component === "circuit-tasks") {
      return tasks(ctx, block.config || {});
    }
    if (block.type === "explain") {
      return ctx.explain(block);
    }
    if (block.type === "exam") {
      return ctx.exam(block);
    }
    if (block.type === "fieldTask") {
      return fieldPower(ctx, block);
    }
    return ctx.paragraph("");
  }

  function format(value, digits, unit) {
    if (value == null || !isFinite(value)) {
      return "—";
    }
    return sim().round(value, digits).toFixed(digits) + " " + unit;
  }

  function createBench(config, onChange) {
    var volts = config.volts;
    var ohms = config.ohms;
    var mode = "single";
    var root = document.createElement("div");
    root.className = "circuit";
    var flag = document.createElement("p");
    flag.className = "sim-flag";
    flag.textContent = "EDUCATIONAL MODEL";
    var diagram = document.createElement("p");
    diagram.className = "circuit-path";
    var meters = document.createElement("p");
    meters.className = "signal-readout";
    meters.setAttribute("aria-live", "polite");
    var voltsRow = document.createElement("div");
    voltsRow.className = "tune-pad";
    var ohmsRow = document.createElement("div");
    ohmsRow.className = "tune-pad";
    var modeRow = document.createElement("div");
    modeRow.className = "tune-pad";

    function button(label, pressed, action) {
      var node = document.createElement("button");
      node.type = "button";
      node.textContent = label;
      if (pressed) {
        node.setAttribute("aria-pressed", "true");
      }
      node.addEventListener("click", function () {
        action();
        paint(true);
      });
      return node;
    }

    function paint(fromUser) {
      voltsRow.textContent = "";
      ohmsRow.textContent = "";
      modeRow.textContent = "";
      config.voltSteps.forEach(function (value) {
        voltsRow.appendChild(button(value + " V", value === volts, function () {
          volts = value;
        }));
      });
      if (config.modes) {
        modeRow.appendChild(button("One load", mode === "single", function () {
          mode = "single";
        }));
        modeRow.appendChild(button("Two loads in series", mode === "series", function () {
          mode = "series";
        }));
        modeRow.appendChild(button("Two loads in parallel", mode === "parallel", function () {
          mode = "parallel";
        }));
      }
      var load = ohms;
      if (mode === "series") {
        load = sim().seriesOhms([config.loadA, config.loadB]);
      } else if (mode === "parallel") {
        load = sim().parallelOhms([config.loadA, config.loadB]);
      }
      if (mode === "single") {
        config.ohmSteps.forEach(function (value) {
          ohmsRow.appendChild(button(value + " ohms", value === ohms, function () {
            ohms = value;
          }));
        });
      }
      var reading = sim().ohmsLaw(volts, load);
      var harsh = !!(reading && (
        (config.harshOhms && reading.ohms <= config.harshOhms) ||
        (config.harshAmps && reading.amps >= config.harshAmps)
      ));
      diagram.textContent = mode === "series"
        ? "Supply → first load → second load → return path"
        : mode === "parallel"
          ? "Supply → two loads side by side → return path"
          : "Supply → load → return path";
      meters.textContent = reading
        ? "Supply " + format(reading.volts, 1, "V") +
          ". Load " + format(reading.ohms, 1, "ohms") +
          ". Current " + format(reading.amps, 2, "A") +
          ". Electrical power " + format(reading.watts, 1, "W") +
          "." + (harsh ? " This load is so small that the supply is almost shorted. That is not a useful radio load here. A real short can heat wires. This drawing cannot hurt you." : "")
        : "Set a supply and a load.";
      if (onChange) {
        onChange({
          volts: volts,
          ohms: mode === "single" ? ohms : load,
          mode: mode,
          amps: reading ? reading.amps : null,
          watts: reading ? reading.watts : null,
          harsh: !!harsh,
        }, !!fromUser);
      }
    }

    root.appendChild(flag);
    root.appendChild(diagram);
    root.appendChild(meters);
    root.appendChild(voltsRow);
    root.appendChild(ohmsRow);
    root.appendChild(modeRow);
    paint(false);
    return { root: root };
  }

  function discover(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Start with one supply, one load, and a return path. Change the supply, then change the load. Watch the current. The formula can wait."));
    var note = ctx.feedbackNode();
    var raisedVolts = false;
    var raisedOhms = false;
    var bench = createBench(config, function (state, fromUser) {
      if (!fromUser) {
        return;
      }
      if (state.volts > config.volts && state.ohms === config.ohms) {
        raisedVolts = true;
        note.textContent = "The supply went up and the load stayed the same. Current went up with it. Power drawn from the supply went up too.";
      } else if (state.ohms > config.ohms && state.volts === config.volts) {
        raisedOhms = true;
        note.textContent = "The load's resistance went up and the supply stayed the same. Current went down.";
      } else if (!raisedVolts) {
        note.textContent = "Try a higher supply voltage while the load stays at " + config.ohms + " ohms.";
      } else if (!raisedOhms) {
        note.textContent = "Put the supply back to " + config.volts + " V, then try a higher resistance.";
      }
      if (raisedVolts && raisedOhms) {
        note.textContent = "You saw both changes. Voltage pushes. Resistance opposes. Current is what results. The next stage names that relationship.";
        ctx.complete("learn");
      }
    });
    wrap.appendChild(bench.root);
    wrap.appendChild(note);
    return wrap;
  }

  function reveal(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Voltage = current × resistance. Current = voltage / resistance. Resistance = voltage / current. Volts, amperes, and ohms are the units. You do not need a triangle to remember it. Use the bench."));
    wrap.appendChild(ctx.paragraph("Electrical power in watts is about voltage times current. That is power taken from the supply. A radio's RF output is a different number. Do not treat them as the same thing."));
    wrap.appendChild(ctx.paragraph("Two loads in series add. Two loads side by side, in parallel, combine to less than either one alone. Try both."));
    var note = ctx.feedbackNode();
    var saw = { series: false, parallel: false };
    var bench = createBench(config, function (state, fromUser) {
      if (!fromUser || state.mode === "single") {
        return;
      }
      saw[state.mode] = true;
      if (state.mode === "series") {
        note.textContent = "Series total is " + format(state.ohms, 0, "ohms") + ". The current is smaller than it would be through one of those loads alone, because the total resistance is higher.";
      } else {
        note.textContent = "Parallel total is " + format(state.ohms, 0, "ohms") + ". That is lower than either load alone, so more current flows from the same supply.";
      }
      if (saw.series && saw.parallel) {
        ctx.complete("see");
      }
    });
    wrap.appendChild(bench.root);
    wrap.appendChild(note);
    return wrap;
  }

  function tasks(ctx, config) {
    var wrap = document.createElement("div");
    var prompt = ctx.paragraph("");
    prompt.className = "challenge-prompt";
    var note = ctx.feedbackNode();
    var index = 0;
    var bench = createBench(config.bench, function (state, fromUser) {
      var task = config.tasks[index];
      if (!fromUser || !task || task.kind === "choice") {
        return;
      }
      var result = judge(task, state);
      note.textContent = result.message;
      if (result.pass) {
        index += 1;
        show();
      }
    });
    var choices = document.createElement("div");
    wrap.appendChild(prompt);
    wrap.appendChild(bench.root);
    wrap.appendChild(choices);
    wrap.appendChild(note);
    if (ctx.saved.stages && ctx.saved.stages.do) {
      index = config.tasks.length;
    }
    show();

    function show() {
      var task = config.tasks[index];
      choices.textContent = "";
      if (!task) {
        prompt.textContent = "Circuit checklist complete.";
        if (!(ctx.saved.stages && ctx.saved.stages.do)) {
          note.textContent = "You changed voltage, resistance, a calculated current, electrical power, a harsh load, and series versus parallel.";
          ctx.complete("do");
        }
        return;
      }
      prompt.textContent = "Step " + (index + 1) + " of " + config.tasks.length + ". " + task.prompt;
      if (task.kind === "choice") {
        choices.appendChild(ctx.choiceRow(task.choices.map(function (choice) {
          return [choice.label, !!choice.correct];
        }), function (ok) {
          note.textContent = ok ? task.success : task.hint;
          if (ok) {
            index += 1;
            show();
          }
        }));
      }
    }
    return wrap;
  }

  function judge(task, state) {
    if (task.check === "voltage-up") {
      return state.volts === task.volts && state.mode === "single"
        ? { pass: true, message: "Current rose. The load did not change. The higher supply pushed more current." }
        : { pass: false, message: "Use one load and select " + task.volts + " V." };
    }
    if (task.check === "resistance-up") {
      return state.ohms === task.ohms && state.volts === task.volts && state.mode === "single"
        ? { pass: true, message: "Current fell. Resistance opposed more of the same supply." }
        : { pass: false, message: "Keep " + task.volts + " V and select " + task.ohms + " ohms." };
    }
    if (task.check === "reading") {
      var reading = sim().ohmsLaw(state.volts, state.ohms);
      var close = reading && Math.abs(reading.amps - task.amps) < 0.02 && state.mode === "single";
      return close
        ? { pass: true, message: "The bench shows about " + task.amps + " A. Current = voltage / resistance. Electrical power here is about " + format(reading.watts, 1, "W") + ", drawn from the supply, not RF output." }
        : { pass: false, message: "Set " + task.volts + " V and " + task.ohms + " ohms on one load, then read the current." };
    }
    if (task.check === "harsh") {
      return state.harsh
        ? { pass: true, message: "The current jumped. A near-short is not a radio load. The next step asks you to name that." }
        : { pass: false, message: "Select the smallest load resistance and read the warning." };
    }
    if (task.check === "parallel") {
      return state.mode === "parallel"
        ? { pass: true, message: "The parallel combination is " + format(state.ohms, 0, "ohms") + ", lower than either load alone." }
        : { pass: false, message: "Choose two loads in parallel and compare the total with one load." };
    }
    return { pass: false, message: "Use the bench for this step." };
  }

  function fieldPower(ctx, block) {
    var wrap = document.createElement("div");
    var config = block.config || {};
    wrap.appendChild(ctx.paragraph(block.prompt));
    var note = ctx.feedbackNode();
    var receive = sim().powerWatts(config.volts, config.receiveAmps);
    var transmit = sim().powerWatts(config.volts, config.transmitAmps);
    var seen = { receive: false, transmit: false };
    var recorded = ctx.saved.fieldTasks && ctx.saved.fieldTasks[block.taskId] === "complete";
    var board = document.createElement("div");
    board.className = "circuit";
    var flag = document.createElement("p");
    flag.className = "sim-flag";
    flag.textContent = "EDUCATIONAL MODEL";
    var meters = document.createElement("p");
    meters.className = "signal-readout";
    meters.setAttribute("aria-live", "polite");
    meters.textContent = "Supply " + config.volts + " V. Press the operating condition to see the electrical power it asks of the supply.";
    function show(amps, label) {
      if (label === "Receiving") {
        seen.receive = true;
      }
      if (label === "Transmitting") {
        seen.transmit = true;
      }
      var watts = sim().powerWatts(config.volts, amps);
      meters.textContent = label + ": " + format(config.volts, 1, "V") + " × " + format(amps, 1, "A") + " = " + format(watts, 1, "W") + " from the supply. This is electrical input power, not RF output power.";
    }
    var row = document.createElement("div");
    row.className = "tune-pad";
    [["Receiving", config.receiveAmps], ["Transmitting", config.transmitAmps]].forEach(function (pair) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = pair[0];
      button.addEventListener("click", function () {
        show(pair[1], pair[0]);
      });
      row.appendChild(button);
    });
    board.appendChild(flag);
    board.appendChild(meters);
    board.appendChild(row);
    wrap.appendChild(board);
    wrap.appendChild(ctx.paragraph("Which condition asks more from the power system, and why?"));
    wrap.appendChild(ctx.choiceRow([
      ["Transmitting. It draws more current, so electrical power is higher.", true],
      ["Receiving. A quiet radio always uses more power.", false],
      ["They match, because RF output and supply power are the same number.", false],
    ], function (ok) {
      if (recorded) {
        note.textContent = "This field task is already recorded.";
        return;
      }
      if (!seen.receive || !seen.transmit) {
        note.textContent = "Read both the receive and transmit figures before you answer.";
        return;
      }
      if (!ok) {
        note.textContent = "Compare the two watt readings. Transmit current is higher, so power from the supply is higher. That watt figure is still not the radio's RF output.";
        return;
      }
      recorded = true;
      note.textContent = "Transmit draws about " + format(transmit, 1, "W") + " from this supply. Receive draws about " + format(receive, 1, "W") + ". The difference is the current. Later portable-power lessons can build on this.";
      ctx.setField(block.taskId, "complete").then(function () {
        ctx.complete("field");
        note.textContent += " Field task recorded.";
      });
    }));
    wrap.appendChild(note);
    return wrap;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
