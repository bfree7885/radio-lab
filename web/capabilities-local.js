/* Local capability view for the browser core.

   The snapshot is produced by the local Python adapter and embedded in the
   page. This file does not probe USB, audio, serial ports, or radios.
*/
(function (root) {
  function create(snapshot) {
    var map = snapshot || {};
    return {
      id: "local",
      available: function (name) {
        return map[name] === true;
      },
      snapshot: function () {
        return map;
      },
    };
  }

  var api = { create: create };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RadioLabLocalCapabilities = api;
})(typeof window !== "undefined" ? window : globalThis);
