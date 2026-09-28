/* Hosted progress adapter. Stores progress in this browser only.

   Records are grouped by curriculum id so Technician and General stay
   separate. Concept status is stored apart from question-pool results.
   Weak topics are derived from pool misses. Nothing is sent to an account
   or another device.

   A previous flat store is read as Technician Foundations.

   Do not install this on the local Flask pages. Those pages use SQLite.
*/
(function (root) {
  var KEY = "waypoint-radio-lab.progress.v1";
  var DEFAULT_CURRICULUM = "technician-foundations";
  var STATUSES = ["not_started", "in_progress", "complete"];

  function emptyCurriculum() {
    return { labs: {}, stages: {}, exams: [], fieldTasks: {}, concepts: {} };
  }

  function emptyStore() {
    return { curricula: {} };
  }

  function memoryStorage() {
    var map = {};
    return {
      getItem: function (key) {
        return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
      },
      setItem: function (key, value) {
        map[key] = String(value);
      },
    };
  }

  function normalize(data) {
    if (!data || typeof data !== "object") {
      return emptyStore();
    }
    if (data.curricula) {
      data.curricula = data.curricula || {};
      return data;
    }
    var legacy = emptyStore();
    legacy.curricula[DEFAULT_CURRICULUM] = {
      labs: data.labs || {},
      stages: data.stages || {},
      exams: data.exams || [],
      fieldTasks: data.fieldTasks || {},
      concepts: {},
    };
    return legacy;
  }

  function create(storage) {
    var box = storage;
    if (!box && typeof localStorage !== "undefined") {
      box = localStorage;
    }
    if (!box) {
      box = memoryStorage();
    }

    function read() {
      var raw = box.getItem(KEY);
      if (!raw) {
        return emptyStore();
      }
      try {
        return normalize(JSON.parse(raw));
      } catch (error) {
        return emptyStore();
      }
    }

    function write(data) {
      box.setItem(KEY, JSON.stringify(data));
    }

    function bucket(data, curriculumId) {
      var id = curriculumId || DEFAULT_CURRICULUM;
      if (!data.curricula[id]) {
        data.curricula[id] = emptyCurriculum();
      }
      var row = data.curricula[id];
      row.labs = row.labs || {};
      row.stages = row.stages || {};
      row.exams = row.exams || [];
      row.fieldTasks = row.fieldTasks || {};
      row.concepts = row.concepts || {};
      return row;
    }

    function stageKey(labId, stageId) {
      return labId + ":" + stageId;
    }

    return {
      id: "browser-local",
      storageKey: KEY,
      getLabStatus: function (labId, curriculumId) {
        var row = bucket(read(), curriculumId).labs[labId];
        return row && row.status ? row.status : "not_started";
      },
      setLabStatus: function (labId, status, curriculumId) {
        if (STATUSES.indexOf(status) === -1) {
          throw new Error("Unknown lab status: " + status);
        }
        var data = read();
        bucket(data, curriculumId).labs[labId] = {
          status: status,
          updatedAt: new Date().toISOString(),
        };
        write(data);
      },
      stageCompleted: function (labId, stageId, curriculumId) {
        var row = bucket(read(), curriculumId).stages[stageKey(labId, stageId)];
        return !!(row && row.completed);
      },
      setStageCompleted: function (labId, stageId, completed, curriculumId) {
        var data = read();
        bucket(data, curriculumId).stages[stageKey(labId, stageId)] = {
          completed: !!completed,
          updatedAt: new Date().toISOString(),
        };
        write(data);
      },
      recordExam: function (entry) {
        var data = read();
        bucket(data, entry.curriculumId).exams.push({
          labId: entry.labId || null,
          questionId: entry.questionId,
          topicId: entry.topicId || null,
          correct: !!entry.correct,
          licenseLevel: entry.licenseLevel || null,
          poolId: entry.poolId || null,
          kind: entry.kind === "concept" ? "concept" : "pool",
          recordedAt: new Date().toISOString(),
        });
        write(data);
      },
      weakTopics: function (limit, curriculumId) {
        var misses = {};
        var hits = {};
        bucket(read(), curriculumId).exams.forEach(function (row) {
          if (!row.topicId || row.kind === "concept") {
            return;
          }
          if (row.correct) {
            hits[row.topicId] = (hits[row.topicId] || 0) + 1;
          } else {
            misses[row.topicId] = (misses[row.topicId] || 0) + 1;
          }
        });
        var topics = [];
        Object.keys(misses).forEach(function (topicId) {
          var missCount = misses[topicId];
          var hitCount = hits[topicId] || 0;
          if (missCount > hitCount) {
            topics.push({ topicId: topicId, misses: missCount, hits: hitCount });
          }
        });
        topics.sort(function (a, b) {
          if (b.misses !== a.misses) {
            return b.misses - a.misses;
          }
          return a.topicId < b.topicId ? -1 : 1;
        });
        return topics.slice(0, limit || 8);
      },
      getConceptStatus: function (conceptId, curriculumId) {
        var row = bucket(read(), curriculumId).concepts[conceptId];
        return row && row.status ? row.status : "not_started";
      },
      setConceptStatus: function (conceptId, status, curriculumId, licenseLevel) {
        if (STATUSES.indexOf(status) === -1) {
          throw new Error("Unknown concept status: " + status);
        }
        var data = read();
        bucket(data, curriculumId).concepts[conceptId] = {
          status: status,
          licenseLevel: licenseLevel || null,
          updatedAt: new Date().toISOString(),
        };
        write(data);
      },
      getFieldTask: function (taskId, curriculumId) {
        return bucket(read(), curriculumId).fieldTasks[taskId] || null;
      },
      setFieldTask: function (taskId, status, labId, curriculumId) {
        if (STATUSES.indexOf(status) === -1) {
          throw new Error("Unknown field-task status: " + status);
        }
        var data = read();
        bucket(data, curriculumId).fieldTasks[taskId] = {
          labId: labId || null,
          status: status,
          updatedAt: new Date().toISOString(),
        };
        write(data);
      },
      summary: function (labIds, curriculumId) {
        var self = this;
        var completed = 0;
        var inProgress = 0;
        var statuses = {};
        labIds.forEach(function (labId) {
          var status = self.getLabStatus(labId, curriculumId);
          statuses[labId] = status;
          if (status === "complete") {
            completed += 1;
          } else if (status === "in_progress") {
            inProgress += 1;
          }
        });
        var total = labIds.length;
        return {
          statuses: statuses,
          completed: completed,
          inProgress: inProgress,
          remaining: total - completed,
          total: total,
          percent: total ? Math.round((100 * completed) / total) : 0,
        };
      },
    };
  }

  var api = {
    create: create,
    memoryStorage: memoryStorage,
    storageKey: KEY,
    defaultCurriculum: DEFAULT_CURRICULUM,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabBrowserProgress = api;
})(typeof window !== "undefined" ? window : globalThis);
