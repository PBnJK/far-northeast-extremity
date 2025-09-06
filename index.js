/* The script
 *
 * Thanks to:
 * - https://dev.to/code_passion/creating-a-draggable-element-using-html-css-and-javascript-54g7 (dragging code)
 */

class Item {
  constructor(id, url, alt, under, x, y, w, h) {
    this.offsetX = x;
    this.offsetY = y;
    this.id = id;

    this.startDragging = (e) => {
      e.preventDefault();

      console.log("start drag");
      this.element = document.getElementById(this.id);

      this.offsetX = e.clientX - this.element.getBoundingClientRect().left;
      this.offsetY = e.clientY - this.element.getBoundingClientRect().top;
      this.element.classList.add("dragging");

      document.addEventListener("mousemove", this.dragElement);
    };

    this.dragElement = (e) => {
      e.preventDefault();
      console.log("drag element");

      const x = e.clientX - this.offsetX;
      const y = e.clientY - this.offsetY;

      this.element.style.left = x + "px";
      this.element.style.top = y + "px";
    };

    this.stopDragging = () => {
      this.element.classList.remove("dragging");
      document.removeEventListener("mousemove", this.dragElement);

      this.element = null;
    };

    this.create(id, url, alt, under, w, h);
  }

  create(id, url, alt, under, w, h) {
    const div = document.createElement("div");
    div.id = id;
    div.classList.add("item");

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
}

const i = new Item(
  "tomb_key",
  "assets/img_tomb_key.png",
  "An icy key",
  document.getElementById("pivot"),
  0,
  0,
  64,
  64,
);
