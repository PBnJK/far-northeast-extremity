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

function showImagePopup(title, url, alt, description) {
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

  const dialog = document.getElementById("popup");
  dialog.showModal();
}

function showCustomPopup(title, html) {
  const e = clearPopup();
  e.innerHTML = html;

  const h2 = document.createElement("h2");
  h2.innerHTML = title;
  h2.id = "popup-title";
  h2.classList.add("national-park");

  e.prepend(h2);

  const dialog = document.getElementById("popup");
  dialog.showModal();
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
  audio.play();
}

function spawnItem(item) {
  items.set(item.id, item);
}

function destroyItem(id) {
  const e = findItem(id);
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

function spawnFrozenTombSign() {
  const frozen_tomb_sign = new Item(
    "frozen_tomb_sign",
    "assets/img_frozen_tomb_sign.png",
    'A sign. It reads: "Frozen Tomb," with a red arrow pointing left',
    176,
    320,
    180,
    180,
  );

  frozen_tomb_sign.setGrabbable(false);
  frozen_tomb_sign.setFirstGrabbedCallback(() => {
    window.location.href = "/scenes/30/";
  });

  spawnItem(frozen_tomb_sign);
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
Don't look at the date on yesterday's either.<br/>
If you get any more memos with my name on them, they're not me.<br/><br/>

You're all officially discharged and are urged to leave immediately.<br/><br/>

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
      "Results of",
      `worrying
`,
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
  "-1874797587": [
    `
— Hello, you've probably dialed...<br/>
— ...<br/>
— ...no, you know what? You know how many people called me just <i>this week?</i><br/>
— I can't take this anymore. I-I <i>won't</i> take this anymore!<br/>
— I'm gonna go live in the woods! Goodbye, modern world! You were lost the moment we invented a way to be prank-called.<br/>
— Thank you! Goodbye.<br/>
`,
    `
Beep beep...the owner of the number you're trying to wish has "gone ga-ga"<br/>
You may find him "living with the squirrels away from the evil phone."
`,
  ],
  "-1986815161": "Ouch! The phone zapped you...",
  1585645585: `
— Hello! You're reaching us because you're a forgetful oaf?<br/>
— Don't answer that, Toby. You just don't forget your head because it's attached to your neck, you know?<br/>
— Any way, Tanner got on my case about the previous message where I just told you the password, so...<br/>
— ...not doing that again! Figure it out yourself!<br/>
— Hope you have a <i>wonderful</i> time waffling around on the clock for the password!
`,
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
      `<form id="form-dial" onsubmit="return handleDial();">
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
      console.log("dial-" + i);
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
    spawnTelephone();
  });
  sticky_note.setGrabbedCallback(() => {
    showTextPopup(
      "Toby!",
      `If you forget the keycode...<br/>
...just trawl over the corners of your mind and you'll remember it.<br/><br/>
(on the back)<br/>
Tanner's been all over me with this op-sec stuff, says I'm on thin ice<br/>
So throw this out when you read it! Seriously!!!
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
  keypad.setGrabbedCallback(() => {});

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
  const clock = new Item("clock", "", "A clock", 248, 1550, 88, 80);

  clock.setGrabbable(false);
  clock.setGrabbedCallback(() => {
    showImagePopup(
      "Clock",
      "assets/img_clock_popup.png",
      "Clock with the hour hand pointing to six, minute hand to one and second hand to zero",
      `
The sun never sets on the far northeast, so you suppose a clock is useful to have.<br/>
But time must have really snuck up on you...when did it get so late?`,
    );
  });
}

function addBunkerReceptionZone() {
  spawnBunkerHatch();
  playAudio("assets/snd_clue_stinger.mp3");

  /* In case they didn't pull off the sign paper */
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
}

function handleDial() {
  return false;
}

function init() {
  spawnNormalPaper();
  spawnFrozenTombSign();
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
