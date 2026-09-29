"use strict";

const assert = require("node:assert/strict");
const RadioLab = require("../web/radiollab.js");
const progressApi = require("../web/progress-browser.js");
const publicCaps = require("../web/capabilities-public.js");
const curriculum = require("../content/curriculum.json");
const capabilities = require("../content/capabilities.json");
const lesson = require("../content/labs/01/lesson.json");
const roadmap = require("../content/roadmap.json");

async function main() {
  RadioLab.curriculum.use(curriculum);
  assert.equal(RadioLab.curriculum.labs().length, 8);
  assert.equal(RadioLab.curriculum.stages().length, 6);
  assert.equal(RadioLab.curriculum.lab("01").title, "What Is Radio?");
  assert.equal(RadioLab.curriculum.lab("02").lesson, "labs/02/lesson.json");
  assert.equal(RadioLab.curriculum.lab("02").available, true);
  assert.equal(RadioLab.curriculum.lab("05").lesson, null);
  assert.equal(RadioLab.curriculum.lab("05").available, false);
  assert.equal(RadioLab.curriculum.stage("learn").label, "LEARN");
  assert.equal(RadioLab.curriculum.stage("field").label, "FIELD TASK");
  assert.equal(RadioLab.curriculum.lab("99"), null);

  RadioLab.lesson.use("01", lesson);
  assert.equal(RadioLab.lesson.stage("01", "see").blocks[0].type, "simulation");
  assert.equal(RadioLab.lesson.stage("01", "do").blocks[0].type, "interaction");
  assert.equal(RadioLab.lesson.stage("01", "explain").blocks[0].type, "explain");
  assert.equal(RadioLab.lesson.stage("01", "exam").blocks[0].type, "exam");
  assert.equal(RadioLab.lesson.stage("01", "field").blocks[0].type, "fieldTask");

  const progress = progressApi.create(progressApi.memoryStorage());
  assert.equal(progress.getLabStatus("01"), "not_started");
  progress.setLabStatus("01", "in_progress");
  assert.equal(progress.getLabStatus("01"), "in_progress");
  assert.throws(function () {
    progress.setLabStatus("01", "finished");
  });
  progress.setStageCompleted("01", "learn", true);
  assert.equal(progress.stageCompleted("01", "learn"), true);
  assert.equal(progress.stageCompleted("01", "see"), false);
  progress.recordExam({
    labId: "01",
    questionId: "Q1",
    topicId: "frequency",
    correct: false,
  });
  progress.recordExam({
    labId: "01",
    questionId: "Q2",
    topicId: "frequency",
    correct: false,
  });
  progress.recordExam({
    labId: "01",
    questionId: "Q3",
    topicId: "frequency",
    correct: true,
  });
  const weak = progress.weakTopics();
  assert.equal(weak.length, 1);
  assert.equal(weak[0].topicId, "frequency");
  assert.equal(weak[0].misses, 2);
  assert.equal(weak[0].hits, 1);
  progress.setFieldTask("field-01", "complete", "01");
  assert.equal(progress.getFieldTask("field-01").status, "complete");
  const summary = progress.summary(["01", "02"]);
  assert.equal(summary.completed, 0);
  assert.equal(summary.inProgress, 1);
  assert.equal(summary.remaining, 2);
  assert.equal(summary.total, 2);
  progress.setLabStatus("01", "complete", "general-core");
  assert.equal(progress.getLabStatus("01"), "in_progress");
  assert.equal(progress.getLabStatus("01", "general-core"), "complete");
  progress.setConceptStatus("wavelength", "complete", "technician-foundations", "technician");
  assert.equal(progress.getConceptStatus("wavelength"), "complete");
  assert.equal(progress.getConceptStatus("wavelength", "general-core"), "not_started");

  RadioLab.roadmap.use(roadmap);
  assert.equal(RadioLab.roadmap.track("technician").licenseLevel, "technician");
  assert.equal(RadioLab.roadmap.track("general").licenseLevel, "general");
  assert.equal(RadioLab.roadmap.phase("technician-foundations").status, "available");
  assert.equal(RadioLab.roadmap.phase("general-core").status, "planned");
  assert.equal(RadioLab.roadmap.phase("general-exam").status, "planned");
  assert.equal(RadioLab.roadmap.phase("sota").status, "planned");

  const caps = publicCaps.create(capabilities);
  assert.equal(caps.available("simulation.frequency"), true);
  assert.equal(caps.available("simulation.swr"), true);
  assert.equal(caps.available("hardware.rtl_sdr"), false);
  assert.equal(caps.available("hardware.gnss"), false);
  assert.equal(caps.available("not-a-device"), false);
  const snapshot = caps.snapshot();
  capabilities.simulation.forEach(function (name) {
    assert.equal(snapshot[name], true);
  });
  capabilities.hardware.forEach(function (name) {
    assert.equal(snapshot[name], false);
  });

  let requested = [];
  RadioLab.configure({
    contentBase: "/content/",
    fetch: function (url) {
      requested.push(url);
      if (url.endsWith("curriculum.json")) {
        return Promise.resolve({
          ok: true,
          json: function () {
            return Promise.resolve(curriculum);
          },
        });
      }
      return Promise.resolve({
        ok: true,
        json: function () {
          return Promise.resolve(lesson);
        },
      });
    },
  });
  await RadioLab.curriculum.load();
  const loaded = await RadioLab.lesson.load("01");
  assert.equal(loaded.labId, "01");
  assert.deepEqual(requested, [
    "/content/curriculum.json",
    "/content/labs/01/lesson.json",
  ]);
  const second = await RadioLab.lesson.load("02");
  assert.equal(second.labId, "01");
  assert.ok(requested.includes("/content/labs/02/lesson.json"));
  await assert.rejects(function () {
    return RadioLab.lesson.load("05");
  });
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
