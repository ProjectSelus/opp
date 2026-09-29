import { Issue, FormalManifestation } from '../domain/entities.js';

export interface SearchQuery {
  municipalityId: string;
  query: string;
  categoryId?: string;
  limit?: number;
}

export interface SearchResultItem {
  issue: Issue;
  score: number;
  matchedTokens: string[];
}

export interface SearchProvider {
  searchIssues(query: SearchQuery): Promise<SearchResultItem[]>;
  indexIssue(issue: Issue): Promise<void>;
  removeIssue(issueId: string): Promise<void>;
}

export interface AISuggestion {
  suggestedCategoryId?: string;
  suggestedAgencyId?: string;
  suggestedAgencyName?: string;
  suggestedSummary?: string;
  confidenceScore: number;
  reasoning?: string;
}

export interface AIRiskReport {
  isHighRisk: boolean;
  riskFlags: string[]; // ex: 'NOMINAL_CRIME_ACCUSATION', 'CHILD_DATA', 'SENSITIVE_DATA', 'THREAT'
  confidence: number;
  requiresHumanReview: boolean;
}

export interface AIProvider {
  suggestMetadata(sanitizedContent: string): Promise<AISuggestion>;
  generateNeutralSummary(sanitizedContent: string): Promise<string>;
  evaluateContentRisk(sanitizedContent: string): Promise<AIRiskReport>;
}

export interface MailOptions {
  from: string;
  to: string;
  cc?: string[];
  replyTo?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  headers?: Record<string, string>;
}

export interface MailSendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

export interface MailProvider {
  send(options: MailOptions): Promise<MailSendResult>;
}

export interface StorageProvider {
  uploadPrivate(path: string, buffer: Buffer, contentType: string): Promise<string>;
  uploadPublic(path: string, buffer: Buffer, contentType: string): Promise<string>;
  getDownloadUrl(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}

export interface GeneratedDocument {
  pdfBuffer: Buffer;
  hashSha256: string;
  templateVersion: string;
}

export interface DocumentProvider {
  generateManifestationDocument(
    manifestation: FormalManifestation,
    issue: Issue,
    protocolCode: string
  ): Promise<GeneratedDocument>;
}

export interface IssueRepository {
  findById(issueId: string): Promise<Issue | null>;
  create(issue: Issue): Promise<Issue>;
  update(issueId: string, partial: Partial<Issue>): Promise<void>;
  searchByTokens(municipalityId: string, tokens: string[], limit?: number): Promise<Issue[]>;
}
