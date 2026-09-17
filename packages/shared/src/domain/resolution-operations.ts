import {
  Issue,
  AgencyResponse,
  PublicAgencyResponse,
  AuditEvent
} from './entities.js';
import { IssueStatus } from './state-machines.js';
import { sanitizeText } from '../utils/sanitizer.js';

export type ResolutionVoteOption = 'SIM' | 'PARCIALMENTE' | 'NAO' | 'NAO_SEI_AVALIAR';

export interface CitizenResolutionVote {
  voteId: string;
  issueId: string;
  userId: string;
  vote: ResolutionVoteOption;
  comment?: string;
  votedAt: string;
}

export interface ResolutionConsensusResult {
  consensusStatus: 'RESOLVED' | 'PARTIALLY_RESOLVED' | 'UNRESOLVED' | 'DISPUTED' | 'AWAITING_QUORUM';
  totalVotes: number;
  totalDecisiveVotes: number;
  counts: Record<ResolutionVoteOption, number>;
  percentages: Record<ResolutionVoteOption, number>;
  recommendedIssueStatus: IssueStatus;
}

/**
 * Processa a resposta oficial do órgão público, executando higienização de PII
 * e preparando a publicação para escrutínio dos cidadãos (Seção 22.1).
 */
export function processAgencyResponse(
  rawResponse: AgencyResponse,
  issue: Issue
): {
  publicResponse: PublicAgencyResponse;
  updatedIssueStatus: IssueStatus;
  auditEvent: AuditEvent;
} {
  const now = new Date().toISOString();

  // 1. Higienização mandatória de dados pessoais (LGPD)
  const { sanitizedText } = sanitizeText(rawResponse.rawContent);
  const sanitizedSummary = sanitizedText.length > 250
    ? sanitizedText.substring(0, 247).trim() + '...'
    : sanitizedText;

  const publicResponse: PublicAgencyResponse = {
    responseId: rawResponse.responseId,
    issueId: issue.issueId,
    agencyId: rawResponse.agencyId,
    sanitizedSummary,
    sanitizedContent: sanitizedText,
    protocolNumber: rawResponse.protocolNumber,
    publishedAt: now
  };

  // 2. Quando o órgão responde, o issue entra no status RESPONDED para deliberação cidadã
  const updatedIssueStatus = IssueStatus.RESPONDED;

  // 3. Trilha de auditoria append-only
  const auditEvent: AuditEvent = {
    eventId: `AUD-RES-${rawResponse.responseId}`,
    timestamp: now,
    correlationId: issue.issueId,
    actorType: 'SYSTEM',
    actorId: rawResponse.agencyId,
    action: 'AGENCY_RESPONSE_PUBLISHED',
    entityType: 'AGENCY_RESPONSE',
    entityId: rawResponse.responseId,
    metadata: {
      issueId: issue.issueId,
      protocolNumber: rawResponse.protocolNumber,
      channelReceived: rawResponse.channelReceived
    }
  };

  return {
    publicResponse,
    updatedIssueStatus,
    auditEvent
  };
}

/**
 * Calcula o consenso comunitário e deliberação coletiva sobre a resolução do problema (Seção 22.2).
 * Baseia-se na votação direta dos cidadãos afetados pelo problema público.
 */
export function computeResolutionConsensus(
  votes: CitizenResolutionVote[],
  minQuorum: number = 3
): ResolutionConsensusResult {
  const counts: Record<ResolutionVoteOption, number> = {
    SIM: 0,
    PARCIALMENTE: 0,
    NAO: 0,
    NAO_SEI_AVALIAR: 0
  };

  for (const v of votes) {
    if (counts[v.vote] !== undefined) {
      counts[v.vote]++;
    }
  }

  const totalVotes = votes.length;
  // Votos decisivos desconsideram quem optou por "NÃO SEI AVALIAR"
  const totalDecisiveVotes = counts.SIM + counts.PARCIALMENTE + counts.NAO;

  const percentages: Record<ResolutionVoteOption, number> = {
    SIM: totalDecisiveVotes > 0 ? Math.round((counts.SIM / totalDecisiveVotes) * 100) : 0,
    PARCIALMENTE: totalDecisiveVotes > 0 ? Math.round((counts.PARCIALMENTE / totalDecisiveVotes) * 100) : 0,
    NAO: totalDecisiveVotes > 0 ? Math.round((counts.NAO / totalDecisiveVotes) * 100) : 0,
    NAO_SEI_AVALIAR: totalVotes > 0 ? Math.round((counts.NAO_SEI_AVALIAR / totalVotes) * 100) : 0
  };

  // Se o quórum mínimo ainda não foi atingido, aguarda mais avaliações cidadãs
  if (totalDecisiveVotes < minQuorum) {
    return {
      consensusStatus: 'AWAITING_QUORUM',
      totalVotes,
      totalDecisiveVotes,
      counts,
      percentages,
      recommendedIssueStatus: IssueStatus.RESPONDED
    };
  }

  // Maioria absoluta ou qualificada (>= 60%) confirmando resolução total
  if (percentages.SIM >= 60) {
    return {
      consensusStatus: 'RESOLVED',
      totalVotes,
      totalDecisiveVotes,
      counts,
      percentages,
      recommendedIssueStatus: IssueStatus.RESOLVED
    };
  }

  // Mais de 50% indicando que o problema NÃO foi resolvido
  if (percentages.NAO >= 50) {
    return {
      consensusStatus: 'UNRESOLVED',
      totalVotes,
      totalDecisiveVotes,
      counts,
      percentages,
      recommendedIssueStatus: IssueStatus.UNRESOLVED
    };
  }

  // Soma de SIM e PARCIALMENTE atinge 60%
  if (percentages.SIM + percentages.PARCIALMENTE >= 60) {
    return {
      consensusStatus: 'PARTIALLY_RESOLVED',
      totalVotes,
      totalDecisiveVotes,
      counts,
      percentages,
      recommendedIssueStatus: IssueStatus.PARTIALLY_RESOLVED
    };
  }

  // Divergência acentuada entre os cidadãos
  return {
    consensusStatus: 'DISPUTED',
    totalVotes,
    totalDecisiveVotes,
    counts,
    percentages,
    recommendedIssueStatus: IssueStatus.DISPUTED
  };
}

/**
 * Valida a submissão de um voto de feedback cívico (Seção 22.2).
 */
export function validateCitizenFeedbackVote(
  userId: string,
  issueId: string,
  existingVotes: CitizenResolutionVote[]
): {
  isValid: boolean;
  error?: string;
  isUpdate: boolean;
} {
  if (!userId || !issueId) {
    return { isValid: false, error: 'Identificadores de usuário e problema são obrigatórios.', isUpdate: false };
  }

  const existingVote = existingVotes.find(v => v.userId === userId && v.issueId === issueId);

  return {
    isValid: true,
    isUpdate: Boolean(existingVote)
  };
}
