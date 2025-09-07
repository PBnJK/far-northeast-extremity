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
    img.setAttribute("src", url);
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

function addZone(description, url, alt) {
  const div = document.createElement("div");
  div.classList.add("zone");

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

function addBunkerReceptionZone() {
  spawnBunkerHatch();
  playAudio("assets/snd_clue_stinger.mp3");
  addZone(
    "Woah...",
    "assets/img_bg_reception_top.png",
    "A quaint little reception area. There's a desk and everything.",
  );
}

function init() {
  spawnNormalPaper();
  spawnFrozenTombSign();
  spawnSmallRock();
  spawnEntranceButton();
}

init();
