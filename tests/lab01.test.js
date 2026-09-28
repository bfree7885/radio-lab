"use strict";

const assert = require("node:assert/strict");
const sim = require("../web/radio-sim.js");

const signals = [
  { id: "fm-broadcast", name: "FM broadcast", khz: 98100, halfKhz: 100, range: "VHF" },
  { id: "two-meter", name: "2-meter amateur", khz: 146520, halfKhz: 15, range: "VHF" },
  { id: "weather", name: "Weather radio", khz: 162550, halfKhz: 15, range: "VHF" },
  { id: "seventy-cm", name: "70-centimeter amateur", khz: 446000, halfKhz: 15, range: "UHF" },
];

function main() {
  assert.equal(sim.parseFrequency("146.520", "MHz"), 146520);
  assert.equal(sim.parseFrequency("146,520", "kHz"), 146520);
  assert.equal(sim.parseFrequency("146520000", "Hz"), 146520);
  assert.equal(sim.formatMhz(146520), "146.520");
  assert.equal(sim.formatKhz(146520), "146,520");
  assert.equal(sim.formatHz(146520), "146,520,000");

  const twoMeter = signals[1];
  const seventy = signals[3];
  assert.ok(Math.abs(sim.wavelengthMeters(twoMeter.khz) - 2.05) < 0.01);
  assert.ok(sim.wavelengthMeters(seventy.khz) < sim.wavelengthMeters(twoMeter.khz));
  assert.ok(sim.wavelengthMeters(440000) < 1);
  assert.equal(sim.formatWavelength(146520), "2.05");

  const centered = sim.tuneState(146520, signals);
  assert.equal(centered.centered, true);
  assert.equal(centered.signal.id, "two-meter");
  assert.equal(centered.strength, 9);

  const quiet = sim.tuneState(120000, signals);
  assert.equal(quiet.centered, false);
  assert.equal(quiet.strength, 0);

  assert.equal(sim.judgeSignal(146520, twoMeter, signals), "centered");
  assert.equal(sim.judgeSignal(98100, twoMeter, signals), "wrong-signal");
  assert.equal(sim.judgeSignal(120000, twoMeter, signals), "low");
  assert.equal(sim.judgeSignal(162550, twoMeter, signals), "wrong-signal");
  assert.equal(sim.judgeTarget(146020, 146020, 10), "centered");
  assert.equal(sim.judgeTarget(147000, 146020, 10), "high");
  assert.equal(sim.judgeSignal(446000, seventy, signals), "centered");
}

main();
