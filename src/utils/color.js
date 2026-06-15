const cssColorToInt = (value) => {
  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  const sentinel = "rgb(1, 2, 3)";
  ctx.fillStyle = sentinel;
  ctx.fillStyle = value;

  if (ctx.fillStyle === sentinel) {
    return null;
  }

  const parsed = Phaser.Display.Color.ValueToColor(ctx.fillStyle);
  return typeof parsed?.color === "number" ? parsed.color : null;
};

export const normalizeColor = (color, fallback = 0xffffff) => {
  if (typeof color === "number" && Number.isFinite(color)) {
    return color;
  }

  if (typeof color === "string") {
    const trimmed = color.trim();
    if (!trimmed) {
      return fallback;
    }

    const lower = trimmed.toLowerCase();

    if (lower.startsWith("0x")) {
      const intValue = Number.parseInt(lower.slice(2), 16);
      if (Number.isFinite(intValue)) {
        return intValue;
      }
    }

    if (trimmed.startsWith("#")) {
      const parsedHex = Phaser.Display.Color.HexStringToColor(trimmed);
      if (typeof parsedHex?.color === "number") {
        return parsedHex.color;
      }
    }

    const cssInt = cssColorToInt(trimmed);
    if (typeof cssInt === "number") {
      return cssInt;
    }

    const parsed = Phaser.Display.Color.ValueToColor(trimmed);
    if (typeof parsed?.color === "number" && (parsed.color !== 0x000000 || lower === "black" || lower === "#000" || lower === "#000000")) {
      return parsed.color;
    }

    const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    const hexParsed = Phaser.Display.Color.HexStringToColor(withHash);
    return typeof hexParsed?.color === "number" ? hexParsed.color : fallback;
  }

  if (typeof color === "object" && color !== null && typeof color.color === "number") {
    return color.color;
  }

  return fallback;
};
