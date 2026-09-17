/**
 * Operações de Domínio Issue-Centric: Fusão (Merge) e Divisão (Split)
 * Em conformidade com a Seção 3.4 e Critério AC-12
 */

import { Issue, AuditEvent } from './entities.js';
import { IssueStatus } from './state-machines.js';

export interface MergeResult {
  updatedTarget: Issue;
  updatedSource: Issue;
  auditEvents: AuditEvent[];
}

export interface SplitResult {
  updatedOriginal: Issue;
  newIssue: Issue;
  auditEvents: AuditEvent[];
}

/**
 * Valida se a fusão entre dois issues é permitida pelas regras de domínio
 */
export function validateMergeIssues(
  targetIssue: Issue,
  sourceIssue: Issue
): { valid: boolean; error?: string } {
  if (targetIssue.issueId === sourceIssue.issueId) {
    return { valid: false, error: 'Não é possível fundir um problema em si mesmo.' };
  }

  if (targetIssue.municipalityId !== sourceIssue.municipalityId) {
    return { valid: false, error: 'Apenas problemas do mesmo município podem ser unificados.' };
  }

  if (sourceIssue.status === IssueStatus.MERGED) {
    return { valid: false, error: 'O problema de origem já está unificado em outro registro.' };
  }

  if (targetIssue.status === IssueStatus.MERGED) {
    return { valid: false, error: 'O problema de destino não pode ser um registro unificado.' };
  }

  if (sourceIssue.status === IssueStatus.ARCHIVED || sourceIssue.status === IssueStatus.CLOSED) {
    return { valid: false, error: 'Problemas encerrados ou arquivados não podem ser unificados.' };
  }

  return { valid: true };
}

/**
 * Executa o cálculo da fusão de dois problemas públicos preservando histórico e dados
 */
export function computeMergedIssue(
  targetIssue: Issue,
  sourceIssue: Issue,
  moderatorId: string,
  reason: string
): MergeResult {
  const validation = validateMergeIssues(targetIssue, sourceIssue);
  if (!validation.valid) {
    throw new Error(validation.error || 'Erro de validação na fusão');
  }

  const now = new Date().toISOString();
  const correlationId = `merge-${sourceIssue.issueId}-into-${targetIssue.issueId}-${Date.now()}`;

  // Combina agências sem duplicidade
  const combinedAgencyIds = Array.from(new Set([...targetIssue.agencyIds, ...sourceIssue.agencyIds]));

  // Combina tokens de busca sem duplicidade
  const combinedTokens = Array.from(new Set([...targetIssue.searchTokens, ...sourceIssue.searchTokens]));

  const updatedTarget: Issue = {
    ...targetIssue,
    formalSupportCount: targetIssue.formalSupportCount + sourceIssue.formalSupportCount,
    commentCount: targetIssue.commentCount + sourceIssue.commentCount,
    followerCount: targetIssue.followerCount + sourceIssue.followerCount,
    agencyIds: combinedAgencyIds,
    searchTokens: combinedTokens,
    lastPublicActivityAt: now,
    updatedAt: now,
    mergeHistory: [
      ...(targetIssue.mergeHistory || []),
      {
        sourceIssueId: sourceIssue.issueId,
        mergedAt: now,
        reason,
        moderatorId
      }
    ]
  };

  const updatedSource: Issue = {
    ...sourceIssue,
    status: IssueStatus.MERGED,
    mergedIntoIssueId: targetIssue.issueId,
    updatedAt: now
  };

  const auditEvents: AuditEvent[] = [
    {
      eventId: `audit-source-${Date.now()}`,
      timestamp: now,
      actorType: 'MODERATOR',
      actorId: moderatorId,
      action: 'ISSUE_MERGED_AS_SOURCE',
      entityType: 'ISSUE',
      entityId: sourceIssue.issueId,
      metadata: {
        mergedIntoIssueId: targetIssue.issueId,
        reason
      },
      correlationId
    },
    {
      eventId: `audit-target-${Date.now()}`,
      timestamp: now,
      actorType: 'MODERATOR',
      actorId: moderatorId,
      action: 'ISSUE_MERGED_AS_TARGET',
      entityType: 'ISSUE',
      entityId: targetIssue.issueId,
      metadata: {
        mergedSourceIssueId: sourceIssue.issueId,
        reason
      },
      correlationId
    }
  ];

  return {
    updatedTarget,
    updatedSource,
    auditEvents
  };
}

/**
 * Valida a divisão de um problema que continha situações distintas
 */
export function validateSplitIssue(
  originalIssue: Issue,
  movedManifestationCount: number
): { valid: boolean; error?: string } {
  if (movedManifestationCount <= 0) {
    return { valid: false, error: 'Pelo menos uma manifestação deve ser movida na divisão.' };
  }

  if (movedManifestationCount >= originalIssue.formalSupportCount) {
    return { valid: false, error: 'A manifestação raiz ou remanescentes devem permanecer no problema original.' };
  }

  return { valid: true };
}

/**
 * Executa a divisão de um issue criando uma nova entidade derivada
 */
export function computeSplitIssue(
  originalIssue: Issue,
  newIssueParams: {
    issueId: string;
    rootManifestationId: string;
    title: string;
    publicSummary: string;
    categoryId: string;
    locationApprox: Issue['locationApprox'];
    searchTokens: string[];
    createdBy: string;
  },
  movedManifestationCount: number,
  moderatorId: string,
  reason: string
): SplitResult {
  const validation = validateSplitIssue(originalIssue, movedManifestationCount);
  if (!validation.valid) {
    throw new Error(validation.error || 'Erro na validação da divisão');
  }

  const now = new Date().toISOString();
  const correlationId = `split-${originalIssue.issueId}-to-${newIssueParams.issueId}-${Date.now()}`;

  const updatedOriginal: Issue = {
    ...originalIssue,
    formalSupportCount: originalIssue.formalSupportCount - movedManifestationCount,
    updatedAt: now
  };

  const newIssue: Issue = {
    issueId: newIssueParams.issueId,
    municipalityId: originalIssue.municipalityId,
    title: newIssueParams.title,
    publicSummary: newIssueParams.publicSummary,
    categoryId: newIssueParams.categoryId,
    locationApprox: newIssueParams.locationApprox,
    status: IssueStatus.OPEN,
    agencyIds: [...originalIssue.agencyIds],
    rootManifestationId: newIssueParams.rootManifestationId,
    formalSupportCount: movedManifestationCount,
    commentCount: 0,
    followerCount: 1,
    lastPublicActivityAt: now,
    searchTokens: newIssueParams.searchTokens,
    createdAt: now,
    updatedAt: now,
    createdBy: newIssueParams.createdBy,
    moderationState: 'APPROVED',
    schemaVersion: 3,
    splitFromIssueId: originalIssue.issueId
  };

  const auditEvents: AuditEvent[] = [
    {
      eventId: `audit-split-orig-${Date.now()}`,
      timestamp: now,
      actorType: 'MODERATOR',
      actorId: moderatorId,
      action: 'ISSUE_SPLIT_SOURCE',
      entityType: 'ISSUE',
      entityId: originalIssue.issueId,
      metadata: {
        newIssueId: newIssue.issueId,
        movedCount: movedManifestationCount,
        reason
      },
      correlationId
    },
    {
      eventId: `audit-split-new-${Date.now()}`,
      timestamp: now,
      actorType: 'MODERATOR',
      actorId: moderatorId,
      action: 'ISSUE_SPLIT_CREATED',
      entityType: 'ISSUE',
      entityId: newIssue.issueId,
      metadata: {
        splitFromIssueId: originalIssue.issueId,
        reason
      },
      correlationId
    }
  ];

  return {
    updatedOriginal,
    newIssue,
    auditEvents
  };
}
