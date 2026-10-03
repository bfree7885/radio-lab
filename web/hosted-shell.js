/* Fills hosted pages from the browser progress store.

   The HTML is generated with an empty learner record. After that, the
   numbers on screen come from this browser.
*/
(function () {
  var LABELS = {
    not_started: "NOT STARTED",
    in_progress: "IN PROGRESS",
    complete: "COMPLETE",
  };

  function progress() {
    return window.RadioLabBrowserProgress ? RadioLabBrowserProgress.create() : null;
  }

  function paintStatuses(store) {
    document.querySelectorAll("[data-lab-status]").forEach(function (node) {
      var labId = node.getAttribute("data-lab-status");
      var curriculumId = node.getAttribute("data-curriculum-id");
      var status = store.getLabStatus(labId, curriculumId);
      node.className = "status status-" + status;
      node.textContent = LABELS[status] || LABELS.not_started;
    });
  }

  function counts(store, curriculumId) {
    var seen = {};
    var completed = 0;
    var inProgress = 0;
    var total = 0;
    document.querySelectorAll('[data-lab-status][data-curriculum-id="' + curriculumId + '"]').forEach(function (node) {
      var labId = node.getAttribute("data-lab-status");
      if (seen[labId]) {
        return;
      }
      seen[labId] = true;
      total += 1;
      var status = store.getLabStatus(labId, curriculumId);
      if (status === "complete") {
        completed += 1;
      } else if (status === "in_progress") {
        inProgress += 1;
      }
    });
    return { completed: completed, inProgress: inProgress, remaining: total - completed, total: total };
  }

  function paintSummaries(store) {
    document.querySelectorAll("[data-track-field]").forEach(function (node) {
      var row = counts(store, node.getAttribute("data-curriculum-id"));
      var field = node.getAttribute("data-track-field");
      if (field === "in_progress") {
        node.textContent = String(row.inProgress);
      } else if (Object.prototype.hasOwnProperty.call(row, field)) {
        node.textContent = String(row[field]);
      }
    });
    document.querySelectorAll("[data-track-meter]").forEach(function (meter) {
      var row = counts(store, meter.getAttribute("data-track-meter"));
      var fill = meter.querySelector(".meter-fill");
      var percent = row.total ? Math.round((100 * row.completed) / row.total) : 0;
      if (fill) {
        fill.style.width = percent + "%";
      }
      meter.setAttribute("aria-valuenow", String(row.completed));
      meter.setAttribute("aria-valuemax", String(row.total));
      meter.setAttribute("aria-valuetext", row.completed + " of " + row.total + " labs complete");
    });
    document.querySelectorAll("[data-track-line]").forEach(function (node) {
      var curriculumId = node.getAttribute("data-track-line");
      var row = counts(store, curriculumId);
      node.textContent = node.textContent.replace(/^\d+ of \d+/, row.completed + " of " + row.total);
    });
  }

  function paintContinue(store) {
    document.querySelectorAll("[data-continue-for]").forEach(function (link) {
      var curriculumId = link.getAttribute("data-continue-for");
      var nodes = document.querySelectorAll('[data-lab-status][data-curriculum-id="' + curriculumId + '"]');
      for (var i = 0; i < nodes.length; i += 1) {
        var labId = nodes[i].getAttribute("data-lab-status");
        if (store.getLabStatus(labId, curriculumId) === "complete") {
          continue;
        }
        var card = nodes[i].closest("li") || nodes[i].closest(".card");
        var target = card && card.querySelector("a[href]");
        if (target) {
          link.setAttribute("href", target.getAttribute("href"));
        }
        return;
      }
    });
  }

  function paintWeak(store) {
    document.querySelectorAll("[data-weak-slot]").forEach(function (section) {
      var curriculumId = section.getAttribute("data-weak-slot");
      var topics = store.weakTopics(8, curriculumId);
      var list = section.querySelector(".hosted-weak-list");
      if (!topics.length) {
        if (list) {
          list.remove();
        }
        return;
      }
      if (!list) {
        list = document.createElement("ul");
        list.className = "hosted-weak-list";
        section.appendChild(list);
      }
      list.replaceChildren();
      topics.forEach(function (topic) {
        var item = document.createElement("li");
        item.textContent = topic.topicId + " — missed " + topic.misses + ", correct " + topic.hits;
        list.appendChild(item);
      });
    });
  }

  function conceptCount(store, curriculumId) {
    var data = window.localStorage.getItem(RadioLabLearnerData.PROGRESS_KEY);
    if (!data) {
      return 0;
    }
    try {
      var parsed = JSON.parse(data);
      var row = parsed.curricula && parsed.curricula[curriculumId];
      if (!row || !row.concepts) {
        return 0;
      }
      return Object.keys(row.concepts).filter(function (id) {
        return row.concepts[id] && row.concepts[id].status && row.concepts[id].status !== "not_started";
      }).length;
    } catch (error) {
      return 0;
    }
  }

  function poolCount(curriculumId) {
    var data = window.localStorage.getItem(RadioLabLearnerData.PROGRESS_KEY);
    if (!data) {
      return { recorded: 0, correct: 0 };
    }
    try {
      var parsed = JSON.parse(data);
      var row = parsed.curricula && parsed.curricula[curriculumId];
      var exams = (row && row.exams) || [];
      var recorded = 0;
      var correct = 0;
      exams.forEach(function (exam) {
        if (exam.kind === "concept") {
          return;
        }
        recorded += 1;
        if (exam.correct) {
          correct += 1;
        }
      });
      return { recorded: recorded, correct: correct };
    } catch (error) {
      return { recorded: 0, correct: 0 };
    }
  }

  function paintConcepts() {
    document.querySelectorAll("[data-concept-count]").forEach(function (node) {
      var count = conceptCount(progress(), node.getAttribute("data-concept-count"));
      if (node.getAttribute("data-concept-count") === "technician-foundations") {
        node.textContent = count ? count + " concept checks recorded for this track." : "No concept checks recorded yet.";
        return;
      }
      var name = node.getAttribute("data-concept-count") === "technician-core" ? "Technician Core" : "Technician Remediation";
      node.textContent = count ? count + " concept checks recorded for " + name + "." : "No " + name + " concept checks recorded yet.";
    });
    document.querySelectorAll("[data-pool-slot]").forEach(function (section) {
      var counts = poolCount(section.getAttribute("data-pool-slot"));
      var paragraph = section.querySelector("p");
      if (!paragraph) {
        return;
      }
      paragraph.textContent = counts.recorded
        ? counts.correct + " correct out of " + counts.recorded + " recorded practice items. This is question performance for Technician Foundations, not concept mastery, and it is not an official exam score."
        : "Not enough evidence yet. Readiness here is question-pool performance for Technician Foundations. It is not a concept-mastery score, and it does not include General. No readiness score is shown until then.";
    });
  }

  function message(text) {
    var node = document.getElementById("learner-data-message");
    if (node) {
      node.textContent = text;
    }
  }

  function summaryText(summary) {
    return "Exported " + summary.exportedAt + ". " + summary.labs + " lab records, " + summary.stages + " stage records, " + summary.concepts + " concept checks, " + summary.practiceResults + " in-lab practice results, " + summary.fieldTasks + " field tasks, " + summary.readinessEvents + " Exam Readiness records, " + summary.mockExams + " mock exams.";
  }

  function wireTransfer() {
    var exportButton = document.getElementById("learner-export");
    var fileInput = document.getElementById("learner-import-file");
    var preview = document.getElementById("learner-import-preview");
    var summary = document.getElementById("learner-import-summary");
    var confirmButton = document.getElementById("learner-import-confirm");
    if (!exportButton || !window.RadioLabLearnerData) {
      return;
    }
    var pending = null;
    exportButton.addEventListener("click", function () {
      var doc = RadioLabLearnerData.capture(window.localStorage, window.localStorage);
      var blob = new Blob([JSON.stringify(doc, null, 2) + "\n"], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "waypoint-radio-lab-learner.json";
      link.click();
      window.setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
      message("Export downloaded. It contains the lab record and Exam Readiness history in this browser.");
    });
    fileInput.addEventListener("change", function () {
      pending = null;
      preview.hidden = true;
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        return;
      }
      file.text().then(function (raw) {
        var doc;
        try {
          doc = JSON.parse(raw);
        } catch (error) {
          message("That file is not JSON. Nothing was changed.");
          return;
        }
        var check = RadioLabLearnerData.validate(doc);
        if (!check.ok) {
          message(check.errors[0] + " Nothing was changed.");
          return;
        }
        pending = doc;
        summary.textContent = summaryText(check.summary);
        preview.hidden = false;
        message("Review the preview, then confirm if you want this file to replace progress in this browser.");
      });
    });
    confirmButton.addEventListener("click", function () {
      if (!pending) {
        message("Choose a valid export first. Nothing was changed.");
        return;
      }
      try {
        RadioLabLearnerData.replaceStores(pending, window.localStorage, window.localStorage);
      } catch (error) {
        message("The file was not applied. Nothing was changed.");
        return;
      }
      window.location.reload();
    });
  }

  function paint() {
    if (document.documentElement.getAttribute("data-delivery") !== "hosted") {
      return;
    }
    var store = progress();
    if (!store) {
      return;
    }
    paintStatuses(store);
    paintSummaries(store);
    paintContinue(store);
    paintWeak(store);
    paintConcepts();
    wireTransfer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", paint);
  } else {
    paint();
  }
})();
