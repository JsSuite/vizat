import Canvas from "./Canvas";

class Wrapper {
  constructor(id, config = {}) {
    this.__wrapper = document.getElementById(id);

    if (!(this.__wrapper instanceof HTMLElement)) {
      return console.warn(
        `[REDRAW] - Warning - There is no DOM element with ID ${id}`
      );
    }

    this.__wrapper.style.height = config.height || "873px";
    this.__wrapper.style.width = config.width || "1440px";
    this.__wrapper.style.background = config.background || "transparent";
  }

  add(canvas) {
    if (!(canvas instanceof Canvas)) {
      return console.error(
        `[REDRAW] - Error - The provided item is not of Redraw Canvas type.`
      );
    }

    if (this.__wrapper instanceof HTMLElement) {
      const addingCanvas = canvas.getCanvas();
      this.__wrapper.appendChild(addingCanvas);
    }
  }
}

export default Wrapper;
