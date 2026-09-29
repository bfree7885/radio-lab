/* Shared stage flow for Labs 02–04.

   Lab 01 keeps its own script. This file records progress the same way:
   local pages post to SQLite, and a hosted page uses the browser store.
*/
(function (root) {
  var STAGE_IDS = ["learn", "see", "do", "explain", "exam", "field"];

  function paragraph(text) {
    var node = document.createElement("p");
    node.textContent = text || "";
    return node;
  }

  function choiceRow(pairs, onPick) {
    var row = document.createElement("div");
    row.className = "tune-pad";
    pairs.forEach(function (pair) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = pair[0];
      button.addEventListener("click", function () {
        onPick(!!pair[1], button);
      });
      row.appendChild(button);
    });
    return row;
  }

  function feedbackNode() {
    var node = paragraph("");
    node.className = "feedback";
    node.setAttribute("aria-live", "polite");
    return node;
  }

  function emptySaved() {
    return { status: "not_started", stages: {}, concepts: {}, exams: [], fieldTasks: {} };
  }

  function paintStage(stageId, done) {
    var link = document.querySelector('[data-stage-link="' + stageId + '"]');
    if (link) {
      link.classList.toggle("stage-done", !!done);
    }
    var article = document.getElementById("stage-" + stageId);
    if (article) {
      article.classList.toggle("stage-complete", !!done);
    }
  }

  function paintLabStatus(status) {
    var node = document.getElementById("lab-status");
    if (!node) {
      return;
    }
    var labels = { not_started: "NOT STARTED", in_progress: "IN PROGRESS", complete: "COMPLETE" };
    node.className = "status status-" + (labels[status] ? status : "not_started");
    node.textContent = labels[status] || labels.not_started;
  }

  function applySnapshot(snapshot) {
    if (!snapshot) {
      return snapshot;
    }
    if (snapshot.status) {
      paintLabStatus(snapshot.status);
    }
    if (snapshot.stages) {
      Object.keys(snapshot.stages).forEach(function (stageId) {
        paintStage(stageId, !!snapshot.stages[stageId]);
      });
    }
    return snapshot;
  }

  function boot(render) {
    var session = document.getElementById("lab-session");
    if (!session || !window.RadioLab) {
      return;
    }
    var delivery = document.documentElement.getAttribute("data-delivery");
    if (delivery !== "hosted" && window.RadioLabLocalProgress && !RadioLab.progress) {
      RadioLab.useProgress(RadioLabLocalProgress.create());
    }
    var labId = session.getAttribute("data-lab-id");
    var curriculumFile = session.getAttribute("data-curriculum-file") || "curriculum.json";
    RadioLab.curriculum.load(curriculumFile)
      .then(function () {
        return RadioLab.lesson.load(labId);
      })
      .then(function (lesson) {
        return readProgress(lesson)
          .catch(function () {
            return emptySaved();
          })
          .then(function (saved) {
            var ctx = makeContext(session, lesson, saved || emptySaved());
            render(ctx);
            STAGE_IDS.forEach(function (stageId) {
              paintStage(stageId, !!(ctx.saved.stages && ctx.saved.stages[stageId]));
            });
            paintLabStatus(ctx.saved.status || "not_started");
          });
      })
      .catch(function () {
        var note = paragraph("The lesson file did not load. Reload the page to try again.");
        session.prepend(note);
      });
  }

  function readProgress(lesson) {
    var progress = RadioLab.progress;
    if (!progress) {
      return Promise.resolve(emptySaved());
    }
    if (typeof progress.load === "function") {
      return progress.load(lesson.labId, lesson.curriculumId);
    }
    var saved = emptySaved();
    saved.status = progress.getLabStatus(lesson.labId, lesson.curriculumId);
    STAGE_IDS.forEach(function (stageId) {
      saved.stages[stageId] = !!progress.stageCompleted(lesson.labId, stageId, lesson.curriculumId);
    });
    (lesson.stages || []).forEach(function (stage) {
      (stage.blocks || []).forEach(function (block) {
        if (block.conceptId && progress.getConceptStatus) {
          saved.concepts[block.conceptId] = progress.getConceptStatus(block.conceptId, lesson.curriculumId);
        }
        if (block.taskId && progress.getFieldTask) {
          var task = progress.getFieldTask(block.taskId, lesson.curriculumId);
          if (task) {
            saved.fieldTasks[block.taskId] = task.status;
          }
        }
      });
    });
    if (progress.examLog) {
      saved.exams = progress.examLog(lesson.labId, lesson.curriculumId);
    }
    return Promise.resolve(saved);
  }

  function makeContext(session, lesson, saved) {
    var ctx = {
      lesson: lesson,
      saved: saved,
      paragraph: paragraph,
      choiceRow: choiceRow,
      feedbackNode: feedbackNode,
      mount: function (stageId) {
        var node = session.querySelector('[data-stage-mount="' + stageId + '"]');
        if (node) {
          node.textContent = "";
        }
        return node;
      },
      block: function (stageId, type) {
        var stage = null;
        (lesson.stages || []).forEach(function (item) {
          if (item.id === stageId) {
            stage = item;
          }
        });
        if (!stage) {
          return null;
        }
        for (var i = 0; i < stage.blocks.length; i += 1) {
          if (!type || stage.blocks[i].type === type) {
            return stage.blocks[i];
          }
        }
        return null;
      },
    };

    ctx.noteActivity = function () {
      var progress = RadioLab.progress;
      if (!progress) {
        return Promise.resolve();
      }
      if (typeof progress.noteActivity === "function") {
        return progress.noteActivity(lesson.labId, lesson.curriculumId).then(applySnapshot);
      }
      if (progress.getLabStatus(lesson.labId, lesson.curriculumId) === "not_started") {
        progress.setLabStatus(lesson.labId, "in_progress", lesson.curriculumId);
        paintLabStatus("in_progress");
      }
      return Promise.resolve();
    };

    ctx.complete = function (stageId) {
      if (saved.stages && saved.stages[stageId]) {
        paintStage(stageId, true);
        return Promise.resolve();
      }
      saved.stages[stageId] = true;
      paintStage(stageId, true);
      var progress = RadioLab.progress;
      if (!progress) {
        rollup();
        return Promise.resolve();
      }
      if (typeof progress.load === "function") {
        return progress.setStageCompleted(lesson.labId, stageId, true, lesson.curriculumId).then(applySnapshot);
      }
      progress.setStageCompleted(lesson.labId, stageId, true, lesson.curriculumId);
      rollup();
      return Promise.resolve();
    };

    function rollup() {
      var progress = RadioLab.progress;
      var done = STAGE_IDS.every(function (stageId) {
        return saved.stages[stageId];
      });
      var any = STAGE_IDS.some(function (stageId) {
        return saved.stages[stageId];
      });
      var status = done ? "complete" : any ? "in_progress" : "not_started";
      if (progress && progress.setLabStatus && typeof progress.load !== "function") {
        progress.setLabStatus(lesson.labId, status, lesson.curriculumId);
      }
      paintLabStatus(status);
    }

    ctx.recordExam = function (block, question, correct) {
      var progress = RadioLab.progress;
      var entry = {
        labId: lesson.labId,
        curriculumId: lesson.curriculumId,
        questionId: question.id,
        topicId: question.topicId,
        correct: correct,
        licenseLevel: block.licenseLevel,
        poolId: block.practicePoolId,
        kind: "pool",
      };
      if (!progress) {
        return Promise.resolve();
      }
      var result = progress.recordExam(entry);
      if (result && result.then) {
        return result.then(applySnapshot);
      }
      ctx.noteActivity();
      return Promise.resolve();
    };

    ctx.setConcept = function (conceptId, status) {
      var progress = RadioLab.progress;
      saved.concepts[conceptId] = status;
      if (!progress || !progress.setConceptStatus) {
        return Promise.resolve();
      }
      var result = progress.setConceptStatus(conceptId, status, lesson.curriculumId, lesson.licenseLevel, lesson.labId);
      if (result && result.then) {
        return result.then(applySnapshot);
      }
      return Promise.resolve();
    };

    ctx.setField = function (taskId, status) {
      var progress = RadioLab.progress;
      saved.fieldTasks[taskId] = status;
      if (!progress || !progress.setFieldTask) {
        return Promise.resolve();
      }
      var result = progress.setFieldTask(taskId, status, lesson.labId, lesson.curriculumId);
      if (result && result.then) {
        return result.then(applySnapshot);
      }
      return Promise.resolve();
    };

    ctx.explain = function (block) {
      return explainPanel(ctx, block);
    };
    ctx.exam = function (block) {
      return examPanel(ctx, block);
    };
    ctx.loadJson = function (relative) {
      var base = document.documentElement.getAttribute("data-content-base") || "/content/";
      var prefix = base.charAt(base.length - 1) === "/" ? base : base + "/";
      return fetch(prefix + relative).then(function (response) {
        if (!response.ok) {
          throw new Error("content");
        }
        return response.json();
      });
    };
    return ctx;
  }

  function explainPanel(ctx, block) {
    var wrap = document.createElement("div");
    wrap.appendChild(paragraph(block.prompt));
    var form = document.createElement("form");
    var area = document.createElement("textarea");
    area.rows = 5;
    area.required = true;
    area.setAttribute("aria-label", block.prompt);
    var submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Compare with the lab's explanation";
    form.appendChild(area);
    form.appendChild(submit);
    var reference = paragraph("");
    reference.hidden = true;
    var choice = document.createElement("div");
    choice.className = "tune-pad";
    choice.hidden = true;
    var sure = document.createElement("button");
    sure.type = "button";
    sure.textContent = "I GET IT";
    var unsure = document.createElement("button");
    unsure.type = "button";
    unsure.textContent = "I'M NOT SURE YET";
    choice.appendChild(sure);
    choice.appendChild(unsure);
    var follow = feedbackNode();
    var back = document.createElement("a");
    back.href = block.returnHref || "#stage-see";
    back.textContent = block.returnLabel || "Return to the experiment";
    back.hidden = true;

    function showReference() {
      reference.hidden = false;
      reference.textContent = block.reference;
      choice.hidden = false;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (area.value.trim().length < 8) {
        follow.textContent = "Write a sentence or two in your own words. This is not graded.";
        return;
      }
      showReference();
      follow.textContent = "Compare your note with the explanation, then choose one.";
      ctx.noteActivity();
    });
    sure.addEventListener("click", function () {
      ctx.setConcept(block.conceptId, "complete").then(function () {
        ctx.complete("explain");
        follow.textContent = "Recorded. You can still go back to the experiment.";
        back.hidden = true;
      });
    });
    unsure.addEventListener("click", function () {
      ctx.setConcept(block.conceptId, "in_progress").then(function () {
        follow.textContent = block.unsure;
        back.hidden = false;
      });
    });
    wrap.appendChild(form);
    wrap.appendChild(reference);
    wrap.appendChild(choice);
    wrap.appendChild(follow);
    wrap.appendChild(back);
    if (ctx.saved.concepts && ctx.saved.concepts[block.conceptId] === "complete") {
      showReference();
      follow.textContent = "You already marked this as understood.";
    } else if (ctx.saved.concepts && ctx.saved.concepts[block.conceptId] === "in_progress") {
      showReference();
      follow.textContent = block.unsure;
      back.hidden = false;
    }
    return wrap;
  }

  function examPanel(ctx, block) {
    var wrap = document.createElement("div");
    var banner = paragraph(block.label || "RADIO LAB PRACTICE");
    banner.className = "sim-flag";
    wrap.appendChild(banner);
    wrap.appendChild(paragraph(block.notice || ""));
    var answered = {};
    (ctx.saved.exams || []).forEach(function (row) {
      if (!answered[row.questionId]) {
        answered[row.questionId] = { attempts: 0, correct: false };
      }
      answered[row.questionId].attempts += 1;
      if (row.correct) {
        answered[row.questionId].correct = true;
      }
    });
    (block.questions || []).forEach(function (question) {
      wrap.appendChild(questionCard(ctx, block, question, answered));
    });
    if (allAttempted(block, answered)) {
      ctx.complete("exam");
    }
    return wrap;
  }

  function questionCard(ctx, block, question, answered) {
    var card = document.createElement("fieldset");
    card.className = "practice-question";
    var legend = document.createElement("legend");
    legend.textContent = question.stem;
    card.appendChild(legend);
    question.choices.forEach(function (choice, index) {
      var label = document.createElement("label");
      label.className = "choice";
      var input = document.createElement("input");
      input.type = "radio";
      input.name = question.id;
      input.value = String(index);
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + choice));
      card.appendChild(label);
    });
    var check = document.createElement("button");
    check.type = "button";
    check.textContent = "Check";
    var why = feedbackNode();
    var retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Try again";
    retry.hidden = true;

    function lockCorrect() {
      check.disabled = true;
      card.querySelectorAll("input").forEach(function (input) {
        input.disabled = true;
      });
      retry.hidden = true;
    }

    check.addEventListener("click", function () {
      var selected = card.querySelector("input:checked");
      if (!selected) {
        why.textContent = "Choose one answer first.";
        return;
      }
      var correct = Number(selected.value) === question.correctIndex;
      ctx.recordExam(block, question, correct).then(function () {
        if (!answered[question.id]) {
          answered[question.id] = { attempts: 0, correct: false };
        }
        answered[question.id].attempts += 1;
        if (correct) {
          answered[question.id].correct = true;
        }
        why.textContent = (correct ? "Yes. " : "Not quite. ") + question.why;
        if (correct) {
          lockCorrect();
        } else {
          retry.hidden = false;
        }
        if (allAttempted(block, answered)) {
          ctx.complete("exam");
        }
      });
    });
    retry.addEventListener("click", function () {
      card.querySelectorAll("input").forEach(function (input) {
        input.checked = false;
        input.disabled = false;
      });
      why.textContent = "Try the question again. A miss stays in the record, and a later correct answer counts too.";
      retry.hidden = true;
    });
    card.appendChild(check);
    card.appendChild(why);
    card.appendChild(retry);
    var prior = answered[question.id];
    if (prior && prior.correct) {
      why.textContent = "You already answered this correctly. " + question.why;
      lockCorrect();
    }
    return card;
  }

  function allAttempted(block, answered) {
    return (block.questions || []).every(function (question) {
      return answered[question.id] && answered[question.id].attempts > 0;
    });
  }

  root.LessonKit = { boot: boot, paragraph: paragraph, choiceRow: choiceRow };
})(typeof window !== "undefined" ? window : globalThis);
