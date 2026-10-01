"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const engineApi = require("../web/readiness-engine.js");
const storeApi = require("../web/readiness-store.js");
const bank = require("../content/exam/technician-readiness-v1.json");
const syllabus = require("../content/exam/technician-2026-2030.json");
const standard = require("../content/exam/technician-element-2-standard.json");
const official = require("../content/exam/technician-2026-2030-questions.json");
const model = require("../content/exam/model.json");
const roadmap = require("../content/roadmap.json");
const foundations = require("../content/curriculum.json");
const core = require("../content/technician-core.json");
const remediation = require("../content/technician-remediation.json");
const rf = require("../content/rf-labs.json");

const officialIds = new Set(official.questions.map(function (question) { return question.id; }));
const officialStems = new Set(official.questions.map(function (question) { return question.stem; }));
const groups = [];
syllabus.subelements.forEach(function (sub) {
  sub.groups.forEach(function (group) {
    groups.push({ id: group.id, subelement: sub.id });
  });
});
const groupIds = new Set(groups.map(function (group) { return group.id; }));

function lesson(id) {
  return JSON.parse(fs.readFileSync(path.join(root, "content/labs", id, "lesson.json"), "utf8"));
}

function choiceTexts(produced) {
  return produced.choices.map(function (choice) { return choice.text; });
}

const engine = engineApi.create({ bank: bank, syllabus: syllabus, standard: standard });

assert.equal(bank.schemaVersion, 1);
assert.equal(bank.license, "technician");
assert.equal(bank.pool, "2026-2030");
assert.equal(bank.label, "RADIO LAB PRACTICE");
assert.equal(bank.mockLabel, "RADIO LAB MOCK EXAM");
assert.match(bank.note, /not FCC or NCVEC/);
assert.equal(model.pools.length, 0);
assert.equal(model.activeTechnician.questionsImported, false);

const ids = new Set();
const covered = {};
bank.questions.forEach(function (question) {
  assert.equal(ids.has(question.id), false, question.id);
  ids.add(question.id);
  assert.equal(question.license, "technician");
  assert.equal(question.pool, "2026-2030");
  assert.ok(groupIds.has(question.groupId), question.id);
  assert.equal(groups.find(function (group) { return group.id === question.groupId; }).subelement, question.subelement);
  assert.ok(question.conceptId);
  assert.ok(question.conceptLabel);
  assert.ok(question.difficulty);
  assert.ok(question.type);
  assert.ok(question.sourceLessons.length);
  assert.ok(question.review.labId);
  assert.ok(question.review.stageId);
  question.sourceLessons.forEach(function (labId) {
    const file = lesson(labId);
    assert.ok(file.stages.some(function (stage) { return stage.id === question.review.stageId; }), question.id);
  });
  (question.alignsTo || []).forEach(function (stemId) {
    assert.ok(officialIds.has(stemId), question.id + " " + stemId);
  });
  if (!question.alignsTo || !question.alignsTo.length) {
    assert.match(question.syllabusTopic, /noise blanker/);
  }
  if (question.generator) {
    assert.equal(typeof engineApi.GENERATORS[question.generator], "function");
    assert.ok(question.seedCount >= 2);
    return;
  }
  assert.equal(officialStems.has(question.stem), false, question.id);
  assert.ok(question.correctIndex >= 0 && question.correctIndex < question.choices.length);
  assert.equal(question.distractorNotes.length, question.choices.length);
  const unique = new Set(question.choices);
  assert.equal(unique.size, question.choices.length, question.id);
  question.choices.forEach(function (choice, index) {
    if (index !== question.correctIndex) {
      assert.notEqual(choice, question.choices[question.correctIndex]);
    }
  });
  if (question.figure) {
    assert.ok(fs.existsSync(path.join(root, "content", question.figure.src)), question.figure.src);
  }
});

groups.forEach(function (group) {
  const rows = bank.questions.filter(function (question) { return question.groupId === group.id; });
  assert.ok(rows.length >= 2, group.id);
  covered[group.id] = rows.length;
});
assert.equal(Object.keys(covered).length, 35);

["t1", "t2", "t3"].forEach(function (figureId) {
  assert.ok(bank.questions.some(function (question) {
    return question.figure && question.figure.id.toLowerCase().replace("-", "") === figureId;
  }));
  assert.ok(fs.existsSync(path.join(
    root,
    "content/exam/sources/technician-2026-2030/diagrams",
    "technician-diagram-" + figureId + ".jpg"
  )));
});

assert.equal(standard.questionCount, 35);
assert.equal(standard.minimumCorrect, 26);
assert.match(standard.citation, /97\.503/);
assert.match(standard.text, /26 questions answered correctly/);
assert.equal(engine.blueprint.questionCount, 35);
assert.equal(engine.blueprint.groups.length, 35);
engine.blueprint.groups.forEach(function (slot) {
  assert.equal(slot.count, 1, slot.groupId);
});

function expectChoice(generator, seed, text) {
  const produced = engineApi.GENERATORS[generator](seed);
  const again = engineApi.GENERATORS[generator](seed);
  assert.equal(produced.stem, again.stem);
  assert.equal(produced.explanation, again.explanation);
  assert.deepEqual(choiceTexts(produced), choiceTexts(again));
  assert.equal(produced.choices[0].text, text);
  assert.equal(new Set(choiceTexts(produced)).size, 4, generator + " " + seed);
}

[
  [0, "10 volts"],
  [1, "50 volts"],
  [2, "60 volts"],
].forEach(function (row) {
  expectChoice("ohms-voltage", row[0], row[1]);
});
expectChoice("ohms-current", 0, "2 amperes");
expectChoice("power-product", 0, "24 watts");
expectChoice("series-resistance", 0, "25 ohms");
expectChoice("parallel-resistance", 0, "50 ohms");
expectChoice("parallel-resistance", 2, "20 ohms");
expectChoice("frequency-units", 0, "7 MHz");
expectChoice("frequency-units", 1, "5000 kHz");
expectChoice("wavelength", 0, "2 meters");
expectChoice("wavelength", 4, "30 meters");
expectChoice("battery-time", 0, "6 hours");
expectChoice("decibels", 0, "20 watts");
expectChoice("decibels", 1, "100 watts");
expectChoice("decibels", 2, "10 watts");

for (let seed = 0; seed < 6; seed += 1) {
  Object.keys(engineApi.GENERATORS).forEach(function (name) {
    const produced = engineApi.GENERATORS[name](seed);
    assert.equal(new Set(choiceTexts(produced)).size, 4, name + ":" + seed);
    assert.ok(produced.explanation);
  });
}

const quick = engine.buildQuickCheck("quick-seed");
const quickAgain = engine.buildQuickCheck("quick-seed");
assert.equal(quick.items.length, 10);
assert.deepEqual(
  quick.items.map(function (item) { return item.instanceId; }),
  quickAgain.items.map(function (item) { return item.instanceId; })
);
assert.deepEqual(
  quick.items.map(function (item) { return item.subelement; }).sort(),
  syllabus.subelements.map(function (sub) { return sub.id; }).sort()
);
const quickScore = engine.score(quick, {});
assert.equal(quickScore.passed, null);
assert.equal(quickScore.practiceMarkApplies, false);

const calculations = engine.buildPractice({ seed: "calc", focus: "calculations", count: 8 });
assert.equal(calculations.items.length, 8);
calculations.items.forEach(function (item) { assert.equal(item.type, "calculation"); });
const regulations = engine.buildPractice({ seed: "regs", focus: "regulations", count: 8 });
regulations.items.forEach(function (item) { assert.equal(item.subelement, "T1"); });
const safety = engine.buildPractice({ seed: "safe", focus: "safety", count: 6 });
safety.items.forEach(function (item) { assert.equal(item.subelement, "T0"); });
const oneGroup = engine.buildPractice({ seed: "group", groupId: "T3A", count: 4 });
oneGroup.items.forEach(function (item) { assert.equal(item.groupId, "T3A"); });

const siblingConcept = engine.catalog.find(function (item) {
  return engine.catalog.filter(function (other) { return other.conceptId === item.conceptId; }).length > 1;
});
const retry = engine.buildPractice({
  seed: "retry",
  attempts: [{ conceptId: siblingConcept.conceptId, questionId: siblingConcept.instanceId, correct: false }],
  count: 1,
});
assert.notEqual(retry.items[0].instanceId, siblingConcept.instanceId);

const oneMiss = engine.summarizeConcepts([
  { conceptId: "demo", conceptLabel: "Demo", groupId: "T1A", questionId: "q", correct: false },
]);
assert.equal(oneMiss[0].status, "review");
assert.equal(engine.weakConcepts(oneMiss.map(function (row) {
  return { conceptId: row.conceptId, conceptLabel: row.conceptLabel, groupId: row.groupId, questionId: "q", correct: false };
})).length, 0);
const twoMisses = [
  { conceptId: "demo", conceptLabel: "Demo", groupId: "T1A", questionId: "q1", correct: false },
  { conceptId: "demo", conceptLabel: "Demo", groupId: "T1A", questionId: "q2", correct: false },
];
assert.equal(engine.summarizeConcepts(twoMisses)[0].status, "weak");
const recovered = twoMisses.concat([
  { conceptId: "demo", conceptLabel: "Demo", groupId: "T1A", questionId: "q3", correct: true },
  { conceptId: "demo", conceptLabel: "Demo", groupId: "T1A", questionId: "q4", correct: true },
  { conceptId: "demo", conceptLabel: "Demo", groupId: "T1A", questionId: "q5", correct: true },
]);
assert.equal(engine.summarizeConcepts(recovered)[0].status, "steady");
assert.equal(engine.buildPractice({ seed: "none", focus: "weak", attempts: [], count: 8 }).empty, true);

const firstMock = engine.buildMock("exam-seed");
const secondMock = engine.buildMock("exam-seed");
assert.equal(firstMock.items.length, 35);
assert.equal(firstMock.label, "RADIO LAB MOCK EXAM");
assert.deepEqual(
  firstMock.items.map(function (item) { return item.instanceId + ":" + item.correctIndex; }),
  secondMock.items.map(function (item) { return item.instanceId + ":" + item.correctIndex; })
);
const otherMock = engine.buildMock("exam-seed-other");
assert.notDeepEqual(
  firstMock.items.map(function (item) { return item.instanceId; }),
  otherMock.items.map(function (item) { return item.instanceId; })
);
const seenGroups = {};
firstMock.items.forEach(function (item) {
  seenGroups[item.groupId] = (seenGroups[item.groupId] || 0) + 1;
});
engine.blueprint.groups.forEach(function (slot) {
  assert.equal(seenGroups[slot.groupId], slot.count);
});

const view = engine.present(firstMock);
const viewText = JSON.stringify(view);
assert.equal(viewText.includes("correctIndex"), false);
assert.equal(viewText.includes("explanation"), false);
assert.equal(viewText.includes("\"note\""), false);
view.items.forEach(function (item) {
  assert.equal(item.choices.every(function (choice) { return typeof choice === "string"; }), true);
});

function answerAll(exam, wrongCount) {
  const answers = {};
  exam.items.forEach(function (item, index) {
    if (index < wrongCount) {
      answers[item.instanceId] = (item.correctIndex + 1) % item.choices.length;
    } else {
      answers[item.instanceId] = item.correctIndex;
    }
  });
  return answers;
}

const perfect = engine.score(firstMock, answerAll(firstMock, 0));
assert.equal(perfect.correct, 35);
assert.equal(perfect.passed, true);
assert.equal(perfect.total, 35);
const justUnder = engine.score(firstMock, answerAll(firstMock, 10));
assert.equal(justUnder.correct, 25);
assert.equal(justUnder.passed, false);
const oneOff = engine.score(firstMock, answerAll(firstMock, 9));
assert.equal(oneOff.correct, 26);
assert.equal(oneOff.passed, true);
const groupSum = Object.keys(perfect.byGroup).reduce(function (sum, id) {
  return sum + perfect.byGroup[id].correct;
}, 0);
const subSum = Object.keys(perfect.bySubelement).reduce(function (sum, id) {
  return sum + perfect.bySubelement[id].correct;
}, 0);
assert.equal(groupSum, perfect.correct);
assert.equal(subSum, perfect.correct);
assert.equal(Object.keys(perfect.byGroup).length, 35);
assert.equal(Object.keys(perfect.bySubelement).length, 10);
assert.equal(perfect.misses.length, 0);
assert.equal(justUnder.misses.length, 10);
justUnder.misses.forEach(function (miss) {
  assert.ok(miss.explanation);
  assert.ok(miss.review.labId);
  assert.ok(miss.conceptId);
});

function fakeExam(passed, missGroup, ids) {
  const byGroup = {};
  const bySubelement = {};
  engine.blueprint.groups.forEach(function (slot) {
    const missed = slot.groupId === missGroup;
    byGroup[slot.groupId] = { correct: missed ? 0 : slot.count, total: slot.count };
    if (!bySubelement[slot.subelement]) {
      bySubelement[slot.subelement] = { correct: 0, total: 0 };
    }
    bySubelement[slot.subelement].total += slot.count;
    bySubelement[slot.subelement].correct += missed ? 0 : slot.count;
  });
  return {
    kind: "mock",
    passed: passed,
    byGroup: byGroup,
    bySubelement: bySubelement,
    questionIds: ids,
  };
}

const manyIds = [];
for (let index = 0; index < 40; index += 1) {
  manyIds.push("q" + index);
}
assert.equal(engine.readinessStatus([], []).status, "BUILDING");
assert.equal(engine.readinessStatus([fakeExam(true, null, manyIds)], []).status, "BUILDING");
assert.equal(engine.readinessStatus([
  fakeExam(false, "T1A", manyIds),
  fakeExam(true, null, manyIds),
], []).status, "DEVELOPING");
assert.equal(engine.readinessStatus([
  fakeExam(true, null, manyIds),
  fakeExam(true, null, manyIds),
], []).status, "CONSISTENT");
assert.equal(engine.readinessStatus([
  fakeExam(true, null, manyIds),
  fakeExam(true, "T1A", manyIds),
  fakeExam(true, "T1A", manyIds),
], []).status, "CONSISTENT");
assert.equal(engine.readinessStatus([
  fakeExam(true, null, manyIds),
  fakeExam(true, null, manyIds),
  fakeExam(true, null, manyIds),
], []).status, "EXAM-READY PRACTICE PERFORMANCE");
assert.notEqual(engine.readinessStatus([
  fakeExam(true, null, manyIds.slice(0, 10)),
  fakeExam(true, null, manyIds.slice(0, 10)),
  fakeExam(true, null, manyIds.slice(0, 10)),
], []).status, "EXAM-READY PRACTICE PERFORMANCE");

const memory = {
  map: {},
  getItem: function (key) { return Object.prototype.hasOwnProperty.call(this.map, key) ? this.map[key] : null; },
  setItem: function (key, value) { this.map[key] = String(value); },
};
const technicianLabs = foundations.labs.concat(core.labs, remediation.labs);
assert.equal(technicianLabs.length, 25);
technicianLabs.forEach(function (lab) {
  assert.equal(lesson(lab.id).labId, lab.id);
});
assert.equal(rf.labs.length, 1);
assert.equal(rf.labs[0].id, "rf-01");
assert.match(rf.note, /supplemental/);
assert.equal(technicianLabs.some(function (lab) { return lab.id === "rf-01"; }), false);
roadmap.tracks.find(function (track) { return track.id === "general"; }).phases.forEach(function (phase) {
  assert.equal(phase.status, "planned");
});
assert.equal(
  roadmap.tracks[0].phases.find(function (phase) { return phase.id === "technician-exam"; }).status,
  "available"
);

const browserStore = storeApi.createBrowser(memory);
browserStore.record("mock", perfect).then(function (saved) {
  assert.equal(saved.kind, "mock");
  assert.ok(saved.recordedAt);
  return browserStore.list();
}).then(function (events) {
  assert.equal(events.length, 1);
  assert.equal(events[0].correct, 35);
  assert.equal(events[0].questionIds.length, 35);
  assert.equal(storeApi.storageKey, "waypoint-radio-lab.readiness.v1");
}).catch(function (error) {
  console.error(error);
  process.exit(1);
});
