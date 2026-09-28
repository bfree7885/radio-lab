/* Hosted progress adapter. Stores progress in this browser only.

   Records lab status, stage completion, exam results, and field tasks.
   Weak topics are derived from exam misses, matching the local SQLite
   adapter. Nothing is sent to an account or another device.

   Do not install this on the local Flask pages. Those pages use SQLite.
*/
(function (root) {
  var KEY = "waypoint-radio-lab.progress.v1";
  var STATUSES = ["not_started", "in_progress", "complete"];

  function emptyStore() {
    return { labs: {}, stages: {}, exams: [], fieldTasks: {} };
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
        var data = JSON.parse(raw);
        data.labs = data.labs || {};
        data.stages = data.stages || {};
        data.exams = data.exams || [];
        data.fieldTasks = data.fieldTasks || {};
        return data;
      } catch (error) {
        return emptyStore();
      }
    }

    function write(data) {
      box.setItem(KEY, JSON.stringify(data));
    }

    function stageKey(labId, stageId) {
      return labId + ":" + stageId;
    }

    return {
      id: "browser-local",
      storageKey: KEY,
      getLabStatus: function (labId) {
        var row = read().labs[labId];
        return row && row.status ? row.status : "not_started";
      },
      setLabStatus: function (labId, status) {
        if (STATUSES.indexOf(status) === -1) {
          throw new Error("Unknown lab status: " + status);
        }
        var data = read();
        data.labs[labId] = { status: status, updatedAt: new Date().toISOString() };
        write(data);
      },
      stageCompleted: function (labId, stageId) {
        var row = read().stages[stageKey(labId, stageId)];
        return !!(row && row.completed);
      },
      setStageCompleted: function (labId, stageId, completed) {
        var data = read();
        data.stages[stageKey(labId, stageId)] = {
          completed: !!completed,
          updatedAt: new Date().toISOString(),
        };
        write(data);
      },
      recordExam: function (entry) {
        var data = read();
        data.exams.push({
          labId: entry.labId || null,
          questionId: entry.questionId,
          topicId: entry.topicId || null,
          correct: !!entry.correct,
          recordedAt: new Date().toISOString(),
        });
        write(data);
      },
      weakTopics: function (limit) {
        var misses = {};
        var hits = {};
        read().exams.forEach(function (row) {
          if (!row.topicId) {
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
      getFieldTask: function (taskId) {
        return read().fieldTasks[taskId] || null;
      },
      setFieldTask: function (taskId, status, labId) {
        if (STATUSES.indexOf(status) === -1) {
          throw new Error("Unknown field-task status: " + status);
        }
        var data = read();
        data.fieldTasks[taskId] = {
          labId: labId || null,
          status: status,
          updatedAt: new Date().toISOString(),
        };
        write(data);
      },
      summary: function (labIds) {
        var self = this;
        var completed = 0;
        var inProgress = 0;
        var statuses = {};
        labIds.forEach(function (labId) {
          var status = self.getLabStatus(labId);
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

  var api = { create: create, memoryStorage: memoryStorage, storageKey: KEY };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabBrowserProgress = api;
})(typeof window !== "undefined" ? window : globalThis);
