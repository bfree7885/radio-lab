/* Lab 04 — Bands and privileges.

   Legal answers come from the regulations file through RadioControls.
   This script does not keep a second copy of the band edges.
*/
(function () {
  function boot() {
    if (!window.LessonKit || !window.RadioControls) {
      return;
    }
    LessonKit.boot(function (ctx) {
      ctx.loadJson("regulations/us-fcc-amateur.json")
        .then(function (catalog) {
          ctx.lesson.stages.forEach(function (stage) {
            var mount = ctx.mount(stage.id);
            if (!mount) {
              return;
            }
            stage.blocks.forEach(function (block) {
              mount.appendChild(renderBlock(ctx, catalog, block));
            });
          });
        })
        .catch(function () {
          var session = document.getElementById("lab-session");
          if (session) {
            session.prepend(ctx.paragraph("The band reference did not load. Reload the page to try again."));
          }
        });
    });
  }

  function renderBlock(ctx, catalog, block) {
    if (block.type === "text") {
      return ctx.paragraph(block.body);
    }
    if (block.component === "spectrum-map") {
      return spectrumMap(ctx, catalog);
    }
    if (block.component === "band-tool") {
      return bandStage(ctx, catalog, block.config || {});
    }
    if (block.component === "band-decisions") {
      return decisions(ctx, catalog, block.config || {});
    }
    if (block.type === "explain") {
      return ctx.explain(block);
    }
    if (block.type === "exam") {
      return ctx.exam(block);
    }
    if (block.type === "fieldTask") {
      return fieldPlan(ctx, catalog, block);
    }
    return ctx.paragraph("");
  }

  function mhz(khz) {
    return window.RadioLabSim.formatMhz(khz) + " MHz";
  }

  function sourceLine(catalog) {
    var source = catalog.source || {};
    var notes = (source.notes || []).join(" ");
    return catalog.jurisdiction + " · " + catalog.regulator + " · " +
      (source.versionLabel || "") + " · reviewed through " + (source.reviewedThrough || "") +
      ". " + notes;
  }

  function describe(result, level, mode) {
    if (!result.entry) {
      return "This frequency is not in the Radio Lab reference. Consulting the reference comes before transmitting. Guessing does not.";
    }
    if (result.reason === "not-amateur") {
      return result.entry.name + ". " + (result.entry.note || "This is not an amateur allocation in the reference.");
    }
    var segment = result.segment;
    var range = segment ? segment.name : result.entry.name;
    if (result.reason === "license") {
      return range + " lists " + (segment.licenseLevels || []).join(" and ") +
        " for this portion. " + (segment.note || "");
    }
    if (result.reason === "mode") {
      return range + " lists " + (segment.modes || []).join(" and ") +
        ", not " + mode + ", in this reference. " + (segment.note || "");
    }
    if (result.reason === "allowed") {
      return "The reference shows this " + mode + " operation for " + level +
        " inside " + result.entry.name + " · " + range + ".";
    }
    return result.entry.note || "The reference does not show this operation.";
  }

  function spectrumMap(ctx, catalog) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("The strip is not to scale. Each box is a region from the reference, drawn the same width so you can see it. A receiver can be tuned outside an amateur allocation. Hearing something there is not permission to transmit there."));
    var strip = document.createElement("div");
    strip.className = "band-strip";
    var detail = ctx.feedbackNode();
    var sawAmateur = false;
    var sawOther = false;
    var regions = (catalog.services || []).concat(catalog.bands || []).filter(function (entry) {
      return entry.showOnMap;
    }).sort(function (a, b) {
      return a.khzLow - b.khzLow;
    });
    regions.forEach(function (entry) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = entry.mapLabel || entry.name;
      button.addEventListener("click", function () {
        strip.querySelectorAll("button").forEach(function (item) {
          item.classList.remove("is-selected");
        });
        button.classList.add("is-selected");
        if (entry.service === "amateur") {
          sawAmateur = true;
          detail.textContent = entry.name + ", " + mhz(entry.khzLow) + " through " + mhz(entry.khzHigh) + ". " + (entry.note || "") + " Transmitting here still depends on the license privilege in the reference, not only on the radio being able to tune here.";
        } else {
          sawOther = true;
          detail.textContent = entry.name + ". " + (entry.note || "") + " Listening is not amateur transmit authorization.";
        }
        if (sawAmateur && sawOther) {
          ctx.complete("learn");
        }
      });
      strip.appendChild(button);
    });
    wrap.appendChild(strip);
    wrap.appendChild(ctx.paragraph(sourceLine(catalog)));
    wrap.appendChild(detail);
    return wrap;
  }

  function createTool(catalog, onChange) {
    var level = "technician";
    var bandId = null;
    var viewed = {};
    var sawGeneral = false;
    var looked = {};
    var root = document.createElement("div");
    root.className = "instrument";
    var detail = document.createElement("p");
    detail.className = "signal-readout";
    detail.setAttribute("aria-live", "polite");
    var levelRow = document.createElement("div");
    levelRow.className = "tune-pad";
    var bandRow = document.createElement("div");
    bandRow.className = "tune-pad";

    function button(label, pressed, action) {
      var node = document.createElement("button");
      node.type = "button";
      node.textContent = label;
      node.setAttribute("aria-pressed", pressed ? "true" : "false");
      node.addEventListener("click", action);
      return node;
    }

    function paint() {
      levelRow.textContent = "";
      bandRow.textContent = "";
      levelRow.appendChild(button("Technician", level === "technician", function () {
        level = "technician";
        paint();
      }));
      levelRow.appendChild(button("General (preview)", level === "general", function () {
        level = "general";
        sawGeneral = true;
        paint();
      }));
      (catalog.bands || []).forEach(function (band) {
        bandRow.appendChild(button(band.name, band.id === bandId, function () {
          bandId = band.id;
          viewed[band.id] = true;
          paint();
        }));
      });
      var band = null;
      (catalog.bands || []).forEach(function (item) {
        if (item.id === bandId) {
          band = item;
        }
      });
      var lines = [];
      if (!band) {
        lines.push("Select a band. The notes below come from the reference.");
      } else {
        lines.push(band.name + ": " + mhz(band.khzLow) + " through " + mhz(band.khzHigh) + ".");
        if (band.note) {
          lines.push(band.note);
        }
        if (band.bandPlanNote) {
          lines.push(band.bandPlanNote);
        }
        (band.segments || []).forEach(function (segment, index) {
          var last = index === band.segments.length - 1;
          var high = last ? segment.khzHigh : segment.khzHigh - 1;
          var listed = (segment.licenseLevels || []).indexOf(level) >= 0;
          lines.push(
            segment.name + " " + mhz(segment.khzLow) + " through " + mhz(high) +
            ". Modes: " + (segment.modes || []).join(", ") +
            ". License levels in this reference: " + (segment.licenseLevels || []).join(", ") +
            ". " + (listed ? "Shown for the license you selected." : "Not listed for the license you selected.") +
            (segment.note ? " " + segment.note : "")
          );
        });
        if (level === "general") {
          lines.push("General preview. The General course is not built. This is not a complete General chart.");
          if (band.generalNote) {
            lines.push(band.generalNote);
          }
        }
      }
      if (catalog.notInThisLab) {
        lines.push(catalog.notInThisLab);
      }
      detail.textContent = lines.join(" ");
      if (onChange) {
        onChange(api);
      }
    }

    var api = {
      root: root,
      viewed: viewed,
      looked: looked,
      sawGeneral: function () {
        return sawGeneral;
      },
      level: function () {
        return level;
      },
      bandId: function () {
        return bandId;
      },
      inspect: function (khz, licenseLevel, mode) {
        var entry = RadioControls.lookupEntry(catalog, khz);
        var result = RadioControls.assessTransmission(catalog, khz, licenseLevel || level, mode || "phone");
        looked[khz] = true;
        if (entry && entry.service === "amateur") {
          bandId = entry.id;
          viewed[entry.id] = true;
        }
        paint();
        detail.textContent = mhz(khz) + ". " + describe(result, licenseLevel || level, mode || "phone") + " " + detail.textContent;
        return result;
      },
    };

    root.appendChild(LessonKit.paragraph(sourceLine(catalog)));
    root.appendChild(levelRow);
    root.appendChild(bandRow);
    root.appendChild(detail);
    paint();
    return api;
  }

  function bandStage(ctx, catalog, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph("Open each band in the reference. Then switch the license preview to General. The General course is not built. The preview only shows what this file already contains."));
    var note = ctx.feedbackNode();
    var tool = createTool(catalog, function (api) {
      var focus = (catalog.bands || []).filter(function (band) {
        return band.focus;
      });
      var opened = focus.every(function (band) {
        return api.viewed[band.id];
      });
      if (!opened) {
        note.textContent = "Open 2 meters, 70 centimeters, and 10 meters. Read the license line on each segment.";
        return;
      }
      if (!api.sawGeneral()) {
        note.textContent = "The three bands are open. Switch to General (preview) once. It is not a full General chart.";
        return;
      }
      note.textContent = "You used the reference for both license levels this file knows about. A band plan note is a custom inside an allocation. It does not replace the allocation.";
      ctx.complete("see");
    });
    wrap.appendChild(tool.root);
    wrap.appendChild(note);
    return wrap;
  }

  function decisions(ctx, catalog, config) {
    var wrap = document.createElement("div");
    wrap.appendChild(ctx.paragraph(config.intro || "Use the reference for each card. The answer is whatever the reference shows."));
    var prompt = ctx.paragraph("");
    prompt.className = "challenge-prompt";
    var verdicts = ctx.paragraph("");
    var note = ctx.feedbackNode();
    var choices = document.createElement("div");
    var tasks = config.tasks || [];
    var index = 0;
    var tool = createTool(catalog, function () {});
    wrap.appendChild(tool.root);
    wrap.appendChild(prompt);
    wrap.appendChild(verdicts);
    wrap.appendChild(choices);
    wrap.appendChild(note);
    if (ctx.saved.stages && ctx.saved.stages.do) {
      index = tasks.length;
    }
    show();

    function show() {
      var task = tasks[index];
      choices.textContent = "";
      if (!task) {
        prompt.textContent = "Band decisions complete.";
        if (!(ctx.saved.stages && ctx.saved.stages.do)) {
          note.textContent = "You checked the reference before deciding. That is the habit.";
          ctx.complete("do");
        }
        return;
      }
      prompt.textContent = "Card " + (index + 1) + " of " + tasks.length + ". " + task.prompt;
      note.textContent = "Check this frequency in the reference, then answer.";
      var check = document.createElement("button");
      check.type = "button";
      check.textContent = "Check this frequency in the reference";
      check.addEventListener("click", function () {
        var result = tool.inspect(task.khz, task.licenseLevel || "technician", task.mode || "phone");
        note.textContent = describe(result, task.licenseLevel || "technician", task.mode || "phone");
      });
      choices.appendChild(check);
      choices.appendChild(answerRow(task));
    }

    function answerRow(task) {
      var result = RadioControls.assessTransmission(
        catalog,
        task.khz,
        task.licenseLevel || "technician",
        task.mode || "phone"
      );
      var pairs;
      if (task.type === "locate") {
        var entry = RadioControls.lookupEntry(catalog, task.khz);
        pairs = (catalog.bands || []).map(function (band) {
          return [band.name, !!(entry && entry.id === band.id)];
        });
        pairs.push(["It is not an amateur band in this reference", !entry || entry.service !== "amateur"]);
      } else if (task.type === "listen") {
        pairs = [
          ["Listening is not authorization to transmit there", true],
          ["If the radio can hear it, transmitting is allowed", false],
        ];
      } else if (task.type === "consult") {
        pairs = [
          ["Consult the reference before transmitting", true],
          ["Transmit, because the radio can be tuned there", false],
        ];
      } else {
        pairs = [
          ["The reference shows this operation as allowed", !!result.allowed],
          ["The reference does not show this operation as allowed", !result.allowed],
        ];
      }
      return ctx.choiceRow(pairs, function (ok) {
        if (!tool.looked[task.khz]) {
          note.textContent = "Check this frequency in the reference before you answer.";
          return;
        }
        if (task.type === "locate") {
          var entry = RadioControls.lookupEntry(catalog, task.khz);
          if (entry && entry.service === "amateur" && tool.bandId() !== entry.id) {
            note.textContent = "Open that band in the reference, then answer.";
            return;
          }
        }
        if (!ok) {
          note.textContent = "Use the sentence the reference just showed. " + describe(result, task.licenseLevel || "technician", task.mode || "phone");
          return;
        }
        verdicts.textContent = "Recorded. " + describe(result, task.licenseLevel || "technician", task.mode || "phone");
        index += 1;
        show();
      });
    }

    return wrap;
  }

  function fieldPlan(ctx, catalog, block) {
    var wrap = document.createElement("div");
    var config = block.config || {};
    wrap.appendChild(ctx.paragraph(block.prompt));
    var note = ctx.feedbackNode();
    var recorded = ctx.saved.fieldTasks && ctx.saved.fieldTasks[block.taskId] === "complete";
    var tool = createTool(catalog, function () {});
    var requested = null;
    (config.candidates || []).forEach(function (candidate) {
      if (candidate.role === "requested") {
        requested = candidate;
      }
    });
    wrap.appendChild(tool.root);
    (config.candidates || []).forEach(function (candidate) {
      var row = document.createElement("div");
      row.className = "tune-pad";
      var check = document.createElement("button");
      check.type = "button";
      check.textContent = "Check " + candidate.label;
      var choose = document.createElement("button");
      choose.type = "button";
      choose.textContent = "Choose " + candidate.label;
      check.addEventListener("click", function () {
        var result = tool.inspect(candidate.khz, "technician", "phone");
        note.textContent = describe(result, "technician", "phone");
      });
      choose.addEventListener("click", function () {
        chooseCandidate(candidate);
      });
      row.appendChild(check);
      row.appendChild(choose);
      wrap.appendChild(ctx.paragraph(candidate.label));
      wrap.appendChild(row);
    });
    wrap.appendChild(note);
    if (recorded) {
      note.textContent = "This field task is already recorded. You can check the options again.";
    }

    function chooseCandidate(candidate) {
      if (recorded) {
        return;
      }
      if (!tool.looked[candidate.khz]) {
        note.textContent = "Check that option in the reference before you choose it.";
        return;
      }
      var result = RadioControls.assessTransmission(catalog, candidate.khz, "technician", "phone");
      if (candidate.role === "requested") {
        if (!result.allowed) {
          note.textContent = "The reference does not show the requested option as allowed. Do not choose it just because the group named it.";
          return;
        }
        if (tool.bandId() !== result.entry.id) {
          note.textContent = "Open the band that contains the group's frequency, then choose it.";
          return;
        }
        recorded = true;
        note.textContent = "That option is the one the group asked for, and the reference shows it for Technician voice inside " + result.entry.name + ".";
        ctx.setField(block.taskId, "complete").then(function () {
          ctx.complete("field");
          note.textContent += " Field task recorded.";
        });
        return;
      }
      if (result.reason === "not-amateur") {
        note.textContent = describe(result, "technician", "phone") + " The group asked for an amateur simplex frequency.";
        return;
      }
      if (!result.allowed) {
        note.textContent = describe(result, "technician", "phone") + " Leave this one off the Technician plan.";
        return;
      }
      var asked = requested ? requested.label : "the frequency the group named";
      note.textContent = "The reference can allow a Technician voice contact here, but the group asked for " + asked + ". Check that option and choose it.";
    }

    return wrap;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
