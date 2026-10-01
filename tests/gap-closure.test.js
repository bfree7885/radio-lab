"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const gap = require("../web/gap-closure.js");
const remediation = require("../content/technician-remediation.json");
const roadmap = require("../content/roadmap.json");
const rf = require("../content/rf-labs.json");

function lesson(id) {
  return require("../content/labs/" + id + "/lesson.json");
}

function sha(path) {
  return crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
}

function close(id) {
  const stage = lesson(id).stages.find(function (item) { return item.id === "close"; });
  assert.ok(stage, id);
  return stage;
}

function has(id, component) {
  assert.ok(close(id).blocks.some(function (block) { return block.component === component; }), component);
}

function main() {
  assert.equal(sha("content/exam/technician-2026-2030-coverage.json"), "d8a7e8e0cbdc6a481c3da955e60e8ba42b33119d2758340744da6234fffc5f1e");
  assert.equal(sha("docs/TECHNICIAN_COVERAGE_AUDIT.md"), "26e2a97cc9c2b85a2c48cccee3daab98e871a7899c87d0b1186e1379779bcd75");
  assert.equal(sha("content/exam/technician-2026-2030-coverage-post-remediation.json"), "ad75e3cd03cfaf888dd17c285ecad05ef5ee63db4eded9a56e224ca0dda28e3d");
  assert.equal(sha("content/exam/technician-2026-2030-stem-support.json"), "d7a98009b8870f652eb142780905d6d921691aca9b4283e931185c15f53b6053");
  assert.equal(sha("docs/TECHNICIAN_COVERAGE_REAUDIT.md"), "98e208a8a3c9058bb49a58e55ba68bb67d9e693bcb4db138540e37d9e013f744");
  assert.equal(sha("content/rf-labs.json"), "c21d19d6bb896107d2a5e27df8ba8b305d74eb1e56d946079acea89c84a3e42f");
  assert.equal(rf.labs[0].id, "rf-01");
  assert.equal(rf.labs[0].curriculumId, "rf-labs");

  const technician = roadmap.tracks.find(function (track) { return track.id === "technician"; });
  const general = roadmap.tracks.find(function (track) { return track.id === "general"; });
  assert.equal(technician.phases.find(function (phase) { return phase.id === "technician-exam"; }).status, "available");
  general.phases.forEach(function (phase) { assert.equal(phase.status, "planned"); });

  ["tr-02", "tr-03", "tr-04", "tr-05", "tr-06", "tr-07", "tr-09"].forEach(function (id) {
    const lab = remediation.labs.find(function (item) { return item.id === id; });
    assert.equal(lab.scripts[lab.scripts.length - 1], "gap-closure.js", id);
    assert.equal(lesson(id).stages[lesson(id).stages.length - 1].id, "close");
  });
  assert.equal(remediation.labs.find(function (item) { return item.id === "tr-08"; }).scripts.indexOf("gap-closure.js"), -1);
  assert.equal(remediation.labs.find(function (item) { return item.id === "rf-01"; }), undefined);

  has("tr-09", "power-line-site");
  assert.equal(gap.POWER_LINE_FEET, 10);
  assert.equal(gap.fallClearsPowerLine(4).safe, false);
  assert.equal(gap.fallClearsPowerLine(10).safe, false);
  assert.equal(gap.fallClearsPowerLine(18).safe, true);
  assert.match(gap.fallClearsPowerLine(18).rule, /within 10 feet/);

  has("tr-03", "cw-only-desk");
  assert.equal(gap.cwOnlyBand(50.05), "50.0-50.1");
  assert.equal(gap.cwOnlyBand(144.05), "144.0-144.1");
  assert.equal(gap.emissionInCwOnlySegment(50.05, "FM").allowed, false);
  assert.equal(gap.emissionInCwOnlySegment(50.05, "CW").allowed, true);
  assert.equal(gap.emissionInCwOnlySegment(144.05, "SSB").allowed, false);
  assert.equal(gap.emissionInCwOnlySegment(144.05, "CW").allowed, true);

  has("tr-04", "winlink-choice");
  assert.equal(gap.messageSystem("callsign-email"), "winlink");
  assert.equal(gap.messageSystem("voice"), "voice");
  assert.equal(gap.messageSystem("aprs"), "aprs");
  assert.equal(gap.messageSystem("net"), "net");
  assert.equal(gap.messageSystem("internet-email"), "internet-email");

  has("tr-05", "polarization-lab");
  assert.equal(gap.ionosphereSketch().after, "elliptical");
  assert.equal(gap.ionosphereSketch().eitherPolarizationWorks, true);
  assert.equal(gap.ionosphereSketch().fadingCause, "different-paths");
  assert.equal(gap.ionosphereSketch().model, "educational");
  assert.equal(gap.polarizationFor("local-fm"), "vertical");
  assert.equal(gap.polarizationFor("vhf-cw"), "horizontal");
  assert.equal(gap.polarizationFor("vhf-ssb"), "horizontal");

  has("tr-06", "station-power-problems");
  has("tr-06", "station-connect");
  has("tr-06", "fm-offset-listen");
  has("tr-06", "noise-blanker-cases");
  has("tr-06", "amplifier-switch");
  has("tr-06", "interference-remedy");
  has("tr-06", "dummy-load-parts");
  const last = close("tr-06").blocks[close("tr-06").blocks.length - 1];
  assert.equal(last.component, "dummy-load-parts");
  assert.ok(last.requiresGates.indexOf("tr06-blanker") >= 0);
  assert.equal(gap.mobileSupplyRating(50).volts, 13.8);
  assert.equal(gap.mobileSupplyRating(50).amperes, 12);
  assert.equal(gap.batteryHours(12, 2), 6);
  assert.equal(gap.batteryHours(7, 3.5), 2);
  assert.match(gap.stationConnection("rf-power-meter"), /feed line/i);
  assert.match(gap.stationConnection("swr-meter"), /rated/i);
  assert.match(gap.stationConnection("ft8-audio"), /FT8/);
  assert.match(gap.stationConnection("interface-signals"), /keying/);
  assert.match(gap.stationConnection("receive-audio"), /line in/i);
  assert.match(gap.stationConnection("bond"), /Flat copper strap/);

  assert.equal(gap.fmReceive(0).quality, "clear");
  assert.equal(gap.fmReceive(-1).quality, "distorted");
  assert.equal(gap.fmReceive(1).quality, "distorted");
  assert.equal(gap.noiseBlankerFits("impulse"), true);
  assert.equal(gap.noiseBlankerFits("voice"), false);
  assert.equal(gap.noiseBlankerFits("deviation"), false);
  const blanker = close("tr-06").blocks.find(function (block) { return block.component === "noise-blanker-cases"; });
  assert.equal(blanker.recordsStage, false);
  assert.equal(blanker.gate, "tr06-blanker");

  assert.equal(gap.amplifierSetting("SSB"), "SSB");
  assert.equal(gap.amplifierSetting("FM"), "CW-FM");
  assert.equal(gap.amplifierSetting("CW"), "CW-FM");
  assert.equal(gap.amplifierResult("SSB", "SSB").matched, true);
  assert.equal(gap.amplifierResult("FM", "SSB").matched, false);
  assert.equal(gap.interferenceRemedy("broadcast-fm"), "band-reject");
  assert.equal(gap.interferenceRemedy("cable-tv"), "connectors");
  assert.equal(gap.dummyLoadMaterial("noninductive-resistor-heatsink"), true);
  assert.equal(gap.dummyLoadMaterial("inductive"), false);

  has("tr-02", "meter-risk");
  assert.equal(gap.meterOutcome("resistance", "voltage", true).risk, true);
  assert.equal(gap.meterOutcome("resistance", "voltage", true).label, "METER AT RISK");
  assert.equal(gap.meterOutcome("voltage", "voltage", true).risk, false);
  assert.equal(gap.meterOutcome("resistance", "resistance", false).risk, false);

  has("tr-07", "satellite-gaps");
  assert.equal(gap.spinLevel(0).level, 4);
  assert.equal(gap.spinLevel(2).level, 1);
  assert.equal(gap.spinLevel(4).level, gap.spinLevel(0).level);
  assert.equal(gap.spinLevel(2).cause, "rotation");
  assert.equal(gap.spinLevel(1).model, "educational");
  assert.equal(gap.publishedSatelliteMode("one"), "SSB");
  assert.equal(gap.publishedSatelliteMode("two"), "FM");
  assert.equal(gap.publishedSatelliteMode("three"), "CW/data");
  assert.equal(gap.satelliteModeMatch("two", "FM").ok, true);
  assert.equal(gap.satelliteModeMatch("two", "SSB").ok, false);
  assert.equal(gap.uplinkBalance(2).relation, "low");
  assert.equal(gap.uplinkBalance(5).relation, "matched");
  assert.equal(gap.uplinkBalance(9).relation, "high");
  assert.equal(gap.uplinkBalance(5).own, gap.uplinkBalance(5).beacon);
  assert.equal(gap.uplinkBalance(9).relation, gap.uplinkBalance(9).relation);

  const reference = require("../content/reference/technician-remediation.json");
  ["power-line-distance", "cw-only-slices", "winlink", "polarization-conventions", "station-power", "dummy-load-parts", "meter-risk", "satellite-operating"].forEach(function (id) {
    assert.ok(reference.sections.some(function (section) { return section.id === id; }), id);
  });
}

main();
