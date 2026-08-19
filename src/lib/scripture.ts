import type { Locale } from "@/i18n/locale";

/** bible.com (YouVersion) version IDs per locale  -  NL uses the
 *  Statenvertaling, EN uses the King James Version, matching how this
 *  app's own source texts are quoted (SV-tekst / KJV throughout).
 *  IDs and abbreviations verified against bible.com's own URLs (e.g.
 *  bible.com/bible/165/MAT.7.7.STV, bible.com/bible/1/GEN.1.KJV)  -  the
 *  `/{locale}/` path prefix alone is NOT reliable for picking the
 *  translation, it only affects bible.com's UI chrome language and can
 *  still land on an unrelated version (seen serving Portuguese NVI).
 *  The `.{abbr}` suffix is what actually pins the translation. */
const BIBLE_VERSION: Record<Locale, { id: number; abbr: string }> = {
  nl: { id: 165, abbr: "STV" }, // Statenvertaling (Importantia editie)
  en: { id: 1, abbr: "KJV" }, // King James Version
};

/** Maps every book-name spelling (full and abbreviated, NL and EN) that
 *  appears in this app's structure data to its bible.com book code.
 *  Keys are matched case-sensitively as they appear in the source text,
 *  longest-first so e.g. "1 Kronieken" doesn't get shadowed by "Kron.". */
const BOOK_CODES: Record<string, string> = {
  // Genesis
  Genesis: "GEN",
  "Gen.": "GEN",
  // Exodus
  Exodus: "EXO",
  "Ex.": "EXO",
  // Leviticus
  Leviticus: "LEV",
  "Lev.": "LEV",
  // Numbers / Numeri
  Numbers: "NUM",
  Numeri: "NUM",
  "Num.": "NUM",
  // Deuteronomy / Deuteronomium
  Deuteronomy: "DEU",
  Deuteronomium: "DEU",
  "Deut.": "DEU",
  // Joshua / Jozua
  Joshua: "JOS",
  Jozua: "JOS",
  "Josh.": "JOS",
  "Joz.": "JOS",
  // Samuel
  "1 Samuel": "1SA",
  "2 Samuel": "2SA",
  "1 Sam.": "1SA",
  "2 Sam.": "2SA",
  // Kings / Koningen
  "1 Kings": "1KI",
  "2 Kings": "2KI",
  "1 Koningen": "1KI",
  "2 Koningen": "2KI",
  "1 Kon.": "1KI",
  "2 Kon.": "2KI",
  // Chronicles / Kronieken
  "1 Chronicles": "1CH",
  "2 Chronicles": "2CH",
  "1 Kronieken": "1CH",
  "2 Kronieken": "2CH",
  "1 Chron.": "1CH",
  "2 Chron.": "2CH",
  "1 Kron.": "1CH",
  "2 Kron.": "2CH",
  // Ezra
  Ezra: "EZR",
  // Psalm(s)
  Psalm: "PSA",
  Psalms: "PSA",
  // Isaiah / Jesaja
  Isaiah: "ISA",
  Jesaja: "ISA",
  "Isa.": "ISA",
  "Jes.": "ISA",
  // Ezekiel / Ezechiël
  Ezekiel: "EZK",
  "Ezechiël": "EZK",
  "Ezek.": "EZK",
  "Ezech.": "EZK",
  // Zechariah / Zacharia
  Zechariah: "ZEC",
  Zacharia: "ZEC",
  // Matthew / Matteüs
  Matthew: "MAT",
  "Matteüs": "MAT",
  "Mattheüs": "MAT",
  "Matt.": "MAT",
  // Mark / Markus
  Mark: "MRK",
  Markus: "MRK",
  "Mark.": "MRK",
  // Luke / Lukas
  Luke: "LUK",
  Lukas: "LUK",
  "Luk.": "LUK",
  // John / Johannes
  John: "JHN",
  Johannes: "JHN",
  "Joh.": "JHN",
  // Acts / Handelingen
  Acts: "ACT",
  Handelingen: "ACT",
  "Hand.": "ACT",
  // Romans / Romeinen
  Romans: "ROM",
  Romeinen: "ROM",
  "Rom.": "ROM",
  // Hebrews / Hebreeën
  Hebrews: "HEB",
  "Hebreeën": "HEB",
  "Heb.": "HEB",
  "Hebr.": "HEB",
  // Revelation / Openbaring
  Revelation: "REV",
  Openbaring: "REV",
  "Rev.": "REV",
  "Openb.": "REV",
};

const BOOK_NAMES = Object.keys(BOOK_CODES).sort((a, b) => b.length - a.length);

/** Matches "<Book> <chapter>:<verse>" or "<Book> <chapter>:<verse>-<verse>",
 *  book name drawn from BOOK_NAMES (escaped, longest-first so multi-word
 *  and numbered-prefix names win over their shorter abbreviations). */
const REFERENCE_RE = new RegExp(
  `\\b(${BOOK_NAMES.map((n) => n.replace(/[.]/g, "\\.")).join("|")}) (\\d+):(\\d+)(?:-(\\d+))?`,
  "g",
);

export interface ScriptureMatch {
  start: number;
  end: number;
  /** Ready-to-use bible.com URL for this reference, in the given locale. */
  url: string;
}

/** Scans `text` for Bible references (e.g. "Genesis 2:15", "Gen. 3:14-19")
 *  and returns their positions plus a bible.com deep link in the
 *  translation this app quotes for that locale (SV for nl, KJV for en).
 *  Only verse *ranges* link to their first verse  -  bible.com addresses
 *  single verses, not spans. */
export function findScriptureReferences(text: string, locale: Locale): ScriptureMatch[] {
  const { id, abbr } = BIBLE_VERSION[locale];
  const matches: ScriptureMatch[] = [];
  REFERENCE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = REFERENCE_RE.exec(text))) {
    const [full, book, chapter, verse] = m;
    const code = BOOK_CODES[book];
    if (!code) continue;
    matches.push({
      start: m.index,
      end: m.index + full.length,
      url: `https://www.bible.com/bible/${id}/${code}.${chapter}.${verse}.${abbr}`,
    });
  }
  return matches;
}
