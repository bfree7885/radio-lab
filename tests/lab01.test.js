"use strict";

const assert = require("node:assert/strict");
const sim = require("../web/radio-sim.js");

const signals = [
  { id: "fm-broadcast", name: "FM broadcast", khz: 98100, halfKhz: 100, range: "VHF" },
  { id: "two-meter", name: "2-meter amateur", khz: 146520, halfKhz: 15, range: "VHF" },
  { id: "weather", name: "Weather radio", khz: 162550, halfKhz: 15, range: "VHF" },
  { id: "seventy-cm", name: "70-centimeter amateur", khz: 446000, halfKhz: 15, range: "UHF" },
];

function main() {
  assert.equal(sim.parseFrequency("146.520", "MHz"), 146520);
  assert.equal(sim.parseFrequency("146,520", "kHz"), 146520);
  assert.equal(sim.parseFrequency("146520000", "Hz"), 146520);
  assert.equal(sim.formatMhz(146520), "146.520");
  assert.equal(sim.formatKhz(146520), "146,520");
  assert.equal(sim.formatHz(146520), "146,520,000");

  const twoMeter = signals[1];
  const seventy = signals[3];
  assert.ok(Math.abs(sim.wavelengthMeters(twoMeter.khz) - 2.05) < 0.01);
  assert.ok(sim.wavelengthMeters(seventy.khz) < sim.wavelengthMeters(twoMeter.khz));
  assert.ok(sim.wavelengthMeters(440000) < 1);
  assert.equal(sim.formatWavelength(146520), "2.05");

  const centered = sim.tuneState(146520, signals);
  assert.equal(centered.centered, true);
  assert.equal(centered.signal.id, "two-meter");
  assert.equal(centered.strength, 9);

  const quiet = sim.tuneState(120000, signals);
  assert.equal(quiet.centered, false);
  assert.equal(quiet.strength, 0);

  assert.equal(sim.judgeSignal(146520, twoMeter, signals), "centered");
  assert.equal(sim.judgeSignal(98100, twoMeter, signals), "wrong-signal");
  assert.equal(sim.judgeSignal(120000, twoMeter, signals), "low");
  assert.equal(sim.judgeSignal(162550, twoMeter, signals), "wrong-signal");
  assert.equal(sim.judgeTarget(146020, 146020, 10), "centered");
  assert.equal(sim.judgeTarget(147000, 146020, 10), "high");
  assert.equal(sim.judgeSignal(446000, seventy, signals), "centered");

  const rules = require("../web/lab01.js");
  const lesson = require("../content/labs/01/lesson.json");
  const progressApi = require("../web/progress-browser.js");
  const before = signals.map((signal) => signal.khz);

  let state = rules.initial(signals);
  state = rules.learnTune(state, 162550);
  assert.equal(state.foundWeather, true);
  assert.deepEqual(signals.map((signal) => signal.khz), before);
  assert.deepEqual(state.signals.map((signal) => signal.khz), before);
  state = rules.learnTune(state, 146520);
  state = rules.learnTune(state, 120000);
  assert.equal(state.leftTwoMeter, false);
  state = rules.predictSignal(state, true);
  assert.notEqual(state.prediction, "correct");
  state = rules.learnTune(state, 146520);
  state = rules.predictSignal(state, false);
  assert.equal(state.prediction, "wrong");
  state = rules.learnTune(state, 140000);
  assert.equal(state.leftTwoMeter, false);
  state = rules.learnTune(state, 146520);
  state = rules.predictSignal(state, true);
  state = rules.learnTune(state, 140000);
  assert.equal(state.leftTwoMeter, true);
  assert.equal(rules.stageDone(state, "learn"), false);
  state = rules.learnTune(state, 146520);
  assert.equal(state.returned, true);
  assert.equal(rules.stageDone(state, "learn"), true);
  assert.deepEqual(state.signals.map((signal) => signal.khz), before);

  state = rules.setRate(state, 1);
  state = rules.answerCycle(state, true);
  assert.notEqual(state.cycleChoice, "correct");
  state = rules.setRate(state, 8);
  state = rules.answerCycle(state, false);
  assert.equal(state.cycleChoice, "wrong");
  assert.equal(rules.stageDone(state, "see"), false);
  state = rules.answerCycle(state, true);
  assert.equal(rules.stageDone(state, "see"), true);

  assert.equal(rules.gradeConversion("146.520", 146520).code, "thousand-low");
  assert.equal(rules.gradeConversion("146520000", 146520).code, "thousand-high");
  assert.equal(rules.gradeConversion("146.520", 146520000).code, "million-low");
  assert.equal(rules.gradeConversion("162550", 162.55).code, "thousand-high");
  assert.equal(rules.gradeConversion("146520", 146520).ok, true);
  assert.equal(rules.gradeConversion("146520000", 146520000).ok, true);
  assert.equal(rules.gradeConversion("162.550", 162.55).ok, true);
  assert.equal(rules.gradeConversion("446", 446).ok, true);
  assert.match(rules.conversionFeedback("thousand-low"), /1,000/);
  assert.match(rules.conversionFeedback("million-high"), /1,000,000/);

  state = rules.answerUnit(state, "mhz-khz", "146520", 146520);
  state = rules.answerUnit(state, "mhz-hz", "146520000", 146520000);
  state = rules.answerUnit(state, "khz-mhz", "162.550", 162.55);
  state = rules.answerUnit(state, "hz-mhz", "446", 446);
  assert.equal(rules.formulaReady(state), false);
  state = rules.visitWave(state, "146");
  assert.equal(state.visited["146"], undefined);
  state = rules.predictWave(state, false);
  state = rules.visitWave(state, "98");
  state = rules.visitWave(state, "146");
  state = rules.visitWave(state, "446");
  assert.equal(rules.formulaReady(state), true);
  assert.equal(rules.stageDone(state, "do"), false);
  state = rules.predictWave(state, true);
  assert.equal(rules.gradeWavelength("43800", 146).code, "times");
  assert.equal(rules.gradeWavelength("146", 146).code, "echo-frequency");
  assert.equal(rules.gradeWavelength("2.05", 146).ok, true);
  assert.equal(rules.gradeWavelength("0.67", 446).ok, true);
  assert.ok(300 / 446 < 300 / 146);
  state = rules.answerWave(state, "wave-146", "2.05", 146);
  state = rules.answerWave(state, "wave-446", "0.67", 446);
  assert.equal(rules.stageDone(state, "do"), true);

  state = rules.scenarioAnswer(state, "meaning", true);
  assert.notEqual(state.scenario.meaning, "correct");
  state = rules.scenarioTune(state, 162550);
  state = rules.scenarioAnswer(state, "meaning", true);
  state = rules.scenarioAnswer(state, "converted", rules.gradeConversion("162550", 162550).ok);
  state = rules.scenarioAnswer(state, "compare", true);
  state = rules.scenarioAnswer(state, "away", false);
  assert.equal(rules.stageDone(state, "explain"), false);
  state = rules.scenarioAnswer(state, "away", true);
  rules.CHECK_IDS.forEach((id) => {
    state = rules.answerCheck(state, id, true);
  });
  assert.equal(rules.stageDone(state, "explain"), true);

  const ids = lesson.stages[4].blocks[0].questions.map((question) => question.id);
  ids.forEach((id) => {
    state = rules.answerExam(state, id, false);
  });
  assert.equal(rules.stageDone(state, "exam", ids), false);
  ids.forEach((id) => {
    state = rules.answerExam(state, id, true);
  });
  assert.equal(rules.stageDone(state, "exam", ids), true);

  state = rules.answerField(state, true);
  assert.notEqual(state.fieldChoice, "correct");
  assert.equal(rules.stageDone(state, "field"), false);
  state = rules.fieldTune(state, 162550);
  assert.deepEqual(state.signals.map((signal) => signal.khz), before);
  state = rules.answerField(state, true);
  assert.equal(rules.stageDone(state, "field"), true);

  assert.equal(lesson.revision, 2);
  assert.equal(lesson.stages[5].blocks[0].taskId, "lab01-weather-listen");
  assert.match(lesson.stages[5].blocks[0].prompt, /checklist/i);
  assert.match(lesson.stages[5].blocks[0].prompt, /162\.550/);
  const positions = [];
  lesson.stages[4].blocks[0].questions.forEach((question) => {
    assert.equal(question.choices.length, new Set(question.choices).size);
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.choices.length);
    assert.equal(question.choiceNotes.length, question.choices.length);
    assert.doesNotMatch(question.choices.join(" "), /battery|loudness|watts/i);
    positions.push(question.correctIndex);
  });
  assert.ok(new Set(positions).size > 1);
  const problems = lesson.stages[2].blocks[0].config.problems;
  assert.deepEqual(problems.map((problem) => problem.id), rules.UNIT_IDS);
  assert.ok(problems.some((problem) => problem.prompt.includes("MHz") && problem.correct > 1000));
  assert.ok(problems.some((problem) => problem.prompt.includes("kHz") && problem.correct < 1000));
  assert.ok(problems.some((problem) => problem.prompt.includes("Hz in megahertz")));

  const hosted = progressApi.create(progressApi.memoryStorage());
  hosted.setLabStatus("01", "complete");
  hosted.setStageCompleted("01", "learn", true);
  hosted.setStageCompleted("02", "learn", true);
  assert.equal(hosted.stageCompleted("01", "learn"), true);
  assert.equal(hosted.stageCompleted("01", "learn", "technician-foundations", 2), false);
  hosted.setStageCompleted("01", "learn", true, "technician-foundations", 2);
  assert.equal(hosted.stageCompleted("01", "learn", "technician-foundations", 2), true);
  assert.equal(hosted.stageCompleted("02", "learn"), true);
}

main();
