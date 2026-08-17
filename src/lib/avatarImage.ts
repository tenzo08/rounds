export const AVATAR_SIZE = 160;

export function downscaleToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image"));
        return;
      }
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Couldn't read that image file"));
    };
    img.src = objectUrl;
  });
}

// Preset icon choices for students who'd rather not upload a photo — each is
// rendered client-side onto a canvas (emoji over a flat color) and exported
// the same way an uploaded picture is, so the server never needs to know
// the difference.
export const AVATAR_ICONS: { emoji: string; color: string }[] = [
  { emoji: "🩺", color: "#4A7C59" },
  { emoji: "💊", color: "#6B5B95" },
  { emoji: "🌡️", color: "#3B6E8F" },
  { emoji: "❤️", color: "#C4547D" },
  { emoji: "🧠", color: "#3A8F8C" },
  { emoji: "🩹", color: "#B33A3A" },
  { emoji: "📋", color: "#8A9199" },
  { emoji: "⚕️", color: "#1E2823" },
];

export function renderIconToDataUrl(emoji: string, color: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(AVATAR_SIZE / 2, AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `${AVATAR_SIZE * 0.55}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, AVATAR_SIZE / 2, AVATAR_SIZE / 2 + AVATAR_SIZE * 0.03);
  return canvas.toDataURL("image/png");
}
