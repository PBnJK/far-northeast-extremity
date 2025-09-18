/* The script
 *
 * Thanks to:
 * - https://dev.to/code_passion/creating-a-draggable-element-using-html-css-and-javascript-54g7 (dragging code)
 */

"use strict";

const items = new Map();

const main = document.getElementById("main");

const itemsDiv = document.getElementById("items");
const popup = document.getElementById("popup");

const BASE_WINDOW_WIDTH = 1280;
const BASE_WINDOW_HEIGHT = 720;

let popupCustomClass = "";

let passwordSpookIntervalID = null;

class Item {
  constructor(id, url, alt, x, y, w, h, z = 0) {
    this.id = id;

    this.oldWindowInnerWidth = window.innerWidth;

    this.posX = 0;
    this.posY = 0;

    this.rect = undefined;

    this.offsetX = 0;
    this.offsetY = 0;

    this.collideWith = [];

    /* Flags */
    this.flagGrabbed = false;
    this.flagGrabbable = true;
    this.flagFirstGrabbed = false;
    this.flagFirstDropped = false;
    this.flagCheckCollisions = false;

    /* Callbacks */
    this.firstGrabbedCallback = null;
    this.firstDroppedCallback = null;

    this.grabbedCallback = null;
    this.droppedCallback = null;

    this.hoverCallback = () => {};

    this.startDragging = (e) => {
      e.preventDefault();

      if (!this.flagFirstGrabbed) {
        this.flagFirstGrabbed = true;
        this.firstGrabbedCallback?.();
      }

      this.grabbedCallback?.();
      if (this.flagGrabbable) {
        this.element = this.getElement();

        this.rect = this.element.getBoundingClientRect();
        this.offsetX = e.clientX - this.rect.left;
        this.offsetY = e.clientY - window.scrollY - this.rect.top;
        this.element.classList.add("dragging");

        document.addEventListener("mousemove", this.dragElement);
      }
    };

    this.dragElement = (e) => {
      e.preventDefault();

      this.flagGrabbed = true;

      this.posX = e.clientX - this.offsetX;
      this.posY = e.clientY - this.offsetY;
      this.rect = this.element.getBoundingClientRect();

      this.element.style.left = this.posX + "px";
      this.element.style.top = this.posY + "px";

      if (this.flagCheckCollisions) {
        for (const [el, callback] of this.collideWith) {
          const rect = el.getElement().getBoundingClientRect();
          if (
            !(
              rect.top > this.rect.bottom ||
              rect.right < this.rect.left ||
              rect.bottom < this.rect.top ||
              rect.left > this.rect.right
            )
          ) {
            callback(self, el);
          }
        }
      }
    };

    this.stopDragging = () => {
      if (!this.flagFirstDropped) {
        this.flagFirstDropped = true;
        this.firstDroppedCallback?.();
      }

      this.flagGrabbed = false;
      this.droppedCallback?.();

      document.removeEventListener("mousemove", this.dragElement);
      this.element?.classList.remove("dragging");

      this.element = null;
    };

    this.resizeCallback = () => {
      const e = this.element ?? this.getElement();
      const rect = e.getBoundingClientRect();

      const oldX = rect.left;
      const w = window.innerWidth - this.oldWindowInnerWidth;
      const newX = w / 2 + oldX;

      this.oldWindowInnerWidth = window.innerWidth;

      this.posX = this.offsetX = newX;
      this.rect = e.getBoundingClientRect();
      e.style.left = this.offsetX + "px";
    };

    this.create(id, url, alt, itemsDiv, w, h, z);
    this.moveTo(x, y);
  }

  create(id, url, alt, under, w, h, z) {
    const div = document.createElement("div");
    div.id = id;
    div.classList.add("item");
    div.style.zIndex = z;

    const img = document.createElement("img");
    img.setAttribute("src", url ? url : "assets/img_hidden.png");
    img.setAttribute("alt", alt);

    if (w) img.setAttribute("width", w);
    if (h) img.setAttribute("height", h);

    img.classList.add("item-img");

    div.appendChild(img);
    div.addEventListener("mousedown", this.startDragging);
    div.addEventListener("mouseup", this.stopDragging);
    div.addEventListener("mouseenter", this.hoverCallback);

    window.addEventListener("resize", this.resizeCallback);
    window.addEventListener("scroll", this.stopDragging);

    under.appendChild(div);
  }

  remove() {
    if (this.flagGrabbed) {
      this.stopDragging();
    }

    const e = this.getElement();

    e.removeEventListener("mousedown", this.startDragging);
    e.removeEventListener("mouseup", this.stopDragging);
    e.removeEventListener("mouseenter", this.hoverCallback);

    e.remove();

    window.removeEventListener("resize", this.resizeCallback);
    window.removeEventListener("scroll", this.stopDragging);
  }

  moveTo(x, y) {
    const e = this.element ?? this.getElement();

    const itemsDivRect = itemsDiv.getBoundingClientRect();
    this.posX = this.offsetX = x + itemsDivRect.left;
    this.posY = this.offsetY = y + itemsDivRect.top + window.scrollY;

    this.rect = e.getBoundingClientRect();

    e.style.left = this.offsetX + "px";
    e.style.top = this.offsetY + "px";
  }

  reportCollisionsWith(el, callback) {
    this.flagCheckCollisions = true;
    this.collideWith.push([el, callback]);
  }

  setGrabbable(grabbable) {
    this.flagGrabbable = grabbable;

    const e = this.element ?? this.getElement();
    e.style.cursor = grabbable ? "grab" : "pointer";
  }

  setFirstGrabbedCallback(callback) {
    this.firstGrabbedCallback = callback;
  }

  setFirstDroppedCallback(callback) {
    this.firstDroppedCallback = callback;
  }

  setGrabbedCallback(callback) {
    this.grabbedCallback = callback;
  }

  setDroppedCallback(callback) {
    this.droppedCallback = callback;
  }

  setHoverCallback(callback) {
    this.hoverCallback = callback;
  }

  getElement() {
    return document.getElementById(this.id);
  }
}

function clearPopup() {
  const e = document.getElementById("popup-content");
  while (e.firstChild) {
    e.removeChild(e.lastChild);
  }

  return e;
}

function showTextPopup(title, description, customClass) {
  const e = clearPopup();

  const h2 = document.createElement("h2");
  h2.innerHTML = title;
  h2.id = "popup-title";
  h2.classList.add("national-park");

  const p = document.createElement("p");
  p.innerHTML = description;
  p.id = "popup-description";
  p.classList.add("national-park");

  e.appendChild(h2);
  e.appendChild(p);

  if (customClass) {
    popupCustomClass = customClass;
    popup.classList.add(customClass);
  }

  popup.showModal();
}

function showImagePopup(title, url, alt, description, customClass) {
  const e = clearPopup();

  const h2 = document.createElement("h2");
  h2.innerHTML = title;
  h2.id = "popup-title";
  h2.classList.add("national-park");

  const img = document.createElement("img");
  img.setAttribute("src", url);
  img.setAttribute("alt", alt);
  img.id = "popup-image";

  const p = document.createElement("p");
  p.innerHTML = description;
  p.id = "popup-description";
  p.classList.add("national-park");

  e.appendChild(h2);
  e.appendChild(img);
  e.appendChild(p);

  if (customClass) {
    popupCustomClass = customClass;
    popup.classList.add(customClass);
  }

  popup.showModal();
}

function showDialoguePopup(name, url, alt, text, qA, rA, qB, rB) {
  const e = clearPopup();

  const h2 = document.createElement("h2");
  h2.innerHTML = name;
  h2.id = "popup-title";
  h2.classList.add("national-park");

  const img = document.createElement("img");
  img.setAttribute("src", url);
  img.setAttribute("alt", alt);
  img.id = "popup-image";

  const p = document.createElement("p");
  p.innerHTML = text;
  p.id = "popup-description";
  p.classList.add("national-park");

  const btn1 = document.createElement("button");
  btn1.innerText = qA;
  btn1.id = "popup-qa";
  btn1.classList.add("popup-question");

  btn1.onclick = () => {
    p.innerHTML = rA;

    e.removeChild(btn1);
    e.removeChild(btn2);
  };

  const btn2 = document.createElement("button");
  btn2.innerText = qB;
  btn2.id = "popup-qb";
  btn2.classList.add("popup-question");

  btn2.onclick = () => {
    p.innerHTML = rB;

    e.removeChild(btn1);
    e.removeChild(btn2);
  };

  e.appendChild(h2);
  e.appendChild(img);
  e.appendChild(p);
  e.appendChild(btn1);
  e.appendChild(btn2);

  popup.showModal();
}

function showCustomPopup(title, html, customClass) {
  const e = clearPopup();
  e.innerHTML = html;

  const h2 = document.createElement("h2");
  h2.innerHTML = title;
  h2.id = "popup-title";
  h2.classList.add("national-park");

  e.prepend(h2);

  if (customClass) {
    popupCustomClass = customClass;
    popup.classList.add(customClass);
  }

  popup.showModal();
}

function addZone(id, description, url, alt) {
  const div = document.createElement("div");
  div.classList.add("zone");
  div.id = id;

  const p = document.createElement("p");
  p.classList.add("inner-description");
  p.innerText = description;

  const img = document.createElement("img");
  img.classList.add("inner-image");
  img.setAttribute("src", url);
  img.setAttribute("alt", alt);

  div.appendChild(p);
  div.appendChild(img);

  main.appendChild(div);
}

function playAudio(src) {
  const audio = new Audio(src);
  audio.play().catch((e) => {
    console.log("Error playing audio: ", e);
  });
}

function spawnItem(item) {
  items.set(item.id, item);
}

function destroyItem(id) {
  const e = findItem(id);
  if (!e) {
    return;
  }

  e.remove();

  items.delete(id);
}

function findItem(id) {
  return items.get(id);
}

function spawnNormalPaper() {
  const normal_paper = new Item(
    "normal_paper",
    "assets/img_normal_paper.png",
    'A taped sheet of paper. It reads: "normal boring place, no secrets!"',
    544,
    400,
    320,
    120,
    2,
  );

  normal_paper.setFirstGrabbedCallback(() => {
    window.setTimeout(() => {
      document.title = "The FNESB";
      playAudio("assets/snd_dramatic_stinger.mp3");
    }, 500);
  });

  spawnItem(normal_paper);
}

function spawnSmallRock() {
  const small_rock = new Item(
    "small_rock",
    "assets/img_small_rock.png",
    "A small inconspicuous rock",
    384,
    448,
    64,
    64,
    1,
  );

  spawnItem(small_rock);
}

function spawnEntranceButton() {
  const entrance_button = new Item(
    "entrance_button",
    "assets/img_entrance_button.png",
    "A big red button on the ground",
    400,
    456,
    32,
    32,
    0,
  );

  entrance_button.setGrabbable(false);
  entrance_button.setFirstGrabbedCallback(() => {
    playAudio("assets/snd_button_accept.mp3");
    window.setTimeout(addBunkerReceptionZone, 1000);
  });

  spawnItem(entrance_button);
}

function spawnBunkerHatch() {
  const hatch = new Item(
    "bunker_hatch",
    "assets/img_bunker_hatch.png",
    "An open hatch, leading below",
    176,
    496,
  );

  hatch.setGrabbable(false);

  spawnItem(hatch);
}

function spawnReceptionDeskPapers() {
  const reception_desk_papers = new Item(
    "reception_desk_papers",
    "",
    "Some papers strewn over the reception desk",
    736,
    1124,
    96,
    64,
  );

  reception_desk_papers.setGrabbable(false);
  reception_desk_papers.setGrabbedCallback(() => {
    showTextPopup(
      "MEMO",
      `
Don't look at the date of this memo.<br/>
Don't look at the date on yesterday's either.<br/><br/>

You're all officially discharged and are urged to go. Gather below. You know where.<br/><br/>

Don't bother packing.<br/><br/>

FNESB Director<br/>
Job Tanner
`,
    );
  });

  spawnItem(reception_desk_papers);
}

function spawnManillaFolder() {
  const manilla_folder = new Item(
    "manilla_folder",
    "",
    "A manilla folder full of documents",
    224,
    1836,
    64,
    24,
  );

  manilla_folder.setGrabbable(false);
  manilla_folder.setGrabbedCallback(() => {
    showTextPopup(
      'Results of "██████ ████" Study',
      `
<sub>Lead Researcher Dr. Toby Ramos</sub><br/>
<br/>
The preliminary investigation on the "██████ ████" (MC-1994) was conducted on the 30th of October, ████.<br/>
<br/>
MC-1994, much like RC-1941, appears to have materialized without warning, entirely replacing the rooms
that were previously there (a ██████████ and part of the outermost ████████████.)<br/>
<br/>
The exact date of its appearence is unknown, with some site staff reporting that it "snuck up on me"
(see █████████, p. <b>47</b>) or that they "didn't even notice it was around the corner" (as per p.
<b>98</b> of Dr. Gallagher's report.) The realization of this fact seems to cause considerable mental
anguish. Further research is needed.<br/>
<br/>
<h2>Subsection A. The Room</h2><br/>
MC-1994 itself is not noteworthy, and although a security door has been installed as a security measure, it appears
to show no intention of expanding any further than its currently occupied 10x8x████m area. The only real anomaly
can be found in the PA speakers which have, despite electricity being cut off on the room, continually played the
song "███ █ ████ ███ █████████ ██ ███" over and over and...<br/>
<br/>
(The rest of the document is redacted beyond comprehension. The very ending, however, is still legible:)<br/>
<br/>
For further enquiries, please contact Dr. Ramos on the internal phone line at ████-2512.<br/>
<br/>
(scribbled on a paper note clipped to the folder:)<br/>
P.S.: The "old line" doesn't work anymore. What I call "simple and easy to remember," the institution calls
"unprofessional." So no more calling me on the ol' all-naught.`,
    );
  });

  spawnItem(manilla_folder);
}

function spawnPosterPopup() {
  const poster_popup = new Item(
    "poster_popup",
    "",
    "A lip on the poster",
    576,
    928,
    16,
    12,
  );

  poster_popup.setGrabbable(false);
  poster_popup.setGrabbedCallback(() => {
    showImagePopup(
      "A note on the poster",
      "assets/img_poster_popup.png",
      "2 9 0 8 —",
      "Scrawled behind the poster are some numbers:<br/>2 9 0 8 —",
    );
  });

  spawnItem(poster_popup);
}

function spawnCarpetPopup() {
  const carpet_popup = new Item(
    "carpet_popup",
    "",
    "A fault in the carpet",
    824,
    1844,
    16,
    12,
  );

  carpet_popup.setGrabbable(false);
  carpet_popup.setGrabbedCallback(() => {
    showImagePopup(
      "A note under the carpet",
      "assets/img_carpet_popup.png",
      "— 1 9 9 4",
      "On a note hidden beneath the carpet are some numbers:<br/>—1 9 9 4",
    );
  });

  spawnItem(carpet_popup);
}

/* Thanks to @esmiralha
 * https://stackoverflow.com/a/7616484
 */
function hashPhoneNumber(string) {
  let hash = 0;
  for (const char of string) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0; // Constrain to 32bit integer
  }

  return hash;
}

const ALREADY_DIALED = {};

const PHONE_NUMBERS = {
  "-2035179091": `
— Well, hello. Ramos speaking. You found my secret little line. Congratulations! Hopefully you've found it before everyone...<br/>
— Eh, I suppose the writing's been on the wall for quite a while now. "Forgetful oaf" and all that.<br/>
— Guess they're...tying the loose end.<br/>
— ...but really, they should have at least been more subtle about it! It's unfair to <i>me</i>!<br/>
— "What's it gonna be with Toby?"
— "Oh, that's not enough for him."
— "It's gotta be me the one to do it," so on, so forth...
— ...
— Oh well, we'll see. Toby out.`,
  "-1874797587": [
    `
— Hello, you've probably dialed...<br/>
— ...<br/>
— ...no, you know what? You know how many people called me just <i>this week?</i><br/>
— I can't take this anymore. I-I <i>won't</i> take this anymore!<br/>
— I'm gonna go live in the woods! Goodbye, modern world! You were lost the moment we invented a way to be prank-called.<br/>
— Thank you! Goodbye.`,
    `
Beep beep...the owner of the number you're trying to wish has "gone ga-ga"<br/>
You may find him "living with the squirrels away from the evil phone."`,
  ],
  "-1986815161": "Ouch! The phone zapped you...",
  1585645585: `
— Hello! You're reaching us because you're a forgetful oaf?<br/>
— Don't answer that, Toby. You just don't forget your head because it's attached to your neck, you know?<br/>
— Any way, Tanner got on my case about the previous message where I just told you the password, so...<br/>
— ...not doing that again! Figure it out yourself! This is technically the military, you know?<br/>
— Hope you have a <i>wonderful</i> time waffling around on the clock for the password!`,
  "-1733595729": `
A message trapped on copper wires:<br/>
<br/>
— ...old him it's crazy, right? How he wrote that and didn't even bat an eye?<br/>
— Uh-huh.<br/>
— So then I looked into it, and everyone was just sort of...<br/>
— Sort of—?<br/>
— Sort of wall-eyed, right? Like, I pointed it out, and they were like "huh, I didn't even notice."<br/>
— Really? Everyone?<br/>
— Yeah! Dr. Ramos, Dr. Gallagher—even Dixie! Like what's up with that? How did they write t-that the room is—<br/>
— ...yeah?<br/>
— No, yeah. Just, uh, Tanner is having me redact it out. So I shouldn't, y'know, say it on the line. R-really, I should...I should go. Bye Fifi.<br/>
— Bye bottle-bottom. Don't let the scary room bite.<br/>
<br/>
(Beep beep beep...)`,
  "-434185785": `
— I'll call it MC-1994. "Missing Christmas." My burden to bear. I wonder what it'll replace it with...?<br/>
— No matter. Let's just hope it's got its kicks. Don't look up, Doctor. Not if you want to remember<br/>
— I won't.
`,
  "-286177235": `
"Beep! You tried reachi—wait, crap, I did it wrong! Again! Ahem...hi, you tried calling—reaching—UGH! I'm BUSY! Message after beep! BEEP!!!"<br/>
<br/>
— Toby's found out. We need to act <i>now</i>. Gather at the agreed-upon place.`,
};

function spawnTelephone() {
  const telephone = new Item(
    "telephone",
    "",
    "An old telephone",
    736,
    1080,
    64,
    32,
  );

  telephone.setGrabbable(false);
  telephone.setGrabbedCallback(() => {
    showCustomPopup(
      "Dial a number",
      `<form id="form-dial" onsubmit="return false;">
  <input id="input-dial" name="input-dial" type="text" readonly />
  <div class="dial-keypad">
    <button class="dial-button" id="dial-1">1</button>
    <button class="dial-button" id="dial-2">2</button>
    <button class="dial-button" id="dial-3">3</button>
  </div>
  <div class="dial-keypad">
    <button class="dial-button" id="dial-4">4</button>
    <button class="dial-button" id="dial-5">5</button>
    <button class="dial-button" id="dial-6">6</button>
  </div>
  <div class="dial-keypad">
    <button class="dial-button" id="dial-7">7</button>
    <button class="dial-button" id="dial-8">8</button>
    <button class="dial-button" id="dial-9">9</button>
  </div>
  <div class="dial-keypad">
    <button class="dial-button" id="dial-X">X</button>
    <button class="dial-button" id="dial-0">0</button>
    <button class="dial-button" id="dial-OK">OK</button>
  </div>
  <p id="dial-message"></p>
</form>`,
    );

    const inputDial = document.getElementById("input-dial");

    const keypadDelete = () => {
      if (inputDial.value.length === 0) {
        return;
      }

      if (inputDial.value.length === 6) {
        inputDial.value = inputDial.value.slice(0, -2);
      } else {
        inputDial.value = inputDial.value.slice(0, -1);
      }

      playAudio("assets/snd_keyX.mp3");
    };

    const keypadSubmit = () => {
      if (inputDial.value.length < 9) {
        return;
      }

      playAudio("assets/snd_keyOK.mp3");

      const telephoneNumber = hashPhoneNumber(inputDial.value).toString();
      inputDial.value = "";

      const e = document.getElementById("dial-message");
      const msg = PHONE_NUMBERS[telephoneNumber];
      if (msg) {
        if (Array.isArray(msg)) {
          const idx = ALREADY_DIALED[telephoneNumber] || 0;
          e.innerHTML = msg[idx];
          if (idx < msg.length - 1) {
            ALREADY_DIALED[telephoneNumber] = idx + 1;
          }
        } else {
          e.innerHTML = msg;
        }
      } else {
        e.innerText = "No response";
      }
    };

    const keypadType = (k) => {
      if (inputDial.value.length >= 9) {
        return;
      }

      if (inputDial.value.length === 4) {
        inputDial.value += "-";
      }
      inputDial.value += k;

      playAudio(`assets/snd_key${k}.mp3`);
    };

    const keypadHandler = (k) => {
      switch (k) {
        case "X":
          keypadDelete();
          break;
        case "OK":
          keypadSubmit();
          break;
        default:
          keypadType(k);
      }
    };

    for (let i = 0; i < 10; ++i) {
      const e = document.getElementById("dial-" + i);
      e.onclick = () => {
        keypadHandler(i.toString());
      };
    }

    const keyX = document.getElementById("dial-X");
    keyX.onclick = () => {
      keypadHandler("X");
    };

    const keyOK = document.getElementById("dial-OK");
    keyOK.onclick = () => {
      keypadHandler("OK");
    };
  });

  spawnItem(telephone);
}

function spawnStickyNote() {
  const sticky_note = new Item(
    "sticky_note",
    "assets/img_sticky_note.png",
    "A sticky note",
    448,
    1868,
  );

  sticky_note.setGrabbable(false);
  sticky_note.setFirstGrabbedCallback(() => {
    spawnPosterPopup();
    spawnCarpetPopup();
  });
  sticky_note.setGrabbedCallback(() => {
    showTextPopup(
      "Toby!",
      `If you forget the keycode...<br/>
...just trawl over the corners of your mind and you'll remember it.<br/><br/>
(on the back)<br/>
Tanner's been all over me with this op-sec stuff, says I'm on thin ice<br/>
So throw this out when you read it! Seriously!!!<br/>
<br/>
— Your bud Dumas.
`,
      "popup-sticky-note",
    );
  });

  spawnItem(sticky_note);
}

function spawnPottedPlantKey() {
  const potted_plant_key = new Item(
    "potted_plant_key",
    "assets/img_potted_plant_key.png",
    "A dirty key",
    224,
    1162,
    64,
    64,
  );

  potted_plant_key.reportCollisionsWith(findItem("safe_door"), () => {
    destroyItem("safe_door");
    destroyItem("potted_plant_key");
    playAudio("assets/snd_safe_open.mp3");

    spawnStickyNote();
  });

  spawnItem(potted_plant_key);
}

function spawnPottedPlant() {
  const potted_plant = new Item(
    "potted_plant",
    "",
    "Barely visible in the dirt, a silver something, glimmering...",
    192,
    1130,
    24,
    24,
  );

  potted_plant.setGrabbable(false);
  potted_plant.setFirstGrabbedCallback(() => {
    playAudio("assets/snd_key_found.mp3");
    spawnPottedPlantKey();
  });

  spawnItem(potted_plant);
}

function spawnKeypad() {
  const keypad = new Item(
    "keypad",
    "assets/img_keypad.png",
    "A numerical keypad",
    560,
    1700,
    64,
    64,
  );

  keypad.setGrabbable(false);
  keypad.setGrabbedCallback(() => {
    showCustomPopup(
      "",
      `<form id="form-code" onsubmit="return false;">
  <input id="input-code" name="input-code" type="text" readonly />
  <div class="code-keypad">
    <button class="code-button" id="code-1">1</button>
    <button class="code-button" id="code-2">2</button>
    <button class="code-button" id="code-3">3</button>
  </div>
  <div class="code-keypad">
    <button class="code-button" id="code-4">4</button>
    <button class="code-button" id="code-5">5</button>
    <button class="code-button" id="code-6">6</button>
  </div>
  <div class="code-keypad">
    <button class="code-button" id="code-7">7</button>
    <button class="code-button" id="code-8">8</button>
    <button class="code-button" id="code-9">9</button>
  </div>
  <div class="code-keypad">
    <button class="code-button" id="code-X">X</button>
    <button class="code-button" id="code-0">0</button>
    <button class="code-button" id="code-OK">=></button>
  </div>
</form>`,
      "popup-keypad",
    );

    const inputCode = document.getElementById("input-code");

    const codeDelete = () => {
      if (inputCode.value.length === 0) {
        return;
      }

      inputCode.value = inputCode.value.slice(0, -1);
      playAudio("assets/snd_code9.mp3");
    };

    const codeSubmit = () => {
      if (inputCode.value.length < 4) {
        return;
      }

      if (hashPhoneNumber(inputCode.value) === 1540190) {
        playAudio("assets/snd_codeOK.mp3");
        destroyItem("door");

        addTombwaysZone();
      } else {
        playAudio("assets/snd_codeX.mp3");
      }

      inputCode.value = "";
    };

    const codeType = (k) => {
      if (inputCode.value.length >= 4) {
        return;
      }

      inputCode.value += k;
      playAudio(`assets/snd_code${k}.mp3`);
    };

    const codeHandler = (k) => {
      switch (k) {
        case "X":
          codeDelete();
          break;
        case "OK":
          codeSubmit();
          break;
        default:
          codeType(k);
      }
    };

    for (let i = 0; i < 10; ++i) {
      const e = document.getElementById("code-" + i);
      e.onclick = () => {
        codeHandler(i.toString());
      };
    }

    const codeX = document.getElementById("code-X");
    codeX.onclick = () => {
      codeHandler("X");
    };

    const codeOK = document.getElementById("code-OK");
    codeOK.onclick = () => {
      codeHandler("OK");
    };
  });

  spawnItem(keypad);
}

function spawnSafeDoor() {
  const safe_door = new Item(
    "safe_door",
    "assets/img_safe_door.png",
    "A reinforced safe door",
    384,
    1802,
  );

  safe_door.setGrabbable(false);
  safe_door.setGrabbedCallback(() => {
    showImagePopup(
      "Safe",
      "assets/img_safe_door_popup.png",
      "Close-up of the safe's keyhole",
      "It appears that the safe is protected by some sort of cartoony key...<br/>Looks pretty dirty.",
    );
  });

  spawnItem(safe_door);
}

function spawnClock() {
  const clock = new Item("clock", "", "A wall clock", 248, 1550, 88, 80);

  clock.setGrabbable(false);
  clock.setGrabbedCallback(() => {
    showImagePopup(
      "Clock",
      "assets/img_clock_popup.png",
      "Clock with the hour hand pointing to eleven, minute hand to siz and second hand to zero",
      `
The sun never sets on the far northeast, so you suppose a clock is useful to have.<br/>
But time must have really snuck up on you...when did it get so late?`,
    );
  });

  spawnItem(clock);
}

function spawnDoor() {
  const door = new Item(
    "door",
    "assets/img_reception_door.png",
    'A big bulky door. A big yellow sign says "restricted."',
    648,
    1580,
  );

  door.setGrabbable(false);

  spawnItem(door);
}

function addBunkerReceptionZone() {
  spawnBunkerHatch();
  playAudio("assets/snd_clue_stinger.mp3");

  /* In case you didn't pull off the sign paper */
  document.title = "The FNESB";

  addZone(
    "reception_top",
    "Woah...",
    "assets/img_bg_reception_top.png",
    "A quaint little reception area. There's a desk and everything.",
  );

  addZone(
    "reception_bottom",
    "...a reception?",
    "assets/img_bg_reception_bottom.png",
    "The other side of the reception.",
  );

  spawnReceptionDeskPapers();
  spawnManillaFolder();
  spawnPottedPlant();
  spawnKeypad();
  spawnSafeDoor();
  spawnClock();
  spawnDoor();
  spawnTelephone();
}

function spawnDumas() {
  const dumas = new Item(
    "dumas",
    "assets/anim_dumas.gif",
    "An embarassed-looking elephant",
    320,
    3800,
  );

  dumas.setGrabbable(false);
  dumas.setGrabbedCallback(() => {
    showDialoguePopup(
      "Dumas",
      "assets/img_dumas_closeup.png",
      "Dumas the Elephant",
      "(Oh jeez, she's really going at him...)",
      "What happened?",
      `
Oh hi, intern! Well, we've been putting together a birthday party for Dr. Ramos over here for a while, but he...<br/>
Well, he thought it was something a bit more <i>sinister.</i><br/>
Now Fifi is really digging into him...<br/>
<br/>
You gotta have a clear mind when working with the stuff we do, you know?<br/>
<br/>
Though maybe asking Toby to have a "clear mind" is a bit too much for the poor fellow. Can you believe that he forgot
that today's his birthday? Unbelievable, that...<br/>
<br/>
Someone even wrote it outside in big letters! Which I think might be a security violation, but never mind that, because
he didn't even bat an eye! Coming in here all "what's the occasion, friends?"<br/>
<br/>
What a guy...
`,
      "Merry Christmas!",
      "Thanks! No idea what that is. But thanks!!",
    );
  });

  spawnItem(dumas);
}

function spawnRamos() {
  const ramos = new Item(
    "ramos",
    "assets/anim_ramos.gif",
    "An embarassed-looking kangaroo thing",
    400,
    3816,
  );

  ramos.setGrabbable(false);
  ramos.setGrabbedCallback(() => {
    showDialoguePopup(
      "Ramos",
      "assets/img_ramos_closeup.png",
      "Ramos the Kangaroo Thing",
      "(You've really done it this time, Robert, you've really done it...",
      "What's happened?",
      "O-oh, hey there, intern! Don't worry about it, haha...just ol' scatterbrain Toby! Whole—erm, birthday surprise for me and I just forgot, haha.",
      "Merry Christmas!",
      `
...<br/>
...yeah. Yeah, Merry Christmas to you...too...<br/>
`,
    );
  });

  spawnItem(ramos);
}

function spawnFifi() {
  const fifi = new Item(
    "fifi",
    "assets/anim_fifi.gif",
    "An angry-looking blonde toad-sheep thing",
    472,
    3812,
  );

  fifi.setGrabbable(false);
  fifi.setGrabbedCallback(() => {
    showDialoguePopup(
      "Fifi",
      "assets/img_fifi_closeup.png",
      "Fifi the Toad-Sheep",
      "Dr. Ramos! Respectfully, you're dumb and got bricks for brains!! You thought we were going to do WHAT? Dumb dumb silly dumb!",
      "What happened?",
      `
Oh what DIDN'T intern?! Dr. Brainiac over here FORGOT his birthday, got the size of a room on a report WRONG AND, bless his heart, thought we were going to KILL HIM???<br/>
I mean, for—we're doing SERIOUS research over here, right? But then he puts down that this room—THIS room, the one we're standing on—get this (I've got it written down here,)
<center>"occupies a 10 by 8 by <i>10000</i> meters area."</center><br/>
<br/>
SPOT THE ERROR INTERN!! I'll give you THREE CHANCES!!!!!<br/>
<br/>
You're 8 years my senior Dr. Ramos! How am I meant to look up to you if you can't even look up inside this room and realize maybe you dialed in the size wrong?<br/>
<br/>
<i>Dumb.</i>
`,
      "Merry Christmas!",
      "What? Sorry intern, I'm given my boss a talking to. Dr., respectfully, I'm surprised your weird coat is on the right side.",
    );
  });

  spawnItem(fifi);
}

function spawnTanner() {
  const tanner = new Item(
    "tanner",
    "assets/anim_tanner.gif",
    "A turtle in a suit",
    640,
    3812,
    64,
    128,
    1,
  );

  tanner.setGrabbable(false);
  tanner.setGrabbedCallback(() => {
    showDialoguePopup(
      "Tanner",
      "assets/img_tanner_closeup.png",
      "Tanner the Turtle",
      "...",
      "H-hey boss...",
      `
...hm? Oh, hello intern. How are you liking the party?<br/>
<br/>
...<br/>
<br/>
You know, I myself am not much for parties. But Dr. Ramos...for better or for worse,
he needed this. He works too hard that one.<br/>
<br/>
Sometimes too hard for his own good.
`,
      "Merry Christmas!",
      "I haven't the faintest idea of what that is. Some special occasion?",
    );
  });

  spawnItem(tanner);
}

function spawnDancer1() {
  const dancer_1 = new Item(
    "dancer_1",
    "assets/anim_dancer_1.gif",
    "A sock puppet guy breaking it down",
    720,
    3800,
    64,
    128,
    1,
  );

  dancer_1.setGrabbable(false);
  dancer_1.setGrabbedCallback(() => {
    showDialoguePopup(
      "Some Guy",
      "assets/img_dancer_1_closeup.png",
      "A wild, vaguely antropomorphic dancer",
      "WOO YEAH!!! PART-AY!!!!!",
      "What's up?",
      `
What's "up" is the new "down," man! You can't let 'em get you down!!<br/>
Dance 'till your heart stops, dance 'till the beat drops!!<br/>
You hearin' this? This BEAT?! Fresh, fresh! The glockenspiel is the new 808 man, I'm TELLING YOU!<br/>
<br/>
Ring ring! That's the sound of the police!!! Help!!! They are arresting me!!! They're taking me away...<br/>
...for being TOO GROOVY YEAAAAAAAAAHHH!!!!!!<br/>
Touch-tone! Touch-tone telephone!!<br/>
<br/>
(...)<br/>
<br/>
(He seems to be matching the beat by ondulating his shoulders...)
`,
      "Merry Christmas!",
      `
Marry? No thanks! I'm already married...to the DANCE FLOOR!<br/>
Call me ENGAGED the way I be ENGAGING IN SOME FUNKY STUFF on this here HARDWOOD PANELLIN'<br/>
<br/>
"X Miss?" Miss ME with that stuff MAN<br/>
<br/>
<i>...X</i><br/>
<br/>
But dude. Dudette. Dudaliciousness King. I'm not here to answer questions, DOG.<br/>
I'm only an ENCYCLOPEDIA when I be ENCYCLIN' the BEAT-O-PEDIA<br/>
<br/>
<i>...if you just so happen to be catchin' the drift (little toots I've been letting out the whole time)</i><br/>
<br/>
But yeah, man, ya gotta ask the PHONE. Just don't PHONE IT IN on DA DANCE FLOOR YEAHHHHHH.<br/>
<br/>
Give me an X!<br/>
Give me an M!<br/>
Give me an A!<br/>
Give me an S!<br/>
<br/>
ASK IT Dudevarious Jr. Ya gotta ASK IT! ASK IT!
`,
    );
  });

  spawnItem(dancer_1);
}

function spawnFrozenTombLink() {
  const frozen_tomb_link = new Item(
    "frozen_tomb_link",
    "",
    "Door to the frozen tomb",
    576,
    3700,
    142,
    168,
  );

  frozen_tomb_link.setGrabbable(false);
  frozen_tomb_link.setFirstGrabbedCallback(() => {
    window.location.href = "/scenes/30/";
  });

  spawnItem(frozen_tomb_link);
}

function addTombPartyZone() {
  const note = findItem("tomb_note");
  note.moveTo(448, 3232);

  addZone(
    "tomb_party",
    "All she ever wanted...",
    "assets/img_bg_tomb_party.png",
    "A big old party",
  );

  spawnDumas();
  spawnRamos();
  spawnFifi();
  spawnTanner();
  spawnDancer1();
  spawnFrozenTombLink();

  const bgm = new Audio("assets/mus_all_i_want.mp3");
  bgm.loop = true;
  bgm.volume = 0.0;

  bgm.play();

  window.addEventListener("scroll", () => {
    const normalized = Math.min(1.0, Math.max(0.0, window.scrollY / 3677.0));
    bgm.volume = (10.0 ** normalized - 1.0) / 9.0;
  });
}

function passwordSpook() {
  if (window.scrollY > 400) {
    return;
  }

  playAudio("assets/snd_mariah.mp3");
  clearInterval(passwordSpookIntervalID);

  destroyItem("tomb_door");
  addTombPartyZone();
}

function spawnTombNote() {
  const tomb_note = new Item(
    "tomb_note",
    "assets/img_sticky_note.png",
    "A sticky note",
    448,
    3072,
    null,
    null,
    1,
  );

  tomb_note.setGrabbable(false);
  tomb_note.setFirstGrabbedCallback(() => {
    const entranceImage = document.querySelector("#entrance .inner-image");
    entranceImage.setAttribute("src", "assets/img_bg_entrance_christmas.png");

    const entranceDescription = document.querySelector(
      "#entrance .inner-description",
    );
    entranceDescription.innerText = "Christmas";

    const topImage = document.querySelector("#reception_top .inner-image");
    topImage.setAttribute("src", "assets/img_bg_reception_top_christmas.png");

    const topDescription = document.querySelector(
      "#reception_top .inner-description",
    );
    topDescription.innerText = "For";

    const bottomImage = document.querySelector(
      "#reception_bottom .inner-image",
    );
    bottomImage.setAttribute(
      "src",
      "assets/img_bg_reception_bottom_christmas.png",
    );

    const bottomDescription = document.querySelector(
      "#reception_bottom .inner-description",
    );
    bottomDescription.innerText = "Want";

    const stairwellDescription = document.querySelector(
      "#stairwell .inner-description",
    );
    stairwellDescription.innerText = "I";

    const tombwaysDescription = document.querySelector(
      "#tombways .inner-description",
    );
    tombwaysDescription.innerText = "All";

    destroyItem("normal_paper");
    destroyItem("small_rock");
    destroyItem("entrance_button");
    destroyItem("bunker_hatch");
    destroyItem("keypad");
    destroyItem("safe_door");

    passwordSpookIntervalID = setInterval(passwordSpook, 1000);
  });
  tomb_note.setGrabbedCallback(() => {
    showTextPopup(
      "You forgot",
      `You forgot the<br/>
answer<br/>
<br/>
<br/>
up there.
`,
      "popup-sticky-note",
    );
  });

  spawnItem(tomb_note);
}

function spawnTombDoor() {
  const tomb_door = new Item(
    "tomb_door",
    "assets/img_tombways_door.png",
    "Wooden door",

    360,
    2940,
  );

  tomb_door.setGrabbable(false);

  spawnItem(tomb_door);
}

function addTombwaysZone() {
  addZone(
    "stairwell",
    "Further down...",
    "assets/img_bg_stairwell.png",
    "A scary stairwell...",
  );

  addZone(
    "tombways",
    "A door",
    "assets/img_bg_tombways.png",
    "A christmasy door in a tomb.",
  );

  spawnTombNote();
  spawnTombDoor();
}

function init() {
  spawnNormalPaper();
  spawnSmallRock();
  spawnEntranceButton();

  const closePopupButton = document.getElementById("popup-close");
  closePopupButton.onclick = () => {
    popup.close();

    if (popup.classList.contains(popupCustomClass)) {
      popup.classList.remove(popupCustomClass);
    }
  };
}

init();
