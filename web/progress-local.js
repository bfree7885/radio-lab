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

    function withRevision(body, revision) {
      if (revision != null) {
        body.revision = revision;
      }
      return body;
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
      load: function (labId, curriculumId, revision) {
        var path = urlFor(labId, curriculumId);
        if (revision != null) {
          path += (path.indexOf("?") === -1 ? "?" : "&") + "revision=" + encodeURIComponent(revision);
        }
        return fetch(path).then(readJson);
      },
      setStageCompleted: function (labId, stageId, completed, curriculumId, revision) {
        return post(labId, withRevision({
          op: "stage",
          stageId: stageId,
          completed: !!completed,
          curriculumId: curriculumId,
        }, revision));
      },
      recordExam: function (entry) {
        return post(entry.labId, withRevision({
          op: "exam",
          curriculumId: entry.curriculumId,
          questionId: entry.questionId,
          topicId: entry.topicId,
          correct: !!entry.correct,
          licenseLevel: entry.licenseLevel,
          poolId: entry.poolId,
          kind: entry.kind === "concept" ? "concept" : "pool",
        }, entry.revision));
      },
      setConceptStatus: function (conceptId, status, curriculumId, licenseLevel, labId, revision) {
        return post(labId, withRevision({
          op: "concept",
          conceptId: conceptId,
          status: status,
          curriculumId: curriculumId,
          licenseLevel: licenseLevel,
        }, revision));
      },
      setFieldTask: function (taskId, status, labId, curriculumId, revision) {
        return post(labId, withRevision({
          op: "field",
          taskId: taskId,
          status: status,
          curriculumId: curriculumId,
        }, revision));
      },
      noteActivity: function (labId, curriculumId, revision) {
        return post(labId, withRevision({ op: "activity", curriculumId: curriculumId }, revision));
      },
    };
  }

  var api = { create: create };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabLocalProgress = api;
})(typeof window !== "undefined" ? window : globalThis);
