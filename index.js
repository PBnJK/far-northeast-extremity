/* The script
 *
 * Thanks to:
 * - https://dev.to/code_passion/creating-a-draggable-element-using-html-css-and-javascript-54g7 (dragging code)
 */

"use strict";

class Item {
  constructor(id, url, alt, under, x, y, w, h, z = 0) {
    this.id = id;

    /* Flags */
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

      this.element = this.getElement();

      this.offsetX = e.clientX - this.element.getBoundingClientRect().left;
      this.offsetY = e.clientY - this.element.getBoundingClientRect().top;
      this.element.classList.add("dragging");

      document.addEventListener("mousemove", this.dragElement);
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

    this.create(id, url, alt, under, w, h, z);
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

    under.appendChild(div);
  }

  moveTo(x, y) {
    const e = this.element ?? this.getElement();

    this.offsetX = x;
    this.offsetY = y;

    e.style.left = this.offsetX + "px";
    e.style.top = this.offsetY + "px";
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

const i = new Item(
  "tomb_key",
  "assets/img_tomb_key.png",
  "An icy key",
  document.getElementById("pivot"),
  600,
  400,
  64,
  64,
);
