/**
 * Ouvidoria Pública Popular (OPP) - Entidades de Domínio
 * Versão 3.0 (Issue-Centric)
 */

export interface Municipality {
  municipalityId: string;
  name: string;
  state: string;
  ibgeCode?: string;
  branding: {
    heroTitle?: string;
    heroSubtitle?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  isPublicNameVisible: boolean;
  municipalityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CitizenConsentRecord {
  termVersion: string;
  acceptedAt: string;
  userId: string;
  sanitizedPublicationConsent: boolean;
  electronicTransmissionAuthorized: boolean;
  receiveEmailCopy: boolean;
}

export interface UserPrivateData {
  uid: string;
  fullName: string;
  cpfMasked: string; // apenas dígitos com máscara de exibição se necessário
  cpfHash: string;   // hash criptográfico para validação de unicidade se aplicável
  email: string;
  phoneNumber?: string;
  residentialAddressApprox?: string;
  consents: CitizenConsentRecord[];
  createdAt: string;
  updatedAt: string;
}

export type AgencyChannelType =
  | 'EMAIL'
  | 'WEB_PORTAL'
  | 'FALABR'
  | 'API'
  | 'PHONE'
  | 'IN_PERSON'
  | 'MANUAL';

export interface AgencyChannel {
  channelId: string;
  agencyId: string;
  type: AgencyChannelType;
  addressOrUrl: string;
  acceptsAutomatedSubmission: boolean;
  requiresIdentity: boolean;
  requiresAuthentication: boolean;
  sourceUrl?: string;
  verifiedAt?: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  notes?: string;
}

export interface Agency {
  agencyId: string;
  municipalityId: string;
  name: string;
  acronym?: string;
  description?: string;
  categories: string[];
  channels: AgencyChannel[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IssueLocationApprox {
  neighborhood: string;
  streetApprox?: string;
  referencePoint?: string;
  city: string;
  state: string;
  coordinatesApprox?: {
    latitude: number;
    longitude: number;
  };
}

export interface Issue {
  issueId: string;
  municipalityId: string;
  title: string;
  publicSummary: string;
  categoryId: string;
  locationApprox: IssueLocationApprox;
  status: string; // Conforme IssueStatus na máquina de estados
  agencyIds: string[];
  rootManifestationId: string;
  formalSupportCount: number;
  commentCount: number;
  followerCount: number;
  lastPublicActivityAt: string;
  searchTokens: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string; // UID do autor (mantido internamente, não exposto se anônimo para o público)
  moderationState: 'DRAFT' | 'UNDER_MODERATION' | 'APPROVED' | 'REJECTED';
  schemaVersion: number;
  mergedIntoIssueId?: string; // AC-12: ID do issue principal de destino
  splitFromIssueId?: string;  // Seção 3.4: ID do issue de origem se derivado de split
  mergeHistory?: Array<{
    sourceIssueId: string;
    mergedAt: string;
    reason: string;
    moderatorId: string;
  }>;
}

export interface IssueComment {
  commentId: string;
  issueId: string;
  userId: string;
  authorPublicName: string;
  text: string;
  parentCommentId?: string; // para encadeamento raso (respostas)
  moderationState: 'APPROVED' | 'PENDING' | 'AUTO_FLAGGED' | 'REJECTED';
  riskFlags?: string[];
  reportCount: number;
  editHistory?: Array<{
    text: string;
    editedAt: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface CommentReport {
  reportId: string;
  commentId: string;
  issueId: string;
  reportingUserId: string;
  reason: 'OFFENSIVE' | 'PII_LEAK' | 'CRIME_ACCUSATION' | 'SPAM' | 'OTHER';
  details?: string;
  createdAt: string;
}

export interface IssueEvidence {
  evidenceId: string;
  issueId: string;
  userId: string;
  description: string;
  publicUrl: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  moderationState: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface FormalManifestation {
  manifestationId: string;
  issueId: string;
  userId: string;
  municipalityId: string;
  isRoot: boolean;
  status: string; // Conforme FormalManifestationStatus
  protocolCode?: string; // ex: MF-00142-ROOT ou MF-00142-A001
  citizenStatement: string; // Declaração ou relato sanitizado do cidadão
  useBaseText: boolean;
  consents: CitizenConsentRecord;
  identificationRequiredByChannel: {
    fullNameProvided: boolean;
    cpfProvided: boolean;
    emailProvided: boolean;
  };
  documentPdfUrl?: string;
  documentHash?: string; // SHA-256 do documento transmitido
  templateVersion?: string;
  dispatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchItem {
  itemId: string;
  manifestationId: string;
  userId: string;
  code: string; // ex: MF-00142-A028
  itemHash: string;
}

export interface Dispatch {
  dispatchId: string;
  issueId: string;
  municipalityId: string;
  channelId: string;
  agencyId: string;
  status: string; // Conforme DispatchStatus
  itemsCount: number;
  batchMode: 'IMMEDIATE' | 'HOURLY_BATCH' | 'DAILY_BATCH' | 'MANUAL';
  scheduledAt: string;
  sentAt?: string;
  retryCount: number;
  lastError?: string;
  subject: string;
  contentSnippet: string;
  rawContentHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyResponse {
  responseId: string;
  issueId: string;
  dispatchId?: string;
  agencyId: string;
  channelReceived: AgencyChannelType;
  rawContent: string;
  protocolNumber?: string;
  senderEmailOrContact?: string;
  receivedAt: string;
  moderationState: 'RAW_PENDING' | 'SANITIZED_APPROVED' | 'REJECTED';
}

export interface PublicAgencyResponse {
  responseId: string;
  issueId: string;
  agencyId: string;
  sanitizedSummary: string;
  sanitizedContent: string;
  protocolNumber?: string;
  publishedAt: string;
  userResolutionFeedback?: 'SIM' | 'PARCIALMENTE' | 'NAO' | 'NAO_SEI_AVALIAR';
}

export interface ModerationCase {
  caseId: string;
  entityType: 'ISSUE' | 'FORMAL_MANIFESTATION' | 'COMMENT' | 'EVIDENCE' | 'AGENCY_RESPONSE';
  entityId: string;
  issueId?: string;
  riskFlags: string[];
  aiSuggestion?: {
    categorySuggestion?: string;
    agencySuggestion?: string;
    summarySuggestion?: string;
    detectedRisks?: string[];
  };
  status: 'OPEN' | 'AUTO_FLAGGED' | 'HUMAN_REVIEW' | 'APPROVED' | 'EDIT_REQUESTED' | 'REJECTED' | 'ESCALATED';
  reviewerId?: string;
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  actorType: 'CITIZEN' | 'MODERATOR' | 'ADMIN' | 'SYSTEM';
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeHash?: string;
  afterHash?: string;
  metadata?: Record<string, unknown>;
  correlationId: string;
  ipHash?: string;
}
