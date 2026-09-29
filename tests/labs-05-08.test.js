"use strict";

const assert = require("node:assert/strict");
const sim = require("../web/foundations-sim.js");
const curriculum = require("../content/curriculum.json");
const lab05 = require("../content/labs/05/lesson.json");
const lab06 = require("../content/labs/06/lesson.json");
const lab07 = require("../content/labs/07/lesson.json");
const lab08 = require("../content/labs/08/lesson.json");
const reference = require("../content/reference/foundations.json");

function examOf(lesson) {
  return lesson.stages[4].blocks[0];
}

function assertPractice(lesson, minimum) {
  const exam = examOf(lesson);
  assert.equal(exam.label, "RADIO LAB PRACTICE");
  assert.ok(exam.questions.length >= minimum);
  assert.ok(exam.questions.length <= 7);
  assert.equal(exam.poolId, null);
  assert.equal(exam.practicePoolId, "radio-lab-practice");
  exam.questions.forEach(function (question) {
    assert.equal(question.stem.includes("FCC"), false);
    assert.ok(question.why);
    assert.ok(question.choices[question.correctIndex]);
  });
}

function main() {
  const low = sim.ohmsLaw(12, 50);
  const high = sim.ohmsLaw(24, 50);
  assert.ok(high.amps > low.amps);
  const resisted = sim.ohmsLaw(12, 100);
  assert.ok(resisted.amps < low.amps);
  assert.equal(sim.ohmsLaw(12, 6).amps, 2);
  assert.equal(sim.ohmsLaw(13.8, 46).amps, 0.3);
  assert.equal(sim.round(sim.powerWatts(13.8, 0.5), 1), 6.9);
  assert.equal(sim.powerWatts(13.8, 5), 69);
  assert.ok(sim.powerWatts(13.8, 5) > sim.powerWatts(13.8, 0.5));
  assert.equal(sim.seriesOhms([50, 50]), 100);
  assert.equal(sim.parallelOhms([50, 50]), 25);

  const vhf = sim.wave(146);
  const uhf = sim.wave(440);
  assert.ok(Math.abs(vhf.meters - 300 / 146) < 1e-9);
  assert.ok(uhf.quarterMeters < vhf.quarterMeters);
  assert.equal(sim.matchSWR(vhf.quarterMeters, vhf.quarterMeters).swr, 1);
  assert.equal(sim.matchSWR(vhf.quarterMeters, vhf.quarterMeters).relation, "matched");
  assert.equal(sim.matchSWR(0.51, vhf.quarterMeters).relation, "matched");
  assert.equal(sim.matchSWR(1.2, vhf.quarterMeters).relation, "long");
  assert.ok(sim.matchSWR(1.2, vhf.quarterMeters).swr > 1);
  assert.equal(sim.matchSWR(0.17, vhf.quarterMeters).relation, "short");

  assert.equal(sim.assessPath({
    band: "vhf", mode: "simplex", obstacle: "ridge", height: "high", power: "high",
  }).code, "obstructed");
  assert.equal(sim.assessPath({
    band: "vhf", mode: "simplex", obstacle: "ridge", height: "high", power: "high",
  }).powerHelps, false);
  assert.equal(sim.assessPath({
    band: "vhf", mode: "repeater", obstacle: "ridge",
  }).code, "repeater");
  assert.equal(sim.assessPath({
    band: "vhf", mode: "simplex", obstacle: "hill", height: "low",
  }).code, "obstructed");
  assert.equal(sim.assessPath({
    band: "vhf", mode: "simplex", obstacle: "hill", height: "high",
  }).code, "clear");
  assert.equal(sim.assessPath({ band: "hf" }).code, "skywave");
  assert.equal(sim.assessPath({ band: "hf" }).educationalModel, true);

  ["05", "06", "07", "08"].forEach(function (id) {
    const lab = curriculum.labs.find(function (item) { return item.id === id; });
    assert.equal(lab.available, true);
    assert.equal(lab.lesson, "labs/" + id + "/lesson.json");
  });
  assertPractice(lab05, 5);
  assertPractice(lab06, 5);
  assertPractice(lab07, 5);
  assert.equal(lab05.stages[3].blocks[0].prompt, "If resistance stays the same, why does increasing voltage cause more current to flow?");
  assert.equal(lab06.stages[3].blocks[0].prompt, "Why might an antenna that works well at one frequency perform poorly at a very different frequency?");
  assert.equal(lab07.stages[3].blocks[0].prompt, "Why can antenna location sometimes improve communication more than simply increasing transmitter power?");
  assert.deepEqual(lab08.stages.map(function (stage) { return stage.label; }), [
    "PLAN", "SET UP", "CHECK", "OPERATE", "TROUBLESHOOT", "CLEARANCE",
  ]);
  assert.equal(lab08.stages[5].blocks[0].taskId, "lab08-outing");
  assert.equal(lab08.hardware.length, 0);
  assert.ok(reference.sections.length >= 8);
  assert.equal(reference.id, "technician-foundations-reference");
}

main();
