/**
 * Moderação, Integridade e Auditoria de Comentários (Seção 16 & 23)
 * Avaliação determinística de risco e preservação de histórico de edição
 */

import { IssueComment, CommentReport, AuditEvent } from './entities.js';
import { sanitizeText } from '../utils/sanitizer.js';

// Padrões de alto risco (Seção 16.2)
export const CRIME_ACCUSATION_REGEX = /\b(ladr[aã]o|ladr[aã]|roubou|desvio\s+de\s+verba|propina|corrupto|corrup[cç][aã]o|estelionato|superfaturamento)\b/i;
export const VIOLENCE_THREAT_REGEX = /\b(matar|morte|agredir|porrada|bater|tiro|linchar|linchamento|vingan[cç]a|quebrar\s+(a\s+)?cara)\b/i;
export const MINOR_SENSITIVE_REGEX = /\b(crian[cç]a|menor\s+de\s+idade|adolescente|estupro|pedofilia)\b/i;

// Padrão de linguagem de baixo calão / termos chulos (PT-BR)
export const PROFANITY_REGEX = /\b(merda|merdas|porra|porras|caralho|caralhos|caralha|puta|putas|puto|putos|putaria|bosta|bostas|bostinha|cacete|cacetes|arrombado|arrombados|arrombada|arrombadas|fdp|filho\s+da\s+puta|filha\s+da\s+puta|foda|foder|fodeu|fudeu|fudido|fodido|fudida|fodida|cu|cuz[aã]o|cuz[oõ]es|vsf|vtnc|vai\s+se\s+foder|tomar\s+no\s+cu|tmnc|pqp|babaca|babacas|desgra[cç]ado|desgra[cç]ada|desgra[cç]a|vadia|vadias)\b/gi;

/**
 * Substitui palavras de baixo calão por caracteres ###### (preservando o restante do texto)
 */
export function maskProfanity(text: string): {
  maskedText: string;
  hasProfanity: boolean;
  foundWords: string[];
} {
  const foundWords: string[] = [];
  const maskedText = text.replace(PROFANITY_REGEX, (match) => {
    foundWords.push(match);
    return '######';
  });

  return {
    maskedText,
    hasProfanity: foundWords.length > 0,
    foundWords
  };
}

export interface CommentRiskNotice {
  category: 'PROFANITY' | 'CRIME_ACCUSATION' | 'VIOLENCE_THREAT' | 'SENSITIVE_MINOR' | 'PII';
  title: string;
  description: string;
  recommendation: string;
}

export interface AuthorCommentWarningCheck {
  hasWarnings: boolean;
  warnings: CommentRiskNotice[];
  originalText: string;
  previewText: string;
  hasProfanity: boolean;
  hasHighRisk: boolean;
  maskedWords: string[];
}

export interface CommentEvaluationResult {
  sanitizedText: string;
  moderationState: 'APPROVED' | 'AUTO_FLAGGED';
  riskFlags: string[];
  requiresHumanReview: boolean;
  hasProfanity: boolean;
  maskedProfanitiesCount: number;
}

/**
 * Função de verificação prévia para conscientização cívica do autor antes da postagem.
 * Informa em quais situações o texto se enquadra e dá a opção de editar ou postar mesmo assim.
 */
export function checkCommentForAuthorWarning(rawText: string): AuthorCommentWarningCheck {
  const sanitization = sanitizeText(rawText);
  const profanityResult = maskProfanity(sanitization.sanitizedText);
  const warnings: CommentRiskNotice[] = [];
  let hasHighRisk = false;

  // 1. Linguagem de baixo calão / palavrão
  if (profanityResult.hasProfanity) {
    warnings.push({
      category: 'PROFANITY',
      title: 'Linguagem de Baixo Calão Detectada',
      description: `Foram identificados termos inadequados no texto (${profanityResult.foundWords.length} ocorrência(s)).`,
      recommendation: 'Recomendamos manter o debate cívico respeitoso. Se optar por postar mesmo assim, os termos serão obrigatoriamente substituídos por "######".'
    });
  }

  // 2. Acusação nominal de crime
  if (CRIME_ACCUSATION_REGEX.test(rawText)) {
    hasHighRisk = true;
    warnings.push({
      category: 'CRIME_ACCUSATION',
      title: 'Acusação Nominal de Crime ou Corrupção',
      description: 'O comentário contém acusações diretas que podem configurar calúnia, injúria ou difamação.',
      recommendation: 'Recomendamos relatar objetivamente os fatos e omissões na prestação do serviço público em vez de imputações nominais.'
    });
  }

  // 3. Menção a violência ou ameaça
  if (VIOLENCE_THREAT_REGEX.test(rawText)) {
    hasHighRisk = true;
    warnings.push({
      category: 'VIOLENCE_THREAT',
      title: 'Menção a Violência ou Intimidação',
      description: 'Identificamos palavras associadas a agressão física ou ameaça.',
      recommendation: 'A ouvidoria pública é um canal pacífico de cobrança democrática. Expressões de confronto devem ser removidas.'
    });
  }

  // 4. Exposição sensível de menores
  if (MINOR_SENSITIVE_REGEX.test(rawText)) {
    hasHighRisk = true;
    warnings.push({
      category: 'SENSITIVE_MINOR',
      title: 'Menção a Menores de Idade em Contexto Sensível',
      description: 'Identificamos menção a crianças ou adolescentes em situação de vulnerabilidade.',
      recommendation: 'Proteja a identidade e intimidade de menores na discussão pública.'
    });
  }

  // 5. Dados Pessoais (LGPD)
  if (sanitization.hasPii) {
    warnings.push({
      category: 'PII',
      title: 'Dados Pessoais Identificáveis (LGPD)',
      description: `Foram detectados dados protegidos: ${sanitization.detectedPiiTypes.join(', ')}.`,
      recommendation: 'Para sua privacidade, esses dados pessoais foram automaticamente censurados.'
    });
  }

  return {
    hasWarnings: warnings.length > 0,
    warnings,
    originalText: rawText,
    previewText: profanityResult.maskedText,
    hasProfanity: profanityResult.hasProfanity,
    hasHighRisk,
    maskedWords: profanityResult.foundWords
  };
}

/**
 * Avalia riscos de um comentário antes da persistência.
 * Substitui termos de baixo calão por ###### deterministamente.
 */
export function evaluateCommentRisk(rawText: string, _authorChoseToPostAnyway = false): CommentEvaluationResult {
  const sanitization = sanitizeText(rawText);
  const profanityResult = maskProfanity(sanitization.sanitizedText);
  const riskFlags: string[] = [];

  if (sanitization.hasPii) {
    riskFlags.push(...sanitization.detectedPiiTypes.map(t => `PII_${t}`));
  }

  if (profanityResult.hasProfanity) {
    riskFlags.push('PROFANITY_DETECTED');
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

  const hasSevereRisk = riskFlags.some(f => 
    f === 'NOMINAL_CRIME_ACCUSATION' || 
    f === 'VIOLENCE_OR_THREAT' || 
    f === 'SENSITIVE_MINOR_DATA' ||
    f.startsWith('PII_')
  );

  return {
    sanitizedText: profanityResult.maskedText,
    moderationState: hasSevereRisk ? 'AUTO_FLAGGED' : 'APPROVED',
    riskFlags,
    requiresHumanReview: hasSevereRisk,
    hasProfanity: profanityResult.hasProfanity,
    maskedProfanitiesCount: profanityResult.foundWords.length
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
