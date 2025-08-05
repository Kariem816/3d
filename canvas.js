const canvas = document.getElementById("canvas");
if (!canvas) throw new Error("Where tf is the canvas?!");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("CTX???!!!");
ctx.textBaseline = "top";