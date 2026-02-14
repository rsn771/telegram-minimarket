/**
 * Обрезает строку до maxChars символов, ставит «…» только после пробела (не режет слово).
 */
export function truncateAtWord(text: string, maxChars: number): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  if (t.length <= maxChars) return t;
  const s = t.slice(0, maxChars);
  const nextChar = t[maxChars];
  if (!nextChar || nextChar === " ") return s.trimEnd() + "…";
  const lastSpace = s.lastIndexOf(" ");
  if (lastSpace === -1) return s + "…";
  return s.slice(0, lastSpace).trimEnd() + "…";
}

/**
 * Обрезает текст до двух строк: первая до firstLineMax символов (перенос после пробела),
 * вторая — остаток до totalMax символов (тоже по пробелу). Возвращает строку с \n между строками.
 */
export function truncateToTwoLines(
  text: string,
  firstLineMax: number,
  totalMax: number
): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  if (t.length <= firstLineMax) return t;

  const firstChunk = t.slice(0, firstLineMax);
  let line1End = firstChunk.lastIndexOf(" ");
  if (line1End === -1) line1End = firstLineMax;
  const line1 = t.slice(0, line1End).trimEnd();
  const rest = t.slice(line1End).trim();
  if (!rest) return line1;

  const secondLineMax = totalMax - line1.length;
  if (rest.length <= secondLineMax) return line1 + "\n" + rest;

  const s = rest.slice(0, secondLineMax);
  const lastSpace = s.lastIndexOf(" ");
  const line2 = lastSpace === -1 ? s + "…" : s.slice(0, lastSpace).trimEnd() + "…";
  return line1 + "\n" + line2;
}
