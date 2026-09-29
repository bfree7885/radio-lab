/* Compact field reference for Lab 08. Looking it up is part of the work. */
(function (root) {
  function load(relative) {
    var base = document.documentElement.getAttribute("data-content-base") || "/content/";
    var prefix = base.charAt(base.length - 1) === "/" ? base : base + "/";
    return fetch(prefix + relative).then(function (response) {
      if (!response.ok) {
        throw new Error("reference");
      }
      return response.json();
    });
  }

  function mount(container, relative) {
    var details = document.createElement("details");
    details.className = "field-reference";
    var summary = document.createElement("summary");
    summary.textContent = "Field reference";
    details.appendChild(summary);
    var note = document.createElement("p");
    note.textContent = "Opening this is normal. Field operators look things up.";
    details.appendChild(note);
    container.appendChild(details);
    return load(relative || "reference/foundations.json").then(function (book) {
      note.textContent = book.note;
      (book.sections || []).forEach(function (section) {
        var block = document.createElement("section");
        var heading = document.createElement("h3");
        heading.textContent = section.title;
        var body = document.createElement("p");
        body.textContent = section.body;
        block.appendChild(heading);
        block.appendChild(body);
        details.appendChild(block);
      });
      return book;
    }).catch(function () {
      note.textContent = "The field reference did not load. Reload the page to try again.";
    });
  }

  root.RadioLabReference = { mount: mount, load: load };
})(typeof window !== "undefined" ? window : globalThis);
