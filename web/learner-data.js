/* Export and import of the hosted learner record.

   One JSON file. Import replaces both browser stores after the file
   validates. It does not merge, and it does not read an unfinished exam.
*/
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabLearnerData = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var KIND = "waypoint-radio-lab.learner-export";
  var VERSION = 1;
  var PROGRESS_KEY = "waypoint-radio-lab.progress.v1";
  var READINESS_KEY = "waypoint-radio-lab.readiness.v1";
  var EVENT_KINDS = { practice: true, mock: true };

  function emptyProgress() {
    return { curricula: {} };
  }

  function emptyReadiness() {
    return { events: [] };
  }

  function readStore(box, key, fallback) {
    if (!box || typeof box.getItem !== "function") {
      return fallback();
    }
    var raw = box.getItem(key);
    if (!raw) {
      return fallback();
    }
    try {
      var data = JSON.parse(raw);
      return data && typeof data === "object" ? data : fallback();
    } catch (error) {
      return fallback();
    }
  }

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function capture(progressBox, readinessBox) {
    var progress = readStore(progressBox, PROGRESS_KEY, emptyProgress);
    var readiness = readStore(readinessBox, READINESS_KEY, emptyReadiness);
    if (!isObject(progress.curricula)) {
      progress = emptyProgress();
    }
    if (!Array.isArray(readiness.events)) {
      readiness = emptyReadiness();
    }
    return {
      schemaVersion: VERSION,
      kind: KIND,
      exportedAt: new Date().toISOString(),
      progress: { curricula: progress.curricula },
      readiness: { events: readiness.events },
    };
  }

  function curriculumRowOk(row) {
    if (!isObject(row)) {
      return false;
    }
    if (row.labs !== undefined && !isObject(row.labs)) {
      return false;
    }
    if (row.stages !== undefined && !isObject(row.stages)) {
      return false;
    }
    if (row.concepts !== undefined && !isObject(row.concepts)) {
      return false;
    }
    if (row.fieldTasks !== undefined && !isObject(row.fieldTasks)) {
      return false;
    }
    if (row.exams !== undefined && !Array.isArray(row.exams)) {
      return false;
    }
    return true;
  }

  function validate(doc) {
    var errors = [];
    if (!isObject(doc)) {
      return { ok: false, errors: ["The file is not a JSON object."] };
    }
    if (doc.kind !== KIND) {
      errors.push("This file is not a Radio Lab learner export.");
    }
    if (doc.schemaVersion !== VERSION) {
      errors.push("This export version is not supported.");
    }
    if (typeof doc.exportedAt !== "string" || !doc.exportedAt) {
      errors.push("The export has no timestamp.");
    }
    if (!isObject(doc.progress) || !isObject(doc.progress.curricula)) {
      errors.push("Lab progress is missing.");
    } else {
      Object.keys(doc.progress.curricula).forEach(function (id) {
        if (!curriculumRowOk(doc.progress.curricula[id])) {
          errors.push("Lab progress for " + id + " is not usable.");
        }
      });
    }
    if (!isObject(doc.readiness) || !Array.isArray(doc.readiness.events)) {
      errors.push("Exam Readiness history is missing.");
    } else {
      doc.readiness.events.forEach(function (event, index) {
        if (!isObject(event) || !EVENT_KINDS[event.kind]) {
          errors.push("Exam Readiness record " + (index + 1) + " is not usable.");
        }
      });
    }
    return { ok: errors.length === 0, errors: errors, summary: errors.length ? null : summarize(doc) };
  }

  function summarize(doc) {
    var curricula = doc.progress.curricula;
    var labs = 0;
    var stages = 0;
    var concepts = 0;
    var exams = 0;
    var fieldTasks = 0;
    Object.keys(curricula).forEach(function (id) {
      var row = curricula[id] || {};
      labs += Object.keys(row.labs || {}).length;
      stages += Object.keys(row.stages || {}).length;
      concepts += Object.keys(row.concepts || {}).length;
      fieldTasks += Object.keys(row.fieldTasks || {}).length;
      exams += (row.exams || []).length;
    });
    var events = doc.readiness.events;
    var mocks = events.filter(function (event) { return event.kind === "mock"; }).length;
    return {
      exportedAt: doc.exportedAt,
      curricula: Object.keys(curricula).length,
      labs: labs,
      stages: stages,
      concepts: concepts,
      practiceResults: exams,
      fieldTasks: fieldTasks,
      readinessEvents: events.length,
      mockExams: mocks,
    };
  }

  function replaceStores(doc, progressBox, readinessBox) {
    var check = validate(doc);
    if (!check.ok) {
      throw new Error(check.errors[0] || "Import was not applied.");
    }
    progressBox.setItem(PROGRESS_KEY, JSON.stringify({ curricula: doc.progress.curricula }));
    readinessBox.setItem(READINESS_KEY, JSON.stringify({ events: doc.readiness.events }));
    return check.summary;
  }

  return {
    KIND: KIND,
    VERSION: VERSION,
    PROGRESS_KEY: PROGRESS_KEY,
    READINESS_KEY: READINESS_KEY,
    capture: capture,
    validate: validate,
    summarize: summarize,
    replaceStores: replaceStores,
  };
});
