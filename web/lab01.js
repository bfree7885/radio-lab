/* Lab 01 — What Is Radio?

   One lesson for the local app and the public learner site.
   Revision 2 stage rows are the only Lab 01 stage completions that count.
   Older Lab 01 stage rows stay stored and do not mark these activities done.
*/
(function (root) {
  var STAGE_IDS = ["learn", "see", "do", "explain", "exam", "field"];
  var WINDOW_KHZ = 400;
  var UNIT_IDS = ["mhz-khz", "mhz-hz", "khz-mhz", "hz-mhz"];
  var VISIT_IDS = ["98", "146", "446"];
  var CALC_IDS = ["wave-146", "wave-446"];
  var SCENARIO_IDS = ["tuned", "meaning", "converted", "compare", "away"];
  var CHECK_IDS = ["what-changed", "what-stayed", "why-shorter"];

  function clone(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function copySignals(signals) {
    return (signals || []).map(function (signal) {
      return { id: signal.id, khz: signal.khz };
    });
  }

  function khzOf(signals, id, fallback) {
    var match = (signals || []).filter(function (signal) {
      return signal.id === id;
    })[0];
    return match ? match.khz : fallback;
  }

  function near(a, b) {
    return Math.abs(a - b) <= 10;
  }

  function parsePlain(raw) {
    if (raw == null) {
      return null;
    }
    var text = String(raw).replace(/,/g, "").trim();
    if (!text) {
      return null;
    }
    var n = Number(text);
    return isFinite(n) ? n : null;
  }

  function nearNumber(a, b) {
    var scale = Math.max(Math.abs(a), Math.abs(b), 1);
    return Math.abs(a - b) <= scale * 0.002;
  }

  function gradeConversion(raw, correct) {
    var n = parsePlain(raw);
    if (n === null) {
      return { ok: false, code: "blank" };
    }
    if (nearNumber(n, correct)) {
      return { ok: true, code: "ok" };
    }
    if (nearNumber(n, correct / 1000)) {
      return { ok: false, code: "thousand-low" };
    }
    if (nearNumber(n, correct * 1000)) {
      return { ok: false, code: "thousand-high" };
    }
    if (nearNumber(n, correct / 1000000)) {
      return { ok: false, code: "million-low" };
    }
    if (nearNumber(n, correct * 1000000)) {
      return { ok: false, code: "million-high" };
    }
    if (nearNumber(n, correct / 100) || nearNumber(n, correct * 100)) {
      return { ok: false, code: "hundred" };
    }
    return { ok: false, code: "other" };
  }

  function conversionFeedback(code) {
    var messages = {
      ok: "That matches.",
      blank: "Enter a number.",
      "thousand-low": "That is 1,000 times too small. Each step from MHz to kHz, or from kHz to Hz, multiplies by 1,000.",
      "thousand-high": "That is 1,000 times too large. Each step from Hz to kHz, or from kHz to MHz, divides by 1,000.",
      "million-low": "That is 1,000,000 times too small. 1 MHz = 1,000,000 Hz.",
      "million-high": "That is 1,000,000 times too large. Divide by 1,000,000 to go from Hz to MHz.",
      hundred: "Check the decimal place. The step between these units is 1,000, not 100.",
      other: "Compare the units. 1 kHz = 1,000 Hz. 1 MHz = 1,000 kHz. 1 MHz = 1,000,000 Hz.",
    };
    return messages[code] || messages.other;
  }

  function gradeWavelength(raw, mhz) {
    var correct = 300 / mhz;
    var n = parsePlain(raw);
    if (n === null) {
      return { ok: false, code: "blank", correct: correct };
    }
    var tol = Math.max(0.05, Math.abs(correct) * 0.03);
    if (Math.abs(n - correct) <= tol) {
      return { ok: true, code: "ok", correct: correct };
    }
    if (nearNumber(n, mhz * 300)) {
      return { ok: false, code: "times", correct: correct };
    }
    if (nearNumber(n, mhz)) {
      return { ok: false, code: "echo-frequency", correct: correct };
    }
    return { ok: false, code: "other", correct: correct };
  }

  function wavelengthFeedback(code, mhz) {
    var correct = (300 / mhz).toFixed(2);
    if (code === "ok") {
      return "About " + correct + " m. Wavelength in meters is about 300 divided by the frequency in MHz.";
    }
    if (code === "times") {
      return "That multiplied the frequency by 300. Use 300 divided by the frequency in MHz.";
    }
    if (code === "echo-frequency") {
      return "That repeated the frequency. Wavelength in meters is about 300 divided by the frequency in MHz.";
    }
    if (code === "blank") {
      return "Enter the wavelength in meters.";
    }
    return "Use wavelength in meters ≈ 300 / frequency in MHz. For " + mhz + " MHz that is about " + correct + " m.";
  }

  function initial(signals) {
    return {
      signals: copySignals(signals),
      weatherKhz: khzOf(signals, "weather", 162550),
      twoMeterKhz: khzOf(signals, "two-meter", 146520),
      listeningKhz: 120000,
      foundWeather: false,
      foundTwoMeter: false,
      prediction: null,
      leftTwoMeter: false,
      returned: false,
      rate: 1,
      triedLow: false,
      triedHigh: false,
      cycleChoice: null,
      units: {},
      wavePrediction: null,
      visited: {},
      waves: {},
      scenario: {},
      scenarioKhz: 120000,
      checks: {},
      exam: {},
      fieldKhz: 120000,
      fieldTuned: false,
      fieldChoice: null,
    };
  }

  function learnTune(state, khz) {
    var next = clone(state);
    next.listeningKhz = khz;
    next.signals = copySignals(state.signals);
    if (near(khz, state.weatherKhz)) {
      next.foundWeather = true;
    }
    if (near(khz, state.twoMeterKhz)) {
      next.foundTwoMeter = true;
    }
    if (next.prediction === "correct" && Math.abs(khz - state.twoMeterKhz) >= 1000) {
      next.leftTwoMeter = true;
    }
    if (next.leftTwoMeter && near(khz, state.twoMeterKhz)) {
      next.returned = true;
    }
    return next;
  }

  function predictSignal(state, correct) {
    var next = clone(state);
    if (!near(state.listeningKhz, state.twoMeterKhz)) {
      next.predictionNote = "Center the receiver on 146.520 MHz before you answer. Then move away and come back.";
      return next;
    }
    next.prediction = correct ? "correct" : "wrong";
    next.predictionNote = correct
      ? "Now tune at least 1 MHz away. The 146.520 MHz signal should stay where it is."
      : "The dial does not move that signal. Look at the signals-present list, then try the prediction again.";
    return next;
  }

  function setRate(state, cycles) {
    var next = clone(state);
    next.rate = cycles;
    if (cycles <= 2) {
      next.triedLow = true;
    }
    if (cycles >= 8) {
      next.triedHigh = true;
    }
    return next;
  }

  function answerCycle(state, correct) {
    var next = clone(state);
    if (!state.triedLow || !state.triedHigh) {
      next.cycleNote = "Try 1 cycle and 8 cycles in the same window before you answer.";
      return next;
    }
    next.cycleChoice = correct ? "correct" : "wrong";
    next.cycleNote = correct
      ? "Frequency is how many cycles happen each second. 1 cycle per second is 1 hertz."
      : "Count the repeats in the same window. More repeats means a higher frequency.";
    return next;
  }

  function answerUnit(state, id, raw, correct) {
    var next = clone(state);
    var graded = gradeConversion(raw, correct);
    next.units[id] = graded.ok ? "correct" : graded.code;
    next.unitNote = { id: id, text: conversionFeedback(graded.code) };
    return next;
  }

  function predictWave(state, correct) {
    var next = clone(state);
    next.wavePrediction = correct ? "correct" : "wrong";
    next.waveNote = correct
      ? "Test it. Compare about 98 MHz, 146 MHz, and 446 MHz."
      : "Try the frequency buttons and compare how tightly the wave repeats. Then answer again.";
    return next;
  }

  function visitWave(state, id) {
    var next = clone(state);
    if (!state.wavePrediction) {
      next.waveNote = "Answer the prediction first. Then test it on the wave model.";
      return next;
    }
    next.visited[id] = true;
    next.waveFocus = id;
    return next;
  }

  function formulaReady(state) {
    return !!state.wavePrediction && VISIT_IDS.every(function (id) {
      return !!state.visited[id];
    });
  }

  function answerWave(state, id, raw, mhz) {
    var next = clone(state);
    if (!formulaReady(state)) {
      next.waveCalcNote = { id: id, text: "Compare the three frequencies before you use the formula." };
      return next;
    }
    var graded = gradeWavelength(raw, mhz);
    next.waves[id] = graded.ok ? "correct" : graded.code;
    next.waveCalcNote = { id: id, text: wavelengthFeedback(graded.code, mhz) };
    return next;
  }

  function scenarioTune(state, khz) {
    var next = clone(state);
    next.scenarioKhz = khz;
    next.signals = copySignals(state.signals);
    if (near(khz, state.weatherKhz)) {
      next.scenario.tuned = "correct";
    }
    return next;
  }

  function scenarioAnswer(state, step, correct) {
    var next = clone(state);
    var index = SCENARIO_IDS.indexOf(step);
    var earlier = SCENARIO_IDS.slice(0, index);
    var blocked = earlier.some(function (id) {
      return state.scenario[id] !== "correct";
    });
    if (blocked) {
      next.scenarioNote = "Finish the earlier step first. The readout has to be on 162.550 MHz before the questions count.";
      return next;
    }
    next.scenario[step] = correct ? "correct" : "wrong";
    next.scenarioNote = "";
    return next;
  }

  function answerCheck(state, id, correct) {
    var next = clone(state);
    next.checks[id] = correct ? "correct" : "wrong";
    return next;
  }

  function answerExam(state, id, correct) {
    var next = clone(state);
    next.exam[id] = correct ? "correct" : "wrong";
    return next;
  }

  function fieldTune(state, khz) {
    var next = clone(state);
    next.fieldKhz = khz;
    next.signals = copySignals(state.signals);
    if (near(khz, state.weatherKhz)) {
      next.fieldTuned = true;
    }
    return next;
  }

  function answerField(state, correct) {
    var next = clone(state);
    if (!state.fieldTuned) {
      next.fieldNote = "Item 1 is still open. Set this receiver's readout to 162.550 MHz. Then the question counts.";
      return next;
    }
    next.fieldChoice = correct ? "correct" : "wrong";
    next.fieldNote = correct
      ? "Both checklist items are done."
      : "You changed the receiver's selected frequency. The weather signal is still at 162.550 MHz.";
    return next;
  }

  function learnDone(state) {
    return !!(
      state.foundWeather &&
      state.foundTwoMeter &&
      state.prediction === "correct" &&
      state.leftTwoMeter &&
      state.returned
    );
  }

  function seeDone(state) {
    return state.cycleChoice === "correct";
  }

  function doDone(state) {
    var units = UNIT_IDS.every(function (id) {
      return state.units[id] === "correct";
    });
    var calcs = CALC_IDS.every(function (id) {
      return state.waves[id] === "correct";
    });
    return units && state.wavePrediction === "correct" && formulaReady(state) && calcs;
  }

  function explainDone(state) {
    var scenario = SCENARIO_IDS.every(function (id) {
      return state.scenario[id] === "correct";
    });
    var checks = CHECK_IDS.every(function (id) {
      return state.checks[id] === "correct";
    });
    return scenario && checks;
  }

  function examDone(state, examIds) {
    return (examIds || []).length > 0 && examIds.every(function (id) {
      return state.exam[id] === "correct";
    });
  }

  function fieldDone(state) {
    return !!(state.fieldTuned && state.fieldChoice === "correct");
  }

  function stageDone(state, stageId, examIds) {
    if (stageId === "learn") {
      return learnDone(state);
    }
    if (stageId === "see") {
      return seeDone(state);
    }
    if (stageId === "do") {
      return doDone(state);
    }
    if (stageId === "explain") {
      return explainDone(state);
    }
    if (stageId === "exam") {
      return examDone(state, examIds);
    }
    if (stageId === "field") {
      return fieldDone(state);
    }
    return false;
  }

  var Rules = {
    STAGE_IDS: STAGE_IDS,
    UNIT_IDS: UNIT_IDS,
    VISIT_IDS: VISIT_IDS,
    CALC_IDS: CALC_IDS,
    SCENARIO_IDS: SCENARIO_IDS,
    CHECK_IDS: CHECK_IDS,
    initial: initial,
    copySignals: copySignals,
    learnTune: learnTune,
    predictSignal: predictSignal,
    setRate: setRate,
    answerCycle: answerCycle,
    answerUnit: answerUnit,
    predictWave: predictWave,
    visitWave: visitWave,
    formulaReady: formulaReady,
    answerWave: answerWave,
    scenarioTune: scenarioTune,
    scenarioAnswer: scenarioAnswer,
    answerCheck: answerCheck,
    answerExam: answerExam,
    fieldTune: fieldTune,
    answerField: answerField,
    gradeConversion: gradeConversion,
    conversionFeedback: conversionFeedback,
    gradeWavelength: gradeWavelength,
    wavelengthFeedback: wavelengthFeedback,
    stageDone: stageDone,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Rules;
  }
  root.RadioLab01 = Rules;

  function boot() {
    var session = document.getElementById("lab-session");
    if (!session || !root.RadioLab || !root.RadioLabSim) {
      return;
    }
    var delivery = document.documentElement.getAttribute("data-delivery");
    if (delivery !== "hosted" && root.RadioLabLocalProgress && !root.RadioLab.progress) {
      root.RadioLab.useProgress(root.RadioLabLocalProgress.create());
    }
    var labId = session.getAttribute("data-lab-id");
    root.RadioLab.curriculum.load()
      .then(function () {
        return root.RadioLab.lesson.load(labId);
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

  function fieldTaskId(lesson) {
    var id = "lab01-weather-listen";
    (lesson.stages || []).forEach(function (stage) {
      (stage.blocks || []).forEach(function (block) {
        if (block.type === "fieldTask" && block.taskId) {
          id = block.taskId;
        }
      });
    });
    return id;
  }

  function examIds(lesson) {
    var ids = [];
    (lesson.stages || []).forEach(function (stage) {
      (stage.blocks || []).forEach(function (block) {
        if (block.type === "exam") {
          (block.questions || []).forEach(function (question) {
            ids.push(question.id);
          });
        }
      });
    });
    return ids;
  }

  function readProgress(lesson) {
    var progress = root.RadioLab.progress;
    var revision = lesson.revision;
    if (!progress) {
      return Promise.resolve(emptySaved());
    }
    if (typeof progress.load === "function") {
      return progress.load(lesson.labId, lesson.curriculumId, revision);
    }
    var saved = emptySaved();
    saved.status = progress.getLabStatus(lesson.labId, lesson.curriculumId);
    STAGE_IDS.forEach(function (stageId) {
      saved.stages[stageId] = !!progress.stageCompleted(lesson.labId, stageId, lesson.curriculumId, revision);
    });
    if (typeof progress.examLog === "function") {
      saved.exams = progress.examLog(lesson.labId, lesson.curriculumId);
    }
    if (typeof progress.getFieldTask === "function") {
      var task = progress.getFieldTask(fieldTaskId(lesson), lesson.curriculumId);
      if (task) {
        saved.fieldTasks[task.taskId || fieldTaskId(lesson)] = task.status;
      }
    }
    if (typeof progress.setLabStatus === "function") {
      var done = STAGE_IDS.every(function (stageId) {
        return saved.stages[stageId];
      });
      var any = STAGE_IDS.some(function (stageId) {
        return saved.stages[stageId];
      });
      var status = done ? "complete" : any ? "in_progress" : "not_started";
      progress.setLabStatus(lesson.labId, status, lesson.curriculumId);
      saved.status = status;
    }
    return Promise.resolve(saved);
  }

  function render(session, lesson, saved) {
    var book = {
      lesson: lesson,
      saved: saved,
      signals: lesson.signals || [],
      examIds: examIds(lesson),
      state: Rules.initial(lesson.signals),
      panels: [],
    };
    (saved.exams || []).forEach(function (row) {
      if (row.correct && book.examIds.indexOf(row.questionId) !== -1) {
        book.state.exam[row.questionId] = "correct";
      }
    });
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
    sync(book);
  }

  function renderBlock(book, stage, block) {
    if (block.type === "text") {
      return paragraph(block.body);
    }
    if (block.component === "signal-bench") {
      return signalBench(book, block.config || {});
    }
    if (block.component === "cycle-bench") {
      return cycleBench(book, block);
    }
    if (block.component === "unit-bench") {
      return unitBench(book, block.config || {});
    }
    if (block.component === "wave-bench") {
      return waveBench(book, block.config || {});
    }
    if (block.component === "scenario-bench") {
      return scenarioBench(book, block);
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

  function sync(book) {
    book.panels.forEach(function (panel) {
      panel();
    });
    if (book.rendering) {
      return;
    }
    STAGE_IDS.forEach(function (stageId) {
      if (Rules.stageDone(book.state, stageId, book.examIds)) {
        completeStage(book, stageId);
      }
    });
    if (Rules.stageDone(book.state, "field", book.examIds)) {
      setField(book, fieldTaskId(book.lesson), "complete");
    }
  }

  function signalBench(book, config) {
    var wrap = document.createElement("div");
    wrap.className = "instrument";
    var title = document.createElement("h3");
    title.textContent = "Signals are already there";
    wrap.appendChild(title);
    if (!simulationAllowed()) {
      wrap.appendChild(heldNotice());
      return wrap;
    }
    var split = document.createElement("div");
    split.className = "present-split";
    var present = document.createElement("div");
    var presentLabel = document.createElement("p");
    presentLabel.className = "sim-flag";
    presentLabel.textContent = "SIGNALS PRESENT";
    present.appendChild(presentLabel);
    var list = document.createElement("ul");
    list.className = "signal-legend";
    book.signals.forEach(function (signal) {
      var item = document.createElement("li");
      item.textContent = signal.name + " stays at " + root.RadioLabSim.formatMhz(signal.khz) + " MHz. " + signal.blurb;
      list.appendChild(item);
    });
    present.appendChild(list);
    var listen = document.createElement("div");
    var listenLabel = document.createElement("p");
    listenLabel.className = "sim-flag";
    listenLabel.textContent = "RECEIVER LISTENING HERE";
    var listenValue = document.createElement("p");
    listenValue.className = "freq-readout";
    listen.appendChild(listenLabel);
    listen.appendChild(listenValue);
    split.appendChild(present);
    split.appendChild(listen);
    wrap.appendChild(split);

    var tasks = checklist([
      { id: "weather", label: "Find the weather signal. Set the readout to 162.550 MHz." },
      { id: "two", label: "Find the 2-meter amateur signal. Set the readout to 146.520 MHz." },
      { id: "predict", label: "While the readout is on 146.520 MHz, predict what the signal does if you tune away." },
      { id: "away", label: "After that prediction, tune at least 1 MHz away from 146.520 MHz." },
      { id: "back", label: "Tune back to 146.520 MHz. The signal should still be there." },
    ]);
    wrap.appendChild(tasks.list);

    var receiver = createReceiver(book.signals, { startKhz: config.startKhz || 120000 }, function (fromUser, khz) {
      if (!fromUser) {
        return;
      }
      book.state = Rules.learnTune(book.state, khz);
      noteActivity(book);
      sync(book);
    });
    wrap.appendChild(receiver.root);

    var ask = choiceBox(config.prompt, config.choices, config.choiceNotes, config.correctIndex, function (ok) {
      book.state = Rules.predictSignal(book.state, ok);
      ask.feedback.textContent = book.state.predictionNote || "";
      sync(book);
    });
    wrap.appendChild(ask.root);
    book.panels.push(function () {
      var state = book.state;
      listenValue.textContent = root.RadioLabSim.formatMhz(state.listeningKhz) + " MHz";
      var settled = !!(book.saved.stages && book.saved.stages.learn);
      tasks.sync({
        weather: settled || state.foundWeather,
        two: settled || state.foundTwoMeter,
        predict: settled || state.prediction === "correct",
        away: settled || state.leftTwoMeter,
        back: settled || state.returned,
      });
    });
    return wrap;
  }

  function cycleBench(book, block) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.className = "instrument";
    var title = document.createElement("h3");
    title.textContent = "What frequency means";
    wrap.appendChild(title);
    wrap.appendChild(paragraph(block.prompt));
    var board = document.createElement("div");
    board.className = "wave-board";
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 320 90");
    svg.setAttribute("class", "spectrum-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Teaching model of a repeating wave");
    board.appendChild(svg);
    var caption = document.createElement("p");
    caption.className = "feedback";
    board.appendChild(caption);
    wrap.appendChild(board);
    var pad = document.createElement("div");
    pad.className = "tune-pad";
    [1, 4, 8].forEach(function (cycles) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = cycles + (cycles === 1 ? " cycle" : " cycles");
      button.addEventListener("click", function () {
        book.state = Rules.setRate(book.state, cycles);
        noteActivity(book);
        sync(book);
      });
      pad.appendChild(button);
    });
    wrap.appendChild(pad);
    var ask = choiceBox(config.prompt, config.choices, config.choiceNotes, config.correctIndex, function (ok) {
      book.state = Rules.answerCycle(book.state, ok);
      ask.feedback.textContent = book.state.cycleNote || "";
      sync(book);
    });
    wrap.appendChild(ask.root);
    book.panels.push(function () {
      drawCycles(svg, book.state.rate);
      caption.textContent = book.state.rate + (book.state.rate === 1 ? " cycle" : " cycles") + " in this same window. Fewer cycles is a lower frequency. More cycles is a higher frequency.";
    });
    return wrap;
  }

  function unitBench(book, config) {
    var wrap = document.createElement("div");
    wrap.className = "instrument";
    var title = document.createElement("h3");
    title.textContent = "Hertz, kilohertz, megahertz";
    wrap.appendChild(title);
    wrap.appendChild(paragraph("1 kHz = 1,000 Hz. 1 MHz = 1,000 kHz. 1 MHz = 1,000,000 Hz. Work each conversion yourself."));
    (config.problems || []).forEach(function (problem) {
      wrap.appendChild(numericBox(problem.prompt, function (raw, feedback) {
        book.state = Rules.answerUnit(book.state, problem.id, raw, problem.correct);
        feedback.textContent = (book.state.unitNote && book.state.unitNote.text) || "";
        noteActivity(book);
        sync(book);
      }));
    });
    var tool = document.createElement("div");
    tool.hidden = true;
    tool.appendChild(paragraph("You can use the converter below to check other frequencies. It does not finish this stage by itself."));
    tool.appendChild(unitTool());
    wrap.appendChild(tool);
    book.panels.push(function () {
      var done = UNIT_IDS.every(function (id) {
        return book.state.units[id] === "correct";
      });
      tool.hidden = !done;
    });
    return wrap;
  }

  function waveBench(book, config) {
    var wrap = document.createElement("div");
    wrap.className = "instrument";
    var title = document.createElement("h3");
    title.textContent = "Wavelength";
    wrap.appendChild(title);
    wrap.appendChild(paragraph("Teaching model. The drawing shows how tightly a wave repeats. It is not a radio wave traveling across the room."));
    var ask = choiceBox(config.prompt, config.choices, config.choiceNotes, config.correctIndex, function (ok) {
      book.state = Rules.predictWave(book.state, ok);
      ask.feedback.textContent = book.state.waveNote || "";
      noteActivity(book);
      sync(book);
    });
    wrap.appendChild(ask.root);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 320 90");
    svg.setAttribute("class", "spectrum-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Teaching model comparing wavelength");
    var caption = document.createElement("p");
    caption.className = "feedback";
    var pad = document.createElement("div");
    pad.className = "tune-pad";
    (config.visits || []).forEach(function (visit) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = visit.label;
      button.addEventListener("click", function () {
        book.state = Rules.visitWave(book.state, visit.id);
        book.waveMhz = visit.mhz;
        if (book.state.waveNote) {
          ask.feedback.textContent = book.state.waveNote;
        }
        sync(book);
      });
      pad.appendChild(button);
    });
    wrap.appendChild(pad);
    wrap.appendChild(svg);
    wrap.appendChild(caption);
    var formula = document.createElement("div");
    formula.hidden = true;
    formula.appendChild(paragraph("Wavelength in meters is about 300 divided by the frequency in MHz. Now use that."));
    (config.calculations || []).forEach(function (item) {
      formula.appendChild(numericBox(item.prompt, function (raw, feedback) {
        book.state = Rules.answerWave(book.state, item.id, raw, item.mhz);
        feedback.textContent = (book.state.waveCalcNote && book.state.waveCalcNote.text) || "";
        sync(book);
      }));
    });
    wrap.appendChild(formula);
    book.waveMhz = 146;
    book.panels.push(function () {
      var mhz = book.waveMhz || 146;
      if (book.state.waveFocus) {
        drawCycles(svg, Math.max(1, mhz / 70));
        if (mhz >= 400) {
          caption.textContent = "Higher frequency. The repeats sit closer together, so the wavelength is shorter.";
        } else if (mhz <= 100) {
          caption.textContent = "Lower frequency. Fewer repeats in this window, so the wavelength is longer.";
        } else {
          caption.textContent = "About 146 MHz sits between the other two. Its repeats are wider than 446 MHz.";
        }
      } else {
        caption.textContent = "Choose a frequency after your prediction to compare the spacing.";
      }
      formula.hidden = !Rules.formulaReady(book.state);
    });
    return wrap;
  }

  function scenarioBench(book, block) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.className = "instrument";
    var title = document.createElement("h3");
    title.textContent = "Put it together";
    wrap.appendChild(title);
    wrap.appendChild(paragraph(block.prompt));
    if (!simulationAllowed()) {
      wrap.appendChild(heldNotice());
      return wrap;
    }
    var readout = document.createElement("p");
    readout.className = "freq-readout";
    wrap.appendChild(readout);
    wrap.appendChild(createReceiver(book.signals, { startKhz: config.startKhz || 120000 }, function (fromUser, khz) {
      if (!fromUser) {
        return;
      }
      book.state = Rules.scenarioTune(book.state, khz);
      noteActivity(book);
      sync(book);
    }).root);
    var meaning = choiceBox(config.meaningPrompt, config.meaningChoices, config.meaningNotes, config.meaningCorrect, function (ok) {
      book.state = Rules.scenarioAnswer(book.state, "meaning", ok);
      meaning.feedback.textContent = book.state.scenarioNote || (config.meaningNotes || [])[ok ? config.meaningCorrect : meaning.last] || "";
      if (!ok && book.state.scenario.meaning === "wrong") {
        meaning.feedback.textContent = (config.meaningNotes || [])[meaning.last] || "";
      }
      sync(book);
    });
    var convert = numericBox(config.convertPrompt, function (raw, feedback) {
      var graded = Rules.gradeConversion(raw, config.convertCorrect);
      book.state = Rules.scenarioAnswer(book.state, "converted", graded.ok);
      feedback.textContent = book.state.scenarioNote || Rules.conversionFeedback(graded.code);
      if (book.state.scenario.converted === "correct" || book.state.scenario.converted === "wrong") {
        sync(book);
      }
    });
    var compare = choiceBox(config.comparePrompt, config.compareChoices, config.compareNotes, config.compareCorrect, function (ok) {
      book.state = Rules.scenarioAnswer(book.state, "compare", ok);
      compare.feedback.textContent = book.state.scenarioNote || (config.compareNotes || [])[compare.last] || "";
      sync(book);
    });
    var away = choiceBox(config.awayPrompt, config.awayChoices, config.awayNotes, config.awayCorrect, function (ok) {
      book.state = Rules.scenarioAnswer(book.state, "away", ok);
      away.feedback.textContent = book.state.scenarioNote || (config.awayNotes || [])[away.last] || "";
      sync(book);
    });
    wrap.appendChild(meaning.root);
    wrap.appendChild(convert);
    wrap.appendChild(compare.root);
    wrap.appendChild(away.root);
    book.panels.push(function () {
      readout.textContent = "Receiver listening here: " + root.RadioLabSim.formatMhz(book.state.scenarioKhz) + " MHz";
      var ready = book.state.scenario.tuned === "correct";
      meaning.root.hidden = !ready;
      convert.hidden = book.state.scenario.meaning !== "correct";
      compare.root.hidden = book.state.scenario.converted !== "correct";
      away.root.hidden = book.state.scenario.compare !== "correct";
    });
    return wrap;
  }

  function explainPanel(book, block) {
    var wrap = document.createElement("div");
    wrap.className = "instrument";
    var title = document.createElement("h3");
    title.textContent = "Explain it";
    wrap.appendChild(title);
    wrap.appendChild(paragraph(block.prompt));
    (block.checks || []).forEach(function (check) {
      var box = choiceBox(check.prompt, check.choices, check.choiceNotes, check.correctIndex, function (ok) {
        book.state = Rules.answerCheck(book.state, check.id, ok);
        box.feedback.textContent = (check.choiceNotes || [])[box.last] || "";
        noteActivity(book);
        sync(book);
      });
      wrap.appendChild(box.root);
    });
    wrap.appendChild(paragraph("How sure do you feel? This note does not finish the stage."));
    var pad = document.createElement("div");
    pad.className = "tune-pad";
    [
      ["I get it", "complete"],
      ["I'm not sure yet", "in_progress"],
    ].forEach(function (pair) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = pair[0];
      button.addEventListener("click", function () {
        setConcept(book, block.conceptId || "tuning-selects-frequency", pair[1]);
        var note = paragraph(pair[1] === "complete"
          ? "Saved as a confidence note. The questions above are what finish this stage."
          : "Saved. Stay with the questions above until the pattern is clear.");
        note.className = "feedback";
        pad.appendChild(note);
      });
      pad.appendChild(button);
    });
    wrap.appendChild(pad);
    return wrap;
  }

  function examPanel(book, block) {
    var wrap = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = block.label || "RADIO LAB PRACTICE";
    wrap.appendChild(title);
    wrap.appendChild(paragraph("These questions use mistakes this lab is meant to catch. A correct answer is recorded only when you choose it. You can try again after a miss."));
    (block.questions || []).forEach(function (question) {
      var box = choiceBox(question.stem, question.choices, question.choiceNotes, question.correctIndex, function (ok) {
        book.state = Rules.answerExam(book.state, question.id, ok);
        box.feedback.textContent = (question.choiceNotes || [])[box.last] || "";
        recordExam(book, block, question, ok);
        sync(book);
      });
      wrap.appendChild(box.root);
      book.panels.push(function () {
        if (book.state.exam[question.id] === "correct") {
          box.feedback.textContent = (question.choiceNotes || [])[question.correctIndex] || "";
        }
      });
    });
    return wrap;
  }

  function fieldPanel(book, block) {
    var config = block.config || {};
    var wrap = document.createElement("div");
    wrap.className = "instrument";
    var title = document.createElement("h3");
    title.textContent = "Field task";
    wrap.appendChild(title);
    wrap.appendChild(paragraph(block.prompt));
    if (!simulationAllowed()) {
      wrap.appendChild(heldNotice());
      return wrap;
    }
    var tasks = checklist([
      { id: "tune", label: "Set this receiver so the readout shows 162.550 MHz." },
      { id: "answer", label: "Answer the question that appears under the receiver." },
    ]);
    wrap.appendChild(tasks.list);
    var readout = document.createElement("p");
    readout.className = "freq-readout";
    wrap.appendChild(readout);
    wrap.appendChild(createReceiver(book.signals, { startKhz: config.startKhz || 120000 }, function (fromUser, khz) {
      if (!fromUser) {
        return;
      }
      book.state = Rules.fieldTune(book.state, khz);
      noteActivity(book);
      sync(book);
    }).root);
    var ask = choiceBox(config.prompt, config.choices, config.choiceNotes, config.correctIndex, function (ok) {
      if (book.saved.stages && book.saved.stages.field) {
        ask.feedback.textContent = (config.choiceNotes || [])[ask.last] || "";
        return;
      }
      book.state = Rules.answerField(book.state, ok);
      if (book.state.fieldChoice === "correct" || book.state.fieldChoice === "wrong") {
        ask.feedback.textContent = (config.choiceNotes || [])[ask.last] || book.state.fieldNote || "";
      } else {
        ask.feedback.textContent = book.state.fieldNote || "";
      }
      sync(book);
    });
    wrap.appendChild(ask.root);
    var status = document.createElement("p");
    status.className = "feedback";
    status.setAttribute("aria-live", "polite");
    wrap.appendChild(status);
    book.panels.push(function () {
      var state = book.state;
      var settled = !!(book.saved.stages && book.saved.stages.field);
      readout.textContent = "Receiver listening here: " + root.RadioLabSim.formatMhz(state.fieldKhz) + " MHz";
      var tuned = settled || state.fieldTuned;
      var answered = settled || state.fieldChoice === "correct";
      tasks.sync({ tune: tuned, answer: answered });
      ask.root.hidden = !tuned;
      if (answered) {
        status.textContent = "Field task complete. Both checklist items are done.";
      } else if (!tuned) {
        status.textContent = "Still to do: set the readout to 162.550 MHz. The question stays hidden until then.";
      } else {
        status.textContent = "Still to do: answer the question about the weather signal.";
      }
    });
    return wrap;
  }

  function checklist(items) {
    var list = document.createElement("ul");
    list.className = "task-check";
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.setAttribute("data-check", item.id);
      list.appendChild(li);
    });
    return {
      list: list,
      sync: function (flags) {
        items.forEach(function (item) {
          var li = list.querySelector('[data-check="' + item.id + '"]');
          var done = !!flags[item.id];
          li.classList.toggle("done", done);
          li.textContent = (done ? "Done. " : "Still to do. ") + item.label;
        });
      },
    };
  }

  function choiceBox(prompt, choices, notes, correctIndex, onPick) {
    var rootNode = document.createElement("div");
    rootNode.className = "choice-stack";
    var lead = paragraph(prompt);
    lead.className = "challenge-prompt";
    rootNode.appendChild(lead);
    var feedback = document.createElement("p");
    feedback.className = "feedback";
    feedback.setAttribute("aria-live", "polite");
    var box = { root: rootNode, feedback: feedback, last: correctIndex };
    (choices || []).forEach(function (label, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", function () {
        box.last = index;
        onPick(index === correctIndex, index);
      });
      rootNode.appendChild(button);
    });
    rootNode.appendChild(feedback);
    return box;
  }

  function numericBox(prompt, onSubmit) {
    var form = document.createElement("form");
    form.className = "tune-form";
    var label = document.createElement("label");
    label.textContent = prompt;
    var input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.setAttribute("aria-label", prompt);
    label.appendChild(input);
    var button = document.createElement("button");
    button.type = "submit";
    button.textContent = "Check";
    var feedback = document.createElement("p");
    feedback.className = "feedback";
    feedback.setAttribute("aria-live", "polite");
    form.appendChild(label);
    form.appendChild(button);
    form.appendChild(feedback);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      onSubmit(input.value, feedback);
    });
    return form;
  }

  function unitTool() {
    var sim = root.RadioLabSim;
    var form = document.createElement("form");
    form.className = "tune-form";
    var value = document.createElement("input");
    value.type = "text";
    value.inputMode = "decimal";
    value.value = "146.520";
    value.setAttribute("aria-label", "Converter frequency");
    var unit = document.createElement("select");
    unit.setAttribute("aria-label", "Converter unit");
    ["MHz", "kHz", "Hz"].forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      unit.appendChild(option);
    });
    var live = document.createElement("p");
    live.className = "freq-equal";
    live.setAttribute("aria-live", "polite");
    function show() {
      var khz = sim.parseFrequency(value.value, unit.value);
      live.textContent = khz === null
        ? "Enter a frequency this dial can hold, from 88.000 MHz to 450.000 MHz."
        : sim.formatHz(khz) + " Hz = " + sim.formatKhz(khz) + " kHz = " + sim.formatMhz(khz) + " MHz";
    }
    form.appendChild(value);
    form.appendChild(unit);
    form.appendChild(live);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      show();
    });
    value.addEventListener("input", show);
    unit.addEventListener("change", show);
    show();
    return form;
  }

  function drawCycles(svg, cycles) {
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    var d = "";
    var steps = 96;
    for (var i = 0; i <= steps; i += 1) {
      var x = (i / steps) * 320;
      var y = 45 - Math.sin((i / steps) * cycles * Math.PI * 2) * 28;
      d += (i === 0 ? "M" : " L") + x.toFixed(1) + " " + y.toFixed(1);
    }
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#8fd0c6");
    path.setAttribute("stroke-width", "2");
    svg.appendChild(path);
  }

  function paragraph(text) {
    var node = document.createElement("p");
    node.textContent = text || "";
    return node;
  }

  function simulationAllowed() {
    var caps = root.RadioLab.capabilities;
    if (!caps || typeof caps.available !== "function") {
      return true;
    }
    return caps.available("simulation.frequency") && caps.available("simulation.receiver");
  }

  function heldNotice() {
    return paragraph("The frequency simulation is turned off in this session, so the receiver stays hidden. No radio hardware is required for this lab.");
  }

  function createReceiver(signals, config, onTune) {
    var sim = root.RadioLabSim;
    var khz = config.startKhz || 120000;
    var receiver = document.createElement("div");
    receiver.className = "instrument";
    var flag = document.createElement("p");
    flag.className = "sim-flag";
    flag.textContent = "SIMULATION";
    receiver.appendChild(flag);
    var readout = document.createElement("p");
    readout.className = "freq-readout";
    receiver.appendChild(readout);
    var units = document.createElement("p");
    units.className = "freq-units";
    receiver.appendChild(units);
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
    receiver.appendChild(pad);
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
    receiver.appendChild(typed);
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
      tick.title = signal.name + " " + sim.formatMhz(signal.khz) + " MHz";
      map.appendChild(tick);
    });
    receiver.appendChild(map);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 160");
    svg.setAttribute("class", "spectrum-svg");
    svg.setAttribute("aria-hidden", "true");
    receiver.appendChild(svg);
    var live = document.createElement("p");
    live.className = "signal-readout";
    live.setAttribute("aria-live", "polite");
    receiver.appendChild(live);

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
      typeInput.value = sim.formatMhz(khz);
      marker.style.left = mapPercent(khz) + "%";
      drawSpectrum(svg, khz, signals);
      var heard = "No signal in this window. The signals in the list above stay on their own frequencies.";
      if (state.centered) {
        heard = "This receiver is centered on " + state.signal.name + " at " + sim.formatMhz(state.signal.khz) + " MHz. " + state.signal.blurb;
      } else if (state.nearby) {
        heard = "A signal is nearby: " + state.signal.name + " at " + sim.formatMhz(state.signal.khz) + " MHz. Not centered yet.";
      }
      live.textContent = heard;
      if (onTune) {
        onTune(!!fromUser, khz);
      }
    }

    draw(false);
    return { root: receiver, getKhz: function () { return khz; }, setKhz: setKhz };
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
      hump.setAttribute("points", cx - half + ",124 " + cx + ",46 " + (cx + half) + ",124");
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

  function progressApi() {
    return root.RadioLab.progress;
  }

  function noteActivity(book) {
    var progress = progressApi();
    if (!progress || book.noted) {
      return Promise.resolve();
    }
    book.noted = true;
    if (typeof progress.noteActivity === "function") {
      return Promise.resolve(progress.noteActivity(book.lesson.labId, book.lesson.curriculumId, book.lesson.revision)).then(function (snapshot) {
        applySnapshot(book, snapshot);
      });
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
      return Promise.resolve(
        progress.setStageCompleted(book.lesson.labId, stageId, true, book.lesson.curriculumId, book.lesson.revision)
      ).then(function (snapshot) {
        applySnapshot(book, snapshot);
      });
    }
    progress.setStageCompleted(book.lesson.labId, stageId, true, book.lesson.curriculumId, book.lesson.revision);
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
    book.saved.status = status;
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
      revision: book.lesson.revision,
    };
    if (!progress) {
      return Promise.resolve();
    }
    var result = progress.recordExam(entry);
    if (result && typeof result.then === "function") {
      return result.then(function (snapshot) {
        applySnapshot(book, snapshot);
      });
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
      book.lesson.labId,
      book.lesson.revision
    );
    if (result && typeof result.then === "function") {
      return result.then(function (snapshot) {
        book.saved.concepts[conceptId] = status;
        applySnapshot(book, snapshot);
      });
    }
    book.saved.concepts[conceptId] = status;
    return Promise.resolve();
  }

  function setField(book, taskId, status) {
    if (book.saved.fieldTasks[taskId] === status) {
      return Promise.resolve();
    }
    book.saved.fieldTasks[taskId] = status;
    var progress = progressApi();
    if (!progress || typeof progress.setFieldTask !== "function") {
      return Promise.resolve();
    }
    var result = progress.setFieldTask(taskId, status, book.lesson.labId, book.lesson.curriculumId, book.lesson.revision);
    if (result && typeof result.then === "function") {
      return result.then(function (snapshot) {
        applySnapshot(book, snapshot);
      });
    }
    return Promise.resolve();
  }

  function applySnapshot(book, snapshot) {
    if (!snapshot || !book) {
      return snapshot;
    }
    var rank = { not_started: 0, in_progress: 1, complete: 2 };
    if (snapshot.status && rank[snapshot.status] >= rank[book.saved.status || "not_started"]) {
      book.saved.status = snapshot.status;
      paintLabStatus(snapshot.status);
    }
    if (snapshot.stages) {
      Object.keys(snapshot.stages).forEach(function (stageId) {
        if (snapshot.stages[stageId]) {
          book.saved.stages[stageId] = true;
          paintStage(stageId, true);
        }
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
})(typeof window !== "undefined" ? window : globalThis);
