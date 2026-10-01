/* Educational receiver model for RF Labs.

   Relative levels only. This is not calibrated test equipment and it does
   not transmit. A later receive-only radio adapter can observe ambient
   spectrum. Nothing here generates over-the-air energy.
*/
(function (root) {
  var SPAN = 40;
  var SKIRT = 6;

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function cloneList(items) {
    return (items || []).map(function (item) {
      return { khz: item.khz, widthKhz: item.widthKhz, level: item.level };
    });
  }

  function makeState(partial) {
    var source = partial || {};
    return {
      tuneKhz: source.tuneKhz == null ? 0 : source.tuneKhz,
      passbandKhz: source.passbandKhz == null ? 12 : source.passbandKhz,
      desiredKhz: source.desiredKhz == null ? 0 : source.desiredKhz,
      desiredLevel: source.desiredLevel == null ? 8 : source.desiredLevel,
      desiredWidthKhz: source.desiredWidthKhz == null ? 2 : source.desiredWidthKhz,
      noiseFloor: source.noiseFloor == null ? 1.5 : source.noiseFloor,
      broadband: source.broadband == null ? 0 : source.broadband,
      interferers: cloneList(source.interferers),
      strongKhz: source.strongKhz == null ? 28 : source.strongKhz,
      strongLevel: source.strongLevel == null ? 0 : source.strongLevel,
      strongWidthKhz: source.strongWidthKhz == null ? 2 : source.strongWidthKhz,
      mode: source.mode || "am",
    };
  }

  function cleanSignal() {
    return makeState();
  }

  function shape(khz, center, width, level) {
    if (!(level > 0) || !(width > 0)) {
      return 0;
    }
    var half = width / 2;
    var distance = Math.abs(khz - center);
    if (distance >= half) {
      return 0;
    }
    return level * (1 - distance / half);
  }

  function spectrum(state) {
    var bins = [];
    var khz;
    for (khz = -SPAN; khz <= SPAN; khz += 1) {
      var floor = state.noiseFloor + state.broadband + 0.08 * Math.sin(khz * 0.5);
      var level = floor;
      var desired = shape(khz, state.desiredKhz, state.desiredWidthKhz, state.desiredLevel);
      if (desired > level) {
        level = desired;
      }
      state.interferers.forEach(function (item) {
        var extra = shape(khz, item.khz, item.widthKhz, item.level);
        if (extra > level) {
          level = extra;
        }
      });
      var strong = shape(khz, state.strongKhz, state.strongWidthKhz, state.strongLevel);
      if (strong > level) {
        level = strong;
      }
      bins.push({ khz: khz, level: round(level), floor: round(floor) });
    }
    return bins;
  }

  function overlapPower(center, width, level, tune, passband) {
    if (!(level > 0) || !(width > 0) || !(passband > 0)) {
      return 0;
    }
    var left = Math.max(center - width / 2, tune - passband / 2);
    var right = Math.min(center + width / 2, tune + passband / 2);
    var overlap = Math.max(0, right - left);
    return level * (overlap / width);
  }

  function filterGain(offset, halfWidth) {
    if (offset <= halfWidth) {
      return 1;
    }
    if (offset >= halfWidth + SKIRT) {
      return 0.08;
    }
    return 1 - 0.92 * ((offset - halfWidth) / SKIRT);
  }

  function qualityFor(snr, mode) {
    if (mode === "fm") {
      if (snr >= 2.2) {
        return "CLEAR";
      }
      if (snr >= 1.15) {
        return "DEGRADED";
      }
      return "UNUSABLE";
    }
    if (snr >= 3) {
      return "CLEAR";
    }
    if (snr >= 1.35) {
      return "DEGRADED";
    }
    return "UNUSABLE";
  }

  function reception(state) {
    var half = state.passbandKhz / 2;
    var desired = state.desiredLevel * filterGain(Math.abs(state.desiredKhz - state.tuneKhz), half);
    var noise = state.noiseFloor + state.broadband;
    var interference = 0;
    state.interferers.forEach(function (item) {
      interference += overlapPower(item.khz, item.widthKhz, item.level, state.tuneKhz, state.passbandKhz);
    });
    var distance = Math.abs(state.strongKhz - state.tuneKhz);
    var overload = state.strongLevel >= 8 && distance > half && distance <= SPAN;
    var desense = overload ? (state.strongLevel - 6) * 2 : 0;
    var denom = noise + interference + desense;
    var snr = denom > 0 ? desired / denom : desired;
    snr = round(snr);
    return {
      snr: snr,
      snrDb: snr > 0 ? round(10 * Math.log10(snr)) : null,
      quality: qualityFor(snr, state.mode || "am"),
      noiseFloor: round(noise),
      desiredPeak: state.desiredLevel,
      desiredInPassband: filterGain(Math.abs(state.desiredKhz - state.tuneKhz), half) >= 0.5,
      overload: overload,
      interference: round(interference),
      model: "educational",
    };
  }

  function snrPair(signal, noise) {
    if (!(signal >= 0) || !(noise > 0)) {
      return null;
    }
    var snr = round(signal / noise);
    return {
      signal: signal,
      noise: noise,
      snr: snr,
      snrDb: round(10 * Math.log10(snr)),
      quality: qualityFor(snr, "am"),
    };
  }

  function narrowAt(khz) {
    return makeState({ interferers: [{ khz: khz, widthKhz: khz === 7 ? 4 : 2, level: 8 }] });
  }

  function broadbandAt(amount) {
    return makeState({ broadband: amount });
  }

  function partialBand() {
    return makeState({ interferers: [{ khz: 5, widthKhz: 10, level: 6 }] });
  }

  function overloaded() {
    return makeState({ strongKhz: 24, strongLevel: 10, strongWidthKhz: 2 });
  }

  function modeDemo() {
    return makeState({ broadband: 1.8 });
  }

  function modeCompare(state) {
    var am = reception(makeState(Object.assign({}, state, { mode: "am", interferers: state.interferers })));
    var fm = reception(makeState(Object.assign({}, state, { mode: "fm", interferers: state.interferers })));
    return { snr: am.snr, am: am.quality, fm: fm.quality };
  }

  function recoveryCase(id) {
    if (id === "separated") {
      return makeState({
        passbandKhz: 30,
        interferers: [{ khz: 10, widthKhz: 4, level: 8 }],
      });
    }
    if (id === "buried") {
      return makeState({
        passbandKhz: 30,
        interferers: [{ khz: 0, widthKhz: 4, level: 9 }],
      });
    }
    return null;
  }

  function withPassband(id, width) {
    var next = recoveryCase(id);
    if (!next) {
      return null;
    }
    next.passbandKhz = width;
    return reception(next);
  }

  function preset(name) {
    if (name === "clean") {
      return cleanSignal();
    }
    if (name === "narrow") {
      return narrowAt(0);
    }
    if (name === "several") {
      return makeState({
        interferers: [
          { khz: -4, widthKhz: 2, level: 6 },
          { khz: 4, widthKhz: 2, level: 6 },
        ],
      });
    }
    if (name === "broadband") {
      return broadbandAt(4);
    }
    if (name === "partial") {
      return partialBand();
    }
    if (name === "nearby") {
      return overloaded();
    }
    return null;
  }

  function mysteries() {
    return [
      { id: "A", category: "clean", state: cleanSignal() },
      { id: "B", category: "narrowband", state: narrowAt(0) },
      { id: "C", category: "broadband", state: broadbandAt(5) },
      { id: "D", category: "partial", state: partialBand() },
      { id: "E", category: "overload", state: overloaded() },
    ];
  }

  function investigations() {
    return [
      {
        id: "beside",
        category: "narrowband",
        recoverable: true,
        mitigation: "narrow-filter",
        state: recoveryCase("separated"),
        evidence: "A second narrow trace sits beside the desired signal. A narrower passband leaves that trace outside.",
      },
      {
        id: "hiss",
        category: "broadband",
        recoverable: false,
        mitigation: "none",
        state: broadbandAt(5),
        evidence: "The desired peak is unchanged and the floor has risen through the passband. Narrowing the passband still contains that noise.",
      },
      {
        id: "neighbor",
        category: "overload",
        recoverable: false,
        mitigation: "none",
        state: overloaded(),
        evidence: "The strong trace is outside the tuned passband, and reception still collapsed. That is the receiver, not energy inside the tuned channel.",
      },
    ];
  }

  function rowOf(state) {
    return spectrum(state).map(function (bin) {
      return bin.level;
    });
  }

  function pushRow(history, row, limit) {
    var next = (history || []).concat([row.slice()]);
    var cap = limit || 32;
    if (next.length > cap) {
      return next.slice(next.length - cap);
    }
    return next;
  }

  var api = {
    spanKhz: SPAN,
    makeState: makeState,
    cleanSignal: cleanSignal,
    spectrum: spectrum,
    reception: reception,
    snrPair: snrPair,
    narrowAt: narrowAt,
    broadbandAt: broadbandAt,
    partialBand: partialBand,
    overloaded: overloaded,
    modeDemo: modeDemo,
    modeCompare: modeCompare,
    recoveryCase: recoveryCase,
    withPassband: withPassband,
    preset: preset,
    mysteries: mysteries,
    investigations: investigations,
    rowOf: rowOf,
    pushRow: pushRow,
    capabilities: {
      simulation: "available",
      rtlSdrReceiveOnly: "future",
      transmit: "not-supported",
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RfLabsSim = api;
})(typeof window !== "undefined" ? window : globalThis);
