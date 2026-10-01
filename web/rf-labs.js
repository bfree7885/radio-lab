/* RF-01 workbench. The lesson picks the experiment. The model lives in rf-labs-sim.js. */
(function (root) {
  var gates = {};

  function boot() {
    if (!window.LessonKit || !window.RfLabsSim) {
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
    if (block.component === "field-reference") {
      var wrap = document.createElement("div");
      wrap.appendChild(ctx.paragraph(block.body || "The reference is there when you want a name."));
      if (window.RadioLabReference) {
        RadioLabReference.mount(wrap, (block.config && block.config.file) || "reference/rf-labs.json");
      }
      return wrap;
    }
    var known = {
      "clean-bench": cleanBench,
      "narrow-lab": narrowLab,
      "broad-lab": broadLab,
      "partial-lab": partialLab,
      "overload-lab": overloadLab,
      "mode-lab": modeLab,
      "snr-lab": snrLab,
      "compare-lab": compareLab,
      "jamming-term": jammingTerm,
      "mystery-lab": mysteryLab,
      "recover-lab": recoverLab,
      "field-investigation": fieldInvestigation,
    };
    if (known[block.component]) {
      return known[block.component](ctx, block, stageId);
    }
    return ctx.paragraph("");
  }

  function finish(ctx, block, stageId, note, message) {
    note.textContent = message;
    if (block.gate) {
      gates[block.gate] = true;
    }
    if (block.recordsStage === false) {
      return true;
    }
    var waiting = (block.requiresGates || []).filter(function (id) {
      return !gates[id];
    });
    if (waiting.length) {
      note.textContent = message + " Finish the earlier part of this stage first.";
      return false;
    }
    if (block.taskId) {
      ctx.setField(block.taskId, "complete").then(function () {
        ctx.complete(stageId);
        note.textContent += " Investigation recorded.";
      });
      return true;
    }
    ctx.complete(stageId);
    return true;
  }

  function button(label, action) {
    var node = document.createElement("button");
    node.type = "button";
    node.textContent = label;
    node.addEventListener("click", action);
    return node;
  }

  function bench(ctx, intro) {
    var wrap = document.createElement("div");
    wrap.className = "rf-bench";
    var flag = document.createElement("p");
    flag.className = "sim-flag";
    flag.textContent = "SIMULATION";
    var lead = ctx.paragraph(intro);
    var spectrum = document.createElement("canvas");
    spectrum.className = "rf-spectrum";
    spectrum.width = 640;
    spectrum.height = 180;
    spectrum.setAttribute("aria-label", "Simulated spectrum");
    var water = document.createElement("canvas");
    water.className = "rf-waterfall";
    water.width = 640;
    water.height = 96;
    water.setAttribute("aria-label", "Simulated waterfall history");
    var axis = ctx.paragraph("Simulated frequency offset in kHz. Educational relative level. Not a real service and not calibrated test equipment.");
    var readout = document.createElement("p");
    readout.className = "signal-readout";
    var choices = document.createElement("div");
    choices.className = "tune-pad";
    var note = ctx.feedbackNode();
    var history = [];
    wrap.appendChild(flag);
    wrap.appendChild(lead);
    wrap.appendChild(spectrum);
    wrap.appendChild(water);
    wrap.appendChild(axis);
    wrap.appendChild(readout);
    wrap.appendChild(choices);
    wrap.appendChild(note);

    function paint(state) {
      var bins = RfLabsSim.spectrum(state);
      var report = RfLabsSim.reception(state);
      history = RfLabsSim.pushRow(history, RfLabsSim.rowOf(state), 32);
      drawSpectrum(spectrum, bins, state);
      drawWaterfall(water, history);
      readout.textContent = line(state, report);
      return report;
    }

    return { wrap: wrap, choices: choices, note: note, paint: paint, readout: readout };
  }

  function line(state, report) {
    var overload = report.overload ? " Receiver overload is active in this model." : "";
    return (
      "Tune " + state.tuneKhz + " kHz. Passband " + state.passbandKhz +
      " kHz. Desired peak " + report.desiredPeak +
      ". Noise floor " + report.noiseFloor +
      ". Relative SNR " + report.snr +
      " (about " + report.snrDb + " dB). Reception " + report.quality + "." + overload
    );
  }

  function xOf(khz, width) {
    return ((khz + RfLabsSim.spanKhz) / (RfLabsSim.spanKhz * 2)) * width;
  }

  function drawSpectrum(canvas, bins, state) {
    var context = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#14181c";
    context.fillRect(0, 0, width, height);
    var half = state.passbandKhz / 2;
    var left = xOf(state.tuneKhz - half, width);
    var right = xOf(state.tuneKhz + half, width);
    context.fillStyle = "rgba(232, 168, 56, 0.18)";
    context.fillRect(left, 16, Math.max(2, right - left), height - 28);
    context.strokeStyle = "#8aa0b2";
    context.beginPath();
    bins.forEach(function (bin, index) {
      var x = xOf(bin.khz, width);
      var y = height - 18 - (bin.floor / 12) * (height - 36);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();
    context.strokeStyle = "#e8a838";
    context.lineWidth = 2;
    context.beginPath();
    bins.forEach(function (bin, index) {
      var x = xOf(bin.khz, width);
      var y = height - 18 - (Math.min(bin.level, 12) / 12) * (height - 36);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();
    context.lineWidth = 1;
    var tune = xOf(state.tuneKhz, width);
    context.strokeStyle = "#f4f0e6";
    context.beginPath();
    context.moveTo(tune, 12);
    context.lineTo(tune, height - 16);
    context.stroke();
    context.fillStyle = "#f4f0e6";
    context.font = "12px sans-serif";
    context.fillText("SIMULATION", 8, 14);
  }

  function drawWaterfall(canvas, history) {
    var context = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    context.fillStyle = "#101418";
    context.fillRect(0, 0, width, height);
    if (!history.length || !history[0].length) {
      return;
    }
    var rowHeight = height / history.length;
    history.forEach(function (row, rowIndex) {
      row.forEach(function (level, index) {
        var shade = Math.max(0, Math.min(255, Math.round((level / 10) * 255)));
        context.fillStyle = "rgb(" + shade + "," + Math.round(shade * 0.72) + ",40)";
        var x = (index / row.length) * width;
        context.fillRect(x, rowIndex * rowHeight, width / row.length + 1, rowHeight + 1);
      });
    });
  }

  function cleanBench(ctx, block, stageId) {
    var ui = bench(ctx, "A desired signal is on the display. Tune the marker onto it, then read the floor and the SNR.");
    var state = RfLabsSim.makeState({ tuneKhz: 24 });
    var sawClear = false;
    ui.paint(state);
    ui.choices.appendChild(button("Tune onto the signal", function () {
      state = RfLabsSim.makeState({ tuneKhz: 0 });
      var report = ui.paint(state);
      sawClear = report.quality === "CLEAR";
      ui.note.textContent = "The peak is the signal. The lower line is the noise floor. SNR compares them. Reception is " + report.quality + ".";
    }));
    ui.choices.appendChild(button("Tune away from the signal", function () {
      state = RfLabsSim.makeState({ tuneKhz: 24 });
      var report = ui.paint(state);
      ui.note.textContent = "The passband moved off the peak. Reception is " + report.quality + ".";
    }));
    ui.choices.appendChild(button("The signal is above the noise floor", function () {
      if (!sawClear) {
        ui.note.textContent = "Tune onto the signal and read the SNR first.";
        return;
      }
      finish(ctx, block, stageId, ui.note, "Signal, noise floor, and SNR are three different readings. A clear copy needs the signal to stand far enough above the floor.");
    }));
    return ui.wrap;
  }

  function narrowLab(ctx, block, stageId) {
    var ui = bench(ctx, "A second narrow signal starts away from the receiver. Move it.");
    var seen = { outside: false, near: false, inside: false };
    function show(khz, name) {
      var state = RfLabsSim.narrowAt(khz);
      var report = ui.paint(state);
      seen[name] = true;
      ui.note.textContent = "Second signal at " + khz + " kHz. In-band interference " + report.interference + ". Reception " + report.quality + ".";
    }
    show(30, "outside");
    seen.outside = false;
    ui.choices.appendChild(button("Move the second signal outside", function () { show(30, "outside"); }));
    ui.choices.appendChild(button("Move the second signal near the passband", function () { show(7, "near"); }));
    ui.choices.appendChild(button("Move the second signal inside", function () { show(0, "inside"); }));
    ui.choices.appendChild(button("Outside, near, and inside are different", function () {
      if (!seen.outside || !seen.near || !seen.inside) {
        ui.note.textContent = "Look at all three positions.";
        return;
      }
      finish(ctx, block, stageId, ui.note, "Inside the passband is co-channel. Just at the edge is adjacent. Far outside, this narrow signal is not in the receiver's passband.");
    }));
    return ui.wrap;
  }

  function broadLab(ctx, block, stageId) {
    var ui = bench(ctx, "Wide noise rises across the display. Watch the desired peak and the floor separately.");
    var raised = false;
    var lowered = false;
    ui.paint(RfLabsSim.broadbandAt(0));
    ui.choices.appendChild(button("Raise the wide noise", function () {
      var report = ui.paint(RfLabsSim.broadbandAt(5));
      raised = report.noiseFloor > 1.5 && report.desiredPeak === 8 && report.snr < 5;
      ui.note.textContent = "Floor " + report.noiseFloor + ". Desired peak still " + report.desiredPeak + ". SNR " + report.snr + ". Reception " + report.quality + ".";
    }));
    ui.choices.appendChild(button("Lower the wide noise", function () {
      var report = ui.paint(RfLabsSim.broadbandAt(0));
      lowered = true;
      ui.note.textContent = "Floor back to " + report.noiseFloor + ". SNR " + report.snr + ".";
    }));
    ui.choices.appendChild(button("The signal peak stayed put and the floor rose", function () {
      if (!raised || !lowered) {
        ui.note.textContent = "Raise the wide noise and lower it again.";
        return;
      }
      finish(ctx, block, stageId, ui.note, "Broadband interference lifts the floor under the signal. The desired peak did not have to change for the copy to get worse.");
    }));
    return ui.wrap;
  }

  function partialLab(ctx, block, stageId) {
    var ui = bench(ctx, "Compare three shapes. The receiver cares how much of each shape lands in the passband.");
    var seen = { narrow: false, partial: false, broad: false };
    function show(name, state, sentence) {
      var report = ui.paint(state);
      seen[name] = true;
      ui.note.textContent = sentence + " In-band interference " + report.interference + ". Floor " + report.noiseFloor + ".";
    }
    ui.paint(RfLabsSim.narrowAt(0));
    ui.choices.appendChild(button("Show a narrow interferer", function () {
      show("narrow", RfLabsSim.narrowAt(0), "A narrow interferer is a thin trace.");
    }));
    ui.choices.appendChild(button("Show partial-band noise", function () {
      show("partial", RfLabsSim.partialBand(), "Partial-band energy covers only part of the passband.");
    }));
    ui.choices.appendChild(button("Show broadband noise", function () {
      show("broad", RfLabsSim.broadbandAt(5), "Broadband noise lifts the floor across the span.");
    }));
    ui.choices.appendChild(button("The shapes are different", function () {
      if (!seen.narrow || !seen.partial || !seen.broad) {
        ui.note.textContent = "Show all three shapes.";
        return;
      }
      finish(ctx, block, stageId, ui.note, "Interference is not one shape. A thin carrier, a partial slab, and a raised floor each leave a different picture.");
    }));
    return ui.wrap;
  }

  function overloadLab(ctx, block, stageId) {
    var ui = bench(ctx, "Start on the desired signal. Then add a very strong signal that stays outside the passband.");
    var heard = false;
    var hurt = false;
    ui.paint(RfLabsSim.cleanSignal());
    ui.choices.appendChild(button("Listen with no strong neighbor", function () {
      var report = ui.paint(RfLabsSim.cleanSignal());
      heard = report.quality === "CLEAR" && !report.overload;
      ui.note.textContent = "No strong neighbor. Reception " + report.quality + ".";
    }));
    ui.choices.appendChild(button("Add a very strong signal outside the passband", function () {
      var report = ui.paint(RfLabsSim.overloaded());
      hurt = report.overload && report.quality !== "CLEAR";
      ui.note.textContent = "The strong trace is outside the shaded passband. In-band interference " + report.interference + ". Reception " + report.quality + ". The receiver itself is overloaded.";
    }));
    ui.choices.appendChild(button("The receiver got worse without being tuned to that signal", function () {
      if (!heard || !hurt) {
        ui.note.textContent = "Hear the clean signal, then add the strong neighbor.";
        return;
      }
      finish(ctx, block, stageId, ui.note, "A finite receiver can be desensed by a very strong signal it is not tuned to. The tuned channel can look empty of that signal and still fail. This is a model of the receiver, not a way to affect a real one.");
    }));
    return ui.wrap;
  }

  function modeLab(ctx, block, stageId) {
    var ui = bench(ctx, "Same simulated signal and noise. Two simplified reception rules.");
    var compared = false;
    ui.paint(RfLabsSim.modeDemo());
    ui.choices.appendChild(button("Compare AM-like and FM-like reception", function () {
      var report = RfLabsSim.modeCompare(RfLabsSim.modeDemo());
      ui.paint(RfLabsSim.modeDemo());
      compared = report.am !== report.fm;
      ui.note.textContent = "Relative SNR " + report.snr + ". AM-like reception " + report.am + ". FM-like reception " + report.fm + ". This is a teaching contrast, not every real receiver.";
    }));
    ui.choices.appendChild(button("The same interference can feel different", function () {
      if (!compared) {
        ui.note.textContent = "Compare the two reception rules first.";
        return;
      }
      finish(ctx, block, stageId, ui.note, "AM-like reception in this model degrades as SNR falls. FM-like reception stays clearer until a lower threshold, then drops. The spectrum did not change. The reception rule did.");
    }));
    return ui.wrap;
  }

  function snrLab(ctx, block, stageId) {
    var ui = bench(ctx, "Move the desired level and the noise separately. A ratio of ten is about +10 dB, the same kind of power step as in the circuit lab.");
    var signal = 8;
    var noise = 2;
    var raisedSignal = false;
    var raisedNoise = false;
    function show() {
      var pair = RfLabsSim.snrPair(signal, noise);
      var state = RfLabsSim.makeState({ desiredLevel: signal, noiseFloor: noise, broadband: 0 });
      ui.paint(state);
      ui.readout.textContent = "Desired " + pair.signal + ". Noise " + pair.noise + ". Relative SNR " + pair.snr + " (about " + pair.snrDb + " dB). Reception " + pair.quality + ".";
      return pair;
    }
    show();
    ui.choices.appendChild(button("Raise the desired signal", function () {
      signal = 8;
      noise = 0.8;
      var pair = show();
      raisedSignal = pair.snrDb === 10;
      ui.note.textContent = ui.readout.textContent + " Ten times the noise is about +10 dB.";
    }));
    ui.choices.appendChild(button("Raise the noise", function () {
      signal = 8;
      noise = 4;
      var pair = show();
      raisedNoise = pair.snr < 5;
      ui.note.textContent = ui.readout.textContent + " More noise, lower SNR.";
    }));
    ui.choices.appendChild(button("SNR moved with both controls", function () {
      if (!raisedSignal || !raisedNoise) {
        ui.note.textContent = "Raise the desired signal, then raise the noise.";
        return;
      }
      finish(ctx, block, stageId, ui.note, "Higher SNR generally makes recovery easier. Lower SNR makes it harder. Either the signal or the noise can move that ratio.");
    }));
    return ui.wrap;
  }

  function compareLab(ctx, block, stageId) {
    var ui = bench(ctx, "Each source is a different picture. Look at the trace, the floor, and the reception word.");
    var seen = {};
    var names = [
      ["narrow", "Single narrow interferer"],
      ["several", "Several narrow interferers"],
      ["broadband", "Broadband noise"],
      ["partial", "Partial-band noise"],
      ["nearby", "Very strong nearby signal"],
    ];
    names.forEach(function (pair) {
      ui.choices.appendChild(button(pair[1], function () {
        var state = RfLabsSim.preset(pair[0]);
        var report = ui.paint(state);
        seen[pair[0]] = true;
        ui.note.textContent = pair[1] + ". Floor " + report.noiseFloor + ". In-band interference " + report.interference + ". Reception " + report.quality + (report.overload ? ". Overload." : ".");
      }));
    });
    ui.paint(RfLabsSim.preset("narrow"));
    ui.choices.appendChild(button("Each one looks different on the display", function () {
      var ready = names.every(function (pair) { return seen[pair[0]]; });
      if (!ready) {
        ui.note.textContent = "Open every source once.";
        return;
      }
      finish(ctx, block, stageId, ui.note, "A single tone, several tones, a partial slab, a raised floor, and a strong out-of-channel signal are different receiver problems.");
    }));
    return ui.wrap;
  }

  function jammingTerm(ctx, block, stageId) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Interference can be accidental. Jamming is the name for intentional interference meant to disrupt reception. This lab only simulates what the receiver experiences."));
    var choices = document.createElement("div");
    choices.className = "tune-pad";
    var note = ctx.feedbackNode();
    wrap.appendChild(choices);
    wrap.appendChild(note);
    choices.appendChild(button("Intentional interference meant to disrupt reception", function () {
      finish(ctx, block, stageId, note, "That is the lab's meaning of jamming. The experiments you already ran are the receiver-side pictures. The lab does not transmit and does not describe how to interfere with a real system.");
    }));
    choices.appendChild(button("Any noise floor", function () {
      note.textContent = "A noise floor is part of every receiver picture. Jamming, in this lab, means intentional disruption.";
    }));
    choices.appendChild(button("A filter choice", function () {
      note.textContent = "A filter is a receiver control. It is not another name for jamming.";
    }));
    return wrap;
  }

  function mysteryLab(ctx, block, stageId) {
    var ui = bench(ctx, "Name the picture from the display. The category list is the same five ideas.");
    var cases = RfLabsSim.mysteries();
    var index = 0;
    var labels = [
      ["clean", "Clean signal"],
      ["narrowband", "Narrowband interference"],
      ["broadband", "Broadband noise"],
      ["partial", "Partial-band interference"],
      ["overload", "Receiver overload"],
    ];
    function show() {
      var item = cases[index];
      ui.paint(item.state);
      ui.note.textContent = "Trace " + item.id + ". Use the shape, the floor, and whether a strong trace sits outside the passband.";
    }
    labels.forEach(function (pair) {
      ui.choices.appendChild(button(pair[1], function () {
        var item = cases[index];
        if (pair[0] !== item.category) {
          ui.note.textContent = "Look again at trace " + item.id + ". Compare the floor, the width, and whether the strong energy is inside the shaded passband.";
          return;
        }
        if (index === cases.length - 1) {
          var recorded = finish(ctx, block, stageId, ui.note, "You sorted a clean signal, narrow interference, a raised floor, a partial slab, and overload from the pictures.");
          if (recorded) {
            index += 1;
          }
          return;
        }
        index += 1;
        show();
      }));
    });
    show();
    return ui.wrap;
  }

  function recoverLab(ctx, block, stageId) {
    var ui = bench(ctx, "The interference stays where it is. You only change the receiver passband.");
    var phase = "separated";
    var sawWide = false;
    var sawNarrow = false;
    var sawBuriedWide = false;
    var sawBuriedNarrow = false;
    function show(width) {
      var state = RfLabsSim.recoveryCase(phase);
      state.passbandKhz = width;
      var report = ui.paint(state);
      ui.note.textContent = (phase === "separated" ? "Separated case. " : "Overlapped case. ") + "Passband " + width + " kHz. Reception " + report.quality + ".";
      return report;
    }
    show(30);
    ui.choices.appendChild(button("Wide passband", function () {
      var report = show(30);
      if (phase === "separated") {
        sawWide = report.quality !== "CLEAR";
      } else {
        sawBuriedWide = report.quality === "UNUSABLE";
      }
    }));
    ui.choices.appendChild(button("Narrow passband", function () {
      var report = show(phase === "separated" ? 8 : 4);
      if (phase === "separated") {
        sawNarrow = report.quality === "CLEAR";
      } else {
        sawBuriedNarrow = report.quality === "UNUSABLE";
      }
    }));
    ui.choices.appendChild(button("This separated signal can be recovered", function () {
      if (phase !== "separated" || !sawWide || !sawNarrow) {
        ui.note.textContent = "On the separated case, try the wide passband and the narrow one.";
        return;
      }
      phase = "buried";
      sawWide = false;
      show(30);
      ui.note.textContent = "The separated interferer sat outside the narrower passband, so the copy returned. Now the interferer sits on the desired signal. Try both widths.";
    }));
    ui.choices.appendChild(button("This overlapped signal cannot be recovered", function () {
      if (phase !== "buried" || !sawBuriedWide || !sawBuriedNarrow) {
        ui.note.textContent = "Try both passbands on the overlapped case.";
        return;
      }
      finish(ctx, block, stageId, ui.note, "Filtering helps when the interferer and the desired signal occupy different frequencies. It cannot pull a desired signal out of energy that covers those same frequencies.");
    }));
    return ui.wrap;
  }

  function fieldInvestigation(ctx, block, stageId) {
    var ui = bench(ctx, "Investigation. Identify the pattern, decide whether the desired signal is recoverable with the receiver controls in this model, and pick the matching action. You are reading a simulation.");
    var cases = RfLabsSim.investigations();
    var index = 0;
    var step = "pattern";
    function show() {
      ui.paint(cases[index].state);
      ui.note.textContent = "Case " + (index + 1) + " of " + cases.length + ". Name the pattern first.";
      step = "pattern";
    }
    function advance(message) {
      ui.note.textContent = message;
      step = step === "pattern" ? "recover" : step === "recover" ? "action" : "pattern";
      if (step === "pattern") {
        index += 1;
        if (index >= cases.length) {
          finish(ctx, block, stageId, ui.note, "You separated an in-band neighbor that a narrower passband can exclude, a raised floor that filling the passband leaves in place, and overload from a strong signal outside the tuned channel.");
          return;
        }
        show();
      }
    }
    [
      ["narrowband", "Narrowband interference"],
      ["broadband", "Broadband noise"],
      ["partial", "Partial-band interference"],
      ["overload", "Receiver overload"],
    ].forEach(function (pair) {
      ui.choices.appendChild(button(pair[1], function () {
        if (step !== "pattern") {
          ui.note.textContent = "The pattern for this case is already chosen.";
          return;
        }
        if (pair[0] !== cases[index].category) {
          ui.note.textContent = "Look at the floor and at whether the extra energy is inside the shaded passband.";
          return;
        }
        advance(cases[index].evidence + " Is the desired signal recoverable with these receiver controls?");
      }));
    });
    ui.choices.appendChild(button("Recoverable with a narrower passband", function () {
      if (step !== "recover") {
        return;
      }
      if (!cases[index].recoverable) {
        ui.note.textContent = "A narrower passband does not fix this case. " + cases[index].evidence;
        return;
      }
      advance("Which receiver-side action matches the evidence?");
    }));
    ui.choices.appendChild(button("Not recoverable with these controls", function () {
      if (step !== "recover") {
        return;
      }
      if (cases[index].recoverable) {
        ui.note.textContent = "This one still has spectral separation. A narrower passband can exclude the extra trace.";
        return;
      }
      advance("Which receiver-side action matches the evidence?");
    }));
    ui.choices.appendChild(button("Narrow the passband", function () {
      if (step !== "action") {
        return;
      }
      if (cases[index].mitigation !== "narrow-filter") {
        ui.note.textContent = "Narrowing does not undo a floor that fills the passband, and it does not undo overload from a signal outside the channel.";
        return;
      }
      advance("Narrower passband recorded for this case.");
    }));
    ui.choices.appendChild(button("No receiver control here restores it", function () {
      if (step !== "action") {
        return;
      }
      if (cases[index].mitigation !== "none") {
        ui.note.textContent = "This case still has a receiver control that helps: narrow the passband.";
        return;
      }
      advance("No matching receiver control in this model.");
    }));
    show();
    return ui.wrap;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  root.RfLabs = { boot: boot };
})(typeof window !== "undefined" ? window : globalThis);
