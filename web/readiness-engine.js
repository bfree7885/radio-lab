/* Technician Exam Readiness engine.

   Original Radio Lab questions only. Official stem ids are alignment.
   The same functions run in the browser and under node.
*/
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabReadiness = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var FOCUS = {
    regulations: { subelements: ["T1"] },
    operating: { subelements: ["T2"] },
    propagation: { subelements: ["T3"] },
    station: { subelements: ["T4"] },
    electrical: { subelements: ["T5"] },
    components: { subelements: ["T6"] },
    troubleshooting: { subelements: ["T7"] },
    modes: { subelements: ["T8"] },
    antennas: { subelements: ["T9"] },
    safety: { subelements: ["T0"] },
    calculations: { types: ["calculation"] },
  };

  function round(value, places) {
    var factor = Math.pow(10, places || 0);
    return Math.round(value * factor) / factor;
  }

  function hashSeed(text) {
    var hash = 2166136261;
    var source = String(text);
    for (var i = 0; i < source.length; i += 1) {
      hash ^= source.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) >>> 0;
      var value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(rng, list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rng() * (i + 1));
      var hold = copy[i];
      copy[i] = copy[j];
      copy[j] = hold;
    }
    return copy;
  }

  function choiceSet(correct, distractors, notes) {
    var choices = [{ text: correct, note: "" }].concat(
      distractors.map(function (text, index) {
        return { text: text, note: notes[index] || "" };
      })
    );
    return choices;
  }

  function numericChoices(correct, wrongs, unit, notes) {
    function label(value) {
      return value + (unit ? " " + unit : "");
    }
    var unique = [];
    var seen = {};
    seen[String(correct)] = true;
    wrongs.concat([correct + 4, correct * 2 + 3, Math.abs(correct - 9), correct + 15]).forEach(function (value) {
      var key = String(value);
      if (!seen[key] && unique.length < 3) {
        seen[key] = true;
        unique.push(value);
      }
    });
    return choiceSet(label(correct), unique.map(label), notes);
  }

  var GENERATORS = {
    "ohms-voltage": function (seed) {
      var pairs = [
        [1, 10], [2, 25], [3, 20], [4, 50], [2, 100], [5, 10],
      ];
      var pair = pairs[seed % pairs.length];
      var volts = pair[0] * pair[1];
      return {
        stem: "A resistor of " + pair[1] + " ohms carries " + pair[0] + " ampere" + (pair[0] === 1 ? "" : "s") + ". What is the voltage across it?",
        choices: numericChoices(volts, [pair[0] + pair[1], volts * 2, pair[1] / pair[0]], "volts", [
          "Adding the current and the resistance is not Ohm's law.",
          "Doubling the product is an extra step the relationship does not ask for.",
          "Dividing resistance by current does not give voltage.",
        ]),
        explanation: "Voltage equals current times resistance. " + pair[0] + " × " + pair[1] + " = " + volts + " volts.",
      };
    },
    "ohms-current": function (seed) {
      var pairs = [
        [12, 6], [12, 4], [24, 6], [24, 8], [48, 12], [50, 10],
      ];
      var pair = pairs[seed % pairs.length];
      var amperes = pair[0] / pair[1];
      return {
        stem: pair[0] + " volts is across a " + pair[1] + "-ohm resistor. How much current flows?",
        choices: numericChoices(amperes, [pair[0] * pair[1], pair[0] + pair[1], pair[1] / pair[0]], "amperes", [
          "Multiplying voltage by resistance gives the wrong quantity.",
          "Adding the two numbers is not Ohm's law.",
          "That divides resistance by voltage, which inverts the relationship.",
        ]),
        explanation: "Current equals voltage divided by resistance. " + pair[0] + " / " + pair[1] + " = " + amperes + " amperes.",
      };
    },
    "power-product": function (seed) {
      var pairs = [
        [12, 2], [12, 5], [10, 3], [24, 1], [9, 2], [13, 2],
      ];
      var pair = pairs[seed % pairs.length];
      var watts = pair[0] * pair[1];
      return {
        stem: "A radio draws " + pair[1] + " ampere" + (pair[1] === 1 ? "" : "s") + " from a " + pair[0] + "-volt supply. How much power is that?",
        choices: numericChoices(watts, [pair[0] + pair[1], watts * 2, round(pair[0] / pair[1], 2)], "watts", [
          "Adding voltage and current is not power.",
          "The product is already the power. Doubling it is an extra step.",
          "Dividing voltage by current is not this power relationship.",
        ]),
        explanation: "Power equals voltage times current. " + pair[0] + " × " + pair[1] + " = " + watts + " watts.",
      };
    },
    "series-resistance": function (seed) {
      var pairs = [
        [10, 15], [22, 47], [50, 50], [100, 220], [33, 47], [150, 50],
      ];
      var pair = pairs[seed % pairs.length];
      var total = pair[0] + pair[1];
      return {
        stem: "Two resistors, " + pair[0] + " ohms and " + pair[1] + " ohms, are in series. What is the total resistance?",
        choices: numericChoices(total, [Math.abs(pair[0] - pair[1]), pair[0] * pair[1], round((pair[0] * pair[1]) / total, 1)], "ohms", [
          "Subtracting is not how series resistors combine.",
          "The product is not the series total.",
          "That is the parallel combination, not the series total.",
        ]),
        explanation: "Series resistances add. " + pair[0] + " + " + pair[1] + " = " + total + " ohms.",
      };
    },
    "parallel-resistance": function (seed) {
      var pairs = [
        [100, 100], [50, 50], [60, 30], [120, 60], [200, 200], [40, 40],
      ];
      var pair = pairs[seed % pairs.length];
      var total = (pair[0] * pair[1]) / (pair[0] + pair[1]);
      return {
        stem: "Two resistors, " + pair[0] + " ohms and " + pair[1] + " ohms, are in parallel. What is the combined resistance?",
        choices: numericChoices(total, [pair[0] + pair[1], pair[0] * pair[1], Math.abs(pair[0] - pair[1])], "ohms", [
          "Adding is the series rule.",
          "The product alone is not the parallel result.",
          "The difference is not the parallel result.",
        ]),
        explanation: "Parallel resistance is the product divided by the sum. (" + pair[0] + " × " + pair[1] + ") / (" + pair[0] + " + " + pair[1] + ") = " + total + " ohms. Equal resistors in parallel come out to half of one of them.",
      };
    },
    "frequency-units": function (seed) {
      var rows = [
        { khz: 7000, mhz: 7 },
        { khz: 5000, mhz: 5 },
        { khz: 146000, mhz: 146 },
        { khz: 440000, mhz: 440 },
        { khz: 28000, mhz: 28 },
        { khz: 144000, mhz: 144 },
      ];
      var row = rows[seed % rows.length];
      var askUp = seed % 2 === 0;
      if (askUp) {
        return {
          stem: "How many megahertz is " + row.khz + " kilohertz?",
          choices: numericChoices(row.mhz, [row.khz, row.mhz * 1000, row.mhz / 10], "MHz", [
            "That leaves the number in kilohertz.",
            "That multiplies again instead of dividing by 1,000.",
            "That divides by 10 too many times.",
          ]),
          explanation: "Divide kilohertz by 1,000 to get megahertz. " + row.khz + " / 1000 = " + row.mhz + " MHz.",
        };
      }
      return {
        stem: "How many kilohertz is " + row.mhz + " megahertz?",
        choices: numericChoices(row.khz, [row.mhz, row.mhz * 100, row.mhz * 10000], "kHz", [
          "That leaves the number in megahertz.",
          "Megahertz to kilohertz multiplies by 1,000, not 100.",
          "Multiplying by 10,000 overshoots the conversion.",
        ]),
        explanation: "Multiply megahertz by 1,000 to get kilohertz. " + row.mhz + " × 1000 = " + row.khz + " kHz.",
      };
    },
    wavelength: function (seed) {
      var mhzValues = [150, 50, 300, 15, 10, 6];
      var mhz = mhzValues[seed % mhzValues.length];
      var meters = Math.round(300 / mhz);
      return {
        stem: "Using the Technician approximation of 300 divided by frequency in megahertz, about how many meters long is one wavelength at " + mhz + " MHz?",
        choices: numericChoices(meters, [mhz, 300, round(mhz / 300, 2)], "meters", [
          "That is the frequency, not the wavelength.",
          "300 is the numerator of the approximation, not the wavelength.",
          "Dividing the frequency by 300 inverts the approximation.",
        ]),
        explanation: "Approximate wavelength in meters is 300 divided by the frequency in megahertz. 300 / " + mhz + " rounds to " + meters + " meters.",
      };
    },
    "battery-time": function (seed) {
      var rows = [
        [12, 2], [7, 3.5], [10, 5], [20, 4], [8, 2], [15, 3],
      ];
      var row = rows[seed % rows.length];
      var hours = round(row[0] / row[1], 2);
      return {
        stem: "A battery is rated " + row[0] + " ampere-hours. The radio draws " + row[1] + " amperes on average. About how long will the battery run the radio?",
        choices: numericChoices(hours, [round(row[0] * row[1], 2), round(row[0] - row[1], 2), round(row[1] / row[0], 2)], "hours", [
          "Multiplying ampere-hours by current is not operating time.",
          "Subtracting the current from the ampere-hour rating is not the relationship.",
          "That divides current by ampere-hours, which inverts the relationship.",
        ]),
        explanation: "Operating time is ampere-hours divided by average current. " + row[0] + " / " + row[1] + " = " + hours + " hours.",
      };
    },
    decibels: function (seed) {
      var rows = [
        { watts: 10, db: 3, result: 20, words: "plus 3 dB" },
        { watts: 10, db: 10, result: 100, words: "plus 10 dB" },
        { watts: 20, db: -3, result: 10, words: "minus 3 dB" },
        { watts: 5, db: 3, result: 10, words: "plus 3 dB" },
        { watts: 2, db: 10, result: 20, words: "plus 10 dB" },
        { watts: 40, db: -3, result: 20, words: "minus 3 dB" },
      ];
      var row = rows[seed % rows.length];
      return {
        stem: "A transmitter puts out " + row.watts + " watts. What is the power after a change of " + row.words + "?",
        choices: numericChoices(row.result, [row.watts + row.db, row.watts * Math.abs(row.db), row.watts], "watts", [
          "Decibels are not added to the watt number.",
          "The change is not 'multiply by the decibel number'.",
          "The power does change. Plus 3 dB is about double, minus 3 dB is about half, and plus 10 dB is about ten times.",
        ]),
        explanation: "Plus 3 dB is about twice the power. Minus 3 dB is about half. Plus 10 dB is about ten times. " + row.watts + " watts, " + row.words + ", is about " + row.result + " watts.",
      };
    },
  };

  function blueprintOf(syllabus) {
    var groups = [];
    syllabus.subelements.forEach(function (sub) {
      var count = sub.groups.length;
      var base = Math.floor(sub.examQuestions / count);
      var extra = sub.examQuestions % count;
      sub.groups.forEach(function (group, index) {
        groups.push({
          groupId: group.id,
          subelement: sub.id,
          count: base + (index < extra ? 1 : 0),
        });
      });
    });
    var questionCount = groups.reduce(function (sum, group) {
      return sum + group.count;
    }, 0);
    return { questionCount: questionCount, groups: groups };
  }

  function materialize(question, seed) {
    if (!question.generator) {
      var choices = question.choices.map(function (text, index) {
        return {
          text: text,
          note: index === question.correctIndex ? "" : (question.distractorNotes[index] || ""),
        };
      });
      return {
        questionId: question.id,
        instanceId: question.id,
        stem: question.stem,
        choices: choices,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        groupId: question.groupId,
        subelement: question.subelement,
        conceptId: question.conceptId,
        conceptLabel: question.conceptLabel,
        type: question.type,
        difficulty: question.difficulty,
        figure: question.figure || null,
        review: question.review,
        alignsTo: question.alignsTo || [],
        sourceLessons: question.sourceLessons || [],
      };
    }
    var produced = GENERATORS[question.generator](seed);
    var correctText = produced.choices[0].text;
    return {
      questionId: question.id,
      instanceId: question.id + "@" + seed,
      stem: produced.stem,
      choices: produced.choices,
      correctIndex: 0,
      explanation: produced.explanation,
      groupId: question.groupId,
      subelement: question.subelement,
      conceptId: question.conceptId,
      conceptLabel: question.conceptLabel,
      type: "calculation",
      difficulty: question.difficulty,
      figure: null,
      review: question.review,
      alignsTo: question.alignsTo || [],
      sourceLessons: question.sourceLessons || [],
      generator: question.generator,
      seed: seed,
      correctText: correctText,
    };
  }

  function expand(bank) {
    var items = [];
    bank.questions.forEach(function (question) {
      if (!question.generator) {
        items.push(materialize(question, 0));
        return;
      }
      var count = question.seedCount || 1;
      for (var seed = 0; seed < count; seed += 1) {
        items.push(materialize(question, seed));
      }
    });
    return items;
  }

  function orderChoices(rng, item) {
    var paired = item.choices.map(function (choice, index) {
      return { choice: choice, correct: index === item.correctIndex };
    });
    var ordered = shuffle(rng, paired);
    var correctIndex = 0;
    ordered.forEach(function (entry, index) {
      if (entry.correct) {
        correctIndex = index;
      }
    });
    return {
      instanceId: item.instanceId,
      questionId: item.questionId,
      stem: item.stem,
      choices: ordered.map(function (entry) { return entry.choice; }),
      correctIndex: correctIndex,
      explanation: item.explanation,
      groupId: item.groupId,
      subelement: item.subelement,
      conceptId: item.conceptId,
      conceptLabel: item.conceptLabel,
      type: item.type,
      difficulty: item.difficulty,
      figure: item.figure,
      review: item.review,
      alignsTo: item.alignsTo,
      sourceLessons: item.sourceLessons,
    };
  }

  function blockedIds(attempts) {
    var lastMiss = {};
    (attempts || []).forEach(function (row) {
      if (!row.correct) {
        lastMiss[row.conceptId] = row.questionId;
      } else if (lastMiss[row.conceptId] === row.questionId) {
        delete lastMiss[row.conceptId];
      }
    });
    return lastMiss;
  }

  function take(rng, pool, count, lastMiss) {
    var available = pool.filter(function (item) {
      var blocked = lastMiss[item.conceptId];
      if (!blocked || blocked !== item.instanceId) {
        return true;
      }
      var siblings = pool.filter(function (other) {
        return other.conceptId === item.conceptId && other.instanceId !== item.instanceId;
      });
      return siblings.length === 0;
    });
    if (available.length < count) {
      available = pool.slice();
    }
    return shuffle(rng, available).slice(0, Math.min(count, available.length));
  }

  function create(options) {
    var bank = options.bank;
    var syllabus = options.syllabus;
    var standard = options.standard;
    var blueprint = blueprintOf(syllabus);
    if (blueprint.questionCount !== standard.questionCount) {
      throw new Error("Blueprint question count does not match the Element 2 standard.");
    }
    var catalog = expand(bank);

    function matches(item, filter) {
      if (!filter) {
        return true;
      }
      if (filter.groupId && item.groupId !== filter.groupId) {
        return false;
      }
      if (filter.subelement && item.subelement !== filter.subelement) {
        return false;
      }
      if (filter.subelements && filter.subelements.indexOf(item.subelement) < 0) {
        return false;
      }
      if (filter.types && filter.types.indexOf(item.type) < 0) {
        return false;
      }
      if (filter.conceptIds && filter.conceptIds.indexOf(item.conceptId) < 0) {
        return false;
      }
      return true;
    }

    function sessionFrom(kind, label, seed, items) {
      var rng = mulberry32(hashSeed(String(seed) + ":" + kind));
      return {
        id: kind + "-" + seed,
        kind: kind,
        label: label,
        seed: seed,
        items: items.map(function (item, index) {
          return orderChoices(mulberry32(hashSeed(item.instanceId + ":" + seed + ":" + index)), item);
        }),
      };
    }

    function buildQuickCheck(seed) {
      var rng = mulberry32(hashSeed("quick:" + seed));
      var picked = [];
      syllabus.subelements.forEach(function (sub) {
        var pool = catalog.filter(function (item) { return item.subelement === sub.id; });
        picked = picked.concat(take(rng, pool, 1, {}));
      });
      return sessionFrom("quick", "RADIO LAB PRACTICE", seed, picked);
    }

    function buildPractice(request) {
      var seed = request.seed;
      var focus = FOCUS[request.focus] || {};
      var filter = {
        groupId: request.groupId || null,
        subelement: request.subelement || null,
        subelements: focus.subelements || null,
        types: focus.types || null,
        conceptIds: null,
      };
      var summary = summarizeConcepts(request.attempts || []);
      if (request.focus === "weak") {
        filter.conceptIds = summary.filter(function (row) { return row.status === "weak"; }).map(function (row) {
          return row.conceptId;
        });
        if (!filter.conceptIds.length) {
          return { empty: true, reason: "No concept has enough recent misses to count as a weak area yet." };
        }
      }
      var pool = catalog.filter(function (item) { return matches(item, filter); });
      var count = request.count || 8;
      var items = take(mulberry32(hashSeed("practice:" + seed)), pool, count, blockedIds(request.attempts || []));
      return sessionFrom("practice", "RADIO LAB PRACTICE", seed, items);
    }

    function buildMock(seed) {
      var rng = mulberry32(hashSeed("mock:" + seed));
      var items = [];
      blueprint.groups.forEach(function (slot) {
        var pool = catalog.filter(function (item) { return item.groupId === slot.groupId; });
        var picked = take(rng, pool, slot.count, {});
        if (picked.length !== slot.count) {
          throw new Error("Not enough questions for " + slot.groupId);
        }
        items = items.concat(picked);
      });
      items = shuffle(rng, items);
      return sessionFrom("mock", "RADIO LAB MOCK EXAM", seed, items);
    }

    function present(session) {
      return {
        id: session.id,
        kind: session.kind,
        label: session.label,
        seed: session.seed,
        items: session.items.map(function (item, index) {
          return {
            index: index,
            instanceId: item.instanceId,
            questionId: item.questionId,
            stem: item.stem,
            choices: item.choices.map(function (choice) { return choice.text; }),
            groupId: item.groupId,
            subelement: item.subelement,
            conceptId: item.conceptId,
            conceptLabel: item.conceptLabel,
            type: item.type,
            figure: item.figure || null,
          };
        }),
      };
    }

    function score(session, answers) {
      var correct = 0;
      var byGroup = {};
      var bySubelement = {};
      var misses = [];
      var responses = [];
      session.items.forEach(function (item) {
        var selected = Object.prototype.hasOwnProperty.call(answers, item.instanceId) ? answers[item.instanceId] : null;
        var answered = typeof selected === "number";
        var right = answered && selected === item.correctIndex;
        if (right) {
          correct += 1;
        }
        if (!byGroup[item.groupId]) {
          byGroup[item.groupId] = { correct: 0, total: 0 };
        }
        if (!bySubelement[item.subelement]) {
          bySubelement[item.subelement] = { correct: 0, total: 0 };
        }
        byGroup[item.groupId].total += 1;
        bySubelement[item.subelement].total += 1;
        if (right) {
          byGroup[item.groupId].correct += 1;
          bySubelement[item.subelement].correct += 1;
        }
        var selectedText = answered ? item.choices[selected].text : "";
        var correctText = item.choices[item.correctIndex].text;
        responses.push({
          questionId: item.instanceId,
          conceptId: item.conceptId,
          conceptLabel: item.conceptLabel,
          groupId: item.groupId,
          subelement: item.subelement,
          selected: selected,
          correct: right,
        });
        if (!right) {
          var wrongNote = answered ? item.choices[selected].note : "This question was left unanswered.";
          misses.push({
            questionId: item.instanceId,
            stem: item.stem,
            conceptId: item.conceptId,
            conceptLabel: item.conceptLabel,
            groupId: item.groupId,
            subelement: item.subelement,
            selectedText: selectedText,
            correctText: correctText,
            explanation: item.explanation,
            wrongNote: wrongNote,
            review: item.review,
            alignsTo: item.alignsTo,
          });
        }
      });
      var practiceMark = session.kind === "mock" && session.items.length === standard.questionCount;
      return {
        kind: session.kind,
        seed: session.seed,
        label: session.label,
        correct: correct,
        total: session.items.length,
        passed: practiceMark ? correct >= standard.minimumCorrect : null,
        practiceMarkApplies: practiceMark,
        minimumCorrect: standard.minimumCorrect,
        byGroup: byGroup,
        bySubelement: bySubelement,
        misses: misses,
        responses: responses,
        questionIds: session.items.map(function (item) { return item.instanceId; }),
      };
    }

    return {
      blueprint: blueprint,
      standard: standard,
      catalog: catalog,
      buildQuickCheck: buildQuickCheck,
      buildPractice: buildPractice,
      buildMock: buildMock,
      present: present,
      score: score,
      summarizeConcepts: summarizeConcepts,
      weakConcepts: function (attempts) {
        return summarizeConcepts(attempts).filter(function (row) { return row.status === "weak"; });
      },
      readinessStatus: function (exams, attempts) {
        return readinessStatus(exams, attempts, blueprint);
      },
      attemptsFromEvents: attemptsFromEvents,
    };
  }

  function summarizeConcepts(attempts) {
    var buckets = {};
    (attempts || []).forEach(function (row) {
      if (!buckets[row.conceptId]) {
        buckets[row.conceptId] = [];
      }
      buckets[row.conceptId].push(row);
    });
    return Object.keys(buckets).sort().map(function (conceptId) {
      var rows = buckets[conceptId];
      var recent = rows.slice(-4);
      var recentCorrect = recent.filter(function (row) { return row.correct; }).length;
      var recentMisses = recent.length - recentCorrect;
      var accuracy = recent.length ? recentCorrect / recent.length : 0;
      var status = "practicing";
      if (rows.length < 2) {
        status = rows[0] && !rows[0].correct ? "review" : "practicing";
      } else if (recentMisses >= 2 && accuracy < 0.6) {
        status = "weak";
      } else if (accuracy >= 0.75 && rows[rows.length - 1].correct) {
        status = "steady";
      }
      var latest = rows[rows.length - 1];
      return {
        conceptId: conceptId,
        conceptLabel: latest.conceptLabel,
        groupId: latest.groupId,
        attempts: rows.length,
        recentCorrect: recentCorrect,
        recentCount: recent.length,
        recentAccuracy: accuracy,
        status: status,
      };
    });
  }

  function attemptsFromEvents(events) {
    var rows = [];
    (events || []).forEach(function (event) {
      (event.responses || []).forEach(function (response) {
        rows.push({
          conceptId: response.conceptId,
          conceptLabel: response.conceptLabel,
          groupId: response.groupId,
          questionId: response.questionId,
          correct: !!response.correct,
          at: event.recordedAt,
        });
      });
    });
    return rows;
  }

  function readinessStatus(exams, attempts, blueprint) {
    var mocks = (exams || []).filter(function (exam) { return exam.kind === "mock"; });
    var seen = {};
    (attempts || []).forEach(function (row) { seen[row.questionId] = true; });
    mocks.forEach(function (exam) {
      (exam.questionIds || []).forEach(function (id) { seen[id] = true; });
    });
    var distinct = Object.keys(seen).length;
    var weak = summarizeConcepts(attempts).filter(function (row) { return row.status === "weak"; });
    var lastTwo = mocks.slice(-2);
    var bothPassed = lastTwo.length === 2 && lastTwo.every(function (exam) { return exam.passed; });
    var repeatedGroupMiss = false;
    if (bothPassed) {
      var first = missedGroups(lastTwo[0]);
      var second = missedGroups(lastTwo[1]);
      repeatedGroupMiss = first.some(function (groupId) { return second.indexOf(groupId) >= 0; });
    }
    var subelements = {};
    mocks.forEach(function (exam) {
      Object.keys(exam.bySubelement || {}).forEach(function (id) { subelements[id] = true; });
    });
    var coveredSubs = blueprint.groups.map(function (group) { return group.subelement; }).filter(function (id, index, list) {
      return list.indexOf(id) === index;
    });
    var allSubs = coveredSubs.every(function (id) { return subelements[id]; });
    var status = "BUILDING";
    var reason = "Fewer than two mock exams are on record. One result is not a trend.";
    if (mocks.length >= 2) {
      status = "DEVELOPING";
      reason = "At least two mock exams are on record. The two most recent do not both meet the practice mark, or the repeated-evidence rule is not met yet.";
    }
    if (bothPassed) {
      status = "CONSISTENT";
      reason = "The two most recent mock exams met the practice mark. The highest practice status still needs a third exam, no repeated missed group, no weak concept, at least 40 different questions, and every subelement.";
    }
    var ready = mocks.length >= 3 && bothPassed && !repeatedGroupMiss && weak.length === 0 && distinct >= 40 && allSubs;
    if (ready) {
      status = "EXAM-READY PRACTICE PERFORMANCE";
      reason = "Three or more mock exams are on record, the two most recent met the practice mark, no group was missed on both of those exams, no concept is weak, at least 40 different questions have been seen, and every subelement has appeared.";
    }
    return {
      status: status,
      reason: reason,
      mockCount: mocks.length,
      distinctQuestions: distinct,
      weakConcepts: weak.length,
      repeatedGroupMiss: repeatedGroupMiss,
      allSubelementsSeen: allSubs,
    };
  }

  function missedGroups(exam) {
    return Object.keys(exam.byGroup || {}).filter(function (groupId) {
      var row = exam.byGroup[groupId];
      return row.correct < row.total;
    }).sort();
  }

  return {
    FOCUS: FOCUS,
    GENERATORS: GENERATORS,
    hashSeed: hashSeed,
    mulberry32: mulberry32,
    blueprintOf: blueprintOf,
    materialize: materialize,
    expand: expand,
    summarizeConcepts: summarizeConcepts,
    attemptsFromEvents: attemptsFromEvents,
    readinessStatus: readinessStatus,
    create: create,
  };
});
