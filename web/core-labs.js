/* Technician Core labs TC-01 through TC-04. One script, lesson JSON picks the activity. */
(function () {
  var gates = {};

  function boot() {
    if (!window.LessonKit || !window.CoreSim) {
      return;
    }
    LessonKit.boot(function (ctx) {
      ctx.lesson.stages.forEach(function (stage) {
        var mount = ctx.mount(stage.id);
        if (!mount) {
          return;
        }
        stage.blocks.forEach(function (block) {
          mount.appendChild(renderBlock(ctx, block, stage.id));
        });
      });
    });
  }

  function renderBlock(ctx, block, stageId) {
    if (block.type === "text") {
      return ctx.paragraph(block.body);
    }
    if (block.type === "explain") {
      return ctx.explain(block);
    }
    if (block.type === "exam") {
      return ctx.exam(block);
    }
    if (block.component === "field-reference") {
      return reference(ctx, block);
    }
    if (block.component === "decision-deck") {
      return decisions(ctx, block, stageId);
    }
    if (block.component === "id-timeline") {
      return timeline(ctx, block, stageId);
    }
    if (block.component === "edge-meter") {
      return edgeMeter(ctx, block, stageId);
    }
    if (block.component === "on-air") {
      return onAir(ctx, block, stageId);
    }
    if (block.component === "phonetic") {
      return phonetic(ctx, block, stageId);
    }
    if (block.component === "gain-filter") {
      return gainFilter(ctx, block, stageId);
    }
    if (block.component === "control-review") {
      return controlReview(ctx, block, stageId);
    }
    if (block.component === "component-bench") {
      return componentBench(ctx, block, stageId);
    }
    if (block.component === "schematic-lab") {
      return schematicLab(ctx, block, stageId);
    }
    if (block.component === "signal-path") {
      return signalPath(ctx, block, stageId);
    }
    if (block.component === "modulation-lab") {
      return modulationLab(ctx, block, stageId);
    }
    if (block.component === "diagnose") {
      return diagnose(ctx, block, stageId);
    }
    if (block.component === "power-path") {
      return powerPath(ctx, block, stageId);
    }
    return ctx.paragraph("");
  }

  function finish(ctx, block, stageId, note, message) {
    note.textContent = message;
    if (block.gate) {
      gates[block.gate] = true;
    }
    if (block.recordsStage === false) {
      return;
    }
    var waiting = (block.requiresGates || []).filter(function (id) { return !gates[id]; });
    if (waiting.length) {
      note.textContent = message + " Finish the earlier part of this stage first.";
      return;
    }
    if (ctx.saved.stages && ctx.saved.stages[stageId] && !block.taskId) {
      return;
    }
    if (block.taskId) {
      ctx.setField(block.taskId, "complete").then(function () {
        ctx.complete(stageId);
        note.textContent += " Field task recorded.";
      });
      return;
    }
    ctx.complete(stageId);
  }

  function reference(ctx, block) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph(block.body || "The reference is there to be opened. Looking it up is part of operating."));
    if (window.RadioLabReference) {
      RadioLabReference.mount(wrap, (block.config && block.config.file) || "reference/technician-core.json");
    }
    return wrap;
  }

  function decisions(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    var prompt = ctx.paragraph("");
    prompt.className = "challenge-prompt";
    var choices = document.createElement("div");
    choices.className = "tune-pad";
    var note = ctx.feedbackNode();
    var index = 0;
    wrap.appendChild(prompt);
    wrap.appendChild(choices);
    wrap.appendChild(note);
    show();
    return wrap;

    function show() {
      var scene = (config.scenes || [])[index];
      choices.textContent = "";
      if (!scene) {
        prompt.textContent = config.doneText || "Those decisions are recorded.";
        finish(ctx, block, stageId, note, config.doneText || "Those decisions are recorded.");
        return;
      }
      prompt.textContent = "Situation " + (index + 1) + " of " + config.scenes.length + ". " + scene.prompt;
      scene.choices.forEach(function (choice) {
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = choice.label;
        button.addEventListener("click", function () {
          note.textContent = choice.why;
          if (choice.correct) {
            index += 1;
            show();
          }
        });
        choices.appendChild(button);
      });
    }
  }

  function timeline(ctx, block, stageId) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("A contact is under way. The clock advances only when you let it. Identify with your call sign before the gap grows past 10 minutes, and again when the contact ends."));
    var clock = document.createElement("p");
    clock.className = "signal-readout";
    var row = document.createElement("div");
    row.className = "tune-pad";
    var note = ctx.feedbackNode();
    var minute = 0;
    var lastId = null;
    var endMinute = 20;
    function paint() {
      var since = lastId == null ? "no identification yet" : "last identification at " + lastId + " min";
      clock.textContent = "Contact time " + minute + " min. " + since + ".";
    }
    function button(label, action) {
      var node = document.createElement("button");
      node.type = "button";
      node.textContent = label;
      node.addEventListener("click", function () {
        action();
        paint();
      });
      return node;
    }
    row.appendChild(button("Say your call sign", function () {
      lastId = minute;
      note.textContent = "The station is identified at " + minute + " minutes. The call sign is the identification. Phonetics can make it clearer. They do not replace it.";
    }));
    row.appendChild(button("Let the contact continue", function () {
      var next = minute + 5;
      if (lastId == null || next - lastId > 10) {
        note.textContent = "The gap since the last identification would be more than 10 minutes. Identify before you continue.";
        return;
      }
      minute = next;
      note.textContent = minute >= endMinute
        ? "The contact has reached the end. Identify again as you finish."
        : "The contact continues. Keep track of the last time you said the call sign.";
    }));
    row.appendChild(button("End the contact", function () {
      if (minute < endMinute) {
        note.textContent = "Let the contact run until it reaches " + endMinute + " minutes, and keep the identifications inside the 10-minute gap.";
        return;
      }
      if (lastId !== minute) {
        note.textContent = "End it by identifying. The last identification has to be at the end, not only somewhere in the middle.";
        return;
      }
      finish(ctx, block, stageId, note, "You identified at the start of the long gap and again at the end. That is the station-identification habit this lab practices.");
    }));
    wrap.appendChild(clock);
    wrap.appendChild(row);
    wrap.appendChild(note);
    paint();
    return wrap;
  }

  function edgeMeter(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("The allocation in this model runs from 144.000 to 148.000 MHz. The drawn signal is wider than a single frequency. Park it so the whole signal stays inside."));
    var flag = ctx.paragraph("EDUCATIONAL MODEL");
    flag.className = "sim-flag";
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    var row = document.createElement("div");
    row.className = "tune-pad";
    var note = ctx.feedbackNode();
    var sawCross = false;
    var parked = false;
    var half = config.halfKhz || 8;
    var low = config.bandLow;
    var high = config.bandHigh;
    function describe(center) {
      var span = CoreSim.emissionSpan(center, half);
      var inside = CoreSim.emissionInside(center, half, low, high);
      readout.textContent = "Center " + (center / 1000).toFixed(3) + " MHz. Signal from " +
        (span.low / 1000).toFixed(3) + " to " + (span.high / 1000).toFixed(3) +
        " MHz. " + (inside ? "The whole signal is inside the allocation." : "Part of the signal is outside the allocation.");
      return inside;
    }
    (config.centers || []).forEach(function (center) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = (center / 1000).toFixed(3) + " MHz";
      button.addEventListener("click", function () {
        var inside = describe(center);
        if (!inside) {
          sawCross = true;
          note.textContent = "The center looks close to a legal frequency, and the edge of the signal is already outside. Move in until the whole signal fits.";
          return;
        }
        if (!sawCross) {
          note.textContent = "That center fits. Also try the one nearest the top edge and watch the signal width.";
          return;
        }
        parked = true;
        finish(ctx, block, stageId, note, "The whole signal stays inside. Being near the edge is not the same as being safely inside, because the emission has width. Use the minimum power that completes the contact. The legal maximum is a ceiling, not a goal.");
      });
      row.appendChild(button);
    });
    wrap.appendChild(flag);
    wrap.appendChild(readout);
    wrap.appendChild(row);
    wrap.appendChild(note);
    if (parked) {
      note.textContent = "The signal is parked inside.";
    }
    return wrap;
  }

  function onAir(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    var heard = document.createElement("p");
    heard.className = "signal-readout";
    var prompt = ctx.paragraph("");
    prompt.className = "challenge-prompt";
    var row = document.createElement("div");
    row.className = "tune-pad";
    var note = ctx.feedbackNode();
    var index = 0;
    var actions = ["LISTEN", "TRANSMIT", "IDENTIFY", "WAIT", "CHANGE FREQUENCY", "ADJUST"];
    wrap.appendChild(heard);
    wrap.appendChild(prompt);
    wrap.appendChild(row);
    wrap.appendChild(note);
    show();
    return wrap;

    function show() {
      var step = (config.steps || [])[index];
      row.textContent = "";
      if (!step) {
        prompt.textContent = config.doneText || "Contact sequence complete.";
        heard.textContent = "The frequency is quiet in this model.";
        finish(ctx, block, stageId, note, config.doneText || "Contact sequence complete.");
        return;
      }
      prompt.textContent = "Step " + (index + 1) + " of " + config.steps.length + ". " + step.prompt;
      heard.textContent = step.heard || "Nothing drawn yet. Listen before you decide.";
      actions.forEach(function (action) {
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = action;
        button.addEventListener("click", function () {
          if (action === step.expect) {
            note.textContent = step.success;
            index += 1;
            show();
            return;
          }
          note.textContent = (step.hints && step.hints[action]) || step.hint || "That action does not fit what you can hear.";
        });
        row.appendChild(button);
      });
    }
  }

  function phonetic(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Build the phonetic form of the call sign in order. The call sign itself is still the identification."));
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    var row = document.createElement("div");
    row.className = "tune-pad";
    var note = ctx.feedbackNode();
    var built = [];
    var target = config.words || [];
    function paint() {
      readout.textContent = "Call sign " + (config.call || "") + ". Phonetic so far: " + (built.join(" ") || "(none)");
    }
    target.forEach(function (word) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = word;
      button.addEventListener("click", function () {
        if (built.length >= target.length) {
          return;
        }
        if (word !== target[built.length]) {
          note.textContent = "Use the next word in the call sign order.";
          return;
        }
        built.push(word);
        paint();
        if (built.length === target.length) {
          finish(ctx, block, stageId, note, "That spells the call sign in phonetics. On the air you still say the call sign. Phonetics make the letters easier to copy.");
        }
      });
      row.appendChild(button);
    });
    (config.decoys || []).forEach(function (word) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = word;
      button.addEventListener("click", function () {
        note.textContent = "That word is not the next letter of this call sign.";
      });
      row.appendChild(button);
    });
    wrap.appendChild(readout);
    wrap.appendChild(row);
    wrap.appendChild(note);
    paint();
    return wrap;
  }

  function gainFilter(ctx, block, stageId) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Microphone gain changes how strong your voice is at the transmitter. A filter changes how much of the channel the receiver passes. Both are settings, not a broken radio."));
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    var row = document.createElement("div");
    row.className = "tune-pad";
    var note = ctx.feedbackNode();
    var gain = "unset";
    var filter = "unset";
    var sawWide = false;
    var sawNarrow = false;
    function paint() {
      var gainText = gain === "high" ? "Audio is distorted." : gain === "low" ? "Audio is weak." : gain === "usable" ? "Audio is understandable." : "Gain has not been set.";
      var filterText = filter === "wide" ? "A wide filter passes the voice and more noise." : filter === "narrow" ? "A narrow filter cuts noise and can also cut the voice if it is too tight." : "No filter selected.";
      readout.textContent = gainText + " " + filterText + " Educational model.";
    }
    function mark() {
      paint();
      if (gain === "usable" && sawWide && sawNarrow) {
        finish(ctx, block, stageId, note, "Usable gain is enough to be understood without distortion. The filter is a choice about noise and the width of the signal, not a volume control.");
      }
    }
    [
      ["Mic gain low", function () { gain = "low"; note.textContent = "The other station would struggle to copy a very weak voice."; }],
      ["Mic gain usable", function () { gain = "usable"; note.textContent = "The voice is strong enough to understand and not overdriven."; }],
      ["Mic gain high", function () { gain = "high"; note.textContent = "Too much gain flattens the voice. Turning it down is the fix. Replacing the radio is not."; }],
      ["Wide filter", function () { filter = "wide"; sawWide = true; note.textContent = "More of the channel gets through, including noise beside the voice."; }],
      ["Narrow filter", function () { filter = "narrow"; sawNarrow = true; note.textContent = "Less noise gets through. If the voice starts to sound cut off, the filter is too narrow for it."; }],
    ].forEach(function (pair) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = pair[0];
      button.addEventListener("click", function () {
        pair[1]();
        mark();
      });
      row.appendChild(button);
    });
    wrap.appendChild(readout);
    wrap.appendChild(row);
    wrap.appendChild(note);
    paint();
    return wrap;
  }

  function controlReview(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Same handheld as Foundations Lab 02. Power on, use VFO, and set squelch so this signal opens the speaker. Squelch does not create the signal."));
    var note = ctx.feedbackNode();
    if (!window.RadioHandheld) {
      wrap.appendChild(ctx.paragraph("The handheld did not load. Reload the page."));
      return wrap;
    }
    var set = RadioHandheld.create({
      startKhz: config.startKhz || 145000,
      power: false,
      volume: 0,
      squelch: 9,
      noise: 2,
      signals: [{ khz: config.signalKhz || 146520, strength: 8, halfKhz: 10, name: "simplex station" }],
      onChange: function (state, fromUser) {
        if (!fromUser) {
          return;
        }
        var ready = state.power && state.mode === "vfo" && state.displayKhz === (config.signalKhz || 146520) &&
          state.volume >= 3 && state.reason === "signal";
        if (ready) {
          finish(ctx, block, stageId, note, "VFO is on the station, the volume is up, and squelch is letting the signal through. Memory can store that frequency later. It is not required to hear it.");
          return;
        }
        note.textContent = "Power on, tune the VFO to 146.520 MHz, raise volume to at least 3, and lower squelch until the signal opens the speaker.";
      },
    });
    wrap.appendChild(set.root);
    wrap.appendChild(note);
    return wrap;
  }

  function componentBench(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph(config.intro || "Select a part and change the condition. The drawing is a teaching model."));
    var flag = ctx.paragraph("EDUCATIONAL MODEL");
    flag.className = "sim-flag";
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    var parts = document.createElement("div");
    parts.className = "tune-pad";
    var controls = document.createElement("div");
    controls.className = "tune-pad";
    var note = ctx.feedbackNode();
    var tried = {};
    var charge = 0;
    var selected = null;

    function need() {
      return config.parts || [];
    }

    function done() {
      return need().every(function (id) { return tried[id]; });
    }

    function mark(id, text) {
      tried[id] = true;
      readout.textContent = text;
      if (done()) {
        finish(ctx, block, stageId, note, config.doneText || "You tried each part in this set.");
      }
    }

    function select(id) {
      selected = id;
      controls.textContent = "";
      var builders = {
        resistor: resistorControls,
        switch: switchControls,
        fuse: fuseControls,
        diode: diodeControls,
        capacitor: capacitorControls,
        inductor: inductorControls,
        relay: relayControls,
        transistor: transistorControls,
      };
      if (builders[id]) {
        builders[id]();
      }
    }

    function addControl(label, action) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", action);
      controls.appendChild(button);
    }

    function resistorControls() {
      [25, 100].forEach(function (ohms) {
        addControl(ohms + " ohm load", function () {
          var amps = CoreSim.limitedCurrent(12, ohms);
          mark("resistor", "12 V across " + ohms + " ohms. Current about " + CoreSim.round(amps, 2) + " A. A larger resistance lets less current through. This is the Lab 05 relationship.");
        });
      });
    }

    function switchControls() {
      addControl("Close the switch", function () {
        mark("switch", "The path is closed. Current can reach the load.");
      });
      addControl("Open the switch", function () {
        mark("switch", "The path is open. The supply is still there, and the load gets no current.");
      });
    }

    function fuseControls() {
      addControl("Normal 1 A load", function () {
        var state = CoreSim.fuseState(1, 2);
        mark("fuse", "1 A through a 2 A fuse. The fuse is " + state + ". It is a wire chosen to open before the rest of the wiring is damaged.");
      });
      addControl("Short, about 6 A", function () {
        var state = CoreSim.fuseState(6, 2);
        mark("fuse", "6 A would flow, which is above the 2 A fuse. The fuse is " + state + ". This drawing cannot hurt you. A real short can heat wires.");
      });
    }

    function diodeControls() {
      addControl("Forward", function () {
        mark("diode", CoreSim.diodeConducts("forward")
          ? "Forward: this model lets current through."
          : "Forward is blocked.");
      });
      addControl("Reverse", function () {
        mark("diode", CoreSim.diodeConducts("reverse")
          ? "Reverse conducts."
          : "Reverse: this model blocks current. A real diode is more detailed than a one-way arrow.");
      });
    }

    function capacitorControls() {
      addControl("Connect to the supply", function () {
        charge = CoreSim.capacitorStep(charge, true);
        mark("capacitor", "Charge indicator " + charge + " of 100. The capacitor is storing energy while it is connected. It is not a battery that runs the radio for the afternoon.");
      });
      addControl("Disconnect", function () {
        charge = CoreSim.capacitorStep(charge, false);
        mark("capacitor", "Charge indicator " + charge + " of 100. Disconnecting lets the stored charge fall in this model.");
      });
    }

    function inductorControls() {
      addControl("Steady current", function () {
        mark("inductor", "A steady current is established. The magnetic field is the idea to notice, not a formula.");
      });
      addControl("Sudden change", function () {
        mark("inductor", "The inductor opposes the sudden change. Current in this model rises a moment later instead of jumping. That opposition is inductance, in beginner form.");
      });
    }

    function relayControls() {
      addControl("Energize the coil", function () {
        mark("relay", "A small coil current pulls the contacts closed. The lamp is on a different path from the coil. The coil did not power the lamp by itself.");
      });
      addControl("Release the coil", function () {
        mark("relay", "The coil is off and the contacts open. The lamp path is open again.");
      });
    }

    function transistorControls() {
      addControl("Control signal low", function () {
        mark("transistor", "The control is low. The larger path stays off in this switch-like model. A transistor is not only a switch, and this is not a full amplifier lesson.");
      });
      addControl("Control signal high", function () {
        mark("transistor", "A small control change lets the larger path conduct. That is the idea: a small signal influences a larger current.");
      });
    }

    need().forEach(function (id) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = id.charAt(0).toUpperCase() + id.slice(1);
      button.addEventListener("click", function () {
        select(id);
        note.textContent = "Change the condition for the " + id + ", then read the result.";
      });
      parts.appendChild(button);
    });
    wrap.appendChild(flag);
    wrap.appendChild(parts);
    wrap.appendChild(controls);
    wrap.appendChild(readout);
    wrap.appendChild(note);
    return wrap;
  }

  function schematicLab(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("The left side is the physical chain. The right side is the schematic. Highlight one, and the same part lights on the other side. Then name the symbols."));
    var physical = document.createElement("div");
    physical.className = "tune-pad";
    var symbols = document.createElement("div");
    symbols.className = "tune-pad";
    var note = ctx.feedbackNode();
    var highlighted = null;
    var named = {};
    var askIndex = 0;
    var asking = false;

    function paint() {
      Array.from(physical.children).forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-part") === highlighted ? "true" : "false");
      });
      Array.from(symbols.children).forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-part") === highlighted ? "true" : "false");
      });
    }

    function ask() {
      var item = (config.identify || [])[askIndex];
      if (!item) {
        finish(ctx, block, stageId, note, "The schematic names the electrical job, not the photograph. Same part, two drawings.");
        return;
      }
      asking = true;
      note.textContent = "Which symbol is the " + item.name + "?";
    }

    (config.parts || []).forEach(function (part) {
      var left = document.createElement("button");
      left.type = "button";
      left.textContent = part.physical;
      left.setAttribute("data-part", part.id);
      left.addEventListener("click", function () {
        if (asking) {
          return;
        }
        highlighted = part.id;
        paint();
        note.textContent = part.physical + " is the " + part.symbol + " on the schematic.";
      });
      physical.appendChild(left);
      var right = document.createElement("button");
      right.type = "button";
      right.textContent = part.symbol;
      right.setAttribute("data-part", part.id);
      right.addEventListener("click", function () {
        if (!asking) {
          highlighted = part.id;
          paint();
          note.textContent = part.symbol + " is the " + part.physical + " in the chain.";
          return;
        }
        var item = config.identify[askIndex];
        if (part.id === item.id) {
          named[item.id] = true;
          askIndex += 1;
          highlighted = part.id;
          paint();
          asking = false;
          ask();
          return;
        }
        note.textContent = "That symbol is the " + part.physical + ". Look for the " + item.name + ".";
      });
      symbols.appendChild(right);
    });
    var start = document.createElement("button");
    start.type = "button";
    start.textContent = "Name the symbols";
    start.addEventListener("click", function () {
      askIndex = 0;
      ask();
    });
    wrap.appendChild(physical);
    wrap.appendChild(symbols);
    wrap.appendChild(start);
    wrap.appendChild(note);
    return wrap;
  }

  function signalPath(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph(config.intro || "Select each stage. The order on the page is the path."));
    var flag = ctx.paragraph("EDUCATIONAL MODEL");
    flag.className = "sim-flag";
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    var row = document.createElement("div");
    row.className = "tune-pad";
    var note = ctx.feedbackNode();
    var seen = {};
    (config.stages || []).forEach(function (stage) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = stage.label;
      button.addEventListener("click", function () {
        seen[stage.id] = true;
        readout.textContent = stage.label + ". " + stage.role;
        if ((config.stages || []).every(function (item) { return seen[item.id]; })) {
          finish(ctx, block, stageId, note, config.doneText || "You walked the whole path.");
        }
      });
      row.appendChild(button);
    });
    wrap.appendChild(flag);
    wrap.appendChild(row);
    wrap.appendChild(readout);
    wrap.appendChild(note);
    return wrap;
  }

  function modulationLab(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Each picture is a cartoon of how information can ride on a radio signal. It is not a complete RF drawing."));
    var flag = ctx.paragraph("EDUCATIONAL MODEL");
    flag.className = "sim-flag";
    var picture = document.createElement("p");
    picture.className = "mod-picture";
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    var row = document.createElement("div");
    row.className = "tune-pad";
    var note = ctx.feedbackNode();
    var seen = {};
    (config.modes || []).forEach(function (mode) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = mode.label;
      button.addEventListener("click", function () {
        seen[mode.id] = true;
        picture.textContent = mode.picture;
        readout.textContent = mode.note;
        if ((config.modes || []).every(function (item) { return seen[item.id]; })) {
          finish(ctx, block, stageId, note, "Information changes the radio signal in different ways. Recognizing the name is the goal here, not drawing a real waveform.");
        }
      });
      row.appendChild(button);
    });
    wrap.appendChild(flag);
    wrap.appendChild(row);
    wrap.appendChild(picture);
    wrap.appendChild(readout);
    wrap.appendChild(note);
    return wrap;
  }

  function diagnose(ctx, block, stageId) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    var prompt = ctx.paragraph("");
    prompt.className = "challenge-prompt";
    var choices = document.createElement("div");
    choices.className = "tune-pad";
    var note = ctx.feedbackNode();
    var index = 0;
    wrap.appendChild(ctx.paragraph("Check in this order when you can: power, connections, settings, signal path, then a measurement. Do not start by replacing a part you have not checked."));
    wrap.appendChild(prompt);
    wrap.appendChild(choices);
    wrap.appendChild(note);
    show();
    return wrap;

    function show() {
      var item = (config.cases || [])[index];
      choices.textContent = "";
      if (!item) {
        prompt.textContent = config.doneText || "The checks are done.";
        finish(ctx, block, stageId, note, config.doneText || "The checks are done.");
        return;
      }
      prompt.textContent = "Case " + (index + 1) + " of " + config.cases.length + ". " + item.observation;
      item.choices.forEach(function (choice) {
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = choice.label;
        button.addEventListener("click", function () {
          note.textContent = choice.why;
          if (choice.correct) {
            index += 1;
            show();
          }
        });
        choices.appendChild(button);
      });
    }
  }

  function powerPath(ctx, block, stageId) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("The portable radio is dark. The chain is battery, fuse, switch, radio. Check the chain before you decide the radio itself failed."));
    var readout = document.createElement("p");
    readout.className = "circuit-path";
    readout.textContent = "Battery — fuse — switch — radio. The radio stays dark.";
    var row = document.createElement("div");
    row.className = "tune-pad";
    var note = ctx.feedbackNode();
    var saw = { battery: false, fuse: false, switch: false };
    function button(label, action) {
      var node = document.createElement("button");
      node.type = "button";
      node.textContent = label;
      node.addEventListener("click", action);
      return node;
    }
    row.appendChild(button("Check the battery", function () {
      saw.battery = true;
      note.textContent = "The battery reads about 12.6 V. Power is present at the battery. The dark radio is farther along the chain.";
    }));
    row.appendChild(button("Check the switch", function () {
      saw.switch = true;
      note.textContent = "The switch is closed. It is not the open point.";
    }));
    row.appendChild(button("Check the fuse", function () {
      saw.fuse = true;
      note.textContent = "The fuse is open. Current cannot pass it. The battery and the switch can both be fine while the radio stays dark.";
    }));
    row.appendChild(button("Replace the radio", function () {
      note.textContent = "The radio has not been shown to be the failed part. An open fuse in front of it produces the same dark panel.";
    }));
    row.appendChild(button("Replace the fuse and try again", function () {
      if (!saw.battery || !saw.fuse) {
        note.textContent = "Check the battery and the fuse before you change a part.";
        return;
      }
      readout.textContent = "Battery — new fuse — switch — radio. The panel lights.";
      finish(ctx, block, stageId, note, "The open fuse was the break. Replacing the radio would have left the open fuse in the chain.");
    }));
    wrap.appendChild(readout);
    wrap.appendChild(row);
    wrap.appendChild(note);
    return wrap;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
