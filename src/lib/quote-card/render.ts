/**
 * Client-side quote-card renderer.
 *
 * Composites:
 *   - background image (object-cover scaled to 1080×1920)
 *   - dark gradient at the bottom for legibility
 *   - quote text in a serif weight, white, bottom-third, centered
 *   - subtle @SetsandStruggles label at the very bottom
 *
 * Returns a Blob (PNG) the caller can download or hand to the FS API.
 */
import {
  QUOTE_CARD_HEIGHT,
  QUOTE_CARD_WIDTH,
  QUOTE_BRAND_LABEL,
} from "@/data/quote-seeds";

export interface RenderQuoteCardOptions {
  quote: string;
  backgroundUrl?: string;
  /** Override label, defaults to QUOTE_BRAND_LABEL. */
  label?: string;
}

const HORIZONTAL_PADDING = 96;
const QUOTE_FONT_FAMILY = '"Georgia", "Times New Roman", serif';
const LABEL_FONT_FAMILY = '"Helvetica Neue", "Inter", sans-serif';

/** Load an Image element, resolving when it's fully decoded. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

/**
 * Wrap text into lines that fit within `maxWidth` at the given font.
 * Used to keep long quotes readable instead of overflowing the canvas.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Pick a quote font size that lets the wrapped text fit in the bottom-third
 * "text zone" of the card. Starts large and steps down until it fits.
 */
function fitQuote(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
): { size: number; lines: string[]; lineHeight: number } {
  const sizes = [108, 96, 84, 76, 68, 60, 54, 48];
  for (const size of sizes) {
    ctx.font = `italic 600 ${size}px ${QUOTE_FONT_FAMILY}`;
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = Math.round(size * 1.2);
    const totalHeight = lineHeight * lines.length;
    if (totalHeight <= maxHeight) {
      return { size, lines, lineHeight };
    }
  }
  // Fallback: tightest size, allow overflow.
  const size = sizes[sizes.length - 1];
  ctx.font = `italic 600 ${size}px ${QUOTE_FONT_FAMILY}`;
  return {
    size,
    lines: wrapText(ctx, text, maxWidth),
    lineHeight: Math.round(size * 1.2),
  };
}

export async function renderQuoteCard(
  opts: RenderQuoteCardOptions,
): Promise<Blob> {
  const { quote, backgroundUrl, label = QUOTE_BRAND_LABEL } = opts;

  const canvas = document.createElement("canvas");
  canvas.width = QUOTE_CARD_WIDTH;
  canvas.height = QUOTE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // 1. Background. Either painted from an image or a solid dark fallback.
  if (backgroundUrl) {
    try {
      const img = await loadImage(backgroundUrl);
      // Object-cover: scale to cover the full canvas, crop overflow.
      const scale = Math.max(
        QUOTE_CARD_WIDTH / img.width,
        QUOTE_CARD_HEIGHT / img.height,
      );
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const dx = (QUOTE_CARD_WIDTH - drawW) / 2;
      const dy = (QUOTE_CARD_HEIGHT - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
    } catch {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, QUOTE_CARD_WIDTH, QUOTE_CARD_HEIGHT);
    }
  } else {
    // No background yet — solid black with a faint vignette so the card
    // looks intentional rather than empty.
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, QUOTE_CARD_WIDTH, QUOTE_CARD_HEIGHT);
  }

  // 2. Dark gradient at the bottom for legibility behind the text.
  const gradient = ctx.createLinearGradient(
    0,
    QUOTE_CARD_HEIGHT * 0.4,
    0,
    QUOTE_CARD_HEIGHT,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.5, "rgba(0,0,0,0.55)");
  gradient.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, QUOTE_CARD_WIDTH, QUOTE_CARD_HEIGHT);

  // 3. Quote text, fitted into the bottom-third.
  const textZoneTop = QUOTE_CARD_HEIGHT * 0.55;
  const textZoneBottom = QUOTE_CARD_HEIGHT - 220; // reserve room for the label
  const textZoneHeight = textZoneBottom - textZoneTop;
  const maxTextWidth = QUOTE_CARD_WIDTH - HORIZONTAL_PADDING * 2;

  const { lines, lineHeight } = fitQuote(
    ctx,
    quote,
    maxTextWidth,
    textZoneHeight,
  );

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // Soft shadow under the text — a thin one, just for separation, not drama.
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  const totalTextHeight = lineHeight * lines.length;
  const startY = textZoneTop + (textZoneHeight - totalTextHeight) / 2 + lineHeight;
  const centerX = QUOTE_CARD_WIDTH / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], centerX, startY + i * lineHeight);
  }

  // Reset shadow before drawing the label.
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 4. Brand label, small, all-caps tracked, near the bottom.
  ctx.font = `500 28px ${LABEL_FONT_FAMILY}`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  // Hand-spaced letter-spacing because Canvas API doesn't support it natively.
  const labelText = label.toUpperCase();
  const trackedLabel = labelText.split("").join("\u2009"); // thin space between letters
  ctx.fillText(trackedLabel, centerX, QUOTE_CARD_HEIGHT - 96);

  // 5. Hairline divider above the label, very subtle.
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 80, QUOTE_CARD_HEIGHT - 132);
  ctx.lineTo(centerX + 80, QUOTE_CARD_HEIGHT - 132);
  ctx.stroke();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/png",
      0.95,
    );
  });
}
