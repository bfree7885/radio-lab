/* Radio Lab browser core.

   Loads the shared curriculum and lesson files. Progress and capabilities
   come from adapters installed by the host page. This file does not import
   Flask, SQLite, or hardware libraries.

   Local Flask pages install the local capability snapshot and leave progress
   in SQLite. A future hosted page installs the browser progress adapter and
   the public capability adapter (see boot-hosted.js).
*/
(function (root) {
  var state = {
    contentBase: "/content/",
    fetchImpl: null,
    curriculum: null,
    lessons: {},
  };

  function join(base, path) {
    var prefix = base.charAt(base.length - 1) === "/" ? base : base + "/";
    return prefix + String(path).replace(/^\//, "");
  }

  function fetcher() {
    if (state.fetchImpl) {
      return state.fetchImpl;
    }
    if (typeof fetch === "function") {
      return fetch;
    }
    return null;
  }

  function findById(items, id) {
    if (!items) {
      return null;
    }
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].id === id) {
        return items[i];
      }
    }
    return null;
  }

  function readJson(response) {
    if (!response || !response.ok) {
      throw new Error("Radio Lab could not load shared content");
    }
    return response.json();
  }

  var RadioLab = {
    curriculum: {
      use: function (data) {
        state.curriculum = data;
        return data;
      },
      load: function () {
        var get = fetcher();
        if (!get) {
          return Promise.reject(new Error("No fetch available"));
        }
        return Promise.resolve(get(join(state.contentBase, "curriculum.json")))
          .then(readJson)
          .then(function (data) {
            state.curriculum = data;
            return data;
          });
      },
      get: function () {
        return state.curriculum;
      },
      labs: function () {
        return state.curriculum ? state.curriculum.labs : [];
      },
      lab: function (id) {
        return findById(state.curriculum && state.curriculum.labs, id);
      },
      stages: function () {
        return state.curriculum ? state.curriculum.stages : [];
      },
      stage: function (id) {
        return findById(state.curriculum && state.curriculum.stages, id);
      },
    },
    lesson: {
      use: function (labId, data) {
        state.lessons[labId] = data;
        return data;
      },
      get: function (labId) {
        return state.lessons[labId] || null;
      },
      load: function (labId) {
        var lab = RadioLab.curriculum.lab(labId);
        if (!lab || !lab.lesson) {
          return Promise.reject(new Error("No lesson file for lab " + labId));
        }
        var get = fetcher();
        if (!get) {
          return Promise.reject(new Error("No fetch available"));
        }
        return Promise.resolve(get(join(state.contentBase, lab.lesson)))
          .then(readJson)
          .then(function (data) {
            state.lessons[labId] = data;
            return data;
          });
      },
      stage: function (labId, stageId) {
        var lesson = state.lessons[labId];
        if (!lesson) {
          return null;
        }
        return findById(lesson.stages, stageId);
      },
    },
    progress: null,
    capabilities: null,
    configure: function (options) {
      options = options || {};
      if (options.contentBase) {
        state.contentBase = options.contentBase;
      }
      if (options.fetch) {
        state.fetchImpl = options.fetch;
      }
      return RadioLab;
    },
    useProgress: function (adapter) {
      RadioLab.progress = adapter;
      return RadioLab;
    },
    useCapabilities: function (adapter) {
      RadioLab.capabilities = adapter;
      return RadioLab;
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = RadioLab;
  }
  root.RadioLab = RadioLab;
})(typeof window !== "undefined" ? window : globalThis);
