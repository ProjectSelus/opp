import { describe, it, expect } from 'vitest';
import {
  processAgencyResponse,
  computeResolutionConsensus,
  validateCitizenFeedbackVote,
  CitizenResolutionVote
} from '../src/domain/resolution-operations.js';
import { Issue, AgencyResponse } from '../src/domain/entities.js';
import { IssueStatus } from '../src/domain/state-machines.js';

describe('Ciclo de Resolução e Consenso Cidadão (Fase 9 / Seção 22)', () => {
  const sampleIssue: Issue = {
    issueId: 'OPP-MN-2026-00142',
    municipalityId: 'mundo-novo-ms',
    title: 'Postes apagados na Rua das Flores',
    publicSummary: 'Trecho sem iluminação.',
    categoryId: 'iluminacao',
    locationApprox: {
      neighborhood: 'Bairro Centro',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: IssueStatus.FORWARDED,
    agencyIds: ['sec-obras-mn'],
    rootManifestationId: 'MF-00142-ROOT',
    formalSupportCount: 15,
    commentCount: 2,
    followerCount: 20,
    lastPublicActivityAt: '2026-09-16T10:00:00.000Z',
    searchTokens: ['iluminacao'],
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-10T14:30:00.000Z',
    createdBy: 'user-01',
    moderationState: 'APPROVED',
    schemaVersion: 3
  };

  const sampleRawResponse: AgencyResponse = {
    responseId: 'RESP-001',
    issueId: 'OPP-MN-2026-00142',
    dispatchId: 'DSP-001',
    agencyId: 'sec-obras-mn',
    channelReceived: 'EMAIL',
    rawContent: 'Informamos que a equipe técnica esteve no local e realizou a substituição das 5 lâmpadas queimadas. Contato do fiscal João: 012.345.678-99 e fiscal@obras.gov.br.',
    protocolNumber: 'PROT-SEMOB-2026-889',
    senderEmailOrContact: 'obras@mundonovo.ms.gov.br',
    receivedAt: '2026-09-16T15:00:00.000Z',
    moderationState: 'SANITIZED_APPROVED'
  };

  it('deve sanitizar a resposta do órgão e gerar PublicAgencyResponse com auditoria', () => {
    const { publicResponse, updatedIssueStatus, auditEvent } = processAgencyResponse(
      sampleRawResponse,
      sampleIssue
    );

    expect(updatedIssueStatus).toBe(IssueStatus.RESPONDED);
    expect(publicResponse.protocolNumber).toBe('PROT-SEMOB-2026-889');
    expect(publicResponse.sanitizedContent).not.toContain('012.345.678-99');
    expect(publicResponse.sanitizedContent).toContain('***.***.***-**');
    expect(auditEvent.action).toBe('AGENCY_RESPONSE_PUBLISHED');
    expect(auditEvent.correlationId).toBe(sampleIssue.issueId);
  });

  it('deve aguardar quórum mínimo de deliberação antes de alterar status do problema', () => {
    const fewVotes: CitizenResolutionVote[] = [
      { voteId: 'v1', issueId: 'OPP-001', userId: 'u1', vote: 'SIM', votedAt: '2026-09-16T16:00:00Z' }
    ];

    const consensus = computeResolutionConsensus(fewVotes, 3);
    expect(consensus.consensusStatus).toBe('AWAITING_QUORUM');
    expect(consensus.recommendedIssueStatus).toBe(IssueStatus.RESPONDED);
  });

  it('deve classificar como RESOLVED quando a maioria qualificada (>= 60%) votar SIM', () => {
    const votes: CitizenResolutionVote[] = [
      { voteId: 'v1', issueId: 'OPP-001', userId: 'u1', vote: 'SIM', votedAt: '2026-09-16T16:00:00Z' },
      { voteId: 'v2', issueId: 'OPP-001', userId: 'u2', vote: 'SIM', votedAt: '2026-09-16T16:05:00Z' },
      { voteId: 'v3', issueId: 'OPP-001', userId: 'u3', vote: 'SIM', votedAt: '2026-09-16T16:10:00Z' },
      { voteId: 'v4', issueId: 'OPP-001', userId: 'u4', vote: 'NAO', votedAt: '2026-09-16T16:15:00Z' },
      { voteId: 'v5', issueId: 'OPP-001', userId: 'u5', vote: 'NAO_SEI_AVALIAR', votedAt: '2026-09-16T16:20:00Z' }
    ];

    // 3 SIM e 1 NAO = 4 votos decisivos. 3/4 = 75% SIM
    const consensus = computeResolutionConsensus(votes, 3);
    expect(consensus.consensusStatus).toBe('RESOLVED');
    expect(consensus.percentages.SIM).toBe(75);
    expect(consensus.percentages.NAO).toBe(25);
    expect(consensus.recommendedIssueStatus).toBe(IssueStatus.RESOLVED);
  });

  it('deve classificar como UNRESOLVED quando mais de 50% dos cidadãos votarem NÃO', () => {
    const votes: CitizenResolutionVote[] = [
      { voteId: 'v1', issueId: 'OPP-001', userId: 'u1', vote: 'NAO', votedAt: '2026-09-16T16:00:00Z' },
      { voteId: 'v2', issueId: 'OPP-001', userId: 'u2', vote: 'NAO', votedAt: '2026-09-16T16:05:00Z' },
      { voteId: 'v3', issueId: 'OPP-001', userId: 'u3', vote: 'SIM', votedAt: '2026-09-16T16:10:00Z' }
    ];

    // 2 NAO e 1 SIM = 67% NAO
    const consensus = computeResolutionConsensus(votes, 3);
    expect(consensus.consensusStatus).toBe('UNRESOLVED');
    expect(consensus.percentages.NAO).toBe(67);
    expect(consensus.recommendedIssueStatus).toBe(IssueStatus.UNRESOLVED);
  });

  it('deve classificar como PARTIALLY_RESOLVED quando a soma de SIM e PARCIALMENTE atingir 60%', () => {
    const votes: CitizenResolutionVote[] = [
      { voteId: 'v1', issueId: 'OPP-001', userId: 'u1', vote: 'SIM', votedAt: '2026-09-16T16:00:00Z' },
      { voteId: 'v2', issueId: 'OPP-001', userId: 'u2', vote: 'PARCIALMENTE', votedAt: '2026-09-16T16:05:00Z' },
      { voteId: 'v3', issueId: 'OPP-001', userId: 'u3', vote: 'PARCIALMENTE', votedAt: '2026-09-16T16:10:00Z' },
      { voteId: 'v4', issueId: 'OPP-001', userId: 'u4', vote: 'NAO', votedAt: '2026-09-16T16:15:00Z' }
    ];

    // 1 SIM (25%) + 2 PARCIALMENTE (50%) = 75%
    const consensus = computeResolutionConsensus(votes, 3);
    expect(consensus.consensusStatus).toBe('PARTIALLY_RESOLVED');
    expect(consensus.recommendedIssueStatus).toBe(IssueStatus.PARTIALLY_RESOLVED);
  });

  it('deve validar novo voto versus atualização de voto existente', () => {
    const votes: CitizenResolutionVote[] = [
      { voteId: 'v1', issueId: 'OPP-001', userId: 'user-123', vote: 'SIM', votedAt: '2026-09-16T16:00:00Z' }
    ];

    const updateCheck = validateCitizenFeedbackVote('user-123', 'OPP-001', votes);
    expect(updateCheck.isValid).toBe(true);
    expect(updateCheck.isUpdate).toBe(true);

    const newCheck = validateCitizenFeedbackVote('user-456', 'OPP-001', votes);
    expect(newCheck.isValid).toBe(true);
    expect(newCheck.isUpdate).toBe(false);
  });
});
