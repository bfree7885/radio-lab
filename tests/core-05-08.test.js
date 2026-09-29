"use strict";

const assert = require("node:assert/strict");
const sim = require("../web/core-sim.js");
const foundations = require("../content/curriculum.json");
const core = require("../content/technician-core.json");
const roadmap = require("../content/roadmap.json");
const reference = require("../content/reference/technician-core.json");
const model = require("../content/exam/model.json");
const lab05 = require("../content/labs/tc-05/lesson.json");
const lab06 = require("../content/labs/tc-06/lesson.json");
const lab07 = require("../content/labs/tc-07/lesson.json");
const lab08 = require("../content/labs/tc-08/lesson.json");

function examOf(lesson) {
  return lesson.stages[4].blocks.find(function (block) { return block.type === "exam"; });
}

function component(lesson, name) {
  var found = null;
  lesson.stages.forEach(function (stage) {
    stage.blocks.forEach(function (block) {
      if (block.component === name) {
        found = block;
      }
    });
  });
  return found;
}

function main() {
  assert.equal(foundations.labs.length, 8);
  assert.equal(foundations.id, "technician-foundations");
  assert.deepEqual(core.labs.map(function (lab) { return lab.id; }), [
    "tc-01", "tc-02", "tc-03", "tc-04", "tc-05", "tc-06", "tc-07", "tc-08",
  ]);
  ["tc-05", "tc-06", "tc-07", "tc-08"].forEach(function (id) {
    var lab = core.labs.find(function (item) { return item.id === id; });
    assert.equal(lab.curriculumFile, "technician-core.json");
    assert.ok(lab.scripts.indexOf("core-labs.js") >= 0);
    assert.ok(lab.scripts.indexOf("core-more.js") >= 0);
    assert.ok(lab.scripts.indexOf("core-sim.js") >= 0);
  });

  assert.equal(model.pools.length, 0);
  var general = roadmap.tracks.find(function (track) { return track.id === "general"; });
  assert.ok(general);
  general.phases.forEach(function (phase) {
    assert.equal(phase.status, "planned");
  });
  var examPhase = roadmap.tracks[0].phases.find(function (phase) { return phase.id === "technician-exam"; });
  assert.equal(examPhase.status, "planned");

  [lab05, lab06, lab07].forEach(function (lesson) {
    var exam = examOf(lesson);
    assert.equal(exam.poolId, null);
    assert.equal(exam.practicePoolId, "radio-lab-practice");
    assert.ok(exam.questions.length >= 6);
    assert.ok(exam.questions.length <= 8);
    exam.questions.forEach(function (question) {
      assert.equal(/T\d[A-F]\d\d/.test(question.stem), false);
      assert.ok(question.why);
    });
  });
  assert.equal(examOf(lab08).questions.length, 8);

  assert.equal(lab05.stages[3].blocks[0].prompt, "Why isn't selecting the correct frequency always enough to understand a radio signal?");
  assert.equal(lab06.stages[3].blocks[0].prompt, "Why can changing the antenna system improve a signal even when transmitter power stays exactly the same?");
  assert.equal(lab07.stages[3].blocks[0].prompt, "Why is changing several things at once a poor troubleshooting strategy?");
  assert.equal(lab08.stages[3].blocks[0].prompt, "Why does safe amateur-radio operation involve more than just avoiding electrical shock?");

  assert.equal(sim.modeMatches("cw", "cw"), true);
  assert.equal(sim.modeMatches("fm", "ssb"), false);
  assert.equal(sim.widerMode("fm", "cw"), "fm");
  assert.ok(sim.modeWidth("cw") < sim.modeWidth("ssb"));
  assert.ok(sim.modeWidth("ssb") < sim.modeWidth("fm"));
  assert.equal(component(lab05, "mode-bench").config.signals.length, 4);
  assert.ok(component(lab05, "ordered-path"));
  assert.ok(component(lab05, "satellite-pass"));

  assert.ok(sim.feedLoss(40, 146, "fair") > sim.feedLoss(5, 146, "fair"));
  assert.ok(sim.feedLoss(20, 440, "fair") > sim.feedLoss(20, 50, "fair"));
  assert.ok(sim.feedLoss(20, 146, "poor") > sim.feedLoss(20, 146, "good"));
  assert.equal(sim.polarizationCoupling("vertical", "vertical"), "strong");
  assert.equal(sim.polarizationCoupling("vertical", "horizontal"), "weak");
  assert.equal(sim.patternRead("directional", 0, 0).strength, "strong");
  assert.equal(sim.patternRead("directional", 180, 0).strength, "weak");
  assert.equal(sim.patternRead("omni", 90, 0).strength, "similar");
  assert.ok(component(lab06, "feed-loss"));
  assert.ok(component(lab06, "polarization"));
  assert.ok(component(lab06, "pattern-aim"));

  assert.equal(sim.meterSetup("voltage", true).ok, true);
  assert.equal(sim.meterSetup("resistance", true).reason, "live-resistance");
  assert.equal(sim.meterSetup("resistance", true).reason, "live-resistance");
  assert.equal(sim.meterSetup("current", true).reason, "series-current");
  assert.equal(sim.meterSetup("resistance", false).ok, true);
  var cases = lab07.stages[2].blocks.find(function (block) { return block.component === "fault-case"; }).config.cases;
  assert.equal(cases.length, 4);
  cases.forEach(function (item) {
    assert.equal(sim.resolveFault(cases, item.id), item.cause);
    assert.equal(sim.resolveFault(cases, item.id), item.cause);
  });
  assert.equal(new Set(cases.map(function (item) { return item.cause; })).size, 4);

  var spots = component(lab08, "site-inspection").config.spots;
  assert.ok(spots.filter(function (spot) { return spot.hazard; }).length >= 5);
  assert.ok(JSON.stringify(lab08).indexOf("EDUCATIONAL MODEL — NOT A COMPLIANCE CALCULATOR") >= 0);
  assert.ok(component(lab08, "exposure-model"));
  assert.ok(sim.exposureIndex(50, 1, 1) > sim.exposureIndex(5, 10, 0.2));
  assert.equal(sim.exposureIndex(5, 0, 1), null);

  ["mode-overview", "bandwidth", "digital-path", "aprs", "satellite", "feed-line", "polarization", "patterns", "instruments", "troubleshooting", "safety"].forEach(function (id) {
    assert.ok(reference.sections.some(function (section) { return section.id === id; }));
  });
}

main();
