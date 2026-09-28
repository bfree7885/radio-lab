/* Radio Lab client.

   Pages work with this file blocked. Future simulations can attach here.
   Live versus simulation is decided on the server. This file does not
   probe radios, USB devices, or audio hardware.
*/
(function () {
  var root = document.documentElement;
  var mode = root.getAttribute("data-lab-mode");
  if (mode !== "simulation" && mode !== "live") {
    root.setAttribute("data-lab-mode", "simulation");
  }
})();
