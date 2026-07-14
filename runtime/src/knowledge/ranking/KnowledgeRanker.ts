import { RetrievalResult } from '../retrieval/KnowledgeRetriever.js';

export interface RankingOptions {
  minScoreThreshold: number;
  boostExactMatches: boolean;
  maxResults: number;
}

export class KnowledgeRanker {
  private defaultOptions: RankingOptions = {
    minScoreThreshold: 0.1,
    boostExactMatches: true,
    maxResults: 10,
  };

  public rank(results: RetrievalResult[], query: string, options?: Partial<RankingOptions>): RetrievalResult[] {
    const opts = { ...this.defaultOptions, ...options };
    const lowerQuery = query.toLowerCase();

    // Filter by threshold
    let ranked = results.filter(r => r.score >= opts.minScoreThreshold);

    // Boost exact matches
    if (opts.boostExactMatches) {
      ranked = ranked.map(r => {
        let scoreBoost = 0;
        if (r.chunk.content.toLowerCase().includes(lowerQuery)) {
          scoreBoost += 0.5; // Arbitrary boost for exact phrase match
        }
        return { ...r, score: r.score + scoreBoost };
      });
    }

    // Sort again based on boosted scores
    ranked.sort((a, b) => b.score - a.score);

    return ranked.slice(0, opts.maxResults);
  }
}
