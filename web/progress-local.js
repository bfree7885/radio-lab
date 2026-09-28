/* Local progress adapter.

   Lab interactions call this instead of browser storage. It posts to the
   Flask progress API, which writes SQLite. Hosted pages keep using
   web/progress-browser.js.
*/
(function (root) {
  function create(options) {
    var base = (options && options.url) || "/api/progress";

    function urlFor(labId, curriculumId) {
      var path = base + "/" + encodeURIComponent(labId);
      if (curriculumId) {
        path += "?curriculumId=" + encodeURIComponent(curriculumId);
      }
      return path;
    }

    function readJson(response) {
      if (!response || !response.ok) {
        throw new Error("Radio Lab could not save progress");
      }
      return response.json();
    }

    function post(labId, body) {
      return fetch(urlFor(labId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      }).then(readJson);
    }

    return {
      id: "local-sqlite",
      load: function (labId, curriculumId) {
        return fetch(urlFor(labId, curriculumId)).then(readJson);
      },
      setStageCompleted: function (labId, stageId, completed, curriculumId) {
        return post(labId, {
          op: "stage",
          stageId: stageId,
          completed: !!completed,
          curriculumId: curriculumId,
        });
      },
      recordExam: function (entry) {
        return post(entry.labId, {
          op: "exam",
          curriculumId: entry.curriculumId,
          questionId: entry.questionId,
          topicId: entry.topicId,
          correct: !!entry.correct,
          licenseLevel: entry.licenseLevel,
          poolId: entry.poolId,
          kind: entry.kind === "concept" ? "concept" : "pool",
        });
      },
      setConceptStatus: function (conceptId, status, curriculumId, licenseLevel, labId) {
        return post(labId, {
          op: "concept",
          conceptId: conceptId,
          status: status,
          curriculumId: curriculumId,
          licenseLevel: licenseLevel,
        });
      },
      setFieldTask: function (taskId, status, labId, curriculumId) {
        return post(labId, {
          op: "field",
          taskId: taskId,
          status: status,
          curriculumId: curriculumId,
        });
      },
      noteActivity: function (labId, curriculumId) {
        return post(labId, { op: "activity", curriculumId: curriculumId });
      },
    };
  }

  var api = { create: create };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabLocalProgress = api;
})(typeof window !== "undefined" ? window : globalThis);
