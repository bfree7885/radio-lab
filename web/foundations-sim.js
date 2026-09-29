/* Educational models for Labs 05–08.

   Ohm's law, a simplified antenna match, and a qualitative path picture.
   These are teaching models, not engineering predictions.
*/
(function (root) {
  function round(value, digits) {
    var scale = Math.pow(10, digits);
    return Math.round(value * scale) / scale;
  }

  function ohmsLaw(volts, ohms) {
    if (!isFinite(volts) || !(ohms > 0)) {
      return null;
    }
    var amps = volts / ohms;
    return {
      volts: volts,
      ohms: ohms,
      amps: amps,
      watts: volts * amps,
    };
  }

  function powerWatts(volts, amps) {
    if (!isFinite(volts) || !isFinite(amps)) {
      return null;
    }
    return volts * amps;
  }

  function seriesOhms(values) {
    var total = 0;
    for (var i = 0; i < values.length; i += 1) {
      if (!(values[i] > 0)) {
        return null;
      }
      total += values[i];
    }
    return total;
  }

  function parallelOhms(values) {
    var sum = 0;
    for (var i = 0; i < values.length; i += 1) {
      if (!(values[i] > 0)) {
        return null;
      }
      sum += 1 / values[i];
    }
    if (!(sum > 0)) {
      return null;
    }
    return 1 / sum;
  }

  function wave(mhz) {
    if (!(mhz > 0)) {
      return null;
    }
    var meters = 300 / mhz;
    return {
      mhz: mhz,
      meters: meters,
      quarterMeters: meters / 4,
      halfMeters: meters / 2,
    };
  }

  function matchSWR(lengthMeters, targetMeters) {
    if (!(lengthMeters > 0) || !(targetMeters > 0)) {
      return null;
    }
    var ratio = lengthMeters / targetMeters;
    var departure = Math.abs(ratio - 1);
    var swr = 1 + departure * 4;
    if (swr > 9.9) {
      swr = 9.9;
    }
    swr = round(swr, 1);
    var relation = "matched";
    if (ratio > 1.08) {
      relation = "long";
    } else if (ratio < 0.92) {
      relation = "short";
    }
    return {
      swr: swr,
      reflection: (swr - 1) / (swr + 1),
      relation: relation,
      educationalModel: true,
    };
  }

  function assessPath(state) {
    var band = state.band || "vhf";
    var mode = state.mode || "simplex";
    var obstacle = state.obstacle || "none";
    var height = state.height || "low";
    var position = state.position || "same";
    if (band === "hf") {
      return {
        code: "skywave",
        label: "INTRODUCTORY HF SKYWAVE",
        educationalModel: true,
        powerHelps: false,
        note: "HF can reach past the horizon when the ionosphere returns a signal to Earth. That is not guaranteed, and it changes with time and frequency. This drawing is only an introduction.",
      };
    }
    if (mode === "repeater") {
      return {
        code: "repeater",
        label: "REPEATER PATH",
        educationalModel: true,
        powerHelps: false,
        note: "The repeater path in this model does not need the direct path to be clear. It is not a coverage prediction.",
      };
    }
    if (obstacle === "ridge") {
      return {
        code: "obstructed",
        label: "OBSTRUCTED PATH",
        educationalModel: true,
        powerHelps: false,
        note: "This ridge blocks the direct path. Raising transmitter power does not remove the ridge. On this drawing the antennas stay below the ridge even when they are raised.",
      };
    }
    if (obstacle === "hill" && height !== "high" && position !== "clearer") {
      return {
        code: "obstructed",
        label: "OBSTRUCTED PATH",
        educationalModel: true,
        powerHelps: false,
        note: "The hill blocks this low path. More power does not move the hill. Height or a clearer position may open a simplified line of sight. Higher does not always work.",
      };
    }
    return {
      code: "clear",
      label: "CLEAR PATH",
      educationalModel: true,
      powerHelps: false,
      note: "The simplified line of sight is open. This is not a promise of range, and a different hill could still block a higher antenna.",
    };
  }

  var api = {
    round: round,
    ohmsLaw: ohmsLaw,
    powerWatts: powerWatts,
    seriesOhms: seriesOhms,
    parallelOhms: parallelOhms,
    wave: wave,
    matchSWR: matchSWR,
    assessPath: assessPath,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.FoundationsSim = api;
})(typeof window !== "undefined" ? window : globalThis);
