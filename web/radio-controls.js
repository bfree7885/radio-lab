/* Pure helpers for Labs 02–04.

   Squelch, repeater offset, and the band reference. No page and no network.
*/
(function (root) {
  function receiverGate(opts) {
    var signal = opts.signal || 0;
    var noise = opts.noise == null ? 0 : opts.noise;
    var volume = opts.volume || 0;
    var squelch = opts.squelch || 0;
    if (!opts.power) {
      return { rx: false, reason: "off", signal: signal, passing: false };
    }
    var passing = Math.max(signal, noise) >= squelch;
    if (!passing) {
      return {
        rx: false,
        reason: signal > 0 && signal < squelch ? "squelch-hides-signal" : "squelch-closed",
        signal: signal,
        passing: false,
      };
    }
    if (volume <= 0) {
      return { rx: false, reason: "volume-down", signal: signal, passing: true };
    }
    if (signal > noise) {
      return { rx: true, reason: "signal", signal: signal, passing: true };
    }
    return { rx: true, reason: "noise", signal: signal, passing: true };
  }

  function signalAt(khz, signals, noise) {
    var best = 0;
    var name = "";
    (signals || []).forEach(function (signal) {
      if (Math.abs(khz - signal.khz) <= (signal.halfKhz || 0)) {
        if (signal.strength > best) {
          best = signal.strength;
          name = signal.name || "";
        }
      }
    });
    return { strength: best, name: name, noise: noise == null ? 2 : noise };
  }

  function repeaterPair(outputKhz, offsetKhz) {
    return {
      receiveKhz: outputKhz,
      transmitKhz: outputKhz + offsetKhz,
      offsetKhz: offsetKhz,
    };
  }

  function repeaterResponds(expected, attempt) {
    var freqOk = attempt.receiveKhz === expected.outputKhz;
    var offsetOk = attempt.offsetKhz === expected.offsetKhz;
    var toneOk = attempt.toneHz === expected.toneHz;
    return {
      freqOk: freqOk,
      offsetOk: offsetOk,
      toneOk: toneOk,
      responds: freqOk && offsetOk && toneOk,
    };
  }

  function lookupEntry(catalog, khz) {
    var lists = (catalog.services || []).concat(catalog.bands || []);
    var best = null;
    lists.forEach(function (entry) {
      if (khz < entry.khzLow || khz > entry.khzHigh) {
        return;
      }
      var width = entry.khzHigh - entry.khzLow;
      if (!best || width < best.width) {
        best = { entry: entry, width: width };
      }
    });
    return best ? best.entry : null;
  }

  function segmentAt(band, khz) {
    var segments = band.segments || [];
    for (var i = 0; i < segments.length; i += 1) {
      var seg = segments[i];
      var last = i === segments.length - 1;
      var belowTop = last ? khz <= seg.khzHigh : khz < seg.khzHigh;
      if (khz >= seg.khzLow && belowTop) {
        return seg;
      }
    }
    return null;
  }

  function assessTransmission(catalog, khz, licenseLevel, mode) {
    var entry = lookupEntry(catalog, khz);
    if (!entry) {
      return { allowed: false, reason: "not-in-reference", entry: null, segment: null };
    }
    if (entry.service !== "amateur") {
      return { allowed: false, reason: "not-amateur", entry: entry, segment: null };
    }
    var segment = segmentAt(entry, khz);
    if (!segment) {
      return { allowed: false, reason: "no-segment", entry: entry, segment: null };
    }
    var levels = segment.licenseLevels || [];
    if (levels.indexOf(licenseLevel) === -1) {
      return { allowed: false, reason: "license", entry: entry, segment: segment };
    }
    var modes = segment.modes || [];
    if (mode && modes.indexOf("all") === -1 && modes.indexOf(mode) === -1) {
      return { allowed: false, reason: "mode", entry: entry, segment: segment };
    }
    return { allowed: true, reason: "allowed", entry: entry, segment: segment };
  }

  var api = {
    receiverGate: receiverGate,
    signalAt: signalAt,
    repeaterPair: repeaterPair,
    repeaterResponds: repeaterResponds,
    lookupEntry: lookupEntry,
    segmentAt: segmentAt,
    assessTransmission: assessTransmission,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioControls = api;
})(typeof window !== "undefined" ? window : globalThis);
