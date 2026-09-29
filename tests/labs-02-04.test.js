"use strict";

const assert = require("node:assert/strict");
const controls = require("../web/radio-controls.js");
const catalog = require("../content/regulations/us-fcc-amateur.json");
const curriculum = require("../content/curriculum.json");
const lab02 = require("../content/labs/02/lesson.json");
const lab03 = require("../content/labs/03/lesson.json");
const lab04 = require("../content/labs/04/lesson.json");

function gate(opts) {
  return controls.receiverGate(opts);
}

function examOf(lesson) {
  return lesson.stages[4].blocks[0];
}

function assertPractice(lesson) {
  const exam = examOf(lesson);
  assert.equal(exam.label, "RADIO LAB PRACTICE");
  assert.equal(exam.questions.length, 5);
  assert.equal(exam.poolId, null);
  assert.equal(exam.practicePoolId, "radio-lab-practice");
  assert.equal(exam.licenseLevel, "technician");
  assert.deepEqual(exam.questionIds, exam.questions.map(function (question) {
    return question.id;
  }));
  exam.questions.forEach(function (question) {
    assert.equal(question.stem.includes("FCC"), false);
    assert.ok(question.why);
    assert.ok(question.choices[question.correctIndex]);
  });
  assert.deepEqual(lesson.hardware, []);
  assert.deepEqual(lesson.stages.map(function (stage) {
    return stage.id;
  }), ["learn", "see", "do", "explain", "exam", "field"]);
}

function main() {
  assert.equal(gate({ power: false, volume: 5, squelch: 0, signal: 8, noise: 2 }).reason, "off");
  assert.equal(gate({ power: true, volume: 5, squelch: 0, signal: 0, noise: 2 }).reason, "noise");
  assert.equal(gate({ power: true, volume: 5, squelch: 4, signal: 0, noise: 2 }).reason, "squelch-closed");
  assert.equal(gate({ power: true, volume: 5, squelch: 9, signal: 8, noise: 2 }).reason, "squelch-hides-signal");
  assert.equal(gate({ power: true, volume: 0, squelch: 0, signal: 8, noise: 2 }).reason, "volume-down");
  const open = gate({ power: true, volume: 5, squelch: 4, signal: 8, noise: 2 });
  assert.equal(open.reason, "signal");
  assert.equal(open.signal, 8);

  assert.equal(controls.repeaterPair(146940, -600).transmitKhz, 146340);
  assert.equal(controls.repeaterPair(146940, 600).transmitKhz, 147540);
  assert.equal(controls.repeaterPair(147060, 600).transmitKhz, 147660);
  const expected = { outputKhz: 146940, offsetKhz: -600, toneHz: 100 };
  assert.equal(controls.repeaterResponds(expected, {
    receiveKhz: 146940,
    offsetKhz: -600,
    toneHz: 88.5,
  }).responds, false);
  assert.equal(controls.repeaterResponds(expected, {
    receiveKhz: 146940,
    offsetKhz: -600,
    toneHz: 100,
  }).responds, true);

  function assess(khz, level, mode) {
    return controls.assessTransmission(catalog, khz, level, mode);
  }
  assert.equal(assess(146520, "technician", "phone").allowed, true);
  assert.equal(assess(146520, "technician", "phone").entry.id, "2m");
  assert.equal(assess(98100, "technician", "phone").reason, "not-amateur");
  assert.equal(assess(162550, "technician", "phone").reason, "not-amateur");
  assert.equal(assess(28400, "technician", "phone").allowed, true);
  assert.equal(assess(28500, "technician", "phone").allowed, true);
  assert.equal(assess(28501, "technician", "phone").reason, "license");
  assert.equal(assess(29600, "technician", "phone").allowed, false);
  assert.equal(assess(28400, "general", "phone").allowed, true);
  assert.equal(assess(28200, "technician", "phone").reason, "mode");
  assert.equal(catalog.jurisdiction, "US");
  assert.equal(catalog.source.versionLabel, "foundations-2026-09");
  assert.equal(catalog.source.reviewedThrough, "2026-09-28");
  ["2m", "70cm"].forEach(function (id) {
    const band = catalog.bands.find(function (item) {
      return item.id === id;
    });
    assert.ok(band.segments.some(function (segment) {
      return segment.licenseLevels.indexOf("general") >= 0;
    }));
  });
  assert.ok(catalog.licenseLevels.indexOf("general") >= 0);

  ["02", "03", "04"].forEach(function (id) {
    const lab = curriculum.labs.find(function (item) {
      return item.id === id;
    });
    assert.equal(lab.available, true);
    assert.equal(lab.lesson, "labs/" + id + "/lesson.json");
  });
  ["05", "06", "07", "08"].forEach(function (id) {
    const lab = curriculum.labs.find(function (item) {
      return item.id === id;
    });
    assert.equal(lab.available, false);
    assert.equal(lab.lesson, null);
  });

  assertPractice(lab02);
  assertPractice(lab03);
  assertPractice(lab04);
  assert.equal(lab02.stages[5].blocks[0].taskId, "lab02-trailhead-146520");
  assert.equal(lab03.stages[5].blocks[0].taskId, "lab03-ridge-repeater");
  assert.equal(lab04.stages[5].blocks[0].taskId, "lab04-summit-plan");
  assert.equal(lab02.stages[3].blocks[0].prompt, "What is the difference between changing volume and changing squelch?");
  assert.equal(
    lab03.stages[3].blocks[0].prompt,
    "Why does a repeater use two frequencies instead of simply having everyone transmit and receive on exactly the same frequency at the same time?"
  );
  assert.equal(
    lab04.stages[3].blocks[0].prompt,
    "Why doesn't owning a radio that can transmit on a frequency automatically mean you are allowed to transmit there?"
  );
}

main();
