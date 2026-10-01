/* Exam Readiness progress.

   Local Flask pages use SQLite through /api/readiness.
   Hosted pages use this browser only. The two stores are not synchronized.
   Lesson progress stays in its own store.
*/
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabReadinessStore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var KEY = "waypoint-radio-lab.readiness.v1";

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

  function readBox(box) {
    var raw = box.getItem(KEY);
    if (!raw) {
      return { events: [] };
    }
    try {
      var data = JSON.parse(raw);
      data.events = data.events || [];
      return data;
    } catch (error) {
      return { events: [] };
    }
  }

  function createBrowser(storage) {
    var box = storage;
    if (!box && typeof localStorage !== "undefined") {
      box = localStorage;
    }
    if (!box) {
      box = memoryStorage();
    }
    return {
      id: "browser-local",
      storageKey: KEY,
      list: function () {
        return Promise.resolve(readBox(box).events.slice());
      },
      record: function (kind, payload) {
        if (kind !== "practice" && kind !== "mock") {
          return Promise.reject(new Error("Unknown readiness event"));
        }
        var data = readBox(box);
        var event = Object.assign({}, payload, {
          id: data.events.length + 1,
          kind: kind,
          recordedAt: new Date().toISOString(),
        });
        data.events.push(event);
        box.setItem(KEY, JSON.stringify(data));
        return Promise.resolve(event);
      },
    };
  }

  function createLocal() {
    return {
      id: "sqlite",
      storageKey: null,
      list: function () {
        return fetch("/api/readiness").then(function (response) {
          if (!response.ok) {
            throw new Error("readiness");
          }
          return response.json();
        }).then(function (data) {
          return data.events || [];
        });
      },
      record: function (kind, payload) {
        return fetch("/api/readiness", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: kind, payload: payload }),
        }).then(function (response) {
          if (!response.ok) {
            throw new Error("readiness");
          }
          return response.json();
        });
      },
    };
  }

  function createForPage() {
    var delivery = document.documentElement.getAttribute("data-delivery");
    if (delivery === "hosted") {
      return createBrowser();
    }
    return createLocal();
  }

  return {
    storageKey: KEY,
    createBrowser: createBrowser,
    createLocal: createLocal,
    createForPage: createForPage,
  };
});
