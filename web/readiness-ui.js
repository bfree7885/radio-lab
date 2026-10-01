/* Technician Exam Readiness page.

   The engine scores. This file only shows one question at a time and
   keeps the answer key out of the page until the learner submits.
*/
(function () {
  var engine = null;
  var store = null;
  var events = [];
  var session = null;
  var answers = {};
  var cursor = 0;
  var standard = null;
  var syllabus = null;
  var contentBase = "";
  var SESSION_KEY = "waypoint-radio-lab.readiness-session.v1";

  var FOCUSES = [
    ["", "Any topic"],
    ["weak", "Weak areas"],
    ["calculations", "Calculations"],
    ["regulations", "Regulations"],
    ["operating", "Operating"],
    ["propagation", "Propagation"],
    ["station", "Station / controls"],
    ["electrical", "Electrical"],
    ["components", "Components"],
    ["troubleshooting", "Troubleshooting"],
    ["modes", "Modes / digital / satellites"],
    ["antennas", "Antennas"],
    ["safety", "Safety"],
  ];

  function rootNode() {
    return document.getElementById("readiness-root");
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") {
        node.textContent = attrs[key];
      } else if (key === "className") {
        node.className = attrs[key];
      } else {
        node.setAttribute(key, attrs[key]);
      }
    });
    (children || []).forEach(function (child) {
      if (child) {
        node.appendChild(child);
      }
    });
    return node;
  }

  function button(label, className, onClick) {
    var node = el("button", { type: "button", className: className, text: label });
    node.addEventListener("click", onClick);
    return node;
  }

  function contentPrefix() {
    var base = document.documentElement.getAttribute("data-content-base") || "/content/";
    return base.charAt(base.length - 1) === "/" ? base : base + "/";
  }

  function loadJson(path) {
    return fetch(contentBase + path).then(function (response) {
      if (!response.ok) {
        throw new Error(path);
      }
      return response.json();
    });
  }

  function attempts() {
    return engine.attemptsFromEvents(events);
  }

  function mocks() {
    return events.filter(function (event) { return event.kind === "mock"; });
  }

  function saveSession() {
    if (!session) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      session: session,
      answers: answers,
      cursor: cursor,
    }));
  }

  function clearSession() {
    session = null;
    answers = {};
    cursor = 0;
    sessionStorage.removeItem(SESSION_KEY);
  }

  function restoreSession() {
    var raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return false;
    }
    try {
      var saved = JSON.parse(raw);
      if (!saved.session || !saved.session.items) {
        return false;
      }
      session = saved.session;
      answers = saved.answers || {};
      cursor = saved.cursor || 0;
      return true;
    } catch (error) {
      return false;
    }
  }

  function start(next) {
    if (next.empty) {
      renderDashboard(next.reason);
      return;
    }
    session = next;
    answers = {};
    cursor = 0;
    saveSession();
    renderSession();
  }

  function storeKind(kind) {
    return kind === "mock" ? "mock" : "practice";
  }

  function reviewRows() {
    return session.items.map(function (item) {
      var selected = Object.prototype.hasOwnProperty.call(answers, item.instanceId) ? answers[item.instanceId] : null;
      var answered = typeof selected === "number";
      return {
        questionId: item.instanceId,
        stem: item.stem,
        selectedText: answered ? item.choices[selected].text : "",
        correctText: item.choices[item.correctIndex].text,
        correct: answered && selected === item.correctIndex,
        explanation: item.explanation,
        wrongNote: answered ? item.choices[selected].note : "This question was left unanswered.",
        conceptId: item.conceptId,
        conceptLabel: item.conceptLabel,
        groupId: item.groupId,
        subelement: item.subelement,
        review: item.review,
      };
    });
  }

  function submitSession() {
    var scored = engine.score(session, answers);
    scored.mode = session.kind;
    scored.review = reviewRows();
    var kind = storeKind(session.kind);
    store.record(kind, scored).then(function (event) {
      events.push(event);
      clearSession();
      renderResult(event);
    }).catch(function () {
      renderResult(scored);
    });
  }

  function renderDashboard(notice) {
    var node = rootNode();
    node.replaceChildren();
    var trend = engine.readinessStatus(events, attempts());
    var weak = engine.weakConcepts(attempts());
    var review = engine.summarizeConcepts(attempts()).filter(function (row) { return row.status === "review"; });

    if (notice) {
      node.appendChild(el("p", { className: "panel", text: notice }));
    }

    node.appendChild(el("section", { className: "panel", "aria-labelledby": "trend-heading" }, [
      el("h2", { id: "trend-heading", text: "Readiness trend" }),
      el("p", { className: "stat-line", text: trend.status }),
      el("p", { text: trend.reason }),
      el("p", { text: "BUILDING: fewer than two mock exams. DEVELOPING: two or more mock exams, and the two most recent do not both meet the practice mark. CONSISTENT: the two most recent mock exams both met the mark. EXAM-READY PRACTICE PERFORMANCE also needs a third mock exam, no group missed on both of those two exams, no weak concept, at least 40 different questions, and every subelement. This is practice performance. It is not an FCC result." }),
      el("p", { text: "Mock exams on record: " + trend.mockCount + ". Different questions seen: " + trend.distinctQuestions + ". Weak concepts: " + trend.weakConcepts + "." }),
    ]));

    var practice = el("section", { className: "panel", "aria-labelledby": "practice-heading" }, [
      el("h2", { id: "practice-heading", text: "Question bank practice" }),
      el("p", { text: "RADIO LAB PRACTICE. " + engine.catalog.length + " original questions are available, including number variants. The bank is labeled as Radio Lab practice. Official stem ids are alignment only." }),
    ]);
    var focus = el("select", { id: "readiness-focus", "aria-label": "Practice topic" });
    FOCUSES.forEach(function (pair) {
      focus.appendChild(el("option", { value: pair[0], text: pair[1] }));
    });
    var group = el("select", { id: "readiness-group", "aria-label": "Official group" });
    group.appendChild(el("option", { value: "", text: "Any group" }));
    syllabus.subelements.forEach(function (sub) {
      sub.groups.forEach(function (item) {
        group.appendChild(el("option", { value: item.id, text: item.id + " " + sub.id }));
      });
    });
    practice.appendChild(el("div", { className: "readiness-actions" }, [
      focus,
      group,
      button("Start focused practice", "button", function () {
        var built = engine.buildPractice({
          seed: String(Date.now()),
          focus: focus.value || null,
          groupId: group.value || null,
          attempts: attempts(),
          count: 8,
        });
        start(built);
      }),
    ]));
    node.appendChild(practice);

    node.appendChild(el("section", { className: "panel", "aria-labelledby": "quick-heading" }, [
      el("h2", { id: "quick-heading", text: "Quick Check" }),
      el("p", { text: "Ten RADIO LAB PRACTICE questions, one from each subelement. This is retrieval practice. It is not a mock exam and it is not graded against the FCC written-element mark." }),
      button("Start Quick Check", "button", function () {
        start(engine.buildQuickCheck(String(Date.now())));
      }),
    ]));

    var weakSection = el("section", { className: "panel", "aria-labelledby": "weak-heading" }, [
      el("h2", { id: "weak-heading", text: "Weak areas" }),
      el("p", { text: "A concept becomes weak only after at least two attempts, with at least two misses among the last four, and recent accuracy below 60 percent. One miss is a review item. It does not stay marked weak." }),
    ]);
    if (!weak.length) {
      weakSection.appendChild(el("p", { text: "No concept is weak yet." }));
    }
    weak.forEach(function (row) {
      weakSection.appendChild(el("p", { text: row.conceptLabel + " · " + row.groupId + " · " + row.recentCorrect + " of the last " + row.recentCount + " correct." }));
    });
    if (review.length) {
      weakSection.appendChild(el("p", { text: review.length + " concept" + (review.length === 1 ? "" : "s") + " missed once. Those stay in review until the pattern repeats." }));
    }
    if (weak.length) {
      weakSection.appendChild(button("Practice weak areas", "button", function () {
        start(engine.buildPractice({
          seed: String(Date.now()),
          focus: "weak",
          attempts: attempts(),
          count: 8,
        }));
      }));
    }
    node.appendChild(weakSection);

    node.appendChild(el("section", { className: "panel", "aria-labelledby": "mock-heading" }, [
      el("h2", { id: "mock-heading", text: "Mock exams" }),
      el("p", { text: "RADIO LAB MOCK EXAM. " + standard.questionCount + " original questions, one from each official group. The practice mark is " + standard.minimumCorrect + " correct, from " + standard.citation + "." }),
      button("Start mock exam", "button", function () {
        start(engine.buildMock(String(Date.now())));
      }),
    ]));

    var history = el("section", { className: "panel", "aria-labelledby": "history-heading" }, [
      el("h2", { id: "history-heading", text: "Exam history" }),
    ]);
    if (!mocks().length) {
      history.appendChild(el("p", { text: "No mock exam is stored yet." }));
    }
    mocks().slice().reverse().forEach(function (exam) {
      var mark = exam.passed ? "Practice mark met" : "Practice mark not met";
      var row = el("div", { className: "readiness-history" }, [
        el("p", { text: exam.recordedAt + " · seed " + exam.seed + " · " + exam.correct + " of " + exam.total + " · " + mark }),
        button("Open summary", "button-quiet", function () {
          renderResult(exam);
        }),
      ]);
      history.appendChild(row);
    });
    node.appendChild(history);
  }

  function unansweredCount(presented) {
    return presented.items.filter(function (item) {
      return typeof answers[item.instanceId] !== "number";
    }).length;
  }

  function renderSession() {
    var presented = engine.present(session);
    var item = presented.items[cursor];
    var node = rootNode();
    node.replaceChildren();
    var unanswered = unansweredCount(presented);
    var section = el("section", { className: "panel", "aria-labelledby": "question-heading" }, [
      el("p", { className: "eyebrow", text: presented.label }),
      el("h2", { id: "question-heading", text: "Question " + (cursor + 1) + " of " + presented.items.length }),
      el("p", { id: "unanswered-count", text: unanswered + " unanswered" }),
    ]);
    if (item.figure) {
      section.appendChild(el("img", {
        className: "readiness-figure",
        src: contentBase + item.figure.src,
        alt: item.figure.alt || item.figure.id,
      }));
      section.appendChild(el("p", { text: "Official NCVEC Figure " + item.figure.id + ". The question is a Radio Lab question about that figure." }));
    }
    section.appendChild(el("p", { className: "challenge-prompt", text: item.stem }));
    item.choices.forEach(function (choice, index) {
      var choiceButton = button(choice, "readiness-choice", function () {
        answers[item.instanceId] = index;
        saveSession();
        renderSession();
      });
      if (answers[item.instanceId] === index) {
        choiceButton.setAttribute("aria-pressed", "true");
      }
      section.appendChild(choiceButton);
    });
    var nav = el("div", { className: "readiness-nav" });
    presented.items.forEach(function (entry, index) {
      var marker = button(String(index + 1), "button-quiet", function () {
        cursor = index;
        saveSession();
        renderSession();
      });
      if (index === cursor) {
        marker.setAttribute("aria-current", "true");
      }
      if (typeof answers[entry.instanceId] === "number") {
        marker.classList.add("readiness-answered");
      }
      nav.appendChild(marker);
    });
    section.appendChild(nav);
    section.appendChild(el("div", { className: "readiness-actions" }, [
      button("Previous", "button-quiet", function () {
        cursor = Math.max(0, cursor - 1);
        saveSession();
        renderSession();
      }),
      button("Next", "button-quiet", function () {
        cursor = Math.min(presented.items.length - 1, cursor + 1);
        saveSession();
        renderSession();
      }),
      button(unanswered ? "Submit with " + unanswered + " unanswered" : "Submit", "button", submitSession),
      button("Back to dashboard", "button-quiet", function () {
        clearSession();
        renderDashboard();
      }),
    ]));
    node.appendChild(section);
  }

  function renderResult(result) {
    var node = rootNode();
    node.replaceChildren();
    var heading = "Practice result";
    var summary = result.correct + " of " + result.total;
    if (result.practiceMarkApplies) {
      heading = result.passed ? "Practice mark met" : "Practice mark not met";
      summary = result.correct + " of " + result.total + ". The written-element mark is " + result.minimumCorrect + " of " + result.total + ", from " + standard.citation + ". This mock exam does not grant a license and does not guarantee the real exam.";
    } else if (result.mode === "quick" || result.kind === "practice" && result.total === 10) {
      summary = result.correct + " of " + result.total + ". Quick Check is retrieval practice. It is not graded against the FCC written-element mark.";
    }
    var section = el("section", { className: "panel", "aria-labelledby": "result-heading" }, [
      el("h2", { id: "result-heading", text: heading }),
      el("p", { className: "stat-line", text: summary }),
    ]);
    if (result.bySubelement) {
      var breakdown = el("div");
      breakdown.appendChild(el("h3", { text: "Subelement results" }));
      Object.keys(result.bySubelement).sort().forEach(function (id) {
        var row = result.bySubelement[id];
        breakdown.appendChild(el("p", { text: id + ": " + row.correct + " of " + row.total }));
      });
      section.appendChild(breakdown);
    }
    var misses = result.review ? result.review.filter(function (row) { return !row.correct; }) : (result.misses || []);
    section.appendChild(el("h3", { text: misses.length ? "Questions to review" : "Nothing missed in this set" }));
    misses.forEach(function (row) {
      var block = el("article", { className: "readiness-miss" }, [
        el("p", { text: row.stem || row.conceptLabel }),
        el("p", { text: "Your answer: " + (row.selectedText || "unanswered") }),
        el("p", { text: "Answer that fits: " + row.correctText }),
        el("p", { text: "Why that answer works: " + (row.explanation || "") }),
        el("p", { text: "Why the other choice does not: " + (row.wrongNote || "") }),
        el("p", { text: "Concept: " + row.conceptLabel + " · Group " + row.groupId }),
      ]);
      if (row.review && row.review.labId) {
        block.appendChild(el("a", {
          href: "/labs/" + row.review.labId + "#stage-" + row.review.stageId,
          text: "Review this in " + row.review.labId.toUpperCase() + ", " + row.review.stageId,
        }));
      }
      section.appendChild(block);
    });
    if (result.review) {
      section.appendChild(el("h3", { text: "Every question" }));
      result.review.forEach(function (row) {
        section.appendChild(el("p", {
          text: (row.correct ? "Matched. " : "Review. ") + row.conceptLabel + " · " + row.groupId + " · " + (row.correctText || ""),
        }));
      });
    }
    section.appendChild(button("Back to dashboard", "button", function () {
      renderDashboard();
    }));
    node.appendChild(section);
  }

  function boot() {
    contentBase = contentPrefix();
    store = RadioLabReadinessStore.createForPage();
    Promise.all([
      loadJson("exam/technician-readiness-v1.json"),
      loadJson("exam/technician-2026-2030.json"),
      loadJson("exam/technician-element-2-standard.json"),
      store.list(),
    ]).then(function (parts) {
      standard = parts[2];
      syllabus = parts[1];
      engine = RadioLabReadiness.create({
        bank: parts[0],
        syllabus: parts[1],
        standard: parts[2],
      });
      events = parts[3];
      if (restoreSession()) {
        renderSession();
      } else {
        renderDashboard();
      }
    }).catch(function () {
      rootNode().textContent = "Exam Readiness could not load. The lesson pages are still available.";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
