import {
  Issue,
  SearchProvider,
  SearchQuery,
  SearchResultItem,
  generateSearchTokens,
  expandTokensWithSynonyms,
  calculateIssueSimilarity
} from '@opp/shared';
import { FirestoreIssueRepository } from '../repositories/firestore-issue-repository.js';

export class FirestoreTokenSearchProvider implements SearchProvider {
  constructor(private issueRepo: FirestoreIssueRepository) {}

  async searchIssues(query: SearchQuery): Promise<SearchResultItem[]> {
    const rawTokens = generateSearchTokens([query.query]);

    if (!rawTokens.length) {
      return [];
    }

    const expandedTokens = expandTokensWithSynonyms(rawTokens);

    const candidates = await this.issueRepo.searchByTokens(
      query.municipalityId,
      expandedTokens,
      query.limit || 20
    );

    const scoredResults: SearchResultItem[] = [];

    for (const candidate of candidates) {
      const similarity = calculateIssueSimilarity(
        {
          municipalityId: query.municipalityId,
          title: query.query,
          categoryId: query.categoryId
        },
        candidate
      );

      if (similarity && similarity.similarityScore > 0) {
        scoredResults.push({
          issue: candidate,
          score: similarity.similarityScore,
          matchedTokens: similarity.matchedTokens
        });
      }
    }

    // Ordena pelo maior score de relevância
    return scoredResults.sort((a, b) => b.score - a.score);
  }

  async indexIssue(issue: Issue): Promise<void> {
    const tokens = generateSearchTokens([
      issue.title,
      issue.publicSummary,
      issue.locationApprox?.neighborhood,
      issue.locationApprox?.referencePoint,
      issue.locationApprox?.city
    ]);

    await this.issueRepo.update(issue.issueId, {
      searchTokens: tokens,
      updatedAt: new Date().toISOString()
    });
  }

  async removeIssue(issueId: string): Promise<void> {
    await this.issueRepo.update(issueId, {
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString()
    });
  }
}
