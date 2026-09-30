"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const sim = require("../web/remediation-sim.js");
const foundations = require("../content/curriculum.json");
const core = require("../content/technician-core.json");
const remediation = require("../content/technician-remediation.json");
const roadmap = require("../content/roadmap.json");
const tr07 = require("../content/labs/tr-07/lesson.json");
const tr08 = require("../content/labs/tr-08/lesson.json");
const tr09 = require("../content/labs/tr-09/lesson.json");
const exposure = require("../content/regulations/fcc-rf-exposure.json");

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
  return lesson.stages[4].blocks.find(function (block) { return block.type === "exam"; });
}

function sha(path) {
  return crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
}

function main() {
  assert.equal(foundations.labs.length, 8);
  assert.equal(core.labs.length, 8);
  ["tr-01", "tr-02", "tr-03", "tr-04", "tr-05", "tr-06", "tr-07", "tr-08", "tr-09"].forEach(function (id) {
    var lab = remediation.labs.find(function (item) { return item.id === id; });
    assert.equal(lab.available, true, id);
    assert.ok(lab.scripts.indexOf("core-sim.js") > -1);
    assert.ok(lab.scripts.indexOf("core-sim.js") < lab.scripts.indexOf("core-labs.js"));
  });
  const general = roadmap.tracks.find(function (track) { return track.id === "general"; });
  general.phases.forEach(function (phase) { assert.equal(phase.status, "planned"); });

  assert.equal(sha("content/exam/technician-2026-2030-coverage.json"), "d8a7e8e0cbdc6a481c3da955e60e8ba42b33119d2758340744da6234fffc5f1e");
  assert.equal(sha("docs/TECHNICIAN_COVERAGE_AUDIT.md"), "26e2a97cc9c2b85a2c48cccee3daab98e871a7899c87d0b1186e1379779bcd75");

  assert.deepEqual(tr07.alignment.topics, ["T8A", "T8B", "T8C", "T8D"]);
  assert.deepEqual(tr08.alignment.topics, ["T9A", "T9B"]);
  assert.deepEqual(tr09.alignment.topics, ["T0A", "T0B", "T0C"]);
  assert.equal(tr07.stages[3].blocks[0].prompt, "Why isn't choosing a radio mode only a matter of deciding whether you want voice or data?");
  assert.equal(tr08.stages[3].blocks[0].prompt, "Why can two feed lines connected to the same antenna deliver different amounts of transmitter power to the antenna?");
  assert.equal(tr09.stages[3].blocks[0].prompt, "Why can't RF exposure safety be decided from transmitter power alone?");

  ["spectrum-lab", "sideband-lab", "digital-explorer", "image-lab", "leo-pass", "activity-chooser"].forEach(function (name) {
    assert.ok(components(tr07).indexOf(name) >= 0, name);
  });
  ["antenna-gallery", "pattern-lab", "loading-lab", "feed-compare", "connector-lab", "swr-lab"].forEach(function (name) {
    assert.ok(components(tr08).indexOf(name) >= 0, name);
  });
  ["hazard-walk", "fuse-lab", "ground-lab", "site-plan", "exposure-lab"].forEach(function (name) {
    assert.ok(components(tr09).indexOf(name) >= 0, name);
  });
  [tr07, tr08, tr09].forEach(function (lesson) {
    const exam = examOf(lesson);
    assert.equal(exam.poolId, null);
    assert.equal(exam.practicePoolId, "radio-lab-practice");
    exam.questions.forEach(function (question) { assert.ok(question.why); });
  });

  assert.equal(sim.typicalBandwidth("cw").khz, 0.15);
  assert.equal(sim.typicalBandwidth("ssb").khz, 3);
  assert.equal(sim.typicalBandwidth("fm").khz, 15);
  assert.equal(sim.typicalBandwidth("fast-scan").khz, 6000);
  assert.equal(sim.typicalBandwidth("cw").approximate, true);
  assert.equal(sim.narrowerMode("cw", "fm"), "cw");
  assert.equal(sim.narrowerMode("ssb", "fast-scan"), "ssb");
  assert.equal(sim.sidebandFor("10m"), "usb");
  assert.equal(sim.sidebandFor("vhf"), "usb");
  assert.equal(sim.sidebandFor("hf-below-10"), "lsb");

  const rising = sim.satellitePass(2);
  const peak = sim.satellitePass(4);
  const falling = sim.satellitePass(6);
  assert.equal(rising.doppler, "up");
  assert.equal(rising.available, true);
  assert.equal(peak.doppler, "zero");
  assert.ok(peak.elevation > rising.elevation);
  assert.equal(falling.doppler, "down");
  assert.equal(sim.satellitePass(0).available, false);
  assert.equal(sim.satellitePass(2).elevation, sim.satellitePass(2).elevation);

  const gallery = tr08.stages[0].blocks.find(function (block) { return block.component === "antenna-gallery"; });
  assert.ok(gallery.config.antennas.length >= 6);

  assert.equal(sim.dipoleRelative(0).relative, 0);
  assert.equal(sim.dipoleRelative(90).relative, 1);
  assert.equal(sim.dipoleRelative(90).model, "educational");
  assert.ok(sim.quarterWaveInches(146) > 19 && sim.quarterWaveInches(146) < 22);

  const rg58 = sim.feedLineLoss("RG-58", 20, 146);
  const rg213 = sim.feedLineLoss("RG-213", 20, 146);
  assert.ok(rg213 < rg58);
  assert.ok(sim.feedLineLoss("RG-58", 20, 440) > sim.feedLineLoss("RG-58", 20, 146));
  assert.ok(sim.feedLineLoss("RG-58", 2, 28) < sim.feedLineLoss("RG-213", 30, 440));

  assert.ok(components(tr08).indexOf("connector-lab") >= 0);
  assert.equal(sim.interpretSwr(1).match, "perfect");
  assert.equal(sim.reflectionFraction(1), 0);
  assert.ok(sim.reflectionFraction(4) > 0);
  assert.equal(sim.interpretSwr(4).match, "poor");

  assert.equal(sim.fuseChoice(5, 5).ok, true);
  assert.equal(sim.fuseChoice(5, 20).ok, false);
  assert.equal(sim.fuseChoice(5, 20).reason, "oversized");
  assert.ok(components(tr09).indexOf("ground-lab") >= 0);
  assert.equal(sim.exposureAverage(50, 1), 50);
  assert.equal(sim.exposureAverage(50, 0.5), 25);
  assert.equal(exposure.notOfficial, true);
  assert.ok(exposure.sources.length >= 1);
  assert.ok(exposure.sources[0].url.indexOf("fcc.gov") >= 0);
  assert.ok(tr09.stages[0].blocks.some(function (block) {
    return block.component === "field-reference" && block.config.file.indexOf("fcc-rf-exposure") >= 0;
  }));
}

main();
