"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const sim = require("../web/rf-labs-sim.js");
const curriculum = require("../content/rf-labs.json");
const lesson = require("../content/labs/rf-01/lesson.json");
const remediation = require("../content/technician-remediation.json");
const roadmap = require("../content/roadmap.json");

function sha(path) {
  return crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
}

function source(path) {
  return fs.readFileSync(path, "utf8");
}

function main() {
  const lab = curriculum.labs[0];
  assert.equal(lab.id, "rf-01");
  assert.equal(lab.available, true);
  assert.equal(lab.curriculumId, "rf-labs");
  assert.equal(curriculum.kind, "exploration");
  assert.equal(lab.modes.transmit, "not-supported");
  assert.equal(lab.modes.simulation, "available");
  assert.equal(lab.modes.rtlSdrReceiveOnly, "future");
  assert.ok(lab.scripts.indexOf("rf-labs-sim.js") > lab.scripts.indexOf("lesson-kit.js"));
  assert.equal(remediation.labs.some(function (item) { return item.id === "rf-01"; }), false);
  assert.equal(remediation.labs.length, 9);

  const general = roadmap.tracks.find(function (track) { return track.id === "general"; });
  general.phases.forEach(function (phase) { assert.equal(phase.status, "planned"); });
  const technician = roadmap.tracks.find(function (track) { return track.id === "technician"; });
  assert.equal(technician.phases.find(function (phase) { return phase.id === "technician-exam"; }).status, "available");
  assert.equal(roadmap.tracks.find(function (track) { return track.id === "rf-labs"; }).phases[0].status, "available");

  assert.equal(sha("content/exam/technician-2026-2030-coverage.json"), "d8a7e8e0cbdc6a481c3da955e60e8ba42b33119d2758340744da6234fffc5f1e");
  assert.equal(sha("docs/TECHNICIAN_COVERAGE_AUDIT.md"), "26e2a97cc9c2b85a2c48cccee3daab98e871a7899c87d0b1186e1379779bcd75");

  assert.deepEqual(lesson.stages.map(function (stage) { return stage.id; }), ["see", "change", "measure", "identify", "recover", "explain", "field"]);
  const explain = lesson.stages.find(function (stage) { return stage.id === "explain"; }).blocks[0];
  assert.equal(explain.prompt, "Why can a strong interfering signal make reception worse even when the receiver is tuned to a different frequency?");
  assert.deepEqual(lesson.alignment.topics, []);

  const clean = sim.reception(sim.cleanSignal());
  assert.equal(clean.quality, "CLEAR");
  assert.equal(clean.overload, false);
  assert.equal(clean.desiredInPassband, true);
  const away = sim.reception(sim.makeState({ tuneKhz: 24 }));
  assert.equal(away.quality, "UNUSABLE");
  assert.ok(away.snr < clean.snr);

  const quiet = sim.reception(sim.broadbandAt(0));
  const noisy = sim.reception(sim.broadbandAt(5));
  assert.ok(noisy.snr < quiet.snr);
  assert.ok(noisy.noiseFloor > quiet.noiseFloor);
  assert.equal(noisy.desiredPeak, quiet.desiredPeak);

  const outside = sim.reception(sim.narrowAt(30));
  const inside = sim.reception(sim.narrowAt(0));
  assert.equal(outside.quality, "CLEAR");
  assert.equal(outside.interference, 0);
  assert.equal(inside.quality, "UNUSABLE");
  assert.ok(inside.interference > outside.interference);

  const partial = sim.reception(sim.partialBand());
  assert.ok(partial.interference > 0);
  assert.ok(partial.interference < 6);

  const over = sim.reception(sim.overloaded());
  assert.equal(over.overload, true);
  assert.equal(over.interference, 0);
  assert.notEqual(over.quality, "CLEAR");

  const modes = sim.modeCompare(sim.modeDemo());
  assert.equal(modes.am, "DEGRADED");
  assert.equal(modes.fm, "CLEAR");
  assert.equal(modes.snr, sim.reception(sim.modeDemo()).snr);

  const wide = sim.withPassband("separated", 30);
  const narrow = sim.withPassband("separated", 8);
  assert.notEqual(wide.quality, "CLEAR");
  assert.equal(narrow.quality, "CLEAR");
  assert.equal(sim.withPassband("buried", 30).quality, "UNUSABLE");
  assert.equal(sim.withPassband("buried", 4).quality, "UNUSABLE");

  const high = sim.snrPair(8, 0.8);
  const low = sim.snrPair(8, 4);
  assert.equal(high.snrDb, 10);
  assert.ok(low.snr < high.snr);

  const mysteries = sim.mysteries();
  assert.equal(mysteries.length, 5);
  assert.deepEqual(mysteries.map(function (item) { return item.category; }), ["clean", "narrowband", "broadband", "partial", "overload"]);
  const cases = sim.investigations();
  assert.equal(cases.length, 3);
  assert.equal(cases.some(function (item) { return item.recoverable; }), true);
  assert.equal(cases.some(function (item) { return !item.recoverable; }), true);
  assert.equal(cases.some(function (item) { return item.category === "overload"; }), true);

  const row = sim.rowOf(sim.cleanSignal());
  assert.equal(JSON.stringify(sim.rowOf(sim.cleanSignal())), JSON.stringify(row));
  assert.equal(sim.spectrum(sim.cleanSignal()).length, 81);
  const history = sim.pushRow(sim.pushRow([], row, 2), row, 2);
  assert.equal(history.length, 2);
  assert.equal(sim.pushRow(history, row, 2).length, 2);

  assert.equal(sim.capabilities.transmit, "not-supported");
  assert.equal(sim.transmit, undefined);
  const simSource = source("web/rf-labs-sim.js");
  const lessonSource = source("content/labs/rf-01/lesson.json");
  ["fetch(", "http://", "https://", "WebSocket"].forEach(function (token) {
    assert.equal(simSource.indexOf(token), -1);
  });
  ["wifi", "cellular", "GPS", "1090"].forEach(function (token) {
    assert.equal(simSource.toLowerCase().indexOf(token.toLowerCase()), -1);
    assert.equal(lessonSource.toLowerCase().indexOf(token.toLowerCase()), -1);
  });
}

main();
