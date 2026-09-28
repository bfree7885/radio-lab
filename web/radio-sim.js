/* Shared simulation math for Lab 01.

   Browser only. No network and no hardware. Frequencies are integer
   kilohertz so the converter and the receiver agree.
*/
(function (root) {
  var MIN_KHZ = 88000;
  var MAX_KHZ = 450000;

  function clampKhz(khz) {
    var n = Math.round(Number(khz));
    if (!isFinite(n)) {
      return null;
    }
    if (n < MIN_KHZ) {
      return MIN_KHZ;
    }
    if (n > MAX_KHZ) {
      return MAX_KHZ;
    }
    return n;
  }

  function parseFrequency(value, unit) {
    var n = Number(String(value).replace(/,/g, "").trim());
    if (!isFinite(n) || n <= 0) {
      return null;
    }
    var khz;
    if (unit === "Hz") {
      khz = n / 1000;
    } else if (unit === "kHz") {
      khz = n;
    } else if (unit === "MHz") {
      khz = n * 1000;
    } else {
      return null;
    }
    return clampKhz(khz);
  }

  function formatMhz(khz) {
    return (khz / 1000).toLocaleString("en-US", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  }

  function formatKhz(khz) {
    return Math.round(khz).toLocaleString("en-US");
  }

  function formatHz(khz) {
    return Math.round(khz * 1000).toLocaleString("en-US");
  }

  function wavelengthMeters(khz) {
    var mhz = khz / 1000;
    if (!(mhz > 0)) {
      return null;
    }
    return 300 / mhz;
  }

  function formatWavelength(khz) {
    var meters = wavelengthMeters(khz);
    if (meters === null) {
      return "";
    }
    var digits = meters >= 10 ? 1 : 2;
    return meters.toFixed(digits);
  }

  function tuneState(tunedKhz, signals) {
    var best = null;
    var bestDelta = Infinity;
    var list = signals || [];
    for (var i = 0; i < list.length; i += 1) {
      var delta = Math.abs(tunedKhz - list[i].khz);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = list[i];
      }
    }
    if (!best) {
      return { signal: null, deltaKhz: null, strength: 0, centered: false, nearby: false };
    }
    var reach = best.halfKhz * 6;
    var centered = bestDelta <= best.halfKhz;
    var strength = 0;
    if (bestDelta <= reach) {
      strength = Math.round(9 * (1 - bestDelta / reach));
      if (centered) {
        strength = 9;
      } else if (strength < 1) {
        strength = 1;
      }
    }
    return {
      signal: best,
      deltaKhz: bestDelta,
      strength: strength,
      centered: centered,
      nearby: strength > 0 && !centered,
    };
  }

  function judgeTarget(tunedKhz, targetKhz, toleranceKhz) {
    var delta = tunedKhz - targetKhz;
    var tol = toleranceKhz || 0;
    if (Math.abs(delta) <= tol) {
      return "centered";
    }
    if (Math.abs(delta) <= Math.max(tol * 4, 50)) {
      return "close";
    }
    if (delta > 0) {
      return "high";
    }
    return "low";
  }

  function judgeSignal(tunedKhz, signal, signals) {
    var state = tuneState(tunedKhz, signals);
    if (state.centered && state.signal && state.signal.id === signal.id) {
      return "centered";
    }
    if (state.centered && state.signal) {
      return "wrong-signal";
    }
    var toward = tunedKhz - signal.khz;
    if (Math.abs(toward) <= signal.halfKhz * 6) {
      return "close";
    }
    if (toward > 0) {
      return "high";
    }
    return "low";
  }

  var api = {
    MIN_KHZ: MIN_KHZ,
    MAX_KHZ: MAX_KHZ,
    clampKhz: clampKhz,
    parseFrequency: parseFrequency,
    formatMhz: formatMhz,
    formatKhz: formatKhz,
    formatHz: formatHz,
    wavelengthMeters: wavelengthMeters,
    formatWavelength: formatWavelength,
    tuneState: tuneState,
    judgeTarget: judgeTarget,
    judgeSignal: judgeSignal,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabSim = api;
})(typeof window !== "undefined" ? window : globalThis);
