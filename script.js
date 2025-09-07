/* The script
 *
 * Thanks to:
 * - https://dev.to/code_passion/creating-a-draggable-element-using-html-css-and-javascript-54g7 (dragging code)
 */

"use strict";

const items = [];

const main = document.getElementById("main");

const itemsDiv = document.getElementById("items");
const itemsDivRect = itemsDiv.getBoundingClientRect();

const popup = document.getElementById("popup");

const BASE_WINDOW_WIDTH = 1280;
const BASE_WINDOW_HEIGHT = 720;

class Item {
  constructor(id, url, alt, x, y, w, h, z = 0) {
    this.id = id;

    this.oldWindowInnerWidth = window.innerWidth;

    this.posX = 0;
    this.posY = 0;

    this.offsetX = 0;
    this.offsetY = 0;

    /* Flags */
    this.flagGrabbed = false;
    this.flagGrabbable = true;
    this.flagFirstGrabbed = false;
    this.flagFirstDropped = false;

    /* Callbacks */
    this.firstGrabbedCallback = null;
    this.firstDroppedCallback = null;

    this.grabbedCallback = null;
    this.droppedCallback = null;

    this.hoverCallback = () => {};

    this.scrollCallback = () => {
      if (!this.flagGrabbed) {
        return;
      }

      const e = this.element ?? this.getElement();

      this.posY += window.screenY;
      e.style.top = this.posY + "px";
    };

    this.startDragging = (e) => {
      e.preventDefault();

      if (!this.flagFirstGrabbed) {
        this.flagFirstGrabbed = true;
        this.firstGrabbedCallback?.();
      }

      this.grabbedCallback?.();
      if (this.flagGrabbable) {
        this.element = this.getElement();

        const rect = this.element.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - window.scrollY - rect.top;
        this.element.classList.add("dragging");

        document.addEventListener("mousemove", this.dragElement);
      }
    };

    this.dragElement = (e) => {
      e.preventDefault();

      this.flagGrabbed = true;

      this.posX = e.clientX - this.offsetX;
      this.posY = e.clientY - this.offsetY;

      this.element.style.left = this.posX + "px";
      this.element.style.top = this.posY + "px";
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

    this.create(id, url, alt, itemsDiv, w, h, z);

    this.moveTo(x + itemsDivRect.left, y + itemsDivRect.top);
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

    window.addEventListener("resize", () => {
      const e = this.element ?? this.getElement();
      const rect = e.getBoundingClientRect();

      const oldX = rect.left;
      const w = window.innerWidth - this.oldWindowInnerWidth;
      const newX = w / 2 + oldX;

      this.oldWindowInnerWidth = window.innerWidth;
      this.moveTo(newX, rect.top);
    });

    window.addEventListener("scroll", this.scrollCallback);

    under.appendChild(div);
  }

  moveTo(x, y) {
    const e = this.element ?? this.getElement();

    this.offsetX = x;
    this.offsetY = y + window.screenY;

    this.posX = this.offsetX = x;
    this.posY = this.offsetY = y + window.screenY;

    e.style.left = this.offsetX + "px";
    e.style.top = this.offsetY + "px";
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

function showTextPopup(title, description) {
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

  const dialog = document.getElementById("popup");
  dialog.showModal();
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
  items.push(item);
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

function spawnPottedPlantKey() {
  const potted_plant_key = new Item(
    "potted_plant_key",
    "assets/img_potted_plant_key.png",
    "A dirty key",
    224,
    1162,
  );

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
  keypad.setGr;

  spawnItem(keypad);
}

function spawnSafeDoor() {}

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
  spawnPottedPlant();
  spawnKeypad();
  spawnSafeDoor();
}

function init() {
  spawnNormalPaper();
  spawnFrozenTombSign();
  spawnSmallRock();
  spawnEntranceButton();

  const closePopupButton = document.getElementById("popup-close");
  closePopupButton.onclick = () => {
    popup.close();
  };
}

init();
