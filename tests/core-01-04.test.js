"use strict";

const assert = require("node:assert/strict");
const sim = require("../web/core-sim.js");
const foundations = require("../content/curriculum.json");
const core = require("../content/technician-core.json");
const syllabus = require("../content/exam/technician-2026-2030.json");
const lab01 = require("../content/labs/tc-01/lesson.json");
const lab02 = require("../content/labs/tc-02/lesson.json");
const lab03 = require("../content/labs/tc-03/lesson.json");
const lab04 = require("../content/labs/tc-04/lesson.json");

function groups() {
  const ids = [];
  syllabus.subelements.forEach(function (subelement) {
    subelement.groups.forEach(function (group) {
      ids.push(group.id);
    });
  });
  return ids;
}

function examOf(lesson) {
  return lesson.stages[4].blocks.find(function (block) { return block.type === "exam"; });
}

function main() {
  assert.equal(foundations.labs.length, 8);
  assert.equal(core.id, "technician-core");
  assert.equal(core.labs.length, 4);
  assert.deepEqual(core.labs.map(function (lab) { return lab.id; }), ["tc-01", "tc-02", "tc-03", "tc-04"]);
  core.labs.forEach(function (lab) {
    assert.equal(lab.available, true);
    assert.equal(lab.curriculumId, "technician-core");
  });

  assert.equal(syllabus.pool, "2026-2030");
  assert.equal(syllabus.effectiveFrom, "2026-07-01");
  assert.equal(syllabus.effectiveThrough, "2030-06-30");
  assert.equal(syllabus.questionsIncluded, false);
  const known = groups();

  [lab01, lab02, lab03, lab04].forEach(function (lesson) {
    assert.equal(lesson.alignment.licenseLevel, "technician");
    assert.equal(lesson.alignment.pool, "2026-2030");
    assert.equal(lesson.curriculumId, "technician-core");
    lesson.alignment.topics.forEach(function (topic) {
      assert.equal(known.indexOf(topic) >= 0, true);
    });
    const exam = examOf(lesson);
    assert.equal(exam.poolId, null);
    assert.equal(exam.practicePoolId, "radio-lab-practice");
    assert.ok(exam.questions.length >= 5);
    assert.ok(exam.questions.length <= 7);
    exam.questions.forEach(function (question) {
      assert.equal(/T\d[A-F]\d\d/.test(question.stem), false);
      assert.ok(question.why);
      assert.ok(known.indexOf(question.topicId) >= 0);
    });
  });

  assert.equal(lab01.stages[3].blocks[0].prompt, "Why does having access to a transmitter not give you permission to use it however you want?");
  assert.equal(lab02.stages[3].blocks[0].prompt, "Why should you listen before transmitting on a frequency?");
  assert.equal(lab03.stages[3].blocks[0].prompt, "Why is a schematic useful even though it doesn't look like the physical layout of the equipment?");
  assert.equal(lab04.stages[3].blocks[0].prompt, "Why is checking power and basic connections usually better than immediately assuming an internal component failed?");

  assert.equal(sim.emissionInside(147995, 8, 144000, 148000), false);
  assert.equal(sim.emissionInside(147900, 8, 144000, 148000), true);
  assert.equal(sim.emissionInside(146520, 8, 144000, 148000), true);
  assert.ok(sim.limitedCurrent(12, 100) < sim.limitedCurrent(12, 25));
  assert.equal(sim.fuseState(6, 2), "open");
  assert.equal(sim.fuseState(1, 2), "holding");
  assert.equal(sim.diodeConducts("forward"), true);
  assert.equal(sim.diodeConducts("reverse"), false);
  assert.equal(sim.capacitorStep(0, true), 35);
  assert.equal(sim.capacitorStep(35, false), 0);
}

main();
