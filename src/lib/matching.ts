/**
 * Lost-Link Intelligent Lost & Found Matching Engine
 * Compares lost reports against inventory of found items to calculate match confidence.
 */

export interface MatchCandidate {
  id: string;
  title: string;
  category: string;
  description: string;
  found_location: string;
  found_date: string;
  status: string;
  image_url?: string;
}

export interface MatchTarget {
  id: string;
  title: string;
  category: string;
  description: string;
  last_seen_location: string;
  date_lost: string;
}

export interface MatchResult {
  item: MatchCandidate;
  score: number; // 0 to 100
  confidence: 'High' | 'Medium' | 'Low';
  reasons: string[];
}

function extractKeywords(text?: string): Set<string> {
  if (!text) return new Set();
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'it', 'my', 'i', 'was',
    'lost', 'found', 'near', 'left', 'some', 'any', 'black', 'white', 'grey', 'gray', 'blue', 'red'
  ]);
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))
  );
}

export function calculateMatchScore(lost: MatchTarget, found: MatchCandidate): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Category Match (35 pts)
  if (lost.category && found.category && lost.category.toLowerCase() === found.category.toLowerCase()) {
    score += 35;
    reasons.push('Exact category match');
  }

  // 2. Keyword similarity in title and description (up to 35 pts)
  const lostWords = extractKeywords(`${lost.title} ${lost.description}`);
  const foundWords = extractKeywords(`${found.title} ${found.description}`);

  let overlap = 0;
  lostWords.forEach((word) => {
    if (foundWords.has(word)) overlap++;
  });

  if (overlap > 0) {
    const keywordPts = Math.min(35, overlap * 12);
    score += keywordPts;
    reasons.push(`${overlap} matching keyword${overlap > 1 ? 's' : ''}`);
  }

  // 3. Date Proximity (up to 20 pts)
  try {
    const lostDate = new Date(lost.date_lost).getTime();
    const foundDate = new Date(found.found_date).getTime();
    if (!isNaN(lostDate) && !isNaN(foundDate)) {
      const diffDays = Math.abs(foundDate - lostDate) / (1000 * 60 * 60 * 24);
      if (diffDays <= 2) {
        score += 20;
        reasons.push('Found within 48 hours of reported loss');
      } else if (diffDays <= 7) {
        score += 15;
        reasons.push('Found within 7 days of reported loss');
      } else if (diffDays <= 14) {
        score += 8;
        reasons.push('Found within 2 weeks of reported loss');
      }
    }
  } catch {
    // Ignore date parse issues
  }

  // 4. Location similarity (up to 10 pts)
  if (lost.last_seen_location && found.found_location) {
    const lostLocWords = extractKeywords(lost.last_seen_location);
    const foundLocWords = extractKeywords(found.found_location);
    let locOverlap = false;
    lostLocWords.forEach((w) => {
      if (foundLocWords.has(w)) locOverlap = true;
    });

    if (locOverlap) {
      score += 10;
      reasons.push('Nearby or matching campus location');
    }
  }

  // Normalize max score to 100
  score = Math.min(100, Math.round(score));

  let confidence: 'High' | 'Medium' | 'Low' = 'Low';
  if (score >= 70) confidence = 'High';
  else if (score >= 40) confidence = 'Medium';

  return {
    item: found,
    score,
    confidence,
    reasons,
  };
}

export function findMatches(lost: MatchTarget, candidates: MatchCandidate[]): MatchResult[] {
  return candidates
    .filter((candidate) => candidate.status === 'unclaimed' || candidate.status === 'in_review')
    .map((candidate) => calculateMatchScore(lost, candidate))
    .filter((result) => result.score >= 25)
    .sort((a, b) => b.score - a.score);
}
