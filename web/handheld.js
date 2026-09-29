/* Teaching handheld for Labs 02 and 03.

   A generic field radio. It is not a copy of a commercial model.
*/
(function (root) {
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text) {
      node.textContent = text;
    }
    return node;
  }

  function create(options) {
    var controls = root.RadioControls;
    var opts = options || {};
    var signals = opts.signals || [{ khz: 146520, strength: 8, halfKhz: 10, name: "simulated signal" }];
    var noise = opts.noise == null ? 2 : opts.noise;
    var state = {
      power: !!opts.power,
      volume: opts.volume == null ? 0 : opts.volume,
      squelch: opts.squelch || 0,
      mode: "vfo",
      vfoKhz: opts.startKhz || 145000,
      memoryIndex: 0,
      memories: [null, null],
    };
    var onChange = opts.onChange || function () {};
    var face = el("div", "handheld");
    var flag = el("p", "sim-flag", "SIMULATION");
    var caption = el("p", "handheld-note", "Teaching radio. Not a copy of any commercial handheld, and not receiving real signals.");
    var display = el("div", "handheld-display");
    var freq = el("p", "freq-readout", "OFF");
    var modeLine = el("p", "freq-units", "");
    var rxLine = el("p", "signal-readout");
    rxLine.setAttribute("aria-live", "polite");
    var bars = el("div", "strength");
    var fill = el("span", "strength-fill");
    bars.appendChild(fill);
    var noiseSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    noiseSvg.setAttribute("viewBox", "0 0 200 36");
    noiseSvg.setAttribute("class", "noise-strip");
    noiseSvg.setAttribute("aria-hidden", "true");
    var noisePath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    noisePath.setAttribute("fill", "none");
    noisePath.setAttribute("stroke", "#8fd0c6");
    noisePath.setAttribute("stroke-width", "2");
    noiseSvg.appendChild(noisePath);
    display.appendChild(freq);
    display.appendChild(modeLine);
    display.appendChild(bars);
    display.appendChild(noiseSvg);
    display.appendChild(rxLine);

    function button(label, action) {
      var node = el("button", "", label);
      node.type = "button";
      node.addEventListener("click", function () {
        action();
        publish(true);
      });
      return node;
    }

    var powerBtn = button(state.power ? "Power off" : "Power on", function () {
      state.power = !state.power;
    });
    var volDown = button("Volume down", function () {
      state.volume = Math.max(0, state.volume - 1);
    });
    var volUp = button("Volume up", function () {
      state.volume = Math.min(9, state.volume + 1);
    });
    var sqlDown = button("Squelch down", function () {
      state.squelch = Math.max(0, state.squelch - 1);
    });
    var sqlUp = button("Squelch up", function () {
      state.squelch = Math.min(9, state.squelch + 1);
    });
    var down100 = button("−100 kHz", function () {
      nudge(-100);
    });
    var down10 = button("−10 kHz", function () {
      nudge(-10);
    });
    var up10 = button("+10 kHz", function () {
      nudge(10);
    });
    var up100 = button("+100 kHz", function () {
      nudge(100);
    });
    var vfoBtn = button("VFO", function () {
      state.mode = "vfo";
    });
    var mrBtn = button("Memory", function () {
      state.mode = "mr";
    });
    var ch1 = button("Channel 1", function () {
      state.memoryIndex = 0;
      state.mode = "mr";
    });
    var ch2 = button("Channel 2", function () {
      state.memoryIndex = 1;
      state.mode = "mr";
    });
    var store = button("Store VFO in this channel", function () {
      state.memories[state.memoryIndex] = { khz: state.vfoKhz };
    });

    var form = el("form", "tune-form");
    var label = el("label", "", "Type a frequency in MHz");
    var input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.setAttribute("aria-label", "Type a frequency in MHz");
    label.appendChild(input);
    var tune = el("button", "", "Tune");
    tune.type = "submit";
    form.appendChild(label);
    form.appendChild(tune);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var parsed = window.RadioLabSim.parseFrequency(input.value, "MHz");
      if (parsed === null) {
        rxLine.textContent = "Enter a frequency between 88.000 and 450.000 MHz.";
        return;
      }
      state.mode = "vfo";
      state.vfoKhz = parsed;
      publish(true);
    });

    var reset = button("Reset this radio", function () {
      state.power = !!opts.power;
      state.volume = opts.volume == null ? 0 : opts.volume;
      state.squelch = opts.squelch || 0;
      state.mode = "vfo";
      state.vfoKhz = opts.startKhz || 145000;
      state.memoryIndex = 0;
      state.memories = [null, null];
    });

    function pad(nodes) {
      var row = el("div", "tune-pad");
      nodes.forEach(function (node) {
        row.appendChild(node);
      });
      return row;
    }

    face.appendChild(flag);
    face.appendChild(caption);
    face.appendChild(display);
    face.appendChild(pad([powerBtn]));
    face.appendChild(pad([volDown, volUp, sqlDown, sqlUp]));
    face.appendChild(pad([down100, down10, up10, up100]));
    face.appendChild(form);
    face.appendChild(pad([vfoBtn, mrBtn, ch1, ch2, store]));
    face.appendChild(reset);

    function nudge(delta) {
      if (state.mode === "mr") {
        state.memoryIndex = state.memoryIndex === 0 ? 1 : 0;
        return;
      }
      var next = window.RadioLabSim.clampKhz(state.vfoKhz + delta);
      if (next !== null) {
        state.vfoKhz = next;
      }
    }

    function snapshot() {
      var memory = state.memories[state.memoryIndex];
      var displayKhz = state.mode === "mr" ? (memory ? memory.khz : null) : state.vfoKhz;
      var heard = displayKhz == null ? { strength: 0, name: "", noise: noise } : controls.signalAt(displayKhz, signals, noise);
      var gate = controls.receiverGate({
        power: state.power,
        volume: state.volume,
        squelch: state.squelch,
        signal: heard.strength,
        noise: heard.noise,
      });
      return {
        power: state.power,
        volume: state.volume,
        squelch: state.squelch,
        mode: state.mode,
        vfoKhz: state.vfoKhz,
        memoryIndex: state.memoryIndex,
        memories: state.memories.map(function (item) {
          return item ? { khz: item.khz } : null;
        }),
        displayKhz: displayKhz,
        signal: heard.strength,
        signalName: heard.name,
        noise: heard.noise,
        rx: gate.rx,
        reason: gate.reason,
      };
    }

    function publish(fromUser) {
      var view = snapshot();
      powerBtn.textContent = view.power ? "Power off" : "Power on";
      powerBtn.setAttribute("aria-pressed", view.power ? "true" : "false");
      if (!view.power) {
        freq.textContent = "OFF";
        modeLine.textContent = "Volume " + view.volume + " of 9 · Squelch " + view.squelch + " of 9";
        fill.style.width = "0%";
        noisePath.setAttribute("points", "0,18 200,18");
        rxLine.textContent = "Power is off. The display is dark.";
      } else if (view.displayKhz == null) {
        freq.textContent = "EMPTY";
        modeLine.textContent = "Memory channel " + (view.memoryIndex + 1) + " has nothing stored.";
        fill.style.width = "0%";
        noisePath.setAttribute("points", "0,18 200,18");
        rxLine.textContent = "This memory is empty. Press VFO to tune, or store a frequency first.";
      } else {
        freq.textContent = window.RadioLabSim.formatMhz(view.displayKhz) + " MHz";
        modeLine.textContent =
          (view.mode === "mr" ? "MEMORY " + (view.memoryIndex + 1) : "VFO") +
          " · Volume " + view.volume + " of 9 · Squelch " + view.squelch + " of 9";
        fill.style.width = (view.signal / 9) * 100 + "%";
        noisePath.setAttribute("points", view.reason === "noise"
          ? "0,18 12,8 24,28 36,6 48,30 60,10 72,26 84,4 96,28 108,12 120,30 132,8 144,24 156,6 168,28 180,14 200,18"
          : "0,18 200,18");
        rxLine.textContent = describe(view);
      }
      input.value = view.displayKhz ? window.RadioLabSim.formatMhz(view.displayKhz) : "";
      onChange(view, !!fromUser);
    }

    function describe(view) {
      var strength = "Signal strength " + view.signal + " of 9. Squelch does not change that number.";
      if (view.reason === "volume-down") {
        return "The receiver is passing sound, but volume is at zero so the speaker is quiet. " + strength;
      }
      if (view.reason === "noise") {
        return "RX open. Background noise. No simulated station is stronger than the noise. " + strength;
      }
      if (view.reason === "signal") {
        return "RX open. Simulated signal" + (view.signalName ? " (" + view.signalName + ")" : "") + ". " + strength;
      }
      if (view.reason === "squelch-hides-signal") {
        return "Speaker closed. A signal is on this frequency, but the squelch is set higher than that signal. " + strength;
      }
      return "Speaker closed. Squelch is holding back the background noise. It did not make a signal clearer. " + strength;
    }

    function set(partial) {
      if (!partial) {
        return snapshot();
      }
      if (partial.power != null) {
        state.power = !!partial.power;
      }
      if (partial.volume != null) {
        state.volume = partial.volume;
      }
      if (partial.squelch != null) {
        state.squelch = partial.squelch;
      }
      if (partial.vfoKhz != null) {
        state.vfoKhz = partial.vfoKhz;
      }
      if (partial.mode) {
        state.mode = partial.mode;
      }
      publish(false);
      return snapshot();
    }

    publish(false);
    return { root: face, getState: snapshot, set: set, reset: function () {
      reset.click();
    } };
  }

  root.RadioHandheld = { create: create };
})(typeof window !== "undefined" ? window : globalThis);
