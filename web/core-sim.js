/* Educational models for Technician Core. These are not measurements. */
(function (root) {
  function round(value, places) {
    var factor = Math.pow(10, places);
    return Math.round(value * factor) / factor;
  }

  function emissionSpan(centerKhz, halfKhz) {
    return { low: centerKhz - halfKhz, high: centerKhz + halfKhz };
  }

  function emissionInside(centerKhz, halfKhz, bandLow, bandHigh) {
    var span = emissionSpan(centerKhz, halfKhz);
    return span.low >= bandLow && span.high <= bandHigh;
  }

  function limitedCurrent(volts, ohms) {
    if (!ohms) {
      return null;
    }
    return volts / ohms;
  }

  function fuseState(amps, rating) {
    return amps > rating ? "open" : "holding";
  }

  function diodeConducts(direction) {
    return direction === "forward";
  }

  function capacitorStep(level, connected) {
    if (connected) {
      return Math.min(100, level + 35);
    }
    return Math.max(0, level - 35);
  }

  var MODE_WIDTH = { cw: 1, ssb: 2, digital: 2, fm: 4 };

  function modeWidth(mode) {
    return MODE_WIDTH[mode] || null;
  }

  function modeMatches(signalMode, receiverMode) {
    return signalMode === receiverMode;
  }

  function widerMode(left, right) {
    var a = modeWidth(left);
    var b = modeWidth(right);
    if (a == null || b == null || a === b) {
      return null;
    }
    return a > b ? left : right;
  }

  function feedLoss(lengthM, mhz, quality) {
    var factor = quality === "poor" ? 3 : quality === "fair" ? 2 : 1;
    return round(lengthM * (mhz / 146) * factor, 2);
  }

  function polarizationCoupling(incoming, station) {
    return incoming === station ? "strong" : "weak";
  }

  function patternRead(kind, bearing, stationBearing) {
    if (kind === "omni") {
      return { aim: "all-around", strength: "similar" };
    }
    var diff = Math.abs(bearing - stationBearing);
    if (diff > 180) {
      diff = 360 - diff;
    }
    if (diff <= 30) {
      return { aim: "toward", strength: "strong" };
    }
    if (diff >= 120) {
      return { aim: "away", strength: "weak" };
    }
    return { aim: "off-axis", strength: "less" };
  }

  function meterSetup(mode, circuitLive) {
    if (mode === "resistance" && circuitLive) {
      return { ok: false, reason: "live-resistance" };
    }
    if (mode === "current") {
      return { ok: false, reason: "series-current" };
    }
    return { ok: true, reason: "ready" };
  }

  function resolveFault(cases, id) {
    var found = null;
    (cases || []).forEach(function (item) {
      if (item.id === id) {
        found = item.cause;
      }
    });
    return found;
  }

  function exposureIndex(watts, meters, duty) {
    if (!meters || meters <= 0 || duty < 0 || watts < 0) {
      return null;
    }
    return round((watts * duty) / (meters * meters), 2);
  }

  var CoreSim = {
    round: round,
    emissionSpan: emissionSpan,
    emissionInside: emissionInside,
    limitedCurrent: limitedCurrent,
    fuseState: fuseState,
    diodeConducts: diodeConducts,
    capacitorStep: capacitorStep,
    modeWidth: modeWidth,
    modeMatches: modeMatches,
    widerMode: widerMode,
    feedLoss: feedLoss,
    polarizationCoupling: polarizationCoupling,
    patternRead: patternRead,
    meterSetup: meterSetup,
    resolveFault: resolveFault,
    exposureIndex: exposureIndex,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CoreSim;
  }
  root.CoreSim = CoreSim;
})(typeof window !== "undefined" ? window : globalThis);
