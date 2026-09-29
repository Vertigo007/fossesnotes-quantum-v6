// Text similarity helpers used to decide which Marketplace listings are
// "the same item" as ours. Deliberately dependency-free so it can run on
// the server and be copied into the extension if needed.

const STOPWORDS = new Set([
  // fr
  'a', 'au', 'aux', 'avec', 'de', 'des', 'du', 'en', 'et', 'la', 'le', 'les',
  'pour', 'sur', 'un', 'une', 'ou', 'tres', 'bon', 'bonne', 'etat', 'neuf',
  'neuve', 'vendre', 'vend', 'a vendre', 'comme', 'plus', 'tout', 'tous',
  // en
  'the', 'and', 'for', 'with', 'of', 'in', 'on', 'or', 'new', 'used', 'good',
  'great', 'condition', 'sale', 'like', 'excellent', 'mint', 'obo',
]);

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(text) {
  return normalize(text)
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Tokens containing digits (model numbers, sizes, storage) are strong
// identity signals: "iphone 13" vs "iphone 14" must not match.
function isStrong(token) {
  return /\d/.test(token) && token.length >= 2;
}

/**
 * Weighted Jaccard similarity in [0, 1]. Strong (alphanumeric) tokens weigh
 * 3x, and a mismatch on strong tokens present in both titles is penalised.
 */
export function titleSimilarity(a, b) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  const w = (t) => (isStrong(t) ? 3 : 1);
  let inter = 0;
  let union = 0;
  for (const t of new Set([...ta, ...tb])) {
    const weight = w(t);
    union += weight;
    if (ta.has(t) && tb.has(t)) inter += weight;
  }
  let score = inter / union;
  const strongA = [...ta].filter(isStrong);
  const strongB = [...tb].filter(isStrong);
  if (strongA.length && strongB.length && !strongA.some((t) => tb.has(t))) {
    score *= 0.4;
  }
  return Math.round(score * 1000) / 1000;
}

/** Best similarity of a candidate title against several reference queries. */
export function bestSimilarity(candidate, references) {
  return references.reduce((best, ref) => Math.max(best, titleSimilarity(candidate, ref)), 0);
}
