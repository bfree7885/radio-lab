/* Shared models for TR-01 through TR-03.

   Prefix math, decibel ratios, series and parallel totals, and rule checks.
   Decibel factors are the Technician approximations, not a derived logarithm.
*/
(function (root) {
  var PREFIX = {
    pico: 1e-12,
    micro: 1e-6,
    milli: 1e-3,
    none: 1,
    kilo: 1e3,
    mega: 1e6,
    giga: 1e9,
  };

  var DB_FACTOR = { "3": 2, "6": 4, "10": 10, "-3": 0.5, "-6": 0.25, "-10": 0.1 };

  function convertPrefix(value, fromPrefix, toPrefix) {
    if (!isFinite(value) || PREFIX[fromPrefix] == null || PREFIX[toPrefix] == null) {
      return null;
    }
    return (value * PREFIX[fromPrefix]) / PREFIX[toPrefix];
  }

  function dbFactor(db) {
    var factor = DB_FACTOR[String(db)];
    return factor == null ? null : factor;
  }

  function applyDb(watts, db) {
    var factor = dbFactor(db);
    if (factor == null || !(watts > 0)) {
      return null;
    }
    return { inputWatts: watts, db: Number(db), factor: factor, outputWatts: watts * factor, relative: true };
  }

  function seriesOhms(values) {
    var total = 0;
    for (var i = 0; i < values.length; i += 1) {
      if (!(values[i] > 0)) {
        return null;
      }
      total += values[i];
    }
    return { totalOhms: total, currentSame: true, voltageSame: false };
  }

  function parallelOhms(values) {
    var sum = 0;
    for (var i = 0; i < values.length; i += 1) {
      if (!(values[i] > 0)) {
        return null;
      }
      sum += 1 / values[i];
    }
    if (!(sum > 0)) {
      return null;
    }
    return { totalOhms: 1 / sum, currentSame: false, voltageSame: true };
  }

  function solveOhm(known) {
    var v = known.volts;
    var i = known.amps;
    var r = known.ohms;
    var present = [v, i, r].filter(function (value) { return value != null && isFinite(value); }).length;
    if (present !== 2) {
      return null;
    }
    if (v == null) {
      return { unknown: "volts", value: i * r, relation: "voltage = current × resistance" };
    }
    if (i == null) {
      if (!(r > 0)) {
        return null;
      }
      return { unknown: "amps", value: v / r, relation: "current = voltage / resistance" };
    }
    if (!(i > 0)) {
      return null;
    }
    return { unknown: "ohms", value: v / i, relation: "resistance = voltage / current" };
  }

  function solvePower(known) {
    var p = known.watts;
    var v = known.volts;
    var i = known.amps;
    var present = [p, v, i].filter(function (value) { return value != null && isFinite(value); }).length;
    if (present !== 2) {
      return null;
    }
    if (p == null) {
      return { unknown: "watts", value: v * i, relation: "power = voltage × current" };
    }
    if (i == null) {
      if (!(v !== 0)) {
        return null;
      }
      return { unknown: "amps", value: p / v, relation: "current = power / voltage" };
    }
    if (!(i !== 0)) {
      return null;
    }
    return { unknown: "volts", value: p / i, relation: "voltage = power / current" };
  }

  function technicianHfPhone(mhz) {
    return mhz >= 28.3 && mhz < 28.5;
  }

  function technicianPep(mhz) {
    if (!(mhz > 0)) {
      return null;
    }
    if (mhz < 30) {
      return { watts: 200, note: "Technician HF segments in this reference are limited to 200 watts peak envelope power." };
    }
    return { watts: 1500, note: "Above 30 MHz the usual Technician maximum is 1500 watts peak envelope power, with specific restrictions that this card does not list one by one." };
  }

  var RULES = [
    { id: "races", prompt: "You have a new Technician license. A city official asks you to be the control operator of a RACES station tonight.", accept: "enroll", why: "The license is not enough. RACES also requires enrollment with the civil defense organization." },
    { id: "beacon", prompt: "You want an automatically controlled beacon. The reference shows 28.200 to 28.300 MHz for those beacons.", accept: "ten-meters", why: "Automatically controlled propagation beacons in this reference are on 10 meters, between 28.200 and 28.300 MHz." },
    { id: "coordinator", prompt: "Who recommends the transmit and receive channels for a new repeater?", accept: "coordinator", why: "A frequency coordinator, selected by the amateur operators who are eligible to use repeaters and auxiliary stations, recommends the pair." },
    { id: "secondary", prompt: "Your contact is in a part of a band where the amateur service is secondary.", accept: "yield", why: "A secondary station must not cause harmful interference to the primary service and must accept interference from it." },
    { id: "hf-phone", prompt: "You want to use phone on 7.200 MHz. The reference shows Technician HF phone only on part of 10 meters.", accept: "no", why: "7.200 MHz is not in the Technician phone slice. Look up 10 meters before you call a Technician HF phone frequency legal." },
    { id: "pep", prompt: "On a Technician HF segment, a friend says 1500 watts is fine.", accept: "200", why: "This reference limits Technician HF segments to 200 watts peak envelope power." },
    { id: "vanity", prompt: "You want a specific available call sign instead of the next sequential one.", accept: "vanity", why: "A licensed amateur may request a vanity call sign. Any currently licensed amateur may apply. The request does not replace the need for a grant." },
    { id: "waters", prompt: "You are on a US-documented ship in international waters and want to use your FCC license.", accept: "fcc-rules", why: "The FCC license can be used when the ship's master agrees, and you still follow FCC amateur rules. The license is not a pass to ignore the ship." },
    { id: "country", prompt: "A country has notified the ITU that it objects to amateur communications from FCC licensees.", accept: "stop", why: "Communications are prohibited with any country whose administration has notified the ITU of that objection." },
    { id: "code", prompt: "A friend asks you to scramble a chat so bystanders cannot read it.", accept: "plain", why: "Messages are not encoded to hide their meaning. Ordinary contacts stay in plain language. A narrow control-link exception is not a reason to scramble a conversation." },
    { id: "auto", prompt: "A repeater transmits when a station keys it, and no control operator is sitting at the repeater site.", accept: "automatic", why: "That is automatic control: a device operates the station under the rules, and the control operator is not present at the site." },
    { id: "remote", prompt: "You sit at home and operate a radio at another location over an internet control link.", accept: "remote", why: "Remote control means the control point is somewhere other than the station, connected by a control link. You are still the control operator." },
    { id: "tactical", prompt: "Net control calls you 'Aid Station 2' for an hour.", accept: "both", why: "A tactical name is allowed, and your FCC call sign is still required at the end of the contact and at least every 10 minutes." },
    { id: "club", prompt: "Four friends want a club call sign. None of them wants to be the trustee.", accept: "trustee", why: "A club grant needs a licensed trustee and an organized club. A license for nobody in particular is not issued." },
    { id: "inspect", prompt: "An FCC representative asks to inspect the station.", accept: "show", why: "The station licensee makes the station and its records available for inspection on request." },
    { id: "grant", prompt: "You passed the exam an hour ago. The license database does not list a grant yet.", accept: "wait", why: "You may transmit when the FCC license grant appears in the license database. Passing the exam is not itself the grant." },
    { id: "grace", prompt: "Your license expired last month and is inside the two-year grace period.", accept: "silent", why: "The grace period is time to renew. It is not permission to transmit." },
    { id: "renew", prompt: "Your 10-year grant expires in two months. When can you request renewal?", accept: "ninety", why: "A renewal may be requested within 90 days before expiration. The normal term is 10 years." },
    { id: "groupd", prompt: "Which shape is the Group D call sign this card uses for a sequential Technician grant?", accept: "shape", why: "Group D is two letters, one digit, and three letters. The grant, not the shape you prefer, is what you identify with." },
    { id: "email", prompt: "The email address on your grant bounces.", accept: "fix", why: "If the FCC cannot reach you by email, the grant can be revoked, suspended, or cancelled. Keep the address current." },
    { id: "international", prompt: "A station in another country asks about your picnic plans.", accept: "personal", why: "International communications are permitted when they are incidental to the purposes of the amateur service, including personal remarks." },
    { id: "classes", prompt: "Which new amateur licenses does the FCC currently issue?", accept: "three", why: "New licenses are Technician, General, and Amateur Extra." },
    { id: "iss", prompt: "Who may contact the International Space Station on a VHF frequency?", accept: "privilege", why: "Any amateur station whose license gives the frequency privilege may contact the ISS. The space station is an amateur station more than 50 km above the Earth." },
    { id: "edge", prompt: "You want to center a phone signal exactly on the edge of your phone slice.", accept: "inside", why: "The signal has width. Part of it would fall outside the slice. Keep the whole signal inside." },
    { id: "third", prompt: "An unlicensed friend wants to say hello on your radio to a station in the United States.", accept: "you-control", why: "You remain the control operator. A message for someone else is third-party communications. A contact with a foreign station also needs that country's third-party agreement, and the third party cannot be a person whose amateur license was revoked." },
    { id: "music", prompt: "A friend asks you to play a song on phone.", accept: "no-music", why: "Music is not permitted, except when it is incidental to an authorized retransmission of a space station." },
    { id: "sale", prompt: "You want to tell the club net that your old handheld is for sale.", accept: "occasional", why: "An occasional notice that equipment is available is permitted. Regular buying and selling is a business and is not." },
    { id: "broadcast", prompt: "You want to transmit a program intended for the general public.", accept: "not-broadcast", why: "Broadcasting means transmissions intended for the general public. That is not an amateur purpose." },
    { id: "testid", prompt: "You want to send a test transmission, and separately a friend wants model-craft control signals with no voice identification.", accept: "identify-test", why: "Test transmissions are identified. The narrow exception this course treats as unidentified is a control signal for a model craft." },
    { id: "extra-op", prompt: "Other than an emergency, may you be the control operator while the station transmits in an Amateur Extra-only segment?", accept: "no-extra", why: "Privileges follow the control operator. A Technician is not the control operator for an Extra-only segment except during an emergency." },
    { id: "both", prompt: "You are the control operator at a friend's station. Who is responsible for proper operation?", accept: "both-people", why: "The station licensee and the control operator are both responsible. The licensee designates the control operator. The control point is where the control function is performed." },
    { id: "repeater-account", prompt: "A repeater retransmits a station on another channel, and the repeated signal breaks a rule.", accept: "licensee", why: "A repeater simultaneously retransmits another amateur station on a different channel. The repeater licensee is accountable for the retransmission." },
    { id: "phonetics", prompt: "Must you use a phonetic alphabet every time you identify on phone?", accept: "optional", why: "Phonetics are optional. They clarify letters. Identification itself is still your call sign, in English, on phone." },
    { id: "indicator", prompt: "You want to add a self-assigned indicator after your call sign.", accept: "after", why: "An indicator such as portable may follow the call sign. It does not replace the call sign." },
    { id: "news", prompt: "A news crew asks you to gather a story on the radio.", accept: "safety-only", why: "News gathering is limited to an immediate safety-of-life or protection-of-property need when no other means is available." },
    { id: "pay", prompt: "When may you be paid for operating an amateur station?", accept: "classroom", why: "Compensation is not allowed, except when the operation is incidental to classroom instruction." },
    { id: "auxiliary", prompt: "What is an auxiliary station in this card?", accept: "point", why: "An auxiliary station is a point-to-point link among cooperating amateur stations, not a contact with the public." },
    { id: "obscenity", prompt: "A station on the repeater is using indecent language.", accept: "stop-language", why: "Indecent or obscene language is prohibited. Do not continue that transmission." },
    { id: "week-home", prompt: "First week. You are at the kitchen table with the radio in front of you.", accept: "local-home", why: "You are at the station performing the control function. That is local control of your home station." },
    { id: "week-friend", prompt: "At the picnic, an unlicensed friend wants to say hello on the local repeater.", accept: "you-stay", why: "You stay the control operator. Your friend may speak. You are still responsible for the transmission, and you still identify with your call sign." },
    { id: "week-repeater", prompt: "The picnic uses a repeater. Nobody is at the repeater site.", accept: "repeater-auto", why: "The repeater is under automatic control. You are still the control operator of your own radio, and you still identify." },
    { id: "week-remote", prompt: "The next day you operate that same radio from your phone, over a control link, while the radio stays at home.", accept: "remote-week", why: "The control point moved. That is remote control, and you are still the control operator. It is not automatic control." },
  ];

  function rule(id) {
    for (var i = 0; i < RULES.length; i += 1) {
      if (RULES[i].id === id) {
        return RULES[i];
      }
    }
    return null;
  }

  function initRules() {
    return RULES.map(function (item) {
      return { id: item.id, prompt: item.prompt };
    });
  }

  var api = {
    PREFIX: PREFIX,
    convertPrefix: convertPrefix,
    dbFactor: dbFactor,
    applyDb: applyDb,
    seriesOhms: seriesOhms,
    parallelOhms: parallelOhms,
    solveOhm: solveOhm,
    solvePower: solvePower,
    technicianHfPhone: technicianHfPhone,
    technicianPep: technicianPep,
    rule: rule,
    initRules: initRules,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RemediationBasics = api;
})(typeof window !== "undefined" ? window : globalThis);
