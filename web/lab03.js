/* Lab 03 — Repeaters. A simplified path model, not a coverage prediction. */
(function () {
  function boot() {
    if (!window.LessonKit || !window.RadioControls) {
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
    if (block.component === "path-toggle") {
      return pathLab(ctx, block.config || {});
    }
    if (block.component === "offset-tone") {
      return offsetLab(ctx, block.config || {});
    }
    if (block.component === "repeater-tasks") {
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

  function pathLab(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Simplex, from the last lab, is both radios on one frequency. Here a ridge sits between them. Try the direct path, then the hilltop relay."));
    var scene = document.createElement("div");
    scene.className = "repeater-scene";
    var status = ctx.feedbackNode();
    var mode = "simplex";
    var sawSimplex = false;
    var sawRepeater = false;

    function draw() {
      scene.textContent = "";
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 640 240");
      svg.setAttribute("class", "spectrum-svg");
      svg.setAttribute("aria-hidden", "true");
      svg.appendChild(poly("80,200 280,200 200,80 80,200", "#31403a"));
      svg.appendChild(poly("360,200 560,200 440,90 360,200", "#31403a"));
      svg.appendChild(poly("250,200 390,200 320,40 250,200", "#24312b"));
      svg.appendChild(dot(120, 168, "Radio A"));
      svg.appendChild(dot(520, 168, "Radio B"));
      svg.appendChild(dot(320, 48, "Repeater"));
      if (mode === "simplex") {
        svg.appendChild(line(120, 168, 230, 150, true));
        svg.appendChild(line(520, 168, 410, 150, true));
      } else {
        svg.appendChild(line(120, 168, 320, 48, false));
        svg.appendChild(line(520, 168, 320, 48, false));
      }
      scene.appendChild(svg);
      var caption = ctx.paragraph(
        mode === "simplex"
          ? "Simplex. The drawing stops the direct path at the ridge. Real hills are not this tidy, and sometimes a direct path still works. This is only a teaching picture."
          : "Repeater. Each radio reaches the higher site. The site hears one radio and sends that signal onward. This is not a prediction of range."
      );
      scene.appendChild(caption);
      status.textContent = caption.textContent;
    }

    function poly(points, fill) {
      var node = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      node.setAttribute("points", points);
      node.setAttribute("fill", fill);
      return node;
    }

    function dot(x, y, label) {
      var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(x));
      circle.setAttribute("cy", String(y));
      circle.setAttribute("r", "10");
      circle.setAttribute("fill", "#e0b15a");
      var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(x - 28));
      text.setAttribute("y", String(y + 28));
      text.setAttribute("fill", "#f4f7f5");
      text.setAttribute("font-size", "16");
      text.textContent = label;
      group.appendChild(circle);
      group.appendChild(text);
      return group;
    }

    function line(x1, y1, x2, y2, blocked) {
      var node = document.createElementNS("http://www.w3.org/2000/svg", "line");
      node.setAttribute("x1", String(x1));
      node.setAttribute("y1", String(y1));
      node.setAttribute("x2", String(x2));
      node.setAttribute("y2", String(y2));
      node.setAttribute("stroke", blocked ? "#c5d0ca" : "#8fd0c6");
      node.setAttribute("stroke-width", "4");
      if (blocked) {
        node.setAttribute("stroke-dasharray", "8 6");
      }
      return node;
    }

    function select(next, fromUser) {
      mode = next;
      draw();
      if (!fromUser) {
        return;
      }
      if (next === "simplex") {
        sawSimplex = true;
      } else {
        sawRepeater = true;
      }
      if (sawSimplex && sawRepeater) {
        ctx.complete("learn");
      }
    }

    wrap.appendChild(ctx.choiceRow([
      ["Show simplex", true],
      ["Show repeater", true],
    ], function (_ok, button) {
      select(button.textContent.indexOf("repeater") >= 0 ? "repeater" : "simplex", true);
    }));
    wrap.appendChild(scene);
    wrap.appendChild(status);
    select("simplex", false);
    return wrap;
  }

  function offsetLab(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("The repeater listens on one frequency and transmits on another. Your radio does the reverse while you use it: it listens where the repeater transmits."));
    var output = config.outputKhz;
    var offset = config.offsetKhz;
    var tone = null;
    var readout = ctx.feedbackNode();
    var toneNote = ctx.feedbackNode();
    var trail = { moved: false, flipped: false, failedTone: false, passedTone: false };
    var startOffset = offset;

    function paint() {
      var pair = RadioControls.repeaterPair(output, offset);
      var sign = offset < 0 ? "minus" : "plus";
      readout.textContent =
        "Repeater output, which your radio receives: " + window.RadioLabSim.formatMhz(pair.receiveKhz) +
        " MHz. Your radio transmits on: " + window.RadioLabSim.formatMhz(pair.transmitKhz) +
        " MHz. Offset: " + sign + " " + Math.abs(offset) + " kHz. The listing for a real repeater tells you the sign. A 2-meter convention is often 600 kHz. It is not a rule for every band or region.";
    }

    wrap.appendChild(ctx.choiceRow([
      ["Output 146.940 MHz", true],
      ["Output 147.000 MHz", true],
    ], function (_ok, button) {
      var next = button.textContent.indexOf("147.000") >= 0 ? 147000 : 146940;
      if (next !== config.outputKhz) {
        trail.moved = true;
      }
      output = next;
      paint();
      finish();
    }));
    wrap.appendChild(ctx.choiceRow([
      ["Minus 600 kHz", true],
      ["Plus 600 kHz", true],
    ], function (_ok, button) {
      var next = button.textContent.indexOf("Plus") >= 0 ? 600 : -600;
      if (next !== startOffset) {
        trail.flipped = true;
      }
      offset = next;
      paint();
      finish();
    }));
    wrap.appendChild(readout);
    wrap.appendChild(ctx.paragraph("An access tone, often called CTCSS, is a low tone sent with your transmission. The repeater can require the tone it expects. People listening on the output can still hear the conversation. The tone is not privacy."));
    wrap.appendChild(ctx.choiceRow(config.tones.map(function (toneChoice) {
      return [toneChoice.label, true];
    }), function (_ok, button) {
      config.tones.forEach(function (toneChoice) {
        if (button.textContent === toneChoice.label) {
          tone = toneChoice.hz;
        }
      });
      var result = RadioControls.repeaterResponds(
        { outputKhz: config.outputKhz, offsetKhz: config.offsetKhz, toneHz: config.toneHz },
        { receiveKhz: output, offsetKhz: offset, toneHz: tone }
      );
      if (!result.freqOk || !result.offsetOk) {
        toneNote.textContent = "Set the output and offset back to the listing before judging the tone. This example receives " + window.RadioLabSim.formatMhz(config.outputKhz) + " MHz with a minus 600 kHz offset.";
        return;
      }
      if (result.responds) {
        trail.passedTone = true;
        toneNote.textContent = "The repeater responds. The tone matched. Anyone who can hear the output can still hear what is said.";
      } else {
        trail.failedTone = true;
        toneNote.textContent = "No response. The frequency relationship can be right while the tone is missing or wrong. The tone did not hide the channel. The repeater simply did not accept the transmission.";
      }
      finish();
    }));
    wrap.appendChild(toneNote);
    paint();

    function finish() {
      if (trail.moved && trail.flipped && trail.failedTone && trail.passedTone) {
        ctx.complete("see");
      }
    }
    return wrap;
  }

  function taskLab(ctx, config) {
    var wrap = document.createElement("div");
    var listing = config.listing;
    wrap.appendChild(ctx.paragraph(config.intro));
    var prompt = ctx.paragraph("");
    prompt.className = "challenge-prompt";
    var note = ctx.feedbackNode();
    var panel = configPanel(listing, function () {});
    var pathSeen = { simplex: false, repeater: false };
    var steps = [
      {
        prompt: "The listing names an output and an input. Which frequency is the repeater output?",
        success: "The output is the frequency the repeater transmits.",
        hint: "Read the listing. The output and the input are different numbers.",
        choices: [
          [window.RadioLabSim.formatMhz(listing.outputKhz) + " MHz", true],
          [window.RadioLabSim.formatMhz(listing.outputKhz + listing.offsetKhz) + " MHz", false],
        ],
      },
      {
        prompt: "Which frequency does your radio receive while you are using this repeater?",
        success: "Your radio listens on the repeater output.",
        hint: "The repeater transmits on its output. That is the frequency you receive.",
        choices: [
          [window.RadioLabSim.formatMhz(listing.outputKhz) + " MHz, the output", true],
          [window.RadioLabSim.formatMhz(listing.outputKhz + listing.offsetKhz) + " MHz, the input", false],
        ],
      },
      {
        prompt: "Set the panel to the listing: receive the output, use the listed offset, and use the listed tone.",
        setup: function () {
          panel.set({
            receiveKhz: listing.outputKhz,
            offsetKhz: 0,
            toneHz: null,
          });
        },
        check: function () {
          var view = panel.get();
          var result = RadioControls.repeaterResponds(listing, view);
          if (result.responds) {
            return "The simulated repeater responds.";
          }
          if (!result.freqOk) {
            return "The receive frequency is not the output on the listing.";
          }
          if (!result.offsetOk) {
            return "The offset sign or size does not match the listing.";
          }
          return "Frequency relationship is set. The tone is not the one on the listing.";
        },
      },
      {
        prompt: "Troubleshooting: the panel will be set near the repeater, with the wrong tone. Make it respond.",
        setup: function () {
          panel.set({
            receiveKhz: listing.outputKhz,
            offsetKhz: listing.offsetKhz,
            toneHz: config.wrongToneHz,
          });
        },
        check: function () {
          var result = RadioControls.repeaterResponds(listing, panel.get());
          if (result.responds) {
            return "That tone was the missing piece. The repeater responds.";
          }
          if (result.freqOk && result.offsetOk) {
            return "Output and offset are already right. Change the tone to the listing.";
          }
          return "Put the output and offset back, then fix the tone. The fault in this setup is the tone.";
        },
      },
      {
        prompt: "Switch the picture between simplex and repeater. Select each one. Simplex is one frequency. Repeater operation uses the two frequencies you just set.",
        path: true,
      },
    ];
    var index = 0;
    var choices = document.createElement("div");
    wrap.appendChild(prompt);
    wrap.appendChild(panel.root);
    wrap.appendChild(choices);
    wrap.appendChild(note);
    if (ctx.saved.stages && ctx.saved.stages.do) {
      index = steps.length;
    }
    show();

    function show() {
      var step = steps[index];
      choices.textContent = "";
      if (!step) {
        prompt.textContent = "Repeater checklist complete.";
        if (!(ctx.saved.stages && ctx.saved.stages.do)) {
          ctx.complete("do");
        }
        return;
      }
      prompt.textContent = "Step " + (index + 1) + " of " + steps.length + ". " + step.prompt;
      if (step.setup) {
        step.setup();
      }
      if (step.choices) {
        choices.appendChild(ctx.choiceRow(step.choices, function (ok) {
          note.textContent = ok ? step.success : step.hint;
          if (ok) {
            index += 1;
            show();
          }
        }));
      }
      if (step.path) {
        choices.appendChild(ctx.choiceRow([
          ["Simplex: one frequency, no repeater", true],
          ["Repeater: listen on the output", true],
        ], function (_ok, button) {
          if (button.textContent.indexOf("Simplex") === 0) {
            pathSeen.simplex = true;
            note.textContent = "Simplex is the direct contact from Lab 02. Both radios use one frequency.";
          } else {
            pathSeen.repeater = true;
            note.textContent = "Repeater operation listens on the output and transmits on the input.";
          }
          if (pathSeen.simplex && pathSeen.repeater) {
            index += 1;
            show();
          }
        }));
      }
    }

    panel.onChange = function () {
      var step = steps[index];
      if (!step || !step.check) {
        return;
      }
      var message = step.check();
      note.textContent = message;
      if (message.indexOf("responds") >= 0) {
        index += 1;
        show();
      }
    };
    return wrap;
  }

  function configPanel(listing, onChange) {
    var receiveKhz = listing.outputKhz;
    var offsetKhz = 0;
    var toneHz = null;
    var root = document.createElement("div");
    root.className = "instrument";
    var live = document.createElement("p");
    live.className = "signal-readout";
    live.setAttribute("aria-live", "polite");
    var api = {
      root: root,
      onChange: onChange,
      get: function () {
        return { receiveKhz: receiveKhz, offsetKhz: offsetKhz, toneHz: toneHz };
      },
      set: function (next) {
        receiveKhz = next.receiveKhz;
        offsetKhz = next.offsetKhz;
        toneHz = next.toneHz;
        paint();
      },
    };

    function paint() {
      var pair = RadioControls.repeaterPair(receiveKhz, offsetKhz);
      var toneLabel = toneHz == null ? "no tone" : toneHz.toFixed(1) + " Hz";
      var result = RadioControls.repeaterResponds(listing, api.get());
      live.textContent =
        "Receive " + window.RadioLabSim.formatMhz(pair.receiveKhz) +
        " MHz. Transmit " + window.RadioLabSim.formatMhz(pair.transmitKhz) +
        " MHz. Tone " + toneLabel + ". " +
        (result.responds ? "Simulated repeater responds." : "Simulated repeater is quiet.");
    }

    function addChoices(label, pairs, apply) {
      root.appendChild(LessonKit.paragraph(label));
      var row = document.createElement("div");
      row.className = "tune-pad";
      pairs.forEach(function (pair) {
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = pair.label;
        button.addEventListener("click", function () {
          apply(pair.value);
          paint();
          if (api.onChange) {
            api.onChange();
          }
        });
        row.appendChild(button);
      });
      root.appendChild(row);
    }

    addChoices("Receive frequency", [
      { label: window.RadioLabSim.formatMhz(listing.outputKhz) + " MHz", value: listing.outputKhz },
      { label: window.RadioLabSim.formatMhz(listing.outputKhz + listing.offsetKhz) + " MHz", value: listing.outputKhz + listing.offsetKhz },
    ], function (value) {
      receiveKhz = value;
    });
    addChoices("Offset", [
      { label: "Minus 600 kHz", value: -600 },
      { label: "Plus 600 kHz", value: 600 },
      { label: "No offset", value: 0 },
    ], function (value) {
      offsetKhz = value;
    });
    addChoices("Access tone", [
      { label: "No tone", value: null },
      { label: "88.5 Hz", value: 88.5 },
      { label: "100.0 Hz", value: 100 },
      { label: "123.0 Hz", value: 123 },
    ], function (value) {
      toneHz = value;
    });
    root.appendChild(live);
    paint();
    return api;
  }

  function fieldLab(ctx, block) {
    var wrap = document.createElement("div");
    var config = block.config || {};
    wrap.appendChild(ctx.paragraph(block.prompt));
    var mode = "simplex";
    var note = ctx.feedbackNode();
    var recorded = ctx.saved.fieldTasks && ctx.saved.fieldTasks[block.taskId] === "complete";
    wrap.appendChild(ctx.paragraph("Look at the path, then set the radio side of the repeater."));
    wrap.appendChild(ctx.choiceRow([
      ["Direct path, simplex", true],
      ["Path through the repeater", true],
    ], function (_ok, button) {
      mode = button.textContent.indexOf("repeater") >= 0 ? "repeater" : "simplex";
      note.textContent = mode === "simplex"
        ? "The direct path is the one this scenario calls unreliable. The repeater is the path you were given."
        : "The repeater path is the one that clears the ridge in this simplified drawing.";
      check();
    }));
    var panel = configPanel(config.listing, function () {
      check();
    });
    wrap.appendChild(panel.root);
    wrap.appendChild(note);
    if (recorded) {
      note.textContent = "This field task is already recorded.";
    }

    function check() {
      if (recorded) {
        return;
      }
      var result = RadioControls.repeaterResponds(config.listing, panel.get());
      if (mode !== "repeater") {
        note.textContent = "Switch the picture to the repeater path. Simplex is the path the ridge blocks in this scenario.";
        return;
      }
      if (!result.responds) {
        if (!result.freqOk) {
          note.textContent = "Receive the output frequency from the listing.";
        } else if (!result.offsetOk) {
          note.textContent = "The offset on the listing is plus 600 kHz for this repeater. Do not assume the sign from the frequency alone.";
        } else {
          note.textContent = "The tone on the listing is still not selected.";
        }
        return;
      }
      recorded = true;
      note.textContent = "The simulated repeater responds, and the path in the drawing is the repeater path.";
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
