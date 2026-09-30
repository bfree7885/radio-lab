"use strict";

const assert = require("node:assert/strict");
const sim = require("../web/remediation-sim.js");
const foundations = require("../content/curriculum.json");
const core = require("../content/technician-core.json");
const remediation = require("../content/technician-remediation.json");
const roadmap = require("../content/roadmap.json");
const audit = require("../content/exam/technician-2026-2030-coverage.json");
const tr04 = require("../content/labs/tr-04/lesson.json");
const tr05 = require("../content/labs/tr-05/lesson.json");
const tr06 = require("../content/labs/tr-06/lesson.json");

function components(lesson) {
  const names = [];
  lesson.stages.forEach(function (stage) {
    stage.blocks.forEach(function (block) {
      if (block.component) {
        names.push(block.component);
      }
    });
  });
  return names;
}

function examOf(lesson) {
  return lesson.stages[4].blocks.find(function (block) {
    return block.type === "exam";
  });
}

function main() {
  assert.equal(foundations.labs.length, 8);
  assert.deepEqual(core.labs.map(function (lab) { return lab.id; }), [
    "tc-01", "tc-02", "tc-03", "tc-04", "tc-05", "tc-06", "tc-07", "tc-08",
  ]);
  assert.deepEqual(remediation.labs.map(function (lab) { return lab.id; }), [
    "tr-01", "tr-02", "tr-03", "tr-04", "tr-05", "tr-06", "tr-07", "tr-08", "tr-09",
  ]);
  ["tr-04", "tr-05", "tr-06"].forEach(function (id) {
    var lab = remediation.labs.find(function (item) { return item.id === id; });
    assert.equal(lab.curriculumId, "technician-remediation");
    assert.equal(lab.available, true);
    assert.ok(lab.scripts.indexOf("core-sim.js") >= 0);
    assert.ok(lab.scripts.indexOf("remediation-sim.js") >= 0);
    assert.ok(lab.scripts.indexOf("remediation-labs.js") > lab.scripts.indexOf("core-labs.js"));
  });
  ["tr-07", "tr-08", "tr-09"].forEach(function (id) {
    var lab = remediation.labs.find(function (item) { return item.id === id; });
    assert.equal(lab.available, false);
  });

  const general = roadmap.tracks.find(function (track) { return track.id === "general"; });
  general.phases.forEach(function (phase) {
    assert.equal(phase.status, "planned");
  });
  const technician = roadmap.tracks.find(function (track) { return track.id === "technician"; });
  const remediationPhase = technician.phases.find(function (phase) { return phase.id === "technician-remediation"; });
  assert.equal(remediationPhase.status, "available");
  assert.equal(remediationPhase.content, "technician-remediation.json");
  assert.equal(technician.phases.find(function (phase) { return phase.id === "technician-exam"; }).status, "planned");

  assert.equal(audit.metric.complete, 0);
  assert.equal(audit.metric.partial, 34);
  assert.equal(audit.metric.missing, 1);
  const t5b = audit.groups.find(function (group) { return group.officialId === "T5B"; });
  assert.equal(t5b.classification, "missing");

  assert.equal(tr04.stages[3].blocks[0].prompt, "Why is listening and understanding how a frequency is being used often more important than immediately transmitting?");
  assert.equal(tr05.stages[3].blocks[0].prompt, "Why can two stations using the same power and frequency have very different results at different times or locations?");
  assert.equal(tr06.stages[3].blocks[0].prompt, "Why should you identify where a problem enters a system before deciding what equipment needs to be changed?");

  ["repeater-panel", "dtmf-pad", "dmr-setup", "operating-sequence"].forEach(function (name) {
    assert.ok(components(tr04).indexOf(name) >= 0, name);
  });
  const scenarios = [];
  tr04.stages.forEach(function (stage) {
    stage.blocks.forEach(function (block) {
      if (block.config && block.config.scenario) {
        scenarios.push(block.config.scenario);
      }
    });
  });
  ["cq", "net", "traffic", "public-service", "interference"].forEach(function (name) {
    assert.ok(scenarios.indexOf(name) >= 0, name);
  });
  ["wave-model", "horizon-lab", "multipath-drive", "propagation-gallery", "absorption-lab"].forEach(function (name) {
    assert.ok(components(tr05).indexOf(name) >= 0, name);
  });
  ["front-panel", "coax-cutaway", "swr-read", "neighbor-case", "station-diagnosis"].forEach(function (name) {
    assert.ok(components(tr06).indexOf(name) >= 0, name);
  });

  [tr04, tr05, tr06].forEach(function (lesson) {
    const exam = examOf(lesson);
    assert.equal(exam.poolId, null);
    assert.equal(exam.practicePoolId, "radio-lab-practice");
    assert.ok(exam.questions.length >= 6);
    exam.questions.forEach(function (question) {
      assert.equal(/T\d[A-F]\d\d/.test(question.stem), false);
      assert.ok(question.why);
      assert.ok(question.choices.length >= 2);
    });
  });

  const seventy = sim.repeaterPlan("70cm", 442100, "minus", false);
  assert.equal(seventy.offsetKhz, -5000);
  assert.equal(seventy.transmitKhz, 437100);
  assert.equal(seventy.listenKhz, 442100);
  const reversed = sim.repeaterPlan("70cm", 442100, "minus", true);
  assert.equal(reversed.listenKhz, 437100);
  assert.equal(reversed.transmitKhz, 442100);
  const two = sim.repeaterPlan("2m", 146940, "plus", false);
  assert.equal(two.offsetKhz, 600);
  assert.equal(two.transmitKhz, 147540);
  assert.equal(sim.repeaterPlan("70cm", 442100, "minus", false).transmitKhz, seventy.transmitKhz);

  ["cq", "net", "public-service", "interference"].forEach(function (name) {
    const started = sim.initScenario(name);
    assert.ok(started);
    assert.ok(started.stepCount >= 1);
    assert.equal(started.stepIndex, 0);
    assert.ok(started.prompt);
    assert.deepEqual(sim.initScenario(name), started);
  });
  const cqStep = sim.stepScenario("cq", 0, "listen");
  assert.equal(cqStep.accepted, true);
  assert.equal(cqStep.index, 1);
  const cqEarly = sim.stepScenario("cq", 0, "call");
  assert.equal(cqEarly.accepted, false);
  assert.equal(cqEarly.index, 0);

  assert.equal(sim.sameFreeSpaceSpeed(14, 146), true);
  assert.ok(sim.wavelengthM(146) < sim.wavelengthM(14));
  assert.equal(sim.bandName(14), "HF");
  assert.equal(sim.bandName(146), "VHF");
  assert.equal(sim.waveModel("horizontal").polarization, "horizontal");
  assert.equal(sim.waveModel("horizontal").magnetic, "vertical");

  const low = sim.horizonKm(4, "visual");
  const high = sim.horizonKm(16, "radio");
  assert.ok(sim.horizonKm(16, "radio") > sim.horizonKm(16, "visual"));
  assert.ok(sim.horizonKm(16, "radio") > sim.horizonKm(4, "radio"));
  assert.equal(sim.horizonKm(16, "radio"), high);
  assert.equal(sim.horizonKm(0, "radio"), null);
  assert.ok(low > 0);

  assert.equal(sim.multipathLevel(2), sim.multipathLevel(2));
  const levels = [0, 1, 2, 3, 4].map(sim.multipathLevel);
  assert.ok(new Set(levels).size > 1);

  const gallery = sim.initGallery();
  assert.ok(gallery.length >= 4);
  ["sporadic-e", "meteor", "aurora", "ducting"].forEach(function (id) {
    assert.ok(sim.gallery().some(function (item) { return item.id === id && item.cause && item.result; }));
  });

  assert.equal(sim.coaxLayers().length, 4);
  assert.ok(sim.coaxLayers().some(function (layer) { return layer.id === "shield"; }));
  assert.equal(sim.interpretSwr(1).match, "perfect");
  assert.equal(sim.interpretSwr(4).match, "poor");
  assert.equal(sim.interpretSwr(4).foldback, true);
  assert.equal(sim.interpretSwr(2), null);

  const early = sim.diagnose("neighbor-overload", [], "work-with-neighbor");
  assert.equal(early.ready, false);
  const ready = sim.diagnose("neighbor-overload", ["dummy-load", "local-monitor", "neighbor-radio"], "work-with-neighbor");
  assert.equal(ready.accepted, true);
  const wrong = sim.diagnose("neighbor-overload", ["dummy-load", "local-monitor", "neighbor-radio"], "ignore");
  assert.equal(wrong.accepted, false);
  assert.equal(sim.diagnose("neighbor-overload", ["dummy-load", "local-monitor", "neighbor-radio"], "ignore").why, wrong.why);

  assert.equal(sim.wiringChoice("fuse-at-battery").ok, true);
  assert.equal(sim.wiringChoice("thin-long").ok, false);
  assert.equal(sim.dtmf("5").simultaneous, true);
  assert.ok(sim.controlEffect("rit", "offset"));
  assert.equal(sim.sensitivityCopy("sensitive", 1).copied, true);
  assert.equal(sim.sensitivityCopy("ordinary", 1).copied, false);
}

main();
