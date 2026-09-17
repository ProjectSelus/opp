import { describe, it, expect } from 'vitest';
import {
  FormalManifestation,
  FormalManifestationStatus,
  Issue,
  IssueStatus,
  generateManifestationCode,
  validateSingleAdhesionPerUser,
  buildFormalDocumentHtml,
  processManifestationWithdrawal
} from '../src/index.js';

describe('Formal Manifestations and Documents (Seções 3, 8, 14, 21 & AC-04/AC-05)', () => {
  const mockIssue: Issue = {
    issueId: 'OPP-MN-2026-00142',
    municipalityId: 'mundo-novo-ms',
    title: 'Falta de iluminação na Rua das Flores',
    publicSummary: 'Postes apagados',
    categoryId: 'iluminacao',
    locationApprox: {
      neighborhood: 'Centro',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: IssueStatus.OPEN,
    agencyIds: ['sec-obras'],
    rootManifestationId: 'MF-00142-ROOT',
    formalSupportCount: 1,
    commentCount: 0,
    followerCount: 1,
    lastPublicActivityAt: '2026-09-02T10:00:00Z',
    searchTokens: ['iluminacao'],
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
    createdBy: 'user-001',
    moderationState: 'APPROVED',
    schemaVersion: 3
  };

  const mockManifestation: FormalManifestation = {
    manifestationId: 'mf-001',
    issueId: 'OPP-MN-2026-00142',
    userId: 'user-002',
    municipalityId: 'mundo-novo-ms',
    isRoot: false,
    status: FormalManifestationStatus.USER_CONFIRMED,
    citizenStatement: 'Moro nesta rua há 10 anos e o trecho está completamente escuro.',
    useBaseText: false,
    consents: {
      termVersion: 'v1.0',
      acceptedAt: '2026-09-05T10:00:00Z',
      userId: 'user-002',
      sanitizedPublicationConsent: true,
      electronicTransmissionAuthorized: true,
      receiveEmailCopy: true
    },
    identificationRequiredByChannel: {
      fullNameProvided: true,
      cpfProvided: true,
      emailProvided: true
    },
    createdAt: '2026-09-05T10:00:00Z',
    updatedAt: '2026-09-05T10:00:00Z'
  };

  it('should generate standardized manifestation codes according to Section 3.2', () => {
    expect(generateManifestationCode(142, undefined, true)).toBe('MF-00142-ROOT');
    expect(generateManifestationCode(142, 1, false)).toBe('MF-00142-A001');
    expect(generateManifestationCode(142, 28, false)).toBe('MF-00142-A028');
  });

  it('should enforce only one active formal adhesion per user per issue (Seção 14.1)', () => {
    // Caso 1: Usuário já possui adesão ativa
    const validationActive = validateSingleAdhesionPerUser('user-002', [mockManifestation]);
    expect(validationActive.valid).toBe(false);
    expect(validationActive.error).toContain('já possui uma adesão formal ativa');

    // Caso 2: Outro usuário
    const validationOtherUser = validateSingleAdhesionPerUser('user-003', [mockManifestation]);
    expect(validationOtherUser.valid).toBe(true);

    // Caso 3: Adesão anterior foi encerrada (CLOSED)
    const closedManifestation = { ...mockManifestation, status: FormalManifestationStatus.CLOSED };
    const validationClosed = validateSingleAdhesionPerUser('user-002', [closedManifestation]);
    expect(validationClosed.valid).toBe(true);
  });

  it('should build formal document HTML with mandatory legal references (Seção 21)', () => {
    const doc = buildFormalDocumentHtml({
      manifestation: mockManifestation,
      issue: mockIssue,
      citizenFullName: 'Maria Oliveira',
      citizenCpfMasked: '***.456.789-**',
      citizenEmail: 'maria@exemplo.com',
      agencyName: 'Secretaria Municipal de Obras',
      municipalityName: 'Mundo Novo',
      protocolCode: 'MF-00142-A001'
    });

    expect(doc.html).toContain('Solicitação de Providências — Manifestação Cidadã');
    expect(doc.html).toContain('MF-00142-A001');
    expect(doc.html).toContain('Maria Oliveira');
    expect(doc.html).toContain('Lei Federal nº 13.460/2017');
    expect(doc.html).toContain(doc.referenceText);
    expect(doc.referenceText).toContain('Esta manifestação está vinculada ao problema público OPP-MN-2026-00142');
  });

  it('should process non-destructive withdrawal with audit record (Seção 14.2)', () => {
    const { updatedManifestation, auditEvent } = processManifestationWithdrawal(
      mockManifestation,
      'user-002',
      'Mudança de endereço'
    );

    expect(updatedManifestation.status).toBe(FormalManifestationStatus.CLOSED);
    expect(auditEvent.action).toBe('MANIFESTATION_WITHDRAWN');
    expect(auditEvent.actorId).toBe('user-002');
    expect(auditEvent.metadata?.reason).toBe('Mudança de endereço');

    // Bloqueia cancelamento por terceiro
    expect(() => {
      processManifestationWithdrawal(mockManifestation, 'user-invasor', 'tentativa indevida');
    }).toThrow('Apenas o próprio cidadão autor pode solicitar a retirada');
  });
});
