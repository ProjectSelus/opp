import * as admin from 'firebase-admin';
import { Issue, IssueRepository } from '@opp/shared';

export class FirestoreIssueRepository implements IssueRepository {
  private get collection() {
    return admin.firestore().collection('issues');
  }

  async findById(issueId: string): Promise<Issue | null> {
    const doc = await this.collection.doc(issueId).get();
    if (!doc.exists) return null;
    return doc.data() as Issue;
  }

  async create(issue: Issue): Promise<Issue> {
    await this.collection.doc(issue.issueId).set(issue);
    return issue;
  }

  async update(issueId: string, partial: Partial<Issue>): Promise<void> {
    await this.collection.doc(issueId).update({
      ...partial,
      updatedAt: new Date().toISOString()
    });
  }

  async searchByTokens(municipalityId: string, tokens: string[], limit: number = 20): Promise<Issue[]> {
    if (!tokens.length) return [];

    // Firestore array-contains-any suporta até 10 elementos por query
    const tokensSlice = tokens.slice(0, 10);

    const snapshot = await this.collection
      .where('municipalityId', '==', municipalityId)
      .where('searchTokens', 'array-contains-any', tokensSlice)
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as Issue);
  }
}
