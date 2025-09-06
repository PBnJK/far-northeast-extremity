/* The script
 *
 * Thanks to:
 * - https://dev.to/code_passion/creating-a-draggable-element-using-html-css-and-javascript-54g7 (dragging code)
 */

"use strict";

const main = document.getElementById("main");

class Item {
  constructor(id, url, alt, x, y, w, h, z = 0) {
    this.id = id;

    this.oldWindowInnerWidth = window.innerWidth;

    this.offsetX = 0;
    this.offsetY = 0;

    /* Flags */
    this.flagGrabbable = true;
    this.flagFirstGrabbed = false;
    this.flagFirstDropped = false;

    /* Callbacks */
    this.firstGrabbedCallback = null;
    this.firstDroppedCallback = null;

    this.grabbedCallback = null;
    this.droppedCallback = null;

    this.startDragging = (e) => {
      e.preventDefault();

      if (!this.flagFirstGrabbed) {
        this.flagFirstGrabbed = true;
        this.firstGrabbedCallback?.();
      }

      this.grabbedCallback?.();
      if (this.flagGrabbable) {
        this.element = this.getElement();

        this.offsetX = e.clientX - this.element.getBoundingClientRect().left;
        this.offsetY = e.clientY - this.element.getBoundingClientRect().top;
        this.element.classList.add("dragging");

        document.addEventListener("mousemove", this.dragElement);
      }
    };

    this.dragElement = (e) => {
      e.preventDefault();

      const x = e.clientX - this.offsetX;
      const y = e.clientY - this.offsetY;

      this.element.style.left = x + "px";
      this.element.style.top = y + "px";
    };

    this.stopDragging = () => {
      if (!this.flagFirstDropped) {
        this.flagFirstDropped = true;
        this.firstDroppedCallback?.();
      }

      this.droppedCallback?.();

      document.removeEventListener("mousemove", this.dragElement);
      this.element = null;
    };

    this.create(id, url, alt, main, w, h, z);
    this.moveTo(x, y);
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

    window.addEventListener("resize", () => {
      console.log("CALLED");
      const e = this.element ?? this.getElement();
      const rect = e.getBoundingClientRect();

      const oldX = rect.left;
      const w = window.innerWidth - this.oldWindowInnerWidth;
      const newX = w / 2 + oldX;

      this.oldWindowInnerWidth = window.innerWidth;
      this.moveTo(newX, rect.top);
    });

    under.appendChild(div);
  }

  moveTo(x, y) {
    const e = this.element ?? this.getElement();

    this.offsetX = x;
    this.offsetY = y;

    e.style.left = this.offsetX + "px";
    e.style.top = this.offsetY + "px";
  }

  setGrabbable(grabbable) {
    this.flagGrabbable = grabbable;
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

  getElement() {
    return document.getElementById(this.id);
  }
}

const items = [];

function spawnItem(item) {
  items.push(item);
}

function spawnNormalPaper() {
  const normal_paper = new Item(
    "normal_paper",
    "assets/img_normal_paper.png",
    'A taped sheet of paper. It reads: "normal boring place, no secrets!"',
    992,
    528,
    320,
    120,
  );

  normal_paper.setFirstGrabbedCallback(() => {
    window.setTimeout(() => {
      const stinger = new Audio("assets/snd_dramatic_stinger.mp3");
      stinger.play();
    }, 500);
  });

  spawnItem(normal_paper);
}

function spawnFrozenTombSign() {
  const frozen_tomb_sign = new Item(
    "frozen_tomb_sign",
    "assets/img_frozen_tomb_sign.png",
    'A sign. It reads: "Frozen Tomb," with a red arrow pointing left',
    600,
    480,
    180,
    180,
  );

  frozen_tomb_sign.setGrabbable(false);
  frozen_tomb_sign.setFirstGrabbedCallback(() => {
    window.location.href = "/scenes/30/";
  });

  spawnItem(frozen_tomb_sign);
}

function init() {
  spawnNormalPaper();
  spawnFrozenTombSign();
}

init();
