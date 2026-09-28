/* Lab 01 — What Is Radio?

   Renders the shared lesson file. Simulation runs in the browser.
   Progress goes through whichever adapter the page installed.
*/
(function () {
  var STAGE_IDS = ["learn", "see", "do", "explain", "exam", "field"];
  var WINDOW_KHZ = 400;

  function boot() {
    var session = document.getElementById("lab-session");
    if (!session || !window.RadioLab || !window.RadioLabSim) {
      return;
    }
    var delivery = document.documentElement.getAttribute("data-delivery");
    if (delivery !== "hosted" && window.RadioLabLocalProgress && !RadioLab.progress) {
      RadioLab.useProgress(RadioLabLocalProgress.create());
    }
    var labId = session.getAttribute("data-lab-id");
    RadioLab.curriculum.load()
      .then(function () {
        return RadioLab.lesson.load(labId);
      })
      .then(function (lesson) {
        return readProgress(lesson)
          .catch(function () {
            return emptySaved();
          })
          .then(function (saved) {
            render(session, lesson, saved || emptySaved());
          });
      })
      .catch(function () {
        var note = document.createElement("p");
        note.textContent = "The lesson file did not load. Reload the page to try again.";
        session.prepend(note);
      });
  }

  function emptySaved() {
    return { status: "not_started", stages: {}, concepts: {}, exams: [], fieldTasks: {} };
  }

  function readProgress(lesson) {
    var progress = RadioLab.progress;
    if (!progress) {
      return Promise.resolve(emptySaved());
    }
    if (typeof progress.load === "function") {
      return progress.load(lesson.labId, lesson.curriculumId);
    }
    var saved = emptySaved();
    saved.status = progress.getLabStatus(lesson.labId, lesson.curriculumId);
    STAGE_IDS.forEach(function (stageId) {
      saved.stages[stageId] = !!progress.stageCompleted(lesson.labId, stageId, lesson.curriculumId);
    });
    if (typeof progress.getConceptStatus === "function") {
      saved.concepts["tuning-selects-frequency"] = progress.getConceptStatus(
        "tuning-selects-frequency",
        lesson.curriculumId
      );
    }
    if (typeof progress.examLog === "function") {
      saved.exams = progress.examLog(lesson.labId, lesson.curriculumId);
    }
    if (typeof progress.getFieldTask === "function") {
      var task = progress.getFieldTask("lab01-simplex-146520", lesson.curriculumId);
      if (task) {
        saved.fieldTasks[task.taskId || "lab01-simplex-146520"] = task.status;
      }
    }
    return Promise.resolve(saved);
  }

  function render(session, lesson, saved) {
    var book = {
      lesson: lesson,
      saved: saved,
      signals: lesson.signals || [],
    };
    lesson.stages.forEach(function (stage) {
      var mount = session.querySelector('[data-stage-mount="' + stage.id + '"]');
      if (!mount) {
        return;
      }
      mount.textContent = "";
      stage.blocks.forEach(function (block) {
        mount.appendChild(renderBlock(book, stage, block));
      });
      paintStage(stage.id, !!(saved.stages && saved.stages[stage.id]));
    });
    paintLabStatus(saved.status || "not_started");
  }

  function renderBlock(book, stage, block) {
    if (block.type === "text") {
      return paragraph(block.body);
    }
    if (block.type === "interaction" && block.component === "unit-converter") {
      return unitConverter(book, block.config || {});
    }
    if (block.type === "simulation" && block.component === "spectrum-receiver") {
      return spectrumSection(book, block.config || {}, function (fromUser, state) {
        if (fromUser && state.centered) {
          completeStage(book, "see");
        }
      });
    }
    if (block.type === "interaction" && block.component === "tuning-challenges") {
      return challenges(book, block.config || {});
    }
    if (block.type === "interaction" && block.component === "wavelength") {
      return wavelengthLab(book, block.config || {});
    }
    if (block.type === "explain") {
      return explainPanel(book, block);
    }
    if (block.type === "exam") {
      return examPanel(book, block);
    }
    if (block.type === "fieldTask") {
      return fieldPanel(book, block);
    }
    return paragraph("This part of the lab is missing a viewer.");
  }

  function paragraph(text) {
    var node = document.createElement("p");
    node.textContent = text || "";
    return node;
  }

  function simulationAllowed() {
    var caps = RadioLab.capabilities;
    if (!caps || typeof caps.available !== "function") {
      return true;
    }
    return caps.available("simulation.frequency") && caps.available("simulation.receiver");
  }

  function heldNotice() {
    return paragraph("The frequency simulation is turned off in this session, so the receiver stays hidden. No radio hardware is required for this lab.");
  }

  function unitConverter(book, config) {
    var wrap = document.createElement("div");
    wrap.className = "instrument";
    var signals = document.createElement("ul");
    signals.className = "signal-legend";
    book.signals.forEach(function (signal) {
      var item = document.createElement("li");
      var name = document.createElement("strong");
      name.textContent = signal.name + " · " + RadioLabSim.formatMhz(signal.khz) + " MHz";
      item.appendChild(name);
      item.appendChild(document.createTextNode(" " + signal.blurb));
      signals.appendChild(item);
    });
    wrap.appendChild(signals);

    var intro = paragraph("The same frequency can be written in hertz, kilohertz, or megahertz. Change the value and watch all three stay equal.");
    wrap.appendChild(intro);

    var form = document.createElement("form");
    form.className = "tune-form";
    var valueLabel = document.createElement("label");
    valueLabel.textContent = "Frequency value";
    var value = document.createElement("input");
    value.type = "text";
    value.inputMode = "decimal";
    value.value = config.start || "146.520";
    value.setAttribute("aria-label", "Frequency value");
    valueLabel.appendChild(value);
    var unitLabel = document.createElement("label");
    unitLabel.textContent = "Unit";
    var unit = document.createElement("select");
    unit.setAttribute("aria-label", "Frequency unit");
    ["MHz", "kHz", "Hz"].forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      if (name === (config.unit || "MHz")) {
        option.selected = true;
      }
      unit.appendChild(option);
    });
    unitLabel.appendChild(unit);
    form.appendChild(valueLabel);
    form.appendChild(unitLabel);
    wrap.appendChild(form);

    var presets = document.createElement("div");
    presets.className = "tune-pad";
    (config.presets || []).forEach(function (preset) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = preset.label;
      button.addEventListener("click", function () {
        touched = true;
        value.value = preset.value;
        unit.value = preset.unit;
        show();
      });
      presets.appendChild(button);
    });
    wrap.appendChild(presets);

    var live = document.createElement("p");
    live.className = "freq-equal";
    live.setAttribute("aria-live", "polite");
    wrap.appendChild(live);
    var hint = paragraph(config.hint || "");
    hint.className = "feedback";
    wrap.appendChild(hint);
    var touched = false;

    function show() {
      var khz = RadioLabSim.parseFrequency(value.value, unit.value);
      if (khz === null) {
        live.textContent = "Enter a frequency above zero. This receiver's dial runs from 88.000 MHz to 450.000 MHz.";
        return;
      }
      live.textContent =
        RadioLabSim.formatMhz(khz) +
        " MHz = " +
        RadioLabSim.formatKhz(khz) +
        " kHz = " +
        RadioLabSim.formatHz(khz) +
        " Hz. One hertz is one wave cycle each second. A kilohertz is one thousand hertz. A megahertz is one thousand kilohertz.";
      if (touched) {
        completeStage(book, "learn");
      }
    }

    value.addEventListener("input", function () {
      touched = true;
      show();
    });
    unit.addEventListener("change", function () {
      touched = true;
      show();
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      show();
    });
    show();
    return wrap;
  }

  function spectrumSection(book, config, onTune) {
    if (!simulationAllowed()) {
      return heldNotice();
    }
    var wrap = document.createElement("div");
    var lead = paragraph("Move the tuning control. The example signals stay put. Only the frequency this receiver is listening to changes.");
    wrap.appendChild(lead);
    var note = paragraph("VHF in this lab means about 30 to 300 MHz. UHF means about 300 to 3000 MHz. 146.520 MHz and 162.550 MHz are VHF. 446.000 MHz is UHF. Those names are ranges. They do not, by themselves, tell you how far a signal will travel.");
    wrap.appendChild(note);
    wrap.appendChild(createReceiver(book.signals, config, onTune).root);
    wrap.appendChild(paragraph(config.caption || ""));
    return wrap;
  }

  function createReceiver(signals, config, onTune) {
    var sim = RadioLabSim;
    var khz = config.startKhz || 120000;
    var root = document.createElement("div");
    root.className = "instrument";

    var flag = document.createElement("p");
    flag.className = "sim-flag";
    flag.textContent = "SIMULATION";
    root.appendChild(flag);

    var readout = document.createElement("p");
    readout.className = "freq-readout";
    root.appendChild(readout);
    var units = document.createElement("p");
    units.className = "freq-units";
    root.appendChild(units);

    var regionLabel = document.createElement("label");
    regionLabel.textContent = "Move along the spectrum";
    var region = document.createElement("input");
    region.type = "range";
    region.min = "88";
    region.max = "449";
    region.step = "1";
    regionLabel.appendChild(region);
    root.appendChild(regionLabel);

    var fineLabel = document.createElement("label");
    fineLabel.textContent = "Fine tune within that megahertz";
    var fine = document.createElement("input");
    fine.type = "range";
    fine.min = "0";
    fine.max = "995";
    fine.step = "5";
    fineLabel.appendChild(fine);
    root.appendChild(fineLabel);

    var pad = document.createElement("div");
    pad.className = "tune-pad";
    [
      ["−10 MHz", -10000],
      ["−1 MHz", -1000],
      ["−100 kHz", -100],
      ["−10 kHz", -10],
      ["+10 kHz", 10],
      ["+100 kHz", 100],
      ["+1 MHz", 1000],
      ["+10 MHz", 10000],
    ].forEach(function (step) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = step[0];
      button.addEventListener("click", function () {
        setKhz(khz + step[1], true);
      });
      pad.appendChild(button);
    });
    root.appendChild(pad);

    var typed = document.createElement("form");
    typed.className = "tune-form";
    var typeLabel = document.createElement("label");
    typeLabel.textContent = "Type a frequency in MHz";
    var typeInput = document.createElement("input");
    typeInput.type = "text";
    typeInput.inputMode = "decimal";
    typeInput.setAttribute("aria-label", "Type a frequency in MHz");
    typeLabel.appendChild(typeInput);
    var setButton = document.createElement("button");
    setButton.type = "submit";
    setButton.textContent = "Tune";
    typed.appendChild(typeLabel);
    typed.appendChild(setButton);
    typed.addEventListener("submit", function (event) {
      event.preventDefault();
      var parsed = sim.parseFrequency(typeInput.value, "MHz");
      if (parsed === null) {
        live.textContent = "Enter a frequency between 88.000 and 450.000 MHz.";
        return;
      }
      setKhz(parsed, true);
    });
    root.appendChild(typed);

    var map = document.createElement("div");
    map.className = "band-map";
    map.setAttribute("aria-hidden", "true");
    var marker = document.createElement("span");
    marker.className = "band-marker";
    map.appendChild(marker);
    signals.forEach(function (signal) {
      var tick = document.createElement("span");
      tick.className = "band-tick";
      tick.style.left = mapPercent(signal.khz) + "%";
      tick.title = signal.name;
      map.appendChild(tick);
    });
    root.appendChild(map);

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 160");
    svg.setAttribute("class", "spectrum-svg");
    svg.setAttribute("aria-hidden", "true");
    root.appendChild(svg);

    var meter = document.createElement("div");
    meter.className = "strength";
    meter.setAttribute("aria-hidden", "true");
    var fill = document.createElement("span");
    fill.className = "strength-fill";
    meter.appendChild(fill);
    root.appendChild(meter);

    var live = document.createElement("p");
    live.className = "signal-readout";
    live.setAttribute("aria-live", "polite");
    root.appendChild(live);

    var legend = document.createElement("ul");
    legend.className = "signal-legend";
    signals.forEach(function (signal) {
      var item = document.createElement("li");
      item.textContent = signal.name + " · " + sim.formatMhz(signal.khz) + " MHz · " + signal.range;
      legend.appendChild(item);
    });
    root.appendChild(legend);

    var reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Reset tuning";
    reset.addEventListener("click", function () {
      setKhz(config.startKhz || 120000, false);
    });
    root.appendChild(reset);

    region.addEventListener("input", function () {
      setKhz(Number(region.value) * 1000 + (khz % 1000), true);
    });
    fine.addEventListener("input", function () {
      setKhz(Math.floor(khz / 1000) * 1000 + Number(fine.value), true);
    });

    function mapPercent(value) {
      return ((value - sim.MIN_KHZ) / (sim.MAX_KHZ - sim.MIN_KHZ)) * 100;
    }

    function setKhz(next, fromUser) {
      var clamped = sim.clampKhz(next);
      if (clamped === null) {
        return;
      }
      khz = clamped;
      draw(fromUser);
    }

    function draw(fromUser) {
      var state = sim.tuneState(khz, signals);
      readout.textContent = sim.formatMhz(khz) + " MHz";
      units.textContent = sim.formatKhz(khz) + " kHz · " + sim.formatHz(khz) + " Hz";
      region.value = String(Math.floor(khz / 1000));
      fine.value = String(Math.min(995, khz % 1000));
      typeInput.value = sim.formatMhz(khz);
      marker.style.left = mapPercent(khz) + "%";
      fill.style.width = (state.strength / 9) * 100 + "%";
      drawSpectrum(svg, khz, signals);
      var heard = "No signal in this window. Background noise. Strength 0 of 9.";
      if (state.centered) {
        heard =
          "Centered on " +
          state.signal.name +
          " (" +
          state.signal.range +
          "). Strength 9 of 9. " +
          state.signal.blurb;
      } else if (state.nearby) {
        heard =
          "A signal is nearby: " +
          state.signal.name +
          ". Not centered yet. Strength " +
          state.strength +
          " of 9.";
      }
      if (config.showWavelength) {
        heard += " Approximate wavelength " + sim.formatWavelength(khz) + " m.";
      }
      live.textContent = heard;
      if (onTune) {
        onTune(!!fromUser, state, khz);
      }
    }

    draw(false);
    return {
      root: root,
      getKhz: function () {
        return khz;
      },
      setKhz: setKhz,
    };
  }

  function drawSpectrum(svg, tunedKhz, signals) {
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    var noise = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var d = "M0 124";
    var pattern = [122, 126, 120, 128, 123, 125, 119, 127];
    for (var i = 0; i < 48; i += 1) {
      var x = (i / 47) * 640;
      d += " L" + x.toFixed(1) + " " + pattern[i % pattern.length];
    }
    noise.setAttribute("d", d);
    noise.setAttribute("fill", "none");
    noise.setAttribute("stroke", "#31403a");
    noise.setAttribute("stroke-width", "2");
    svg.appendChild(noise);

    signals.forEach(function (signal) {
      var delta = signal.khz - tunedKhz;
      if (Math.abs(delta) > WINDOW_KHZ / 2) {
        return;
      }
      var cx = 320 + (delta / WINDOW_KHZ) * 640;
      var half = Math.max(10, (signal.halfKhz / WINDOW_KHZ) * 640);
      var hump = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      hump.setAttribute(
        "points",
        cx - half + ",124 " + cx + ",46 " + (cx + half) + ",124"
      );
      hump.setAttribute("fill", "rgba(143, 208, 198, 0.45)");
      hump.setAttribute("stroke", "#8fd0c6");
      svg.appendChild(hump);
    });

    var marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
    marker.setAttribute("x1", "320");
    marker.setAttribute("x2", "320");
    marker.setAttribute("y1", "18");
    marker.setAttribute("y2", "142");
    marker.setAttribute("stroke", "#e0b15a");
    marker.setAttribute("stroke-width", "3");
    svg.appendChild(marker);
  }

  function challenges(book, config) {
    if (!simulationAllowed()) {
      return heldNotice();
    }
    var wrap = document.createElement("div");
    wrap.appendChild(paragraph("Use the receiver. Each challenge is finished by tuning, not by a multiple-choice guess."));
    var list = config.challenges || [];
    var index = 0;
    var left = false;
    var passed = [];
    var advancing = false;
    var prompt = document.createElement("p");
    prompt.className = "challenge-prompt";
    var feedback = document.createElement("p");
    feedback.className = "feedback";
    feedback.setAttribute("aria-live", "polite");
    var again = document.createElement("button");
    again.type = "button";
    again.textContent = "Practice these challenges again";
    again.hidden = true;

    function current() {
      return list[index];
    }

    function showPrompt() {
      var item = current();
      if (!item) {
        prompt.textContent = "Those four tuning challenges are done. The wave experiment is next.";
        feedback.textContent = "";
        again.hidden = false;
        book.tuneChallengesDone = true;
        maybeFinishDo(book);
        return;
      }
      prompt.textContent = "Challenge " + (index + 1) + " of " + list.length + ". " + item.prompt;
      if (!book.saved.stages.do) {
        feedback.textContent = "Tune the receiver. Feedback will show up here.";
      }
    }

    var receiver = createReceiver(book.signals, { startKhz: config.startKhz, showWavelength: true }, function (fromUser, state, khz) {
      var item = current();
      if (!item || !fromUser || advancing) {
        return;
      }
      var code = item.kind === "target-khz"
        ? RadioLabSim.judgeTarget(khz, item.targetKhz, item.toleranceKhz)
        : RadioLabSim.judgeSignal(khz, signalById(book, item.signalId), book.signals);
      if (item.requireLeaveKhz && item.kind === "center-signal") {
        var target = signalById(book, item.signalId);
        if (Math.abs(khz - target.khz) >= item.requireLeaveKhz) {
          left = true;
        }
        if (code === "centered" && !left) {
          code = "leave";
        }
      }
      var message = (item.feedback && item.feedback[code]) || "";
      if (code === "wrong-signal" && state.signal) {
        message = message.replace("{name}", state.signal.name);
      }
      feedback.textContent = message;
      if (code === "centered" && passed.indexOf(item.id) === -1) {
        passed.push(item.id);
        advancing = true;
        window.setTimeout(function () {
          left = false;
          advancing = false;
          index += 1;
          showPrompt();
        }, 700);
      }
    });

    again.addEventListener("click", function () {
      index = 0;
      left = false;
      passed = [];
      advancing = false;
      again.hidden = true;
      receiver.setKhz(config.startKhz, false);
      showPrompt();
    });

    wrap.appendChild(prompt);
    wrap.appendChild(receiver.root);
    wrap.appendChild(feedback);
    wrap.appendChild(again);
    if (book.saved.stages && book.saved.stages.do) {
      book.tuneChallengesDone = true;
      index = list.length;
      prompt.textContent = "You already finished the tuning challenges. You can practice them again without losing that.";
      again.hidden = false;
    } else {
      showPrompt();
    }
    return wrap;
  }

  function signalById(book, id) {
    for (var i = 0; i < book.signals.length; i += 1) {
      if (book.signals[i].id === id) {
        return book.signals[i];
      }
    }
    return book.signals[0];
  }

  function wavelengthLab(book, config) {
    var wrap = document.createElement("div");
    wrap.className = "instrument";
    wrap.appendChild(paragraph("Drag the frequency and watch the wave. Do not start with a formula. See what the picture does, then open the shortcut if you want it."));
    var khz = config.startKhz || 146000;
    var movedDown = false;
    var label = document.createElement("p");
    label.className = "freq-readout";
    var waveText = document.createElement("p");
    waveText.setAttribute("aria-live", "polite");
    var sliderLabel = document.createElement("label");
    sliderLabel.textContent = "Wave frequency";
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = String(RadioLabSim.MIN_KHZ);
    slider.max = String(RadioLabSim.MAX_KHZ);
    slider.step = "1000";
    slider.value = String(khz);
    sliderLabel.appendChild(slider);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 160");
    svg.setAttribute("class", "spectrum-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "A simplified radio wave. Higher frequency draws the cycles closer together.");
    var examples = document.createElement("div");
    examples.className = "tune-pad";
    (config.examples || []).forEach(function (example) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = example.label;
      button.addEventListener("click", function () {
        apply(example.khz, true);
      });
      examples.appendChild(button);
    });
    var reveal = document.createElement("button");
    reveal.type = "button";
    reveal.textContent = "Show the shortcut";
    reveal.disabled = true;
    var shortcut = paragraph("");
    shortcut.hidden = true;
    var feedback = document.createElement("p");
    feedback.className = "feedback";
    feedback.setAttribute("aria-live", "polite");
    var reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Reset the wave";

    function drawWave() {
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      var cycles = Math.max(1, Math.min(18, (khz / 1000) / 40));
      var d = "";
      var steps = 120;
      for (var i = 0; i <= steps; i += 1) {
        var x = (i / steps) * 640;
        var y = 80 - Math.sin((i / steps) * cycles * Math.PI * 2) * 48;
        d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
      }
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#8fd0c6");
      path.setAttribute("stroke-width", "3");
      svg.appendChild(path);
    }

    function apply(next, fromUser) {
      var previous = khz;
      khz = RadioLabSim.clampKhz(next) || khz;
      slider.value = String(Math.round(khz / 1000) * 1000);
      label.textContent = RadioLabSim.formatMhz(khz) + " MHz";
      var meters = RadioLabSim.formatWavelength(khz);
      waveText.textContent = "Approximate wavelength " + meters + " m. The picture is a teaching sketch of how tightly the wave repeats, not a photo of a radio wave.";
      drawWave();
      svg.setAttribute("aria-label", "Simplified wave at " + RadioLabSim.formatMhz(khz) + " MHz, wavelength about " + meters + " meters.");
      if (!fromUser) {
        return;
      }
      reveal.disabled = false;
      if (khz < previous) {
        movedDown = true;
      }
      var length = RadioLabSim.wavelengthMeters(khz);
      if (length < config.goalMeters) {
        feedback.textContent = config.success;
        book.waveDone = true;
        maybeFinishDo(book);
      } else if (movedDown && khz < (config.startKhz || 146000)) {
        feedback.textContent = config.longer;
      } else {
        feedback.textContent = config.stillLong;
      }
    }

    slider.addEventListener("input", function () {
      apply(Number(slider.value), true);
    });
    reveal.addEventListener("click", function () {
      shortcut.hidden = false;
      shortcut.textContent = config.shortcut;
    });
    reset.addEventListener("click", function () {
      movedDown = false;
      feedback.textContent = "";
      shortcut.hidden = true;
      apply(config.startKhz || 146000, false);
    });

    wrap.appendChild(label);
    wrap.appendChild(sliderLabel);
    wrap.appendChild(svg);
    wrap.appendChild(waveText);
    wrap.appendChild(examples);
    wrap.appendChild(feedback);
    wrap.appendChild(reveal);
    wrap.appendChild(shortcut);
    wrap.appendChild(reset);
    apply(khz, false);
    if (book.saved.stages && book.saved.stages.do) {
      book.waveDone = true;
    }
    return wrap;
  }

  function maybeFinishDo(book) {
    if (book.tuneChallengesDone && book.waveDone) {
      completeStage(book, "do");
    }
  }

  function explainPanel(book, block) {
    var wrap = document.createElement("div");
    wrap.appendChild(paragraph(block.prompt));
    var form = document.createElement("form");
    var area = document.createElement("textarea");
    area.rows = 5;
    area.required = true;
    area.setAttribute("aria-label", block.prompt);
    var submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Compare with the lab's explanation";
    form.appendChild(area);
    form.appendChild(submit);
    var reference = paragraph("");
    reference.hidden = true;
    var choice = document.createElement("div");
    choice.className = "tune-pad";
    choice.hidden = true;
    var sure = document.createElement("button");
    sure.type = "button";
    sure.textContent = "I GET IT";
    var unsure = document.createElement("button");
    unsure.type = "button";
    unsure.textContent = "I'M NOT SURE YET";
    choice.appendChild(sure);
    choice.appendChild(unsure);
    var follow = document.createElement("p");
    follow.className = "feedback";
    follow.setAttribute("aria-live", "polite");
    var back = document.createElement("a");
    back.href = "#stage-see";
    back.textContent = "Return to the receiver";
    back.hidden = true;

    function showReference() {
      reference.hidden = false;
      reference.textContent = block.reference;
      choice.hidden = false;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (area.value.trim().length < 8) {
        follow.textContent = "Write a sentence or two in your own words. This is not graded.";
        return;
      }
      showReference();
      follow.textContent = "Compare your note with the explanation, then choose one.";
      noteActivity(book);
    });
    sure.addEventListener("click", function () {
      setConcept(book, block.conceptId, "complete").then(function () {
        completeStage(book, "explain");
        follow.textContent = "Recorded. You can still reread the receiver.";
        back.hidden = true;
      });
    });
    unsure.addEventListener("click", function () {
      setConcept(book, block.conceptId, "in_progress").then(function () {
        follow.textContent = block.unsure;
        back.hidden = false;
      });
    });

    wrap.appendChild(form);
    wrap.appendChild(reference);
    wrap.appendChild(choice);
    wrap.appendChild(follow);
    wrap.appendChild(back);
    if (book.saved.concepts && book.saved.concepts[block.conceptId] === "complete") {
      showReference();
      follow.textContent = "You already marked this as understood.";
    } else if (book.saved.concepts && book.saved.concepts[block.conceptId] === "in_progress") {
      showReference();
      follow.textContent = block.unsure;
      back.hidden = false;
    }
    return wrap;
  }

  function examPanel(book, block) {
    var wrap = document.createElement("div");
    var banner = document.createElement("p");
    banner.className = "sim-flag";
    banner.textContent = block.label || "RADIO LAB PRACTICE";
    wrap.appendChild(banner);
    wrap.appendChild(paragraph(block.notice || ""));
    var answered = {};
    (book.saved.exams || []).forEach(function (row) {
      if (!answered[row.questionId]) {
        answered[row.questionId] = { attempts: 0, correct: false };
      }
      answered[row.questionId].attempts += 1;
      if (row.correct) {
        answered[row.questionId].correct = true;
      }
    });
    (block.questions || []).forEach(function (question) {
      wrap.appendChild(questionCard(book, block, question, answered));
    });
    if (allAttempted(block, answered)) {
      completeStage(book, "exam");
    }
    return wrap;
  }

  function questionCard(book, block, question, answered) {
    var card = document.createElement("fieldset");
    card.className = "practice-question";
    var legend = document.createElement("legend");
    legend.textContent = question.stem;
    card.appendChild(legend);
    var prior = answered[question.id];
    question.choices.forEach(function (choice, index) {
      var label = document.createElement("label");
      label.className = "choice";
      var input = document.createElement("input");
      input.type = "radio";
      input.name = question.id;
      input.value = String(index);
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + choice));
      card.appendChild(label);
    });
    var check = document.createElement("button");
    check.type = "button";
    check.textContent = "Check";
    var why = document.createElement("p");
    why.className = "feedback";
    why.setAttribute("aria-live", "polite");
    var retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Try again";
    retry.hidden = true;

    function lockCorrect() {
      check.disabled = true;
      card.querySelectorAll("input").forEach(function (input) {
        input.disabled = true;
      });
      retry.hidden = true;
    }

    check.addEventListener("click", function () {
      var selected = card.querySelector("input:checked");
      if (!selected) {
        why.textContent = "Choose one answer first.";
        return;
      }
      var correct = Number(selected.value) === question.correctIndex;
      recordExam(book, block, question, correct).then(function () {
        if (!answered[question.id]) {
          answered[question.id] = { attempts: 0, correct: false };
        }
        answered[question.id].attempts += 1;
        if (correct) {
          answered[question.id].correct = true;
        }
        why.textContent = (correct ? "Yes. " : "Not quite. ") + question.why;
        if (correct) {
          lockCorrect();
        } else {
          retry.hidden = false;
        }
        if (allAttempted(block, answered)) {
          completeStage(book, "exam");
        }
      });
    });
    retry.addEventListener("click", function () {
      card.querySelectorAll("input").forEach(function (input) {
        input.checked = false;
        input.disabled = false;
      });
      why.textContent = "Try the question again. A miss stays in the record, and a later correct answer counts too.";
      retry.hidden = true;
    });

    card.appendChild(check);
    card.appendChild(why);
    card.appendChild(retry);
    if (prior && prior.correct) {
      why.textContent = "You already answered this correctly. " + question.why;
      lockCorrect();
    }
    return card;
  }

  function allAttempted(block, answered) {
    return (block.questions || []).every(function (question) {
      return answered[question.id] && answered[question.id].attempts > 0;
    });
  }

  function fieldPanel(book, block) {
    if (!simulationAllowed()) {
      return heldNotice();
    }
    var wrap = document.createElement("div");
    wrap.appendChild(paragraph(block.prompt));
    var config = block.config || {};
    var steps = { target: false, tuned: false, range: false, meaning: false };
    var feedback = document.createElement("p");
    feedback.className = "feedback";
    feedback.setAttribute("aria-live", "polite");

    wrap.appendChild(paragraph("Which frequency should this receiver listen on for the group?"));
    wrap.appendChild(choiceRow([
      ["146.520 MHz", true],
      ["162.550 MHz", false],
    ], function (ok) {
      if (ok) {
        steps.target = true;
        feedback.textContent = "146.520 MHz is the frequency your friend named. 162.550 MHz is only where the radio is listening now.";
      } else {
        feedback.textContent = "162.550 MHz is the weather-radio example already on the display. The group named a different frequency.";
      }
      maybeField(book, block, steps, feedback);
    }));

    var receiver = createReceiver(book.signals, {
      startKhz: config.startKhz,
      showWavelength: true,
      caption: "",
    }, function (fromUser, state, khz) {
      if (!fromUser) {
        return;
      }
      var code = RadioLabSim.judgeTarget(khz, config.targetKhz, config.toleranceKhz);
      if (code === "centered") {
        steps.tuned = true;
        feedback.textContent = "The receiver is on 146.520 MHz. Approximate wavelength " + RadioLabSim.formatWavelength(khz) + " m. That is the 2-meter amateur example, in the VHF range.";
        maybeField(book, block, steps, feedback);
        return;
      }
      if (state.centered && state.signal && state.signal.id === "weather") {
        feedback.textContent = "This is still the weather-radio example. The group is lower, at 146.520 MHz.";
      } else if (code === "high") {
        feedback.textContent = "The display is still higher than 146.520 MHz. Move down.";
      } else if (code === "low") {
        feedback.textContent = "That went below 146.520 MHz. Come back up.";
      } else {
        feedback.textContent = "Close. Center the receiver on 146.520 MHz.";
      }
    });
    wrap.appendChild(paragraph("Tune this simulated radio from 162.550 MHz to the group's frequency."));
    wrap.appendChild(receiver.root);

    wrap.appendChild(paragraph("Once you are on 146.520 MHz, which range is that frequency in?"));
    wrap.appendChild(choiceRow([
      ["VHF", true],
      ["UHF", false],
    ], function (ok) {
      if (!steps.tuned) {
        feedback.textContent = "Tune to 146.520 MHz first, then use the wavelength number on the receiver.";
        return;
      }
      if (ok) {
        steps.range = true;
        feedback.textContent = "146 MHz is below 300 MHz, so this lab calls it VHF. The wavelength on the receiver is about 2 meters.";
      } else {
        feedback.textContent = "UHF was the 446 MHz example. 146 MHz is below 300 MHz, which this lab called VHF.";
      }
      maybeField(book, block, steps, feedback);
    }));

    wrap.appendChild(paragraph("The wavelength shown for 146.520 MHz is closest to which of these?"));
    wrap.appendChild(choiceRow([
      ["About 2 meters", true],
      ["About 70 centimeters", false],
      ["About 3 meters", false],
    ], function (ok) {
      if (!steps.tuned) {
        feedback.textContent = "Land on 146.520 MHz and read the wavelength line before answering.";
        return;
      }
      if (ok) {
        steps.wave = true;
        feedback.textContent = "About 2 meters. The higher 446 MHz example was the short one, near 70 centimeters.";
      } else {
        feedback.textContent = "Read the wavelength line on the receiver. 70 centimeters belonged to the 446 MHz example. About 3 meters belonged to the FM example.";
      }
      maybeField(book, block, steps, feedback);
    }));

    wrap.appendChild(paragraph("What did you just do with the tuning control?"));
    wrap.appendChild(choiceRow([
      ["Selected the frequency this receiver listens to", true],
      ["Started the friend's transmitter", false],
      ["Changed the wavelength of the weather broadcast", false],
    ], function (ok) {
      if (ok) {
        steps.meaning = true;
        feedback.textContent = "You selected where this receiver listens. Your friend's radio was not started by your dial, and the weather broadcast's wavelength did not change.";
      } else {
        feedback.textContent = "The dial selects a listening frequency. It does not start someone else's radio, and it does not retune the other signals.";
      }
      maybeField(book, block, steps, feedback);
    }));

    wrap.appendChild(feedback);
    if (book.saved.fieldTasks && book.saved.fieldTasks[block.taskId] === "complete") {
      feedback.textContent = "This field task is already recorded. You can tune the receiver again.";
    }
    return wrap;
  }

  function choiceRow(pairs, onPick) {
    var row = document.createElement("div");
    row.className = "tune-pad";
    pairs.forEach(function (pair) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = pair[0];
      button.addEventListener("click", function () {
        onPick(pair[1], button);
      });
      row.appendChild(button);
    });
    return row;
  }

  function maybeField(book, block, steps, feedback) {
    if (steps.recorded || !(steps.target && steps.tuned && steps.range && steps.wave && steps.meaning)) {
      return;
    }
    steps.recorded = true;
    setField(book, block.taskId, "complete").then(function () {
      completeStage(book, "field");
      feedback.textContent += " Field task recorded.";
    });
  }

  function progressApi() {
    return RadioLab.progress;
  }

  function noteActivity(book) {
    var progress = progressApi();
    if (!progress) {
      return Promise.resolve();
    }
    if (typeof progress.noteActivity === "function") {
      return progress.noteActivity(book.lesson.labId, book.lesson.curriculumId).then(applySnapshot);
    }
    if (progress.getLabStatus(book.lesson.labId, book.lesson.curriculumId) === "not_started") {
      progress.setLabStatus(book.lesson.labId, "in_progress", book.lesson.curriculumId);
      paintLabStatus("in_progress");
    }
    return Promise.resolve();
  }

  function completeStage(book, stageId) {
    if (book.saved.stages && book.saved.stages[stageId]) {
      paintStage(stageId, true);
      return Promise.resolve();
    }
    book.saved.stages[stageId] = true;
    paintStage(stageId, true);
    var progress = progressApi();
    if (!progress) {
      rollupLocal(book);
      return Promise.resolve();
    }
    if (typeof progress.load === "function") {
      return progress.setStageCompleted(book.lesson.labId, stageId, true, book.lesson.curriculumId).then(applySnapshot);
    }
    progress.setStageCompleted(book.lesson.labId, stageId, true, book.lesson.curriculumId);
    rollupLocal(book);
    return Promise.resolve();
  }

  function rollupLocal(book) {
    var progress = progressApi();
    var done = STAGE_IDS.every(function (stageId) {
      return book.saved.stages[stageId];
    });
    var any = STAGE_IDS.some(function (stageId) {
      return book.saved.stages[stageId];
    });
    var status = done ? "complete" : any ? "in_progress" : "not_started";
    if (progress && typeof progress.setLabStatus === "function" && typeof progress.load !== "function") {
      progress.setLabStatus(book.lesson.labId, status, book.lesson.curriculumId);
    }
    paintLabStatus(status);
  }

  function recordExam(book, block, question, correct) {
    var progress = progressApi();
    var entry = {
      labId: book.lesson.labId,
      curriculumId: book.lesson.curriculumId,
      questionId: question.id,
      topicId: question.topicId,
      correct: correct,
      licenseLevel: block.licenseLevel,
      poolId: block.practicePoolId,
      kind: "pool",
    };
    if (!progress) {
      return Promise.resolve();
    }
    var result = progress.recordExam(entry);
    if (result && typeof result.then === "function") {
      return result.then(applySnapshot);
    }
    if (progress.getLabStatus(book.lesson.labId, book.lesson.curriculumId) === "not_started") {
      progress.setLabStatus(book.lesson.labId, "in_progress", book.lesson.curriculumId);
      paintLabStatus("in_progress");
    }
    return Promise.resolve();
  }

  function setConcept(book, conceptId, status) {
    var progress = progressApi();
    if (!progress || typeof progress.setConceptStatus !== "function") {
      book.saved.concepts[conceptId] = status;
      return Promise.resolve();
    }
    var result = progress.setConceptStatus(
      conceptId,
      status,
      book.lesson.curriculumId,
      book.lesson.licenseLevel,
      book.lesson.labId
    );
    if (result && typeof result.then === "function") {
      return result.then(function (snapshot) {
        book.saved.concepts[conceptId] = status;
        return applySnapshot(snapshot);
      });
    }
    book.saved.concepts[conceptId] = status;
    return Promise.resolve();
  }

  function setField(book, taskId, status) {
    var progress = progressApi();
    book.saved.fieldTasks[taskId] = status;
    if (!progress || typeof progress.setFieldTask !== "function") {
      return Promise.resolve();
    }
    var result = progress.setFieldTask(taskId, status, book.lesson.labId, book.lesson.curriculumId);
    if (result && typeof result.then === "function") {
      return result.then(applySnapshot);
    }
    return Promise.resolve();
  }

  function applySnapshot(snapshot) {
    if (!snapshot) {
      return snapshot;
    }
    if (snapshot.status) {
      paintLabStatus(snapshot.status);
    }
    if (snapshot.stages) {
      Object.keys(snapshot.stages).forEach(function (stageId) {
        paintStage(stageId, !!snapshot.stages[stageId]);
      });
    }
    return snapshot;
  }

  function paintStage(stageId, done) {
    var link = document.querySelector('[data-stage-link="' + stageId + '"]');
    if (link) {
      link.classList.toggle("stage-done", !!done);
    }
    var article = document.getElementById("stage-" + stageId);
    if (article) {
      article.classList.toggle("stage-complete", !!done);
    }
  }

  function paintLabStatus(status) {
    var node = document.getElementById("lab-status");
    if (!node) {
      return;
    }
    var labels = {
      not_started: "NOT STARTED",
      in_progress: "IN PROGRESS",
      complete: "COMPLETE",
    };
    node.className = "status status-" + status;
    node.textContent = labels[status] || labels.not_started;
  }

  if (typeof document === "undefined") {
    return;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
