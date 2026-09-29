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

  var CoreSim = {
    round: round,
    emissionSpan: emissionSpan,
    emissionInside: emissionInside,
    limitedCurrent: limitedCurrent,
    fuseState: fuseState,
    diodeConducts: diodeConducts,
    capacitorStep: capacitorStep,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CoreSim;
  }
  root.CoreSim = CoreSim;
})(typeof window !== "undefined" ? window : globalThis);
