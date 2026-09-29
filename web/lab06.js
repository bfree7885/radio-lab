/* Lab 06 — Antennas and SWR. A simplified match model, not an analyzer. */
(function () {
  var seeParts = { swr: false, place: false };

  function maybeSee(ctx) {
    if (seeParts.swr && seeParts.place) {
      ctx.complete("see");
    }
  }

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
    if (block.component === "antenna-discover") {
      return discover(ctx, block.config || {});
    }
    if (block.component === "swr-picture") {
      return swrPicture(ctx, block.config || {});
    }
    if (block.component === "antenna-tasks") {
      return tasks(ctx, block.config || {});
    }
    if (block.component === "placement") {
      return placement(ctx);
    }
    if (block.type === "explain") {
      return ctx.explain(block);
    }
    if (block.type === "exam") {
      return ctx.exam(block);
    }
    if (block.type === "fieldTask") {
      return fieldAntenna(ctx, block);
    }
    return ctx.paragraph("");
  }

  function targetMeters(mhz, kind) {
    var wave = FoundationsSim.wave(mhz);
    return kind === "half" ? wave.halfMeters : wave.quarterMeters;
  }

  function describe(mhz, kind, length) {
    var wave = FoundationsSim.wave(mhz);
    var target = kind === "half" ? wave.halfMeters : wave.quarterMeters;
    var match = FoundationsSim.matchSWR(length, target);
    var name = kind === "half" ? "half-wavelength" : "quarter-wavelength";
    return {
      wave: wave,
      target: target,
      match: match,
      text: "Frequency " + mhz + " MHz. Open-air wavelength about " + wave.meters.toFixed(2) +
        " m. A " + name + " is about " + target.toFixed(2) +
        " m. This wire is " + length.toFixed(2) + " m. Simplified SWR " +
        match.swr.toFixed(1) + ":1. The wire is " + match.relation +
        " relative to that size. Educational model, not an antenna analyzer. Length is not the whole of how an antenna works.",
    };
  }

  function createBench(config, onChange) {
    var mhz = config.mhz;
    var kind = config.kind || "quarter";
    var length = config.length;
    var root = document.createElement("div");
    root.className = "antenna-bench";
    var flag = document.createElement("p");
    flag.className = "sim-flag";
    flag.textContent = "EDUCATIONAL MODEL";
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    readout.setAttribute("aria-live", "polite");
    var bars = document.createElement("div");
    bars.className = "swr-bars";
    var forward = document.createElement("span");
    forward.className = "swr-forward";
    var reflected = document.createElement("span");
    reflected.className = "swr-reflected";
    bars.appendChild(forward);
    bars.appendChild(reflected);

    function button(label, action) {
      var node = document.createElement("button");
      node.type = "button";
      node.textContent = label;
      node.addEventListener("click", function () {
        action();
        paint(true);
      });
      return node;
    }

    function paint(fromUser) {
      if (length < 0.05) {
        length = 0.05;
      }
      if (length > 6) {
        length = 6;
      }
      var view = describe(mhz, kind, length);
      readout.textContent = view.text;
      forward.style.width = "100%";
      reflected.style.width = Math.round(view.match.reflection * 100) + "%";
      if (onChange) {
        onChange({
          mhz: mhz,
          kind: kind,
          length: length,
          match: view.match,
          quarter: view.wave.quarterMeters,
          half: view.wave.halfMeters,
        }, !!fromUser);
      }
    }

    var row = document.createElement("div");
    row.className = "tune-pad";
    [[146, "146 MHz"], [440, "440 MHz"]].forEach(function (pair) {
      row.appendChild(button(pair[1], function () {
        mhz = pair[0];
      }));
    });
    row.appendChild(button("Quarter-wave size", function () {
      kind = "quarter";
    }));
    row.appendChild(button("Half-wave size", function () {
      kind = "half";
    }));
    function setLength(next) {
      length = Math.max(0.02, Math.min(20, Math.round(next * 100) / 100));
    }
    row.appendChild(button("−10 cm", function () {
      setLength(length - 0.1);
    }));
    row.appendChild(button("−2 cm", function () {
      setLength(length - 0.02);
    }));
    row.appendChild(button("+2 cm", function () {
      setLength(length + 0.02);
    }));
    row.appendChild(button("+10 cm", function () {
      setLength(length + 0.1);
    }));
    root.appendChild(flag);
    root.appendChild(ctxPath());
    root.appendChild(readout);
    root.appendChild(bars);
    root.appendChild(row);
    paint(false);
    return { root: root, read: function () {
      return describe(mhz, kind, length);
    } };

    function ctxPath() {
      var line = document.createElement("p");
      line.className = "circuit-path";
      line.textContent = "Transmitter → feed line → antenna";
      return line;
    }
  }

  function discover(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("From Lab 01, a higher frequency has a shorter wavelength. Leave the wire alone and change the frequency. Then change the wire. This model only compares the wire with a quarter or half of the open-air wavelength."));
    var note = ctx.feedbackNode();
    var movedFrequency = false;
    var movedLength = false;
    var startLength = config.length;
    var bench = createBench(config, function (state, fromUser) {
      if (!fromUser) {
        return;
      }
      if (state.mhz !== config.mhz) {
        movedFrequency = true;
        note.textContent = "The frequency changed. The match moved even before you recut the wire. A size that fits one frequency is a different fraction of the wave at another frequency.";
      }
      if (Math.abs(state.length - startLength) >= 0.02) {
        movedLength = true;
      }
      if (movedFrequency && movedLength) {
        note.textContent = "You changed the frequency and the length. The simplified match followed both. A real antenna also depends on height, the feed line, and what is around it.";
        ctx.complete("learn");
      }
    });
    wrap.appendChild(bench.root);
    wrap.appendChild(note);
    return wrap;
  }

  function swrPicture(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Energy leaves the transmitter, travels the feed line, and reaches the antenna. The dark bar is forward energy. The amber bar is the reflected part in this model. SWR is an indicator of that match. A higher ratio here means more reflection. It is not a universal safe limit. The radio's own specifications and the situation matter."));
    var note = ctx.feedbackNode();
    var sawClose = false;
    var sawPoor = false;
    var bench = createBench(config, function (state, fromUser) {
      if (!fromUser) {
        return;
      }
      if (state.match.swr <= 1.5) {
        sawClose = true;
        note.textContent = "About " + state.match.swr.toFixed(1) + ":1. The reflected bar is small. In this model that is a close match. Another radio might still care about a number you can ignore here.";
      } else if (state.match.swr >= 2) {
        sawPoor = true;
        note.textContent = state.match.swr.toFixed(1) + ":1. More of the energy is shown coming back. That does not, by itself, tell you a universal danger line.";
      }
      if (sawClose && sawPoor) {
        seeParts.swr = true;
        maybeSee(ctx);
      }
    });
    wrap.appendChild(bench.root);
    wrap.appendChild(ctx.paragraph("Try 146 MHz and the quarter-wave size, then shorten or lengthen the wire until the match tightens. Then make the mismatch obvious."));
    wrap.appendChild(note);
    return wrap;
  }

  function tasks(ctx, config) {
    var wrap = document.createElement("div");
    var prompt = ctx.paragraph("");
    prompt.className = "challenge-prompt";
    var note = ctx.feedbackNode();
    var index = 0;
    var seen = {};
    var bench = createBench(config.bench, function (state, fromUser) {
      var task = config.tasks[index];
      if (!fromUser || !task || task.kind === "choice") {
        return;
      }
      if (task.check === "match") {
        var ok = state.mhz === task.mhz && state.kind === task.kind && state.match.relation === "matched";
        note.textContent = ok
          ? "The wire is near the " + task.kind + "-wave size at " + task.mhz + " MHz. Simplified SWR is " + state.match.swr.toFixed(1) + ":1."
          : "Set " + task.mhz + " MHz and the " + task.kind + "-wave size, then change the length until the readout says matched.";
        if (ok) {
          index += 1;
          show();
        }
      } else if (task.check === "compare") {
        if (state.kind !== "quarter") {
          note.textContent = "Select the quarter-wave size, then look at 146 MHz and 440 MHz.";
          return;
        }
        seen[state.mhz] = state.quarter;
        if (seen[146] && seen[440]) {
          note.textContent = "At 146 MHz a quarter wave is about " + seen[146].toFixed(2) + " m. At 440 MHz it is about " + seen[440].toFixed(2) + " m. The UHF size is shorter because the wavelength is shorter. That is the Lab 01 relationship, applied to a wire.";
          index += 1;
          show();
        } else {
          note.textContent = "Select 146 MHz and 440 MHz while the quarter-wave size is selected. Read both lengths.";
        }
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
        prompt.textContent = "Antenna checklist complete.";
        if (!(ctx.saved.stages && ctx.saved.stages.do)) {
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

  function placement(ctx) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("The match model is not the whole antenna. Where you put it also matters. This is only a placement sketch. Propagation comes in the next lab."));
    var note = ctx.feedbackNode();
    var saw = {};
    var captions = {
      low: "The antenna is low, near the ground and the rocks. That can change how it works, even if the length still matches the model.",
      higher: "The same antenna is higher. Height changed the situation. Higher is not automatically better in every place.",
      blocked: "A structure sits against the antenna. The wire can be the right length and still be a poor setup because of what is around it.",
      clearer: "The antenna is in a clearer spot. Placement changed, and the length did not have to.",
    };
    wrap.appendChild(ctx.choiceRow([
      ["Low", true],
      ["Higher", true],
      ["Blocked by a structure", true],
      ["Clearer position", true],
    ], function (_ok, button) {
      var key = button.textContent === "Low" ? "low"
        : button.textContent === "Higher" ? "higher"
          : button.textContent.indexOf("Blocked") === 0 ? "blocked" : "clearer";
      saw[key] = true;
      note.textContent = captions[key];
      if (saw.low && saw.higher && saw.blocked && saw.clearer) {
        note.textContent += " You tried all four positions. Length did not tell the whole story.";
        seeParts.place = true;
        maybeSee(ctx);
      }
    }));
    wrap.appendChild(note);
    return wrap;
  }

  function fieldAntenna(ctx, block) {
    var wrap = document.createElement("div");
    var config = block.config || {};
    wrap.appendChild(ctx.paragraph(block.prompt));
    var note = ctx.feedbackNode();
    var recorded = ctx.saved.fieldTasks && ctx.saved.fieldTasks[block.taskId] === "complete";
    var picked = null;
    var place = null;
    wrap.appendChild(ctx.paragraph("The outing is near 146 MHz. Compare each wire with a quarter wavelength, then choose a placement."));
    var bench = createBench({ mhz: 146, kind: "quarter", length: config.startLength }, function () {});
    wrap.appendChild(bench.root);
    config.choices.forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.addEventListener("click", function () {
        picked = choice;
        var view = describe(146, "quarter", choice.meters);
        note.textContent = choice.label + ". " + view.text;
        finish();
      });
      wrap.appendChild(button);
    });
    wrap.appendChild(ctx.choiceRow([
      ["Put it higher and clearer of the trailhead structure", true],
      ["Leave it lying against the metal sign", false],
    ], function (ok) {
      place = ok ? "clearer" : "blocked";
      finish();
    }));
    wrap.appendChild(note);

    function finish() {
      if (recorded) {
        note.textContent = "This field task is already recorded.";
        return;
      }
      if (!picked) {
        note.textContent = "Choose a wire and read its match at 146 MHz before you place it.";
        return;
      }
      var view = describe(146, "quarter", picked.meters);
      if (picked.role !== "fit" || view.match.relation !== "matched") {
        note.textContent = "That wire is " + view.match.relation + " for a quarter wave near 146 MHz in this model. Read the other lengths.";
        return;
      }
      if (place == null) {
        note.textContent = "That length is the closer match. Choose where to put the antenna.";
        return;
      }
      if (place !== "clearer") {
        note.textContent = "The length can be reasonable and the placement still poor. Choose the clearer, higher spot.";
        return;
      }
      recorded = true;
      note.textContent = "The quarter-wave size near 146 MHz is the closer match, and the clearer position keeps the structure off the antenna. This is still a simplified model.";
      ctx.setField(block.taskId, "complete").then(function () {
        ctx.complete("field");
        note.textContent += " Field task recorded.";
      });
    }
    return wrap;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
