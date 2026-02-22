const INAPPROPRIATE_WORDS = [
  // Profanity / slurs
  "fuck", "fucker", "fucking", "fucked", "fck", "fuk",
  "shit", "shitty", "sh1t",
  "bitch", "b1tch", "btch",
  "ass", "asshole", "a$$hole",
  "dick", "d1ck",
  "hoe", "ho3",
  "slut", "whore", "skank",
  "cunt", "c*nt",
  "damn", "dammit",
  "bastard",
  "retard", "retarded",
  "stfu", "gtfo", "kys", "wtf", "lmfao",
  "nigga", "nigger", "n1gga", "n1gger",
  "fag", "faggot",
  "cracker",
  "spic", "chink", "gook",
  "tranny",
];

const INAPPROPRIATE_PHRASES: RegExp[] = [
  // Alcohol / drugs
  /let'?s?\s+(get\s+)?drunk/i,
  /let'?s?\s+go\s+drink(ing)?/i,
  /lets\s+go\s+drink(ing)?/i,
  /get\s+wasted/i,
  /get\s+hammered/i,
  /let'?s?\s+party\s+hard/i,
  /chug\s+beer/i,
  /beer\s+pong/i,
  /keg\s+stand/i,
  /do\s+drugs/i,
  /smoke\s+weed/i,
  /get\s+high/i,
  /pop\s+pills/i,
  /go\s+drinking/i,

  // Hate speech / bullying
  /i\s+hate\s+(people|everyone|you|him|her|them)/i,
  /kill\s+(yourself|your\s*self|myself|my\s*self)/i,
  /go\s+die/i,
  /you('re|\s+are)\s+(stupid|dumb|idiot|worthless|ugly|trash|garbage|pathetic|loser)/i,
  /shut\s+(the\s+f|up)/i,

  // Violence / threats
  /i('ll|'m\s+gonna)\s+(kill|hurt|beat|punch|stab|shoot)/i,
  /fight\s+me/i,
  /pull\s+up/i,
  /catch\s+(these\s+)?hands/i,

  // Sexual content
  /send\s+nudes/i,
  /hook\s*up/i,
  /netflix\s+and\s+chill/i,
  /booty\s+call/i,

  // Discrimination
  /go\s+back\s+to\s+your\s+country/i,
  /you\s+don'?t\s+belong\s+here/i,
];

export function checkContentModeration(text: string): { blocked: boolean; reason: string | null } {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return { blocked: false, reason: null };

  // Check individual words
  const words = normalized.split(/\s+/);
  for (const word of words) {
    // Strip punctuation from word edges for matching
    const clean = word.replace(/[^a-z0-9*$@!]/g, "");
    if (INAPPROPRIATE_WORDS.includes(clean)) {
      return {
        blocked: true,
        reason: "This message contains inappropriate content and cannot be posted. Please keep discussions respectful and academic.",
      };
    }
  }

  // Check phrases
  for (const pattern of INAPPROPRIATE_PHRASES) {
    if (pattern.test(normalized)) {
      return {
        blocked: true,
        reason: "This message contains inappropriate content and cannot be posted. Please keep discussions respectful and academic.",
      };
    }
  }

  return { blocked: false, reason: null };
}
