/* Public capability adapter.

   Hosted Radio Lab is simulation only. Hardware ids from
   content/capabilities.json are reported unavailable. Known simulation
   ids are available. This file does not detect devices.
*/
(function (root) {
  function create(manifest) {
    var simulation = (manifest && manifest.simulation) || [];
    var hardware = (manifest && manifest.hardware) || [];

    function available(name) {
      return simulation.indexOf(name) !== -1;
    }

    function snapshot() {
      var map = {};
      simulation.forEach(function (name) {
        map[name] = true;
      });
      hardware.forEach(function (name) {
        map[name] = false;
      });
      return map;
    }

    return {
      id: "public",
      available: available,
      snapshot: snapshot,
    };
  }

  var api = { create: create };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabPublicCapabilities = api;
})(typeof window !== "undefined" ? window : globalThis);
