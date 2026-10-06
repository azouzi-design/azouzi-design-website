export const SITE_URL = "https://www.azouzi.design";
export const SITE_NAME = "Azouzi.design";
// Space + non-breaking space on both sides of the dash: browsers collapse runs
// of plain spaces in a title, but not a no-break space.
export const SEP = " \u00a0⚉\u00a0 ";
export const SITE_TITLE = `Ahmed A. Azouzi${SEP}Design Partner for AI Founders`;
export const SITE_DESCRIPTION =
  "Senior-level design at a fraction of what an agency or a full-time hire would cost";
export const OG_ALT =
  "Ahmed A. Azouzi — senior-level design at a fraction of what an agency or a full-time hire would cost.";
/** The page background, used for the browser UI color and the manifest. */
export const THEME_COLOR = "#f6f6f6";

/** A meta description from an intro paragraph: whole sentences, 160 characters at most. */
export function describe(paragraph: string) {
  const text = paragraph.replace(/ /g, " ");
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [text];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > 160) break;
    out += sentence;
  }
  return (out || sentences[0]).trim();
}
