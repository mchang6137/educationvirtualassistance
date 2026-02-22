const INAPPROPRIATE_PATTERNS: RegExp[] = [
  // Alcohol / drugs
  /\b(let'?s?\s+(get\s+)?drunk|let'?s?\s+go\s+drink(ing)?|get\s+wasted|get\s+hammered|let'?s?\s+party\s+hard|chug\s+beer|shotgun\s+beers?|beer\s+pong|keg\s+stand)\b/i,
  /\b(do\s+drugs|smoke\s+weed|get\s+high|let'?s?\s+trip|pop\s+pills)\b/i,

  // Hate speech / bullying
  /\b(i\s+hate\s+(people|everyone|you|him|her|them)|kill\s+(yourself|your\s*self|myself|my\s*self)|go\s+die)\b/i,
  /\b(you('re|\s+are)\s+(stupid|dumb|idiot|worthless|ugly|trash|garbage|pathetic|loser))\b/i,
  /\b(shut\s+(the\s+f+|up)\s*(b+|c+)?|stfu|gtfo|kys)\b/i,

  // Profanity (common)
  /\b(f+u+c+k+|sh[i1]+t+|b[i1]+tch|a+ss+h+o+le|d[i1]+ck|damn\s+you|wtf|lmfao)\b/i,

  // Violence / threats
  /\b(i('ll|'m\s+gonna)\s+(kill|hurt|beat|punch|stab|shoot)\s+(you|him|her|them))\b/i,
  /\b(fight\s+me|pull\s+up|catch\s+(these\s+)?hands)\b/i,

  // Sexual content
  /\b(send\s+nudes|hook\s*up|netflix\s+and\s+chill|booty\s+call)\b/i,

  // Discrimination
  /\b(go\s+back\s+to\s+your\s+country|you\s+don'?t\s+belong\s+here)\b/i,
];

export function checkContentModeration(text: string): { blocked: boolean; reason: string | null } {
  const normalized = text.trim();
  if (!normalized) return { blocked: false, reason: null };

  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        blocked: true,
        reason: "This message contains inappropriate content and cannot be posted. Please keep discussions respectful and academic.",
      };
    }
  }

  return { blocked: false, reason: null };
}
