/* Lab 07 — Propagation and range. An educational path model, not a prediction. */
(function () {
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
    if (block.component === "path-discover") {
      return discover(ctx, block.config || {});
    }
    if (block.component === "path-compare") {
      return compare(ctx, block.config || {});
    }
    if (block.component === "path-tasks") {
      return tasks(ctx, block.config || {});
    }
    if (block.type === "explain") {
      return ctx.explain(block);
    }
    if (block.type === "exam") {
      return ctx.exam(block);
    }
    if (block.type === "fieldTask") {
      return fieldPaths(ctx, block);
    }
    return ctx.paragraph("");
  }

  function createScene(config, onChange) {
    var state = {
      band: config.band || "vhf",
      mode: config.mode || "simplex",
      obstacle: config.obstacle || "hill",
      height: config.height || "low",
      position: config.position || "same",
      power: config.power || "low",
    };
    var root = document.createElement("div");
    root.className = "terrain-lab";
    var flag = document.createElement("p");
    flag.className = "sim-flag";
    flag.textContent = "EDUCATIONAL MODEL";
    var scene = document.createElement("div");
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    readout.setAttribute("aria-live", "polite");

    function button(label, pressed, action) {
      var node = document.createElement("button");
      node.type = "button";
      node.textContent = label;
      node.setAttribute("aria-pressed", pressed ? "true" : "false");
      node.addEventListener("click", function () {
        action();
        paint(true);
      });
      return node;
    }

    function row(pairs) {
      var line = document.createElement("div");
      line.className = "tune-pad";
      pairs.forEach(function (pair) {
        line.appendChild(button(pair[0], pair[1], pair[2]));
      });
      return line;
    }

    function draw() {
      scene.textContent = "";
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 640 220");
      svg.setAttribute("class", "spectrum-svg");
      svg.setAttribute("aria-hidden", "true");
      var ground = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      ground.setAttribute("x", "0");
      ground.setAttribute("y", "170");
      ground.setAttribute("width", "640");
      ground.setAttribute("height", "50");
      ground.setAttribute("fill", "#24312b");
      svg.appendChild(ground);
      if (state.obstacle !== "none") {
        var hill = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        hill.setAttribute("points", state.obstacle === "ridge" ? "250,170 390,170 320,40" : "270,170 390,170 330,110");
        hill.setAttribute("fill", "#31403a");
        svg.appendChild(hill);
      }
      if (state.band === "hf") {
        var sky = document.createElementNS("http://www.w3.org/2000/svg", "path");
        sky.setAttribute("d", "M80 150 Q320 20 560 150");
        sky.setAttribute("fill", "none");
        sky.setAttribute("stroke", "#8fd0c6");
        sky.setAttribute("stroke-width", "3");
        svg.appendChild(sky);
      }
      var heightY = state.height === "high" ? 70 : 150;
      [[90, "A"], [540, "B"]].forEach(function (station) {
        var mark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        mark.setAttribute("cx", String(station[0]));
        mark.setAttribute("cy", String(heightY));
        mark.setAttribute("r", "8");
        mark.setAttribute("fill", "#e0b15a");
        svg.appendChild(mark);
      });
      scene.appendChild(svg);
    }

    function paint(fromUser) {
      draw();
      var result = FoundationsSim.assessPath(state);
      var powerLine = state.power === "high"
        ? " Transmitter power is high in this drawing."
        : " Transmitter power is low in this drawing.";
      readout.textContent = result.label + ". " + result.note + powerLine + " Power does not change the path result in this model.";
      root.replaceChildren(flag, scene, readout, controls());
      if (onChange) {
        onChange(Object.assign({ result: result }, state), !!fromUser);
      }
    }

    function controls() {
      var box = document.createElement("div");
      box.appendChild(row([
        ["VHF/UHF", state.band === "vhf", function () { state.band = "vhf"; }],
        ["HF introduction", state.band === "hf", function () { state.band = "hf"; }],
      ]));
      box.appendChild(row([
        ["Simplex", state.mode === "simplex", function () { state.mode = "simplex"; }],
        ["Repeater", state.mode === "repeater", function () { state.mode = "repeater"; }],
      ]));
      box.appendChild(row([
        ["No obstacle", state.obstacle === "none", function () { state.obstacle = "none"; }],
        ["Hill", state.obstacle === "hill", function () { state.obstacle = "hill"; }],
        ["Ridge", state.obstacle === "ridge", function () { state.obstacle = "ridge"; }],
      ]));
      box.appendChild(row([
        ["Low antennas", state.height === "low", function () { state.height = "low"; }],
        ["Higher antennas", state.height === "high", function () { state.height = "high"; }],
      ]));
      box.appendChild(row([
        ["Same position", state.position === "same", function () { state.position = "same"; }],
        ["Clearer ground", state.position === "clearer", function () { state.position = "clearer"; }],
      ]));
      box.appendChild(row([
        ["Low power", state.power === "low", function () { state.power = "low"; }],
        ["High power", state.power === "high", function () { state.power = "high"; }],
      ]));
      return box;
    }

    paint(false);
    return { root: root };
  }

  function discover(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Range is not a power knob. Start with two stations, a hill, and low antennas. Then raise the antennas. This drawing is a teaching model."));
    var note = ctx.feedbackNode();
    var sawBlocked = false;
    var sawClear = false;
    var scene = createScene(config, function (state, fromUser) {
      if (!fromUser) {
        return;
      }
      if (state.result.code === "obstructed") {
        sawBlocked = true;
      }
      if (state.result.code === "clear" && state.obstacle === "hill" && state.height === "high") {
        sawClear = true;
      }
      note.textContent = state.result.label + ". " + state.result.note;
      if (sawBlocked && sawClear) {
        note.textContent = "The hill blocked the low path. Raising the antennas opened a simplified line of sight. Higher will not clear every obstacle. The next stage tries one that it does not clear.";
        ctx.complete("learn");
      }
    });
    wrap.appendChild(scene.root);
    wrap.appendChild(note);
    return wrap;
  }

  function compare(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Put a ridge between the stations. Raise the power. Then raise the antennas. Then try the repeater. After that, open the HF sketch and compare it with the VHF/UHF line-of-sight idea."));
    var note = ctx.feedbackNode();
    var saw = { power: false, repeater: false, hf: false };
    var scene = createScene(config, function (state, fromUser) {
      if (!fromUser) {
        return;
      }
      if (state.obstacle === "ridge" && state.mode === "simplex" && state.power === "high" && state.result.code === "obstructed") {
        saw.power = true;
        note.textContent = "High power, and the ridge is still there. More watts did not open this path.";
      }
      if (state.obstacle === "ridge" && state.result.code === "repeater") {
        saw.repeater = true;
        note.textContent = "The repeater path is the one that gets past the ridge in this model.";
      }
      if (state.band === "hf" && state.result.code === "skywave") {
        saw.hf = true;
        note.textContent = state.result.note;
      }
      if (saw.power && saw.repeater && saw.hf) {
        note.textContent = "Power did not clear the ridge. The repeater path did, in this model. The HF curve is a different idea: a signal returned from the ionosphere, and not a guarantee.";
        ctx.complete("see");
      }
    });
    wrap.appendChild(scene.root);
    wrap.appendChild(note);
    return wrap;
  }

  function tasks(ctx, config) {
    var wrap = document.createElement("div");
    var prompt = ctx.paragraph("");
    prompt.className = "challenge-prompt";
    var note = ctx.feedbackNode();
    var index = 0;
    var scene = createScene(config.scene, function (state, fromUser) {
      var task = config.tasks[index];
      if (!fromUser || !task || task.kind === "choice") {
        return;
      }
      var pass = true;
      Object.keys(task.expect || {}).forEach(function (key) {
        if (state[key] !== task.expect[key] && state.result[key] !== task.expect[key]) {
          pass = false;
        }
      });
      if (task.expectCode && state.result.code !== task.expectCode) {
        pass = false;
      }
      note.textContent = pass ? task.success : task.hint;
      if (pass) {
        index += 1;
        show();
      }
    });
    var choices = document.createElement("div");
    wrap.appendChild(prompt);
    wrap.appendChild(scene.root);
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
        prompt.textContent = "Path checklist complete.";
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

  function fieldPaths(ctx, block) {
    var wrap = document.createElement("div");
    var config = block.config || {};
    wrap.appendChild(ctx.paragraph(block.prompt));
    var note = ctx.feedbackNode();
    var recorded = ctx.saved.fieldTasks && ctx.saved.fieldTasks[block.taskId] === "complete";
    var contact = "valley";
    var valleyReady = false;
    var ridgeReady = false;
    wrap.appendChild(ctx.choiceRow([
      ["Friend in the valley", true],
      ["Station beyond the ridge", true],
    ], function (_ok, button) {
      contact = button.textContent.indexOf("ridge") >= 0 ? "ridge" : "valley";
      note.textContent = contact === "valley"
        ? "The valley path is the hill. Simplex may open if the antennas are higher."
        : "The ridge blocks simplex in this model. The repeater is the path you were given.";
    }));
    var scene = createScene(config.scene, function (state, fromUser) {
      if (!fromUser) {
        return;
      }
      if (contact === "valley" && state.band === "vhf" && state.mode === "simplex" && state.obstacle === "hill" && state.result.code === "clear") {
        valleyReady = true;
        note.textContent = "The valley friend has a clear simplified path. Higher antennas, or clearer ground, did that. Power was not the fix.";
      }
      if (contact === "ridge" && state.obstacle === "ridge" && state.result.code === "repeater") {
        ridgeReady = true;
        note.textContent = "The station beyond the ridge is on the repeater path in this model.";
      }
      if (valleyReady && ridgeReady && !recorded) {
        recorded = true;
        note.textContent = "Each path used a different fix. The valley opened with geometry. The ridge used the repeater. More power was not the answer for the ridge.";
        ctx.setField(block.taskId, "complete").then(function () {
          ctx.complete("field");
          note.textContent += " Field task recorded.";
        });
      }
    });
    wrap.appendChild(scene.root);
    wrap.appendChild(note);
    return wrap;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
