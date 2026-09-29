/* Lab 02 — Your First Radio. */
(function () {
  function boot() {
    if (!window.LessonKit || !window.RadioHandheld) {
      return;
    }
    LessonKit.boot(function (ctx) {
      ["learn", "see", "do", "explain", "exam", "field"].forEach(function (stageId) {
        var mount = ctx.mount(stageId);
        if (!mount) {
          return;
        }
        (ctx.lesson.stages.find(function (stage) {
          return stage.id === stageId;
        }).blocks || []).forEach(function (block) {
          mount.appendChild(renderBlock(ctx, stageId, block));
        });
      });
    });
  }

  function renderBlock(ctx, stageId, block) {
    if (block.type === "text") {
      return ctx.paragraph(block.body);
    }
    if (block.type === "interaction" && block.component === "handheld-intro") {
      return introRadio(ctx, block.config || {});
    }
    if (block.type === "interaction" && block.component === "squelch-memory") {
      return squelchLab(ctx, block.config || {});
    }
    if (block.type === "interaction" && block.component === "radio-tasks") {
      return taskLab(ctx, block.config || {});
    }
    if (block.type === "explain") {
      return ctx.explain(block);
    }
    if (block.type === "exam") {
      return ctx.exam(block);
    }
    if (block.type === "fieldTask") {
      return fieldLab(ctx, block);
    }
    return ctx.paragraph("");
  }

  function radio(config, onChange) {
    return RadioHandheld.create({
      startKhz: config.startKhz,
      power: config.power,
      volume: config.volume,
      squelch: config.squelch,
      noise: config.noise,
      signals: config.signals,
      onChange: onChange,
    });
  }

  function introRadio(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("From Lab 01, the big number is the frequency this radio is set to. Turn it on and try volume and tuning. The names can wait until you have moved something."));
    var note = ctx.feedbackNode();
    var seen = { power: false, volume: false, frequency: false };
    var set = radio(config, function (state, fromUser) {
      if (!fromUser) {
        return;
      }
      if (state.power) {
        seen.power = true;
      }
      if (state.volume !== (config.volume || 0)) {
        seen.volume = true;
      }
      if (state.vfoKhz !== config.startKhz) {
        seen.frequency = true;
      }
      if (!seen.power) {
        note.textContent = "Power is still off. The other controls can be set, but the radio is not running.";
      } else if (!seen.volume) {
        note.textContent = "Power is on. Volume is how loud the speaker is when the radio is passing sound. Try Volume up.";
      } else if (!seen.frequency) {
        note.textContent = "Volume changed the loudness setting. It did not change the frequency. Tune up or down, or type a frequency.";
      } else {
        note.textContent = "Power runs the radio. Volume is loudness. The frequency number is what you are tuned to. Next you will meet squelch, which is not volume.";
        ctx.complete("learn");
      }
    });
    wrap.appendChild(set.root);
    wrap.appendChild(note);
    return wrap;
  }

  function squelchLab(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Squelch is a gate on the speaker. It does not make a weak signal clearer. Start with the noise, close the gate, then tune onto the simulated signal."));
    var note = ctx.feedbackNode();
    var trail = { closed: false, opened: false, stored: false, left: false, recalled: false, simplex: false };
    var set = radio(config, function (state, fromUser) {
      if (!fromUser) {
        return;
      }
      if (!state.power) {
        note.textContent = "Turn the radio on so the noise experiment can run.";
        return;
      }
      if (state.reason === "squelch-closed" && state.signal === 0) {
        trail.closed = true;
        note.textContent = "The rushing noise stopped. Signal strength is still separate. Squelch closed the speaker. It did not create a station.";
      } else if (trail.closed && state.reason === "signal" && state.displayKhz === config.signalKhz) {
        trail.opened = true;
        note.textContent = "The simulated signal opened the speaker. Squelch did not improve it. The signal was stronger than the squelch setting. This tuning mode is the VFO: the frequency you are dialing freely.";
      } else if (!trail.closed) {
        note.textContent = "Raise squelch until the noise caption says the speaker is closed. Stay off the strong signal while you do that.";
      }
      if (state.memories.some(function (item) { return item && item.khz === config.signalKhz; })) {
        trail.stored = true;
      }
      if (trail.stored && state.mode === "vfo" && Math.abs(state.vfoKhz - config.signalKhz) >= 50) {
        trail.left = true;
      }
      if (trail.stored && trail.left && state.mode === "mr" && state.displayKhz === config.signalKhz) {
        trail.recalled = true;
        note.textContent = "Memory recall brought back the stored frequency. The VFO is the free dial. A memory is a saved spot. They are not the same control.";
      }
      finish();
    });
    wrap.appendChild(set.root);
    wrap.appendChild(ctx.paragraph("When the signal is open, store that VFO frequency, tune at least 50 kHz away, then press Memory."));
    wrap.appendChild(ctx.paragraph("Both of these drawings are teaching sketches. Which one is simplex: everyone listening and talking on the same frequency?"));
    wrap.appendChild(ctx.choiceRow([
      ["Both radios show the same frequency, and no relay is in between", true],
      ["One radio transmits on a different frequency than it receives, through a hilltop relay", false],
    ], function (ok) {
      if (ok) {
        trail.simplex = true;
        note.textContent = "That same-frequency contact is simplex. The hilltop relay is a repeater arrangement. The next lab takes that up. You do not need it yet.";
      } else {
        note.textContent = "That second picture is not simplex. Simplex means the radios are on the same frequency.";
      }
      finish();
    }));
    wrap.appendChild(note);

    function finish() {
      if (trail.closed && trail.opened && trail.recalled && trail.simplex) {
        ctx.complete("see");
      }
    }
    return wrap;
  }

  function taskLab(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Use this radio for the checklist. Resetting it does not erase lab progress."));
    var prompt = ctx.paragraph("");
    prompt.className = "challenge-prompt";
    var note = ctx.feedbackNode();
    var tasks = config.tasks || [];
    var index = 0;
    var trail = {};
    var set = radio(config, function (state, fromUser) {
      var task = tasks[index];
      if (!fromUser || !task || task.kind === "choice") {
        return;
      }
      var result = judge(task, state, trail);
      note.textContent = result.message;
      if (result.pass) {
        index += 1;
        show();
      }
    });
    var choices = document.createElement("div");
    wrap.appendChild(prompt);
    wrap.appendChild(set.root);
    wrap.appendChild(choices);
    wrap.appendChild(note);
    if (ctx.saved.stages && ctx.saved.stages.do) {
      index = tasks.length;
    }
    show();

    function show() {
      var task = tasks[index];
      choices.textContent = "";
      if (!task) {
        prompt.textContent = ctx.saved.stages && ctx.saved.stages.do && index === tasks.length
          ? "You already finished this checklist. The radio can still be tried. Progress stays recorded."
          : "Checklist complete.";
        if (!(ctx.saved.stages && ctx.saved.stages.do)) {
          note.textContent = "You operated the handheld: power, frequency, squelch, a step up the dial, memory, and simplex.";
          ctx.complete("do");
        }
        return;
      }
      if (task.check === "up-from" && set.getState().vfoKhz === task.fromKhz) {
        trail.seenFrom = true;
      }
      prompt.textContent = "Step " + (index + 1) + " of " + tasks.length + ". " + task.prompt;
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

  function judge(task, state, trail) {
    if (task.check === "power") {
      return state.power
        ? { pass: true, message: "The radio is on." }
        : { pass: false, message: "Press Power on." };
    }
    if (!state.power) {
      return { pass: false, message: "The radio is off, so this step cannot count yet." };
    }
    if (task.check === "volume") {
      return state.volume >= task.minimum
        ? { pass: true, message: "Volume is high enough to hear what the receiver passes." }
        : { pass: false, message: "Bring volume up. Volume is loudness, not the frequency." };
    }
    if (task.check === "squelch-closed") {
      if (state.signal > 0) {
        return { pass: false, message: "You are on a simulated signal, so the speaker may be open for that reason. Move off it, then raise squelch until the noise closes." };
      }
      return state.reason === "squelch-closed"
        ? { pass: true, message: "Noise is closed. Squelch did not improve a signal. It muted the speaker." }
        : { pass: false, message: "Squelch is still letting the noise through. Raise it." };
    }
    if (task.check === "frequency") {
      return state.displayKhz === task.khz && state.mode === "vfo"
        ? { pass: true, message: "The VFO is on " + task.label + "." }
        : { pass: false, message: "Set the VFO to " + task.label + ". Memory mode is not the free dial." };
    }
    if (task.check === "up-from") {
      if (state.vfoKhz === task.fromKhz) {
        trail.seenFrom = true;
      }
      if (trail.seenFrom && state.vfoKhz === task.toKhz) {
        return { pass: true, message: "That is 100 kHz higher. 100 kHz is 0.100 MHz." };
      }
      return { pass: false, message: trail.seenFrom ? "Move up from there by 100 kHz." : "Start from " + task.fromLabel + ", then go up 100 kHz." };
    }
    if (task.check === "store") {
      var stored = state.memories.some(function (item) {
        return item && item.khz === task.khz;
      });
      return stored
        ? { pass: true, message: "Stored. Tuning away will not erase that memory." }
        : { pass: false, message: "Put the VFO on " + task.label + ", then Store VFO in this channel." };
    }
    if (task.check === "leave") {
      if (state.mode === "vfo" && Math.abs(state.vfoKhz - task.khz) >= task.deltaKhz) {
        trail.left = true;
        return { pass: true, message: "You left the stored frequency on the VFO. Recall it with Memory." };
      }
      return { pass: false, message: "Switch to VFO and tune at least " + task.deltaKhz + " kHz away from " + task.label + "." };
    }
    if (task.check === "recall") {
      return state.mode === "mr" && state.displayKhz === task.khz
        ? { pass: true, message: "Memory brought back " + task.label + "." }
        : { pass: false, message: "Press Memory, on the channel that holds " + task.label + "." };
    }
    return { pass: false, message: "Keep going with the control this step names." };
  }

  function fieldLab(ctx, block) {
    var wrap = document.createElement("div");
    var config = block.config || {};
    wrap.appendChild(ctx.paragraph(block.prompt));
    var note = ctx.feedbackNode();
    var simplex = false;
    var recorded = ctx.saved.fieldTasks && ctx.saved.fieldTasks[block.taskId] === "complete";
    var set = radio(config, function (state, fromUser) {
      if (!fromUser) {
        return;
      }
      advise(state);
    });
    wrap.appendChild(set.root);
    wrap.appendChild(ctx.paragraph("Your friend said simplex. What does this radio need?"));
    wrap.appendChild(ctx.choiceRow([
      ["Stay on 146.520 MHz. No repeater setup.", true],
      ["Set a repeater offset before you can listen.", false],
    ], function (ok) {
      if (ok) {
        simplex = true;
        note.textContent = "Simplex means this one frequency. Repeater offsets are the next lab. You do not need one here.";
      } else {
        simplex = false;
        note.textContent = "A repeater offset is not part of this request. Both radios use 146.520 MHz.";
      }
      advise(set.getState());
    }));
    wrap.appendChild(note);
    if (recorded) {
      note.textContent = "This field task is already recorded. You can set the radio again.";
    }

    function advise(state) {
      if (recorded) {
        return;
      }
      if (!state.power) {
        note.textContent = "Power is still off.";
        return;
      }
      if (state.displayKhz !== config.signalKhz || state.mode !== "vfo") {
        note.textContent = "Tune the VFO to 146.520 MHz. That is the frequency your friend named.";
        return;
      }
      if (state.volume < config.minVolume) {
        note.textContent = "146.520 is on the display. Volume is still too low to be usable.";
        return;
      }
      if (state.squelch <= state.noise) {
        note.textContent = "Squelch is still open. You would hear noise the whole time you are away from a signal. Raise it until noise closes, without going so high that this signal cannot open the speaker.";
        return;
      }
      if (state.reason === "squelch-hides-signal") {
        note.textContent = "Squelch is above the simulated signal, so the speaker stays closed on 146.520. Ease it down until RX opens here, while still staying above the noise.";
        return;
      }
      if (state.reason !== "signal") {
        note.textContent = "Set squelch so the noise is closed and this simulated signal still opens the speaker.";
        return;
      }
      if (!simplex) {
        note.textContent = "The radio is usable on 146.520. Confirm that this simplex contact does not need a repeater setup.";
        return;
      }
      recorded = true;
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
