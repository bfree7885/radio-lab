/* Educational models for Technician remediation TR-04 through TR-06.

   Offsets, horizons, multipath, and SWR readings are teaching models.
   They are not band-plan law, survey measurements, or equipment limits.
*/
(function (root) {
  function round(value, places) {
    var factor = Math.pow(10, places == null ? 2 : places);
    return Math.round(value * factor) / factor;
  }

  var FREE_SPACE_M_PER_S = 300000000;

  var OFFSETS = {
    "2m": {
      khz: 600,
      label: "600 kHz",
      note: "A common United States 2-meter repeater offset. Other repeaters and other countries can differ.",
    },
    "70cm": {
      khz: 5000,
      label: "5 MHz",
      note: "A common United States 70-centimeter repeater offset. Other repeaters and other countries can differ.",
    },
  };

  function repeaterPlan(band, outputKhz, direction, reverse) {
    var spec = OFFSETS[band];
    if (!spec || !isFinite(outputKhz)) {
      return null;
    }
    var sign = direction === "plus" ? 1 : -1;
    var offsetKhz = sign * spec.khz;
    var inputKhz = outputKhz + offsetKhz;
    return {
      band: band,
      outputKhz: outputKhz,
      offsetKhz: offsetKhz,
      offsetLabel: spec.label,
      inputKhz: inputKhz,
      listenKhz: reverse ? inputKhz : outputKhz,
      transmitKhz: reverse ? outputKhz : inputKhz,
      reverse: !!reverse,
      note: spec.note,
      educationalModel: true,
    };
  }

  var DTMF = {
    rows: { "1": 697, "2": 697, "3": 697, "4": 770, "5": 770, "6": 770, "7": 852, "8": 852, "9": 852, "*": 941, "0": 941, "#": 941 },
    cols: { "1": 1209, "2": 1336, "3": 1477, "4": 1209, "5": 1336, "6": 1477, "7": 1209, "8": 1336, "9": 1477, "*": 1209, "0": 1336, "#": 1477 },
  };

  function dtmf(key) {
    var low = DTMF.rows[key];
    var high = DTMF.cols[key];
    if (!low) {
      return null;
    }
    return { key: key, lowHz: low, highHz: high, simultaneous: true, name: "DTMF" };
  }

  function wavelengthM(mhz) {
    if (!(mhz > 0)) {
      return null;
    }
    return round(300 / mhz, 2);
  }

  function bandName(mhz) {
    if (!(mhz > 0)) {
      return null;
    }
    if (mhz >= 3 && mhz < 30) {
      return "HF";
    }
    if (mhz >= 30 && mhz < 300) {
      return "VHF";
    }
    if (mhz >= 300 && mhz < 3000) {
      return "UHF";
    }
    return "other";
  }

  function sameFreeSpaceSpeed(mhzA, mhzB) {
    return mhzA > 0 && mhzB > 0;
  }

  function waveModel(polarization) {
    var electric = polarization === "horizontal" ? "horizontal" : "vertical";
    var magnetic = electric === "horizontal" ? "vertical" : "horizontal";
    return {
      electric: electric,
      magnetic: magnetic,
      travel: "forward",
      perpendicular: true,
      polarization: electric,
      velocityMps: FREE_SPACE_M_PER_S,
      educationalModel: true,
      note: "The electric and magnetic fields are at right angles to each other and to the direction of travel. Polarization follows the electric field. This drawing is a model, not a field plot.",
    };
  }

  function horizonKm(heightM, kind) {
    if (!(heightM > 0)) {
      return null;
    }
    var factor = kind === "radio" ? 4.12 : 3.57;
    return round(factor * Math.sqrt(heightM), 2);
  }

  function multipathLevel(step) {
    var index = Math.round(step);
    if (!isFinite(index)) {
      return null;
    }
    var direct = 1;
    var reflected = 0.65 * Math.cos(index * 1.7);
    return round(Math.abs(direct + reflected), 2);
  }

  function pathBehavior(id) {
    var table = {
      "uhf-trees": {
        kind: "absorption",
        summary: "Vegetation absorbs a lot of UHF and microwave energy. The wave gets weaker. It is not being returned as a useful skip.",
      },
      "rain-microwave": {
        kind: "absorption",
        summary: "Rain and fog can shorten a microwave path by absorbing energy.",
      },
      "rain-10m": {
        kind: "little-effect",
        summary: "Fog and rain have little effect on 10-meter and 6-meter signals in this model.",
      },
      "hf-day-absorption": {
        kind: "absorption",
        summary: "In the daytime the lower ionosphere can absorb lower HF before a hop returns.",
      },
      "hf-f-region": {
        kind: "return",
        summary: "The F region can bend HF back toward the Earth. That return is not the same thing as absorption.",
      },
    };
    return table[id] || null;
  }

  function hfSketch(mhz, daytime, sunspotsHigh) {
    var name = bandName(mhz);
    if (name === "VHF" || name === "UHF") {
      return {
        mode: "line-of-sight",
        beyondHorizon: false,
        note: "A normal VHF or UHF path in this model stays near the radio horizon. A special mode has to be active before you treat it as skip.",
      };
    }
    if (name !== "HF") {
      return null;
    }
    if (mhz < 10 && daytime) {
      return {
        mode: "absorption",
        beyondHorizon: false,
        note: "Lower HF in the daytime is often absorbed. Nighttime on the same band can be a different path.",
      };
    }
    if (mhz >= 28 && !(daytime && sunspotsHigh)) {
      return {
        mode: "closed",
        beyondHorizon: false,
        note: "Long 10-meter F-region paths are most likely in the daytime when sunspot activity is high. This setting does not open that path.",
      };
    }
    return {
      mode: "f-region",
      beyondHorizon: true,
      note: "The F region can return this HF signal beyond the horizon. The model is a sketch, not a prediction for a real day.",
    };
  }

  var GALLERY = [
    {
      id: "sporadic-e",
      title: "Sporadic E",
      cause: "Patches of the E region become dense enough to return VHF for a while.",
      result: "Occasional strong signals on 10, 6, and 2 meters from beyond the radio horizon. They come and go.",
      recognize: "A 2-meter signal from several hundred miles away appears for an hour, then fades. No temperature inversion was reported.",
    },
    {
      id: "meteor",
      title: "Meteor scatter",
      cause: "A meteor trail is briefly ionized and can scatter a signal.",
      result: "Short bursts. Six meters is a common band for this kind of contact.",
      recognize: "The signal is a brief ping, gone in a second, on 6 meters.",
    },
    {
      id: "aurora",
      title: "Auroral propagation",
      cause: "The signal scatters from auroral ionization.",
      result: "The tone is raspy or fluttery. CW is easier to copy than voice.",
      recognize: "A VHF CW signal sounds distorted and watery, and the aurora is active.",
    },
    {
      id: "ducting",
      title: "Tropospheric ducting",
      cause: "A temperature inversion can form a duct in the lower atmosphere.",
      result: "VHF and UHF can travel on the order of 300 miles, farther than the ordinary radio horizon.",
      recognize: "Repeaters a few hundred miles away are steady for hours during a strong inversion.",
    },
    {
      id: "knife-edge",
      title: "Knife-edge diffraction",
      cause: "A sharp ridge bends a little of the wave into the shadow behind it.",
      result: "A station beyond a ridge can still be heard, weaker than a clear line of sight.",
      recognize: "The direct path is blocked by a ridge, and a weak signal still arrives from the far side.",
    },
  ];

  function gallery() {
    return GALLERY.map(function (item) {
      return {
        id: item.id,
        title: item.title,
        cause: item.cause,
        result: item.result,
        recognize: item.recognize,
      };
    });
  }

  function initGallery() {
    return gallery().map(function (item) {
      return { id: item.id, title: item.title };
    });
  }

  var COAX = [
    { id: "center", name: "Center conductor", role: "Carries the signal." },
    { id: "dielectric", name: "Dielectric", role: "Insulates the center from the shield. Foam types lose less than solid types in this comparison." },
    { id: "shield", name: "Shield", role: "The return path. It also keeps outside signals out and the radio signal in." },
    { id: "jacket", name: "Outer jacket", role: "Protects the cable. A jacket that resists ultraviolet light slows sun damage." },
  ];

  function coaxLayers() {
    return COAX.map(function (layer) {
      return { id: layer.id, name: layer.name, role: layer.role };
    });
  }

  function interpretSwr(ratio) {
    if (ratio === 1) {
      return {
        ratio: "1:1",
        match: "perfect",
        foldback: false,
        lostPower: "essentially none reflected",
        note: "1:1 means the antenna and the feed line impedances match in this model. It is not a promise about every radio's protection circuit.",
      };
    }
    if (ratio === 4) {
      return {
        ratio: "4:1",
        match: "poor",
        foldback: true,
        lostPower: "a substantial fraction is reflected and much of the lost power becomes heat in the line and the radio",
        note: "4:1 is a large mismatch. Many solid-state radios reduce output as SWR rises, to protect the transmitter. This lab does not set a universal safe number.",
      };
    }
    return null;
  }

  function controlEffect(control, setting) {
    var table = {
      agc: {
        fast: "Strong and weak stations come out at more similar volume. A sudden loud signal is turned down.",
        off: "A strong station is much louder than a weak one. The receiver gain stays put.",
      },
      rit: {
        offset: "The receive frequency moves a little. The transmit frequency stays where the VFO is.",
        center: "Receive and transmit use the same frequency.",
      },
      scan: {
        running: "The radio steps through memory channels and stops when it hears a signal.",
        stopped: "The radio stays on one channel.",
      },
      keyer: {
        paddle: "The paddle contacts become evenly timed dots and dashes. You are not sending by hand with a straight key.",
        straight: "A straight key follows your hand. No automatic timing is added.",
      },
      squelch: {
        open: "Noise and weak signals are both audible.",
        tight: "The speaker is quiet until a stronger signal arrives. A weak station can disappear.",
      },
      "mic-gain": {
        high: "Voice peaks distort. On FM they can be clipped so hard the repeater audio drops out.",
        moderate: "The voice is understandable and stays inside a normal swing.",
      },
      filter: {
        wide: "More noise beside the voice gets through. Signal-to-noise ratio is worse.",
        ssb: "A voice-width filter rejects noise on either side of an SSB signal.",
      },
      "noise-blanker": {
        on: "Short ignition-like pops are reduced. It is not a cure for another station's voice.",
        off: "Impulse noise comes through with the signal.",
      },
    };
    var row = table[control];
    return row ? row[setting] || null : null;
  }

  function wiringChoice(id) {
    var table = {
      "fuse-at-battery": {
        ok: true,
        why: "The positive lead is fused close to the battery, so a short farther along the cable opens the fuse.",
      },
      "fuse-at-radio-only": {
        ok: false,
        why: "A fuse only at the radio leaves the long positive cable unprotected if it chafes against the body.",
      },
      "heavy-short": {
        ok: true,
        why: "Short, heavy wire keeps the voltage drop small when the radio draws transmit current.",
      },
      "thin-long": {
        ok: false,
        why: "A long thin wire drops voltage under transmit current. The radio can shut down or distort.",
      },
      "negative-to-battery": {
        ok: true,
        why: "The negative return goes to the battery negative, or to chassis that is bonded to it.",
      },
      "negative-to-random-screw": {
        ok: false,
        why: "A painted or loose screw is not a reliable return and can put current through parts of the vehicle you did not intend.",
      },
    };
    return table[id] || null;
  }

  function sensitivityCopy(receiver, level) {
    var limits = { ordinary: 3, sensitive: 1 };
    var limit = limits[receiver];
    if (limit == null || !(level >= 0)) {
      return null;
    }
    return {
      copied: level >= limit,
      educationalModel: true,
      note: "Sensitivity is the ability to detect a weak signal. These levels are a classroom scale, not a lab measurement.",
    };
  }

  function convertFrequency(inputMhz, oscillatorMhz) {
    if (!(inputMhz > 0) || !(oscillatorMhz > 0)) {
      return null;
    }
    return {
      outputMhz: round(Math.abs(inputMhz - oscillatorMhz), 3),
      role: "mixer",
      note: "A mixer combines the signal with an oscillator and produces a new frequency. This is the idea, not a full receiver design.",
    };
  }

  function transvert(radioMhz, shiftMhz) {
    if (!(radioMhz > 0) || !(shiftMhz > 0)) {
      return null;
    }
    return {
      onAirMhz: round(radioMhz + shiftMhz, 3),
      role: "transverter",
      note: "A transverter moves the radio's input and output to another band. The radio still tunes; the transverter changes the range.",
    };
  }

  var CASES = {
    "neighbor-overload": {
      required: ["dummy-load", "local-monitor", "neighbor-radio"],
      action: "work-with-neighbor",
      why: "The transmitter is clean into a dummy load, and a nearby amateur receiver hears normal audio. The neighbor's broadcast radio is being overloaded by the fundamental signal. The next step is to work with them on separation or a filter at their receiver, not to replace your radio on a guess.",
    },
    "over-deviation": {
      required: ["repeater-report"],
      action: "reduce-mic-gain",
      why: "The report is distorted audio and dropouts on voice peaks through the repeater. That fits too much microphone gain. Check that before you blame the repeater.",
    },
    "high-swr": {
      required: ["swr-reading"],
      action: "inspect-feedline",
      why: "The radio is folding back and the SWR reading is 4:1. Look at the feed line, connectors, and antenna before you replace the radio.",
    },
    "harmonic": {
      required: ["other-band", "dummy-load"],
      action: "fix-your-station",
      why: "A receiver on another band hears your signal, and the dummy load stops it. That points at energy leaving your station outside the frequency you meant to use. Check your station before you blame the neighbor's radio.",
    },
  };

  function diagnose(caseId, seen, action) {
    var item = CASES[caseId];
    if (!item) {
      return null;
    }
    var have = {};
    (seen || []).forEach(function (id) {
      have[id] = true;
    });
    var missing = item.required.filter(function (id) {
      return !have[id];
    });
    if (missing.length) {
      return { accepted: false, ready: false, missing: missing, why: "Collect the listed observations before you choose a fix." };
    }
    if (action === item.action) {
      return { accepted: true, ready: true, missing: [], why: item.why };
    }
    return {
      accepted: false,
      ready: true,
      missing: [],
      why: "That action does not match the observations. " + item.why,
    };
  }

  function stepScenario(name, index, choiceId) {
    var scenario = SCENARIOS[name];
    if (!scenario) {
      return null;
    }
    var step = scenario.steps[index];
    if (!step) {
      return { done: true, name: name, title: scenario.title };
    }
    var choice = null;
    step.choices.forEach(function (item) {
      if (item.id === choiceId) {
        choice = item;
      }
    });
    if (!choice) {
      return { done: false, accepted: false, why: "Choose one of the actions on this step.", index: index };
    }
    return {
      done: false,
      accepted: !!choice.correct,
      why: choice.why,
      index: choice.correct ? index + 1 : index,
      finished: choice.correct && index + 1 >= scenario.steps.length,
      name: name,
    };
  }

  function initScenario(name) {
    var scenario = SCENARIOS[name];
    if (!scenario) {
      return null;
    }
    var first = scenario.steps[0];
    return {
      name: scenario.id,
      title: scenario.title,
      stepCount: scenario.steps.length,
      stepIndex: 0,
      prompt: first.prompt,
      readout: first.readout,
      choiceIds: first.choices.map(function (choice) {
        return choice.id;
      }),
    };
  }

  function scenario(name) {
    var found = SCENARIOS[name];
    if (!found) {
      return null;
    }
    return found;
  }

  var SCENARIOS = {
    simplex: {
      id: "simplex",
      title: "Simplex contact",
      steps: [
        {
          prompt: "You want to reach a friend on 146.520 MHz. The radio is already there.",
          readout: "146.520 MHz simplex. You have not listened yet.",
          choices: [
            { id: "listen", label: "Listen", correct: true, why: "Simplex uses one frequency for both directions. Find out whether someone is already there." },
            { id: "call", label: "Call immediately", correct: false, why: "Calling before you listen can cover a contact you have not heard." },
          ],
        },
        {
          prompt: "The frequency is quiet.",
          readout: "No station is using 146.520 MHz.",
          choices: [
            { id: "call", label: "Call your friend and give your call sign", correct: true, why: "Say their call sign, then yours. Simplex does not need a repeater offset." },
            { id: "cq-only", label: "Say CQ and leave your call sign off", correct: false, why: "A call still includes your call sign." },
          ],
        },
      ],
    },
    repeater: {
      id: "repeater",
      title: "Repeater contact",
      steps: [
        {
          prompt: "You can hear the repeater output. You want to call a station whose call sign you know.",
          readout: "Repeater output is quiet. Offset and tone are already set for this machine.",
          choices: [
            { id: "call", label: "Say their call sign, then your call sign", correct: true, why: "On a repeater, call the station you want. CQ is for when you are looking for anyone, usually on simplex." },
            { id: "cq", label: "Call CQ CQ CQ", correct: false, why: "A long CQ is a poor fit on a busy repeater. If you know who you want, call them." },
          ],
        },
        {
          prompt: "Nobody is talking, and you are willing to talk with anyone.",
          readout: "Same repeater. Still quiet.",
          choices: [
            { id: "id", label: "Say your call sign and that you are listening", correct: true, why: "Announcing your call sign tells the repeater you are listening for a contact." },
            { id: "kerchunk", label: "Key up in silence", correct: false, why: "A silent transmission does not identify you and does not invite a useful contact." },
          ],
        },
      ],
    },
    cq: {
      id: "cq",
      title: "Calling CQ",
      steps: [
        {
          prompt: "You want a phone contact with any station, and you are not using a repeater.",
          readout: "A simplex frequency in the band plan. You have not listened.",
          choices: [
            { id: "listen", label: "Listen", correct: true, why: "CQ asks for a contact. It still waits until you know the frequency is free." },
            { id: "cq", label: "Transmit CQ now", correct: false, why: "The frequency might already be in use. Listen first." },
          ],
        },
        {
          prompt: "You hear two stations finishing a contact.",
          readout: "They are saying goodbye.",
          choices: [
            { id: "wait", label: "Wait until they clear", correct: true, why: "They are still using the frequency. CQ can wait a few seconds." },
            { id: "over", label: "Call CQ over the end of their contact", correct: false, why: "Covering their last transmissions is interference, not a skillful CQ." },
          ],
        },
        {
          prompt: "The frequency is quiet now.",
          readout: "Clear simplex channel.",
          choices: [
            { id: "cq", label: "Call CQ and give your call sign", correct: true, why: "CQ means you are calling any station. Your call sign tells them who is calling." },
            { id: "silent", label: "Hold the microphone open and say nothing", correct: false, why: "A carrier with no call sign is not a CQ." },
          ],
        },
        {
          prompt: "You released the microphone.",
          readout: "Your CQ has ended.",
          choices: [
            { id: "listen", label: "Listen for an answer", correct: true, why: "After CQ you leave space for someone to come back. Calling again immediately buries the answer." },
            { id: "again", label: "Call CQ again at once", correct: false, why: "Give an answering station time to transmit." },
          ],
        },
        {
          prompt: "A station answers with their call sign.",
          readout: "They said their call sign and your call sign.",
          choices: [
            { id: "reply", label: "Reply with their call sign and yours", correct: true, why: "Answering a CQ uses the same pattern: their call sign, then yours." },
            { id: "new-cq", label: "Ignore them and call CQ again", correct: false, why: "Someone already answered. Continue the contact." },
          ],
        },
      ],
    },
    answer: {
      id: "answer",
      title: "Answering CQ",
      steps: [
        {
          prompt: "You hear a station calling CQ on a clear simplex frequency.",
          readout: "CQ from a station you can copy.",
          choices: [
            { id: "answer", label: "Say their call sign, then your call sign", correct: true, why: "That is the response to CQ. They learn who is calling them." },
            { id: "cq", label: "Call your own CQ on top of them", correct: false, why: "They already asked for a call. Answer them instead of starting a second CQ." },
          ],
        },
      ],
    },
    interference: {
      id: "interference",
      title: "Crowded frequency",
      steps: [
        {
          prompt: "You and another station are on the same simplex frequency. You can hear each other only in pieces. Both contacts started by accident.",
          readout: "The Q signal for interference from other stations is QRM.",
          choices: [
            { id: "qsy", label: "Agree to move one contact (QSY)", correct: true, why: "QRM means interference from other stations. Moving one contact clears the frequency. QSY means you are changing frequency." },
            { id: "shout", label: "Talk louder and stay", correct: false, why: "More audio does not remove two stations from one frequency." },
          ],
        },
        {
          prompt: "A repeater is linked to two other machines. Your long rag-chew would go out on all of them.",
          readout: "Linked repeater network.",
          choices: [
            { id: "simplex", label: "Move the long chat to simplex", correct: true, why: "Simplex frequencies exist so local contacts do not occupy a repeater, especially a linked one." },
            { id: "stay", label: "Stay on the linked system", correct: false, why: "A linked network repeats you farther than this one machine. A local chat does not need that." },
          ],
        },
        {
          prompt: "Your voice peaks make the repeater audio go silent.",
          readout: "Stations say you drop out when you talk loudly.",
          choices: [
            { id: "gain", label: "Turn the microphone gain down", correct: true, why: "Over-deviation clips the FM signal. The receiver loses you on peaks." },
            { id: "tone", label: "Change the CTCSS tone", correct: false, why: "The repeater is already accepting you. The failure is on voice peaks, which fits deviation, not the access tone." },
          ],
        },
      ],
    },
    net: {
      id: "net",
      title: "Directed net",
      steps: [
        {
          prompt: "A station says: 'This is the picnic net. I am net control. Stations check in when I call for them.'",
          readout: "Directed net. Net control is directing the traffic.",
          choices: [
            { id: "wait", label: "Wait until net control asks for check-ins", correct: true, why: "In a directed net you transmit when net control recognizes you." },
            { id: "jump", label: "Call your friend directly", correct: false, why: "The net is directed. A side conversation waits." },
          ],
        },
        {
          prompt: "Net control says: 'Check-ins, call now.'",
          readout: "Net control is listening for check-ins.",
          choices: [
            { id: "check", label: "Give your call sign and wait", correct: true, why: "A check-in is your call sign, then you wait to be recognized. Traffic means messages, not casual chatting." },
            { id: "story", label: "Tell the whole story of your morning", correct: false, why: "Check-in is not the time for a long transmission." },
          ],
        },
        {
          prompt: "Net control says: 'Stand by. Priority traffic.'",
          readout: "A station has a priority message.",
          choices: [
            { id: "hold", label: "Stay off the frequency", correct: true, why: "Priority traffic gets the net. Your routine comment waits. Part 97 still applies." },
            { id: "over", label: "Transmit your comment anyway", correct: false, why: "Covering priority traffic is the opposite of helping." },
          ],
        },
      ],
    },
    traffic: {
      id: "traffic",
      title: "Formal message",
      steps: [
        {
          prompt: "The message text is MEET AT THE NORTH GATE. Someone asks you to pass 'head to the north parking lot whenever you can.'",
          readout: "Formal traffic. The check counts the words in the text.",
          choices: [
            { id: "exact", label: "Pass MEET AT THE NORTH GATE", correct: true, why: "Accuracy matters. You do not improve a formal message by rewriting it. Unusual words can be spelled with phonetics." },
            { id: "better", label: "Pass your clearer version", correct: false, why: "A paraphrase can change the instruction. Pass the text you were given." },
          ],
        },
        {
          prompt: "The header check says 5. You count five words in the text.",
          readout: "Preamble fields track the message: number, precedence, origin, check, place, and time.",
          choices: [
            { id: "match", label: "The check matches the text", correct: true, why: "The check is the count of words in the text. A mismatch means you ask for a fill, not that you guess." },
            { id: "ignore", label: "Ignore the check", correct: false, why: "The check is how the receiving station knows the text arrived whole." },
          ],
        },
      ],
    },
    "public-service": {
      id: "public-service",
      title: "Public-service mission",
      steps: [
        {
          prompt: "An organized foot-race net is on a local repeater. You have a Technician license and a radio. You have not checked in.",
          readout: "Having a license does not make you the incident commander.",
          choices: [
            { id: "join", label: "Listen, then check in when net control asks", correct: true, why: "You join the net that was organized. You do not self-deploy or take over." },
            { id: "lead", label: "Announce that you are in charge because you are licensed", correct: false, why: "A license authorizes amateur operation. It does not appoint you." },
          ],
        },
        {
          prompt: "The repeater listing says 442.100 MHz, minus 5 MHz, CTCSS 100 Hz. This is a common United States 70-centimeter example, not a rule for every machine.",
          readout: "Output 442.100 MHz.",
          choices: [
            { id: "set", label: "Set minus 5 MHz and the 100 Hz tone, then listen", correct: true, why: "You can hear an output and still fail to get in if the offset or the CTCSS tone is wrong." },
            { id: "carrier", label: "Ignore the tone and the offset", correct: false, why: "Hearing the output only proves you can receive. Access still needs the input and, here, the tone." },
          ],
        },
        {
          prompt: "Net control calls your call sign and asks you to pass a supply message: NEED WATER AT MILE 3.",
          readout: "You were recognized.",
          choices: [
            { id: "pass", label: "Pass NEED WATER AT MILE 3 and your call sign", correct: true, why: "Pass the words you were given. Phonetics can spell an unusual token. Do not decorate the message." },
            { id: "embellish", label: "Add that the runners look tired", correct: false, why: "That was not in the message. Extra color can be heard as part of the request." },
          ],
        },
        {
          prompt: "Another station is talking on the simplex frequency you hoped to use for a side chat. You can hear pieces of both conversations.",
          readout: "QRM on the simplex channel.",
          choices: [
            { id: "move", label: "Stay with the net and leave the crowded simplex frequency", correct: true, why: "The net is the assigned circuit. The interference is a reason to move the side chat, not to talk over it." },
            { id: "cover", label: "Transmit over the other station", correct: false, why: "QRM gets worse if both stations keep transmitting." },
          ],
        },
        {
          prompt: "Net control says: 'Priority. A runner is down at mile 3. All other traffic stand by.'",
          readout: "Priority communication. Part 97 still applies.",
          choices: [
            { id: "standby", label: "Stop routine talk and listen", correct: true, why: "Emergency and priority traffic take the frequency. You help by staying out of the way unless net control calls you. The rules are not suspended." },
            { id: "routine", label: "Finish your weather comment first", correct: false, why: "A routine comment waits. It is not more important than the injured runner." },
          ],
        },
        {
          prompt: "A friend says RACES and ARES are the same thing, and that your license enrolled you in both.",
          readout: "The race organizers are not asking you to join either one today.",
          choices: [
            { id: "distinguish", label: "RACES needs a civil-defense enrollment. ARES is a voluntary amateur registration. This license did neither.", correct: true, why: "RACES is for civil-defense communication and requires that agency's certification. ARES is amateurs who volunteer their stations for public service. Buying a license is not either enrollment." },
            { id: "same", label: "Agree that the license enrolled you", correct: false, why: "The license lets you operate under Part 97. It does not enroll you in RACES or ARES." },
          ],
        },
      ],
    },
  };

  var api = {
    round: round,
    FREE_SPACE_M_PER_S: FREE_SPACE_M_PER_S,
    repeaterPlan: repeaterPlan,
    dtmf: dtmf,
    wavelengthM: wavelengthM,
    bandName: bandName,
    sameFreeSpaceSpeed: sameFreeSpaceSpeed,
    waveModel: waveModel,
    horizonKm: horizonKm,
    multipathLevel: multipathLevel,
    pathBehavior: pathBehavior,
    hfSketch: hfSketch,
    gallery: gallery,
    initGallery: initGallery,
    coaxLayers: coaxLayers,
    interpretSwr: interpretSwr,
    controlEffect: controlEffect,
    wiringChoice: wiringChoice,
    sensitivityCopy: sensitivityCopy,
    convertFrequency: convertFrequency,
    transvert: transvert,
    diagnose: diagnose,
    initScenario: initScenario,
    scenario: scenario,
    stepScenario: stepScenario,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RemediationSim = api;
})(typeof window !== "undefined" ? window : globalThis);
