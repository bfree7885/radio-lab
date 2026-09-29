/* Lab 08 — one portable outing that uses Labs 01–07.

   The six stage ids stay the same. The labels on this page are the mission phases.
*/
(function () {
  var mission = {
    looked: {},
    valleyOk: false,
    ridgeOk: false,
    antennaOk: false,
    powerOk: false,
    links: { supply: false, feed: false, antenna: false },
  };

  function boot() {
    if (!window.LessonKit || !window.FoundationsSim || !window.RadioControls || !window.RadioHandheld) {
      return;
    }
    LessonKit.boot(function (ctx) {
      ctx.loadJson("regulations/us-fcc-amateur.json").then(function (catalog) {
        ctx.lesson.stages.forEach(function (stage) {
          var mount = ctx.mount(stage.id);
          if (!mount) {
            return;
          }
          stage.blocks.forEach(function (block) {
            mount.appendChild(renderBlock(ctx, catalog, block, stage.id));
          });
        });
      }).catch(function () {
        var session = document.getElementById("lab-session");
        if (session) {
          session.prepend(ctx.paragraph("The band reference did not load. Reload the page to try again."));
        }
      });
    });
  }

  function renderBlock(ctx, catalog, block, stageId) {
    if (block.type === "text") {
      return ctx.paragraph(block.body);
    }
    if (block.component === "mission-plan") {
      return plan(ctx, catalog, block.config || {});
    }
    if (block.component === "mission-setup") {
      return setup(ctx);
    }
    if (block.component === "mission-check") {
      return check(ctx, catalog, block.config || {});
    }
    if (block.component === "mission-operate") {
      return operate(ctx, block.config || {});
    }
    if (block.component === "mission-trouble") {
      return trouble(ctx, block.config || {});
    }
    if (block.type === "fieldTask") {
      return clearance(ctx, block);
    }
    return ctx.paragraph("");
  }

  function plan(ctx, catalog, config) {
    var wrap = document.createElement("div");
    if (window.RadioLabReference) {
      RadioLabReference.mount(wrap);
    }
    wrap.appendChild(ctx.paragraph("Check every candidate in the band reference before you choose. The valley friend asked for 146.520 MHz simplex. The station beyond the ridge needs the repeater on the card."));
    var note = ctx.feedbackNode();
    var repeater = config.repeater;
    config.candidates.forEach(function (candidate) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = "Check " + candidate.label;
      button.addEventListener("click", function () {
        mission.looked[candidate.khz] = true;
        var result = RadioControls.assessTransmission(catalog, candidate.khz, "technician", "phone");
        note.textContent = candidate.label + ". " + (result.allowed
          ? "The reference shows Technician voice inside " + result.entry.name + "."
          : "The reference does not show this as a Technician voice transmission. Reason: " + result.reason + ".");
      });
      wrap.appendChild(button);
    });
    wrap.appendChild(ctx.paragraph("Valley contact"));
    wrap.appendChild(ctx.choiceRow([
      ["146.520 MHz simplex", true],
      ["162.550 MHz, because the radio can tune it", false],
      ["29.600 MHz voice", false],
    ], function (ok) {
      if (!config.candidates.every(function (candidate) { return mission.looked[candidate.khz]; })) {
        note.textContent = "Check every candidate in the reference first.";
        return;
      }
      mission.valleyOk = ok;
      note.textContent = ok
        ? "146.520 MHz simplex matches the valley friend, and the reference shows it."
        : "That choice does not fit the reference or the friend's request. Check the candidates again.";
      finish();
    }));
    wrap.appendChild(ctx.paragraph("Station beyond the ridge"));
    wrap.appendChild(ctx.choiceRow([
      ["Use the repeater: output " + window.RadioLabSim.formatMhz(repeater.outputKhz) + " MHz, offset minus 600 kHz, tone " + repeater.toneHz.toFixed(1) + " Hz", true],
      ["Stay on simplex and add transmitter power", false],
    ], function (ok) {
      mission.ridgeOk = ok;
      note.textContent = ok
        ? "The ridge contact uses the repeater listing. Power was not the fix in the last lab."
        : "Simplex plus power did not clear a ridge in the path model. Use the listing.";
      finish();
    }));
    wrap.appendChild(ctx.paragraph("Antenna for about 146 MHz. Compare each length with a quarter wavelength."));
    var quarter = FoundationsSim.wave(146).quarterMeters;
    config.antennas.forEach(function (antenna) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = antenna.label;
      button.addEventListener("click", function () {
        var match = FoundationsSim.matchSWR(antenna.meters, quarter);
        mission.antennaOk = antenna.role === "fit" && match.relation === "matched";
        note.textContent = antenna.label + ". Simplified SWR " + match.swr.toFixed(1) + ":1. The wire is " + match.relation + " for a quarter wave near 146 MHz.";
        finish();
      });
      wrap.appendChild(button);
    });
    var receive = FoundationsSim.powerWatts(config.volts, config.receiveAmps);
    var transmit = FoundationsSim.powerWatts(config.volts, config.transmitAmps);
    wrap.appendChild(ctx.paragraph("Supply " + config.volts + " V. Receiving draws " + config.receiveAmps + " A (" + FoundationsSim.round(receive, 1) + " W). Transmitting draws " + config.transmitAmps + " A (" + FoundationsSim.round(transmit, 1) + " W). Those watts are from the supply, not RF output."));
    wrap.appendChild(ctx.choiceRow([
      ["Transmitting asks more electrical power from the supply", true],
      ["Receiving and transmitting draw the same power", false],
    ], function (ok) {
      mission.powerOk = ok;
      note.textContent = ok
        ? "Transmit current is higher, so the supply provides more electrical power. That is still not the RF output."
        : "Compare the two watt figures. Transmit is the larger electrical demand.";
      finish();
    }));
    wrap.appendChild(note);

    function finish() {
      if (mission.valleyOk && mission.ridgeOk && mission.antennaOk && mission.powerOk) {
        note.textContent = "The plan uses 146.520 simplex for the valley, the repeater for the ridge, the closer 2-meter wire, and a supply that can cover the transmit current.";
        ctx.complete("learn");
      }
    }
    return wrap;
  }

  function setup(ctx) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Connect the supply to the radio, the feed line to the radio, and the antenna to the feed line. A wrong connection gets a correction, not a disaster."));
    var note = ctx.feedbackNode();
    var diagram = document.createElement("p");
    diagram.className = "circuit-path";
    function paint() {
      diagram.textContent = "Supply " + (mission.links.supply ? "connected" : "open") +
        " → radio → feed line " + (mission.links.feed ? "connected" : "open") +
        " → antenna " + (mission.links.antenna ? "connected" : "open");
    }
    function press(label, action, message) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", function () {
        action();
        paint();
        note.textContent = message;
        if (mission.links.supply && mission.links.feed && mission.links.antenna) {
          note.textContent = "The chain is supply, radio, feed line, antenna. You can configure the radio in the check phase.";
          ctx.complete("see");
        }
      });
      return button;
    }
    paint();
    wrap.appendChild(diagram);
    wrap.appendChild(press("Connect the supply to the radio", function () {
      mission.links.supply = true;
    }, "The supply feeds the radio. From Lab 05, transmitting will draw more current than receiving."));
    wrap.appendChild(press("Connect the feed line to the radio", function () {
      mission.links.feed = true;
    }, "The feed line is the path from the radio toward the antenna."));
    wrap.appendChild(press("Connect the antenna to the feed line", function () {
      mission.links.antenna = true;
    }, "The antenna is on the far end of the feed line, not wired straight across the supply."));
    wrap.appendChild(press("Connect the supply straight across the antenna", function () {}, "That skips the radio and treats the antenna like a near-short on the supply. Connect the supply to the radio instead."));
    wrap.appendChild(note);
    return wrap;
  }

  function radioOptions(config, extra) {
    return {
      startKhz: extra.startKhz || 145000,
      power: extra.power || false,
      volume: extra.volume || 0,
      squelch: extra.squelch || 0,
      noise: 2,
      signals: [{ khz: config.signalKhz, strength: 8, halfKhz: 10, name: "valley station" }],
    };
  }

  function usable(state, khz) {
    return state.power && state.mode === "vfo" && state.displayKhz === khz && state.volume >= 3 &&
      state.squelch > state.noise && state.reason === "signal";
  }

  function check(ctx, catalog, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("This checklist reads the radio and the connections. Set the handheld for the valley friend."));
    var note = ctx.feedbackNode();
    var chain = document.createElement("p");
    chain.textContent = "Connections: supply " + (mission.links.supply ? "yes" : "no") +
      ", feed line " + (mission.links.feed ? "yes" : "no") +
      ", antenna " + (mission.links.antenna ? "yes" : "no") +
      ". Planned wire " + (mission.antennaOk ? "near a quarter wave at 146 MHz" : "not chosen yet") + ".";
    var set = RadioHandheld.create(Object.assign(radioOptions(config, {}), {
      onChange: function (state, fromUser) {
        if (!fromUser) {
          return;
        }
        advise(state);
      },
    }));
    wrap.appendChild(chain);
    wrap.appendChild(set.root);
    wrap.appendChild(note);

    function advise(state) {
      if (!mission.links.supply || !mission.links.feed || !mission.links.antenna) {
        note.textContent = "The supply, feed line, and antenna are not all connected yet.";
        return;
      }
      if (!mission.antennaOk) {
        note.textContent = "The plan does not have the quarter-wave wire for 146 MHz yet.";
        return;
      }
      var allowed = RadioControls.assessTransmission(catalog, config.signalKhz, "technician", "phone");
      if (!allowed.allowed) {
        note.textContent = "The band reference does not show this frequency for Technician voice.";
        return;
      }
      if (!usable(state, config.signalKhz)) {
        note.textContent = "Power on, tune the VFO to 146.520 MHz, set volume to at least 3, and set squelch so the noise is closed and this signal still opens the speaker.";
        return;
      }
      note.textContent = "Check complete. Frequency is in the 2-meter reference, the radio is usable on 146.520, the wire is the closer match, and the supply is in the chain.";
      ctx.complete("do");
    }
    return wrap;
  }

  function operate(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("A station is on 146.520 MHz. Make sure you can hear the simulated signal, and name the kind of contact."));
    var note = ctx.feedbackNode();
    var heard = false;
    var named = false;
    var set = RadioHandheld.create(Object.assign(radioOptions(config, {
      startKhz: config.signalKhz,
      power: true,
      volume: 5,
      squelch: 0,
    }), {
      onChange: function (state, fromUser) {
        if (!fromUser) {
          return;
        }
        if (usable(state, config.signalKhz) || (state.power && state.displayKhz === config.signalKhz && state.reason === "signal" && state.volume >= 3)) {
          heard = true;
          note.textContent = "The valley signal is open. Squelch is not hiding it. This contact was planned as simplex.";
        } else if (state.reason === "squelch-hides-signal") {
          note.textContent = "Squelch is above the signal. Ease it down. That does not change the signal strength.";
        } else if (!state.power) {
          note.textContent = "The radio is off.";
        }
        finish();
      },
    }));
    wrap.appendChild(set.root);
    wrap.appendChild(ctx.choiceRow([
      ["Simplex on 146.520 MHz", true],
      ["A repeater contact", false],
    ], function (ok) {
      named = ok;
      note.textContent = ok
        ? "Both stations are on 146.520. No repeater is in this contact."
        : "The valley plan was simplex. The repeater was for the station beyond the ridge.";
      finish();
    }));
    wrap.appendChild(note);

    function finish() {
      if (heard && named) {
        ctx.complete("explain");
      }
    }
    return wrap;
  }

  function trouble(ctx, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Two set faults, in order. First the speaker. Then the repeater tone. Nothing here is random."));
    var note = ctx.feedbackNode();
    var step = 0;
    var set = RadioHandheld.create(Object.assign(radioOptions(config, {
      startKhz: config.signalKhz,
      power: true,
      volume: 5,
      squelch: 9,
    }), {
      onChange: function (state, fromUser) {
        if (!fromUser || step !== 0) {
          return;
        }
        if (state.reason === "signal" && state.displayKhz === config.signalKhz) {
          step = 1;
          note.textContent = "Squelch was above the signal, so the speaker stayed closed. The strength number did not change. Now set the repeater tone.";
          panel.hidden = false;
        } else {
          note.textContent = "The radio is on 146.520 with the squelch above the signal. Lower the squelch until RX opens. Do not retune away from the signal.";
        }
      },
    }));
    var panel = document.createElement("div");
    panel.hidden = true;
    var tone = config.wrongToneHz;
    var live = document.createElement("p");
    live.className = "signal-readout";
    function paintTone() {
      var result = RadioControls.repeaterResponds(config.repeater, {
        receiveKhz: config.repeater.outputKhz,
        offsetKhz: config.repeater.offsetKhz,
        toneHz: tone,
      });
      live.textContent = "Receive " + window.RadioLabSim.formatMhz(config.repeater.outputKhz) +
        " MHz. Offset minus 600 kHz. Tone " + (tone == null ? "none" : tone.toFixed(1) + " Hz") +
        ". " + (result.responds ? "The simulated repeater responds." : "The simulated repeater is quiet.");
      if (step === 1 && result.responds) {
        note.textContent = "The tone was the fault. Output and offset were already the listing. The tone is not privacy.";
        ctx.complete("exam");
      }
    }
    [88.5, 100].forEach(function (hz) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = hz.toFixed(1) + " Hz";
      button.addEventListener("click", function () {
        if (step !== 1) {
          note.textContent = "Fix the squelch on 146.520 before changing the repeater.";
          return;
        }
        tone = hz;
        paintTone();
      });
      panel.appendChild(button);
    });
    panel.appendChild(live);
    paintTone();
    wrap.appendChild(set.root);
    wrap.appendChild(panel);
    wrap.appendChild(note);
    note.textContent = "Fault 1: the signal is on 146.520 and the squelch is too high.";
    return wrap;
  }

  function clearance(ctx, block) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph(block.prompt));
    var list = document.createElement("ul");
    [
      "Frequency: 146.520 MHz for the valley, and the repeater output for the ridge.",
      "Radio controls: power, volume, squelch, and the VFO.",
      "Repeaters: output, a minus offset, and an access tone that is not privacy.",
      "Band information: the reference, not the tuning range, decided the transmit frequency.",
      "Electricity: transmit current asked more from the 13.8 V supply than receive. That was not RF output.",
      "Antennas: a length near a quarter wave at 146 MHz, on a feed line, not a near-short across the supply.",
      "Propagation: the valley path and the ridge path needed different fixes. Power did not remove the ridge.",
    ].forEach(function (line) {
      var item = document.createElement("li");
      item.textContent = line;
      list.appendChild(item);
    });
    var note = ctx.feedbackNode();
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = "Finish this outing";
    button.addEventListener("click", function () {
      ctx.setField(block.taskId, "complete").then(function () {
        return ctx.complete("field");
      }).then(function () {
        return otherLabsDone();
      }).then(function (done) {
        note.textContent = done
          ? "TECHNICIAN FOUNDATIONS COMPLETE. NEXT: TECHNICIAN CORE. These eight labs are the foundation. They are not Technician exam readiness."
          : "This outing is finished, so Lab 08 can be marked complete. Technician Foundations is complete when Labs 01 through 08 are all finished. Next planned stage: Technician Core. This is not exam readiness.";
      });
    });
    wrap.appendChild(list);
    wrap.appendChild(button);
    wrap.appendChild(note);
    return wrap;
  }

  function otherLabsDone() {
    var ids = ["01", "02", "03", "04", "05", "06", "07"];
    var progress = window.RadioLab && RadioLab.progress;
    if (!progress) {
      return Promise.resolve(false);
    }
    if (typeof progress.load === "function") {
      return Promise.all(ids.map(function (id) {
        return progress.load(id, "technician-foundations").catch(function () {
          return { status: "not_started" };
        });
      })).then(function (rows) {
        return rows.every(function (row) {
          return row && row.status === "complete";
        });
      });
    }
    if (typeof progress.getLabStatus === "function") {
      return Promise.resolve(ids.every(function (id) {
        return progress.getLabStatus(id, "technician-foundations") === "complete";
      }));
    }
    return Promise.resolve(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
