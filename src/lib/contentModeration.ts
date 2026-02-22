const INAPPROPRIATE_WORDS = [
  // Profanity / slurs
  "fuck", "fucker", "fucking", "fucked", "fck", "fuk", "fukin", "effing",
  "shit", "shitty", "shits", "shitting",
  "bitch", "bitches", "bitching", "bitchy",
  "ass", "asshole", "assholes",
  "dick", "dicks",
  "hoe", "hoes",
  "butthole", "buttholes", "butt",
  "boob", "boobs", "booty", "booties",
  "tits", "titties", "titty",
  "penis", "vagina", "balls", "nutsack", "ballsack",
  "slut", "sluts", "slutty",
  "whore", "whores",
  "skank", "skanks", "skanky",
  "cunt", "cunts",
  "damn", "dammit",
  "bastard", "bastards",
  "retard", "retarded", "retards",
  "stfu", "gtfo", "kys", "wtf", "lmfao", "lmao",
  "nigga", "niggas", "nigger", "niggers",
  "fag", "fags", "faggot", "faggots",
  "cracker", "crackers",
  "spic", "spics", "chink", "chinks", "gook", "gooks",
  "tranny", "trannies",
  "piss", "pissed",
  "crap", "crappy",
  "douche", "douchebag",
  "twat", "twats",
  "wanker", "wankers",
  "dipshit", "dumbass", "jackass",
  "sexy", "sexi", "horny", "thicc", "thiccc",
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

  // Hate speech / bullying — broad "i hate" pattern
  /i\s+hate\b/i,
  /kill\s+(yourself|your\s*self|myself|my\s*self)/i,
  /go\s+die/i,
  /you('re|\s+are)\s+(stupid|dumb|idiot|worthless|ugly|trash|garbage|pathetic|loser)/i,
  /shut\s+(the\s+f|up)/i,
  /you\s+suck/i,
  /hate\s+you/i,
  /nobody\s+likes\s+you/i,
  /you('re|\s+are)\s+a\s+(loser|idiot|moron|freak|creep)/i,

  // Violence / threats
  /i('ll|'m\s+gonna)\s+(kill|hurt|beat|punch|stab|shoot)/i,
  /fight\s+me/i,
  /catch\s+(these\s+)?hands/i,

  // Sexual / appearance comments
  /send\s+nudes/i,
  /hook\s*up/i,
  /netflix\s+and\s+chill/i,
  /booty\s+call/i,
  /\bis\s+(so\s+)?(hot|sexy|fine|thicc|thick|gorgeous|bangable|fuckable)/i,
  /\blook(s|ing)?\s+(so\s+)?(hot|sexy|fine|thicc|thick|gorgeous)/i,
  /(hot|sexy|fine)\s+(af|ass|as\s+hell)/i,
  /smash\s+or\s+pass/i,
  /i('d|would)\s+(smash|bang|tap|hit)/i,
  /dat\s+ass/i,
  /nice\s+(ass|butt|tits|boobs|body)/i,
  /my\s+(butthole|butt|ass|dick|balls|vagina|penis)/i,

  // Discrimination
  /go\s+back\s+to\s+your\s+country/i,
  /you\s+don'?t\s+belong\s+here/i,
];

export function checkContentModeration(text: string): { blocked: boolean; reason: string | null } {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return { blocked: false, reason: null };

  const REASON = "This message contains inappropriate content and cannot be posted. Please keep discussions respectful and academic.";

  // Check individual words — split on whitespace and punctuation boundaries
  const words = normalized.split(/[\s,.\-!?;:'"()\[\]{}]+/);
  for (const word of words) {
    if (!word) continue;
    if (INAPPROPRIATE_WORDS.includes(word)) {
      return { blocked: true, reason: REASON };
    }
  }

  // Check phrases
  for (const pattern of INAPPROPRIATE_PHRASES) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: REASON };
    }
  }

  return { blocked: false, reason: null };
}
