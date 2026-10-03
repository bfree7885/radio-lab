"use strict";

const assert = require("node:assert/strict");
const learner = require("../web/learner-data.js");

function memory() {
  const map = {};
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
    },
    setItem: function (key, value) {
      map[key] = String(value);
    },
  };
}

const progress = memory();
const readiness = memory();
progress.setItem(learner.PROGRESS_KEY, JSON.stringify({
  curricula: {
    "technician-foundations": {
      labs: { "01": { status: "in_progress" } },
      stages: { "01:learn": { completed: true } },
      exams: [{ labId: "01", questionId: "q", topicId: "T1A", correct: false, kind: "pool" }],
      fieldTasks: { "lab01-simplex-146520": { status: "complete" } },
      concepts: { "tuning-selects-frequency": { status: "complete" } },
    },
  },
}));
readiness.setItem(learner.READINESS_KEY, JSON.stringify({
  events: [{ kind: "mock", seed: "s", correct: 27, total: 35, passed: true, questionIds: ["a"] }],
}));

const doc = learner.capture(progress, readiness);
assert.equal(doc.schemaVersion, 1);
assert.equal(doc.kind, learner.KIND);
assert.equal(doc.progress.curricula["technician-foundations"].labs["01"].status, "in_progress");
assert.equal(doc.readiness.events.length, 1);
assert.equal(JSON.stringify(doc).includes("sessionStorage"), false);

const check = learner.validate(doc);
assert.equal(check.ok, true);
assert.equal(check.summary.labs, 1);
assert.equal(check.summary.stages, 1);
assert.equal(check.summary.concepts, 1);
assert.equal(check.summary.practiceResults, 1);
assert.equal(check.summary.fieldTasks, 1);
assert.equal(check.summary.mockExams, 1);

assert.equal(learner.validate({ kind: "other", schemaVersion: 1 }).ok, false);
assert.equal(learner.validate({ kind: learner.KIND, schemaVersion: 2, exportedAt: "t", progress: { curricula: {} }, readiness: { events: [] } }).ok, false);
assert.equal(learner.validate(null).ok, false);

const broken = JSON.parse(JSON.stringify(doc));
broken.readiness.events.push({ kind: "quick" });
assert.equal(learner.validate(broken).ok, false);

const fresh = memory();
assert.throws(function () {
  learner.replaceStores(broken, fresh, fresh);
});
assert.equal(fresh.getItem(learner.PROGRESS_KEY), null);

const applied = learner.replaceStores(doc, fresh, fresh);
assert.equal(applied.mockExams, 1);
assert.equal(JSON.parse(fresh.getItem(learner.PROGRESS_KEY)).curricula["technician-foundations"].stages["01:learn"].completed, true);
assert.equal(JSON.parse(fresh.getItem(learner.READINESS_KEY)).events[0].passed, true);

const again = memory();
again.setItem(learner.PROGRESS_KEY, JSON.stringify({ curricula: { "technician-core": { labs: { "tc-01": { status: "complete" } } } } }));
learner.replaceStores(doc, again, again);
const replaced = JSON.parse(again.getItem(learner.PROGRESS_KEY));
assert.equal(replaced.curricula["technician-core"], undefined);
assert.equal(replaced.curricula["technician-foundations"].labs["01"].status, "in_progress");
