// input.js — keyboard + mouse state, edge-triggered presses.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, worldX: 0, worldY: 0 };
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
      this.mouse.clicked = true;
    });
  }
  down(...names) { return names.some((n) => this.keys.has(n)); }
  wasPressed(...names) { return names.some((n) => this.pressed.has(n)); }
  axis() {
    let x = 0; let y = 0;
    if (this.down('a', 'arrowleft')) x -= 1;
    if (this.down('d', 'arrowright')) x += 1;
    if (this.down('w', 'arrowup')) y -= 1;
    if (this.down('s', 'arrowdown')) y += 1;
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len, moving: x !== 0 || y !== 0 };
  }
  sneak() { return this.down('shift'); }
  interact() { return this.down('e'); }
  endFrame() { this.pressed.clear(); this.mouse.clicked = false; }
}
