"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const math = require("../web/remediation-basics.js");
const foundations = require("../web/foundations-sim.js");
const remediation = require("../content/technician-remediation.json");
const audit = require("../content/exam/technician-2026-2030-coverage.json");
const provenance = require("../content/exam/sources/technician-2026-2030/diagrams/provenance.json");
const tr01 = require("../content/labs/tr-01/lesson.json");
const tr02 = require("../content/labs/tr-02/lesson.json");
const tr03 = require("../content/labs/tr-03/lesson.json");

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
  assert.equal(math.convertPrefix(1.5, "none", "milli"), 1500);
  assert.equal(math.convertPrefix(500, "milli", "none"), 0.5);
  assert.equal(math.convertPrefix(1, "kilo", "none"), 1000);
  assert.equal(math.convertPrefix(1, "micro", "none"), 1e-6);
  assert.equal(math.convertPrefix(500, "milli", "none"), 0.5);
  assert.equal(math.convertPrefix(1000000, "pico", "micro"), 1);
  assert.equal(math.convertPrefix(3.525, "mega", "kilo"), 3525);
  assert.equal(math.convertPrefix(28400, "kilo", "mega"), 28.4);
  assert.equal(math.convertPrefix(2425, "mega", "giga"), 2.425);
  assert.equal(math.convertPrefix(1500000, "none", "mega"), 1.5);

  assert.equal(math.dbFactor(3), 2);
  assert.equal(math.dbFactor(6), 4);
  assert.equal(math.dbFactor(10), 10);
  assert.equal(math.dbFactor(-3), 0.5);
  assert.equal(math.dbFactor(-6), 0.25);
  assert.equal(math.dbFactor(-10), 0.1);
  assert.equal(math.applyDb(5, 3).outputWatts, 10);
  assert.equal(math.applyDb(12, -6).outputWatts, 3);
  assert.equal(math.applyDb(20, 10).outputWatts, 200);
  assert.equal(math.applyDb(10, 3).relative, true);

  assert.equal(math.seriesOhms([50, 50]).totalOhms, 100);
  assert.equal(math.seriesOhms([50, 50]).currentSame, true);
  assert.equal(math.parallelOhms([50, 50]).totalOhms, 25);
  assert.equal(math.parallelOhms([50, 50]).voltageSame, true);
  assert.equal(foundations.seriesOhms([50, 50]), 100);
  assert.equal(foundations.parallelOhms([50, 50]), 25);
  assert.equal(foundations.ohmsLaw(12, 8).amps, 1.5);
  assert.equal(math.solveOhm({ volts: 90, amps: 3 }).value, 30);
  assert.equal(math.solveOhm({ volts: 12, ohms: 8 }).value, 1.5);
  assert.equal(math.solvePower({ volts: 13.8, amps: 10 }).value, 138);
  assert.equal(math.solvePower({ watts: 120, volts: 12 }).value, 10);

  assert.equal(math.technicianHfPhone(28.4), true);
  assert.equal(math.technicianHfPhone(7.2), false);
  assert.equal(math.technicianHfPhone(28.5), false);
  assert.equal(math.technicianPep(28.4).watts, 200);
  assert.equal(math.technicianPep(146.52).watts, 1500);

  ["tr-01", "tr-02", "tr-03"].forEach(function (id) {
    var lab = remediation.labs.find(function (item) { return item.id === id; });
    assert.equal(lab.available, true);
    assert.ok(lab.scripts.indexOf("core-sim.js") > lab.scripts.indexOf("foundations-sim.js"));
    assert.ok(lab.scripts.indexOf("core-labs.js") > lab.scripts.indexOf("core-sim.js"));
    assert.ok(lab.scripts.indexOf("remediation-basics.js") > lab.scripts.indexOf("core-labs.js"));
    assert.ok(lab.scripts.indexOf("remediation-01-03.js") > lab.scripts.indexOf("remediation-basics.js"));
  });

  assert.deepEqual(tr01.alignment.topics, ["T5A", "T5B", "T5C", "T5D"]);
  assert.equal(
    tr01.stages[3].blocks[0].prompt,
    "Why is 500 milliamps the same current as 0.5 amperes even though the numbers look different?"
  );
  ["unit-bench", "db-bench", "circuit-layout", "quantity-bench"].forEach(function (name) {
    assert.ok(components(tr01).indexOf(name) >= 0, name);
  });
  const practice = examOf(tr01);
  assert.equal(practice.poolId, null);
  assert.equal(practice.practicePoolId, "radio-lab-practice");
  assert.ok(practice.questions.some(function (question) { return question.topicId === "T5B"; }));
  practice.questions.forEach(function (question) {
    assert.ok(question.why);
    assert.equal(question.choices.length, 3);
  });

  ["part-bench", "figure-lab", "supply-path", "solder-lab"].forEach(function (name) {
    assert.ok(components(tr02).indexOf(name) >= 0, name);
  });
  const figures = [];
  tr02.stages.forEach(function (stage) {
    stage.blocks.forEach(function (block) {
      if (block.component === "figure-lab") {
        block.config.figures.forEach(function (figure) {
          figures.push(figure.image);
        });
      }
    });
  });
  assert.ok(figures.some(function (image) { return image.indexOf("technician-diagram-t1.jpg") >= 0; }));
  assert.ok(figures.some(function (image) { return image.indexOf("technician-diagram-t2.jpg") >= 0; }));
  assert.ok(figures.some(function (image) { return image.indexOf("technician-diagram-t3.jpg") >= 0; }));
  provenance.files.forEach(function (file) {
    const bytes = fs.readFileSync(path.join(
      "content/exam/sources/technician-2026-2030/diagrams",
      file.localFilename
    ));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), file.sha256);
  });

  ["privilege-lookup", "control-compare", "rule-deck"].forEach(function (name) {
    assert.ok(components(tr03).indexOf(name) >= 0, name);
  });
  assert.deepEqual(tr03.alignment.topics, ["T1A", "T1B", "T1C", "T1D", "T1E", "T1F"]);
  const deck = tr03.stages[2].blocks.find(function (block) { return block.component === "rule-deck"; });
  deck.config.ids.forEach(function (id) {
    assert.ok(math.rule(id), id);
    const options = deck.config.options[id];
    assert.ok(options.some(function (option) { return option.id === math.rule(id).accept; }), id);
  });
  const field = tr03.stages[5].blocks.find(function (block) { return block.taskId === "tr03-first-week"; });
  ["week-home", "week-friend", "week-repeater", "hf-phone", "pep", "tactical", "week-remote"].forEach(function (id) {
    assert.ok(field.config.ids.indexOf(id) >= 0, id);
  });

  assert.equal(audit.metric.complete, 0);
  assert.equal(audit.metric.partial, 34);
  assert.equal(audit.metric.missing, 1);
  assert.equal(audit.groups.find(function (group) { return group.officialId === "T5B"; }).classification, "missing");
}

main();
