/**
 * Máquinas de Estado do OPP (v3.0 - Anexo D)
 */

export enum IssueStatus {
  DRAFT = 'DRAFT',
  UNDER_MODERATION = 'UNDER_MODERATION',
  OPEN = 'OPEN',
  FORWARDED = 'FORWARDED',
  AWAITING_RESPONSE = 'AWAITING_RESPONSE',
  RESPONDED = 'RESPONDED',
  PARTIALLY_RESOLVED = 'PARTIALLY_RESOLVED',
  RESOLVED = 'RESOLVED',
  UNRESOLVED = 'UNRESOLVED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
  // Estados especiais
  MERGED = 'MERGED',
  SPLIT = 'SPLIT',
  HIDDEN = 'HIDDEN',
  DISPUTED = 'DISPUTED',
}

export enum FormalManifestationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  SANITIZATION_CHECK = 'SANITIZATION_CHECK',
  MODERATION = 'MODERATION',
  READY_FOR_CONFIRMATION = 'READY_FOR_CONFIRMATION',
  USER_CONFIRMED = 'USER_CONFIRMED',
  QUEUED_FOR_DISPATCH = 'QUEUED_FOR_DISPATCH',
  DISPATCHED = 'DISPATCHED',
  RESPONSE_LINKED = 'RESPONSE_LINKED',
  NO_RESPONSE = 'NO_RESPONSE',
  USER_EVALUATED = 'USER_EVALUATED',
  CLOSED = 'CLOSED',
}

export enum DispatchStatus {
  CREATED = 'CREATED',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  BOUNCED = 'BOUNCED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CLOSED = 'CLOSED',
}

export enum ModerationStatus {
  OPEN = 'OPEN',
  AUTO_FLAGGED = 'AUTO_FLAGGED',
  HUMAN_REVIEW = 'HUMAN_REVIEW',
  APPROVED = 'APPROVED',
  EDIT_REQUESTED = 'EDIT_REQUESTED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
}

/**
 * Tabela de transições válidas para Issue
 */
const validIssueTransitions: Record<IssueStatus, IssueStatus[]> = {
  [IssueStatus.DRAFT]: [IssueStatus.UNDER_MODERATION, IssueStatus.OPEN, IssueStatus.HIDDEN],
  [IssueStatus.UNDER_MODERATION]: [IssueStatus.OPEN, IssueStatus.HIDDEN, IssueStatus.DRAFT, IssueStatus.MERGED],
  [IssueStatus.OPEN]: [IssueStatus.FORWARDED, IssueStatus.AWAITING_RESPONSE, IssueStatus.MERGED, IssueStatus.SPLIT, IssueStatus.HIDDEN, IssueStatus.DISPUTED],
  [IssueStatus.FORWARDED]: [IssueStatus.AWAITING_RESPONSE, IssueStatus.RESPONDED, IssueStatus.DISPUTED, IssueStatus.HIDDEN],
  [IssueStatus.AWAITING_RESPONSE]: [IssueStatus.RESPONDED, IssueStatus.UNRESOLVED, IssueStatus.DISPUTED, IssueStatus.HIDDEN],
  [IssueStatus.RESPONDED]: [IssueStatus.PARTIALLY_RESOLVED, IssueStatus.RESOLVED, IssueStatus.UNRESOLVED, IssueStatus.AWAITING_RESPONSE, IssueStatus.DISPUTED],
  [IssueStatus.PARTIALLY_RESOLVED]: [IssueStatus.RESOLVED, IssueStatus.UNRESOLVED, IssueStatus.CLOSED, IssueStatus.ARCHIVED],
  [IssueStatus.RESOLVED]: [IssueStatus.CLOSED, IssueStatus.ARCHIVED, IssueStatus.DISPUTED],
  [IssueStatus.UNRESOLVED]: [IssueStatus.AWAITING_RESPONSE, IssueStatus.CLOSED, IssueStatus.ARCHIVED, IssueStatus.DISPUTED],
  [IssueStatus.CLOSED]: [IssueStatus.ARCHIVED, IssueStatus.OPEN],
  [IssueStatus.ARCHIVED]: [],
  [IssueStatus.MERGED]: [],
  [IssueStatus.SPLIT]: [],
  [IssueStatus.HIDDEN]: [IssueStatus.OPEN, IssueStatus.UNDER_MODERATION, IssueStatus.ARCHIVED],
  [IssueStatus.DISPUTED]: [IssueStatus.OPEN, IssueStatus.UNDER_MODERATION, IssueStatus.AWAITING_RESPONSE, IssueStatus.RESOLVED],
};

/**
 * Tabela de transições válidas para FormalManifestation
 */
const validManifestationTransitions: Record<FormalManifestationStatus, FormalManifestationStatus[]> = {
  [FormalManifestationStatus.DRAFT]: [FormalManifestationStatus.SUBMITTED],
  [FormalManifestationStatus.SUBMITTED]: [FormalManifestationStatus.SANITIZATION_CHECK],
  [FormalManifestationStatus.SANITIZATION_CHECK]: [FormalManifestationStatus.MODERATION, FormalManifestationStatus.READY_FOR_CONFIRMATION],
  [FormalManifestationStatus.MODERATION]: [FormalManifestationStatus.READY_FOR_CONFIRMATION, FormalManifestationStatus.CLOSED],
  [FormalManifestationStatus.READY_FOR_CONFIRMATION]: [FormalManifestationStatus.USER_CONFIRMED, FormalManifestationStatus.CLOSED],
  [FormalManifestationStatus.USER_CONFIRMED]: [FormalManifestationStatus.QUEUED_FOR_DISPATCH],
  [FormalManifestationStatus.QUEUED_FOR_DISPATCH]: [FormalManifestationStatus.DISPATCHED, FormalManifestationStatus.CLOSED],
  [FormalManifestationStatus.DISPATCHED]: [FormalManifestationStatus.RESPONSE_LINKED, FormalManifestationStatus.NO_RESPONSE],
  [FormalManifestationStatus.RESPONSE_LINKED]: [FormalManifestationStatus.USER_EVALUATED, FormalManifestationStatus.CLOSED],
  [FormalManifestationStatus.NO_RESPONSE]: [FormalManifestationStatus.USER_EVALUATED, FormalManifestationStatus.CLOSED],
  [FormalManifestationStatus.USER_EVALUATED]: [FormalManifestationStatus.CLOSED],
  [FormalManifestationStatus.CLOSED]: [],
};

export function canTransitionIssue(current: IssueStatus, next: IssueStatus): boolean {
  if (current === next) return true;
  const allowed = validIssueTransitions[current] || [];
  return allowed.includes(next);
}

export function canTransitionManifestation(current: FormalManifestationStatus, next: FormalManifestationStatus): boolean {
  if (current === next) return true;
  const allowed = validManifestationTransitions[current] || [];
  return allowed.includes(next);
}
