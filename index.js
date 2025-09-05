/* The script
 *
 */

class Item {
  offsetX = 0;
  offsetY = 0;

  constructor(element) {
    element.onmousedown = this.startDragging;
    element.onmouseup = this.stopDragging;
    this.element = element;
  }

  startDragging(e) {
    e.preventDefault();

    this.offsetX = e.clientX - this.element.getBoundingClientRect().left;
    this.offsetY = e.clientY - this.element.getBoundingClientRect().top;
    this.element.classList.add("dragging");

    document.addEventListener("mousemove", this.dragElement);
  }

  dragElement(e) {
    e.preventDefault();

    const x = e.clientX - this.offsetX;
    const y = e.clientY - this.offsetY;

    this.element.style.left = x + "px";
    this.element.style.top = y + "px";
  }

  stopDragging() {
    this.element.classList.remove("dragging");
    document.removeEventListener("mousemove", this.dragElement);
  }
}
