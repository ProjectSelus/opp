/**
 * Moderação, Integridade e Auditoria de Comentários (Seção 16 & 23)
 * Avaliação determinística de risco e preservação de histórico de edição
 */

import { IssueComment, CommentReport, AuditEvent } from './entities.js';
import { sanitizeText } from '../utils/sanitizer.js';

// Padrões de alto risco (Seção 16.2)
const CRIME_ACCUSATION_REGEX = /\b(ladrao|ladra|roubou|desvio\sde\sverba|propina|corrupto|corrupcao|estelionato|superfaturamento)\b/i;
const VIOLENCE_THREAT_REGEX = /\b(matar|morte|agredir|porrada|bater|tiro|linchar|linchamento|vinganca)\b/i;
const MINOR_SENSITIVE_REGEX = /\b(crianca|menor\sde\idade|adolescente|estupro|pedofilia)\b/i;

export interface CommentEvaluationResult {
  sanitizedText: string;
  moderationState: 'APPROVED' | 'AUTO_FLAGGED';
  riskFlags: string[];
  requiresHumanReview: boolean;
}

/**
 * Avalia riscos de um comentário antes da persistência
 */
export function evaluateCommentRisk(rawText: string): CommentEvaluationResult {
  const sanitization = sanitizeText(rawText);
  const riskFlags: string[] = [];

  if (sanitization.hasPii) {
    riskFlags.push(...sanitization.detectedPiiTypes.map(t => `PII_${t}`));
  }

  if (CRIME_ACCUSATION_REGEX.test(rawText)) {
    riskFlags.push('NOMINAL_CRIME_ACCUSATION');
  }

  if (VIOLENCE_THREAT_REGEX.test(rawText)) {
    riskFlags.push('VIOLENCE_OR_THREAT');
  }

  if (MINOR_SENSITIVE_REGEX.test(rawText)) {
    riskFlags.push('SENSITIVE_MINOR_DATA');
  }

  const isHighRisk = riskFlags.length > 0;

  return {
    sanitizedText: sanitization.sanitizedText,
    moderationState: isHighRisk ? 'AUTO_FLAGGED' : 'APPROVED',
    riskFlags,
    requiresHumanReview: isHighRisk
  };
}

/**
 * Aplica edição em comentário preservando histórico de versões anteriores (Seção 23.2)
 */
export function applyCommentEdit(
  currentComment: IssueComment,
  newRawText: string,
  editorUserId: string
): { updatedComment: IssueComment; auditEvent: AuditEvent } {
  if (currentComment.userId !== editorUserId) {
    throw new Error('Apenas o autor do comentário pode editá-lo.');
  }

  const evaluation = evaluateCommentRisk(newRawText);
  const now = new Date().toISOString();

  const historyEntry = {
    text: currentComment.text,
    editedAt: now
  };

  const updatedComment: IssueComment = {
    ...currentComment,
    text: evaluation.sanitizedText,
    moderationState: evaluation.moderationState,
    riskFlags: evaluation.riskFlags,
    editHistory: [...(currentComment.editHistory || []), historyEntry],
    updatedAt: now
  };

  const auditEvent: AuditEvent = {
    eventId: `audit-edit-comment-${Date.now()}`,
    timestamp: now,
    actorType: 'CITIZEN',
    actorId: editorUserId,
    action: 'COMMENT_EDITED',
    entityType: 'COMMENT',
    entityId: currentComment.commentId,
    metadata: {
      issueId: currentComment.issueId,
      previousTextSnippet: currentComment.text.slice(0, 100),
      isHighRisk: evaluation.requiresHumanReview,
      riskFlags: evaluation.riskFlags
    },
    correlationId: `comment-edit-${currentComment.commentId}`
  };

  return {
    updatedComment,
    auditEvent
  };
}

/**
 * Registra denúncia de comentário e avalia se o caso deve ir para revisão humana (Seção 23.2)
 */
export function processCommentReport(
  currentComment: IssueComment,
  report: CommentReport,
  reportThreshold: number = 2
): { updatedComment: IssueComment; shouldCreateModerationCase: boolean; auditEvent: AuditEvent } {
  const newReportCount = (currentComment.reportCount || 0) + 1;
  const shouldFlag = newReportCount >= reportThreshold;
  const now = new Date().toISOString();

  const updatedComment: IssueComment = {
    ...currentComment,
    reportCount: newReportCount,
    moderationState: shouldFlag ? 'AUTO_FLAGGED' : currentComment.moderationState,
    updatedAt: now
  };

  const auditEvent: AuditEvent = {
    eventId: `audit-report-comment-${Date.now()}`,
    timestamp: now,
    actorType: 'CITIZEN',
    actorId: report.reportingUserId,
    action: 'COMMENT_REPORTED',
    entityType: 'COMMENT',
    entityId: currentComment.commentId,
    metadata: {
      issueId: currentComment.issueId,
      reason: report.reason,
      reportCount: newReportCount,
      autoFlagged: shouldFlag
    },
    correlationId: `report-${report.reportId}`
  };

  return {
    updatedComment,
    shouldCreateModerationCase: shouldFlag,
    auditEvent
  };
}
