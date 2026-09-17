import { describe, it, expect } from 'vitest';
import {
  groupManifestationsForDispatch,
  buildAgencyDispatchEmail,
  buildCitizenConfirmationEmail,
  computeRetryBackoffMinutes
} from '../src/domain/dispatch-operations.js';
import { Issue, FormalManifestation, Agency, AgencyChannel } from '../src/domain/entities.js';

describe('Operações de Despacho em Lote e Notificações (Fase 8 / AC-06 & AC-08)', () => {
  const sampleIssue: Issue = {
    issueId: 'OPP-MN-2026-00142',
    municipalityId: 'mundo-novo-ms',
    title: 'Postes com lâmpadas apagadas na Rua das Flores',
    publicSummary: 'Trecho com 5 postes sem iluminação.',
    categoryId: 'iluminacao',
    locationApprox: {
      neighborhood: 'Bairro Centro',
      streetApprox: 'Rua das Flores, 400',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: 'OPEN',
    agencyIds: ['sec-obras-mn'],
    rootManifestationId: 'MF-00142-ROOT',
    formalSupportCount: 3,
    commentCount: 0,
    followerCount: 5,
    lastPublicActivityAt: '2026-09-16T10:00:00.000Z',
    searchTokens: ['iluminacao', 'rua', 'flores'],
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    createdBy: 'user-01',
    moderationState: 'APPROVED',
    schemaVersion: 3
  };

  const sampleAgency: Agency = {
    agencyId: 'sec-obras-mn',
    municipalityId: 'mundo-novo-ms',
    name: 'Secretaria Municipal de Obras e Serviços Urbanos',
    acronym: 'SEMOB',
    categories: ['iluminacao'],
    active: true,
    channels: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  const sampleChannel: AgencyChannel = {
    channelId: 'ch-semob-email',
    agencyId: 'sec-obras-mn',
    type: 'EMAIL',
    addressOrUrl: 'obras@mundonovo.ms.gov.br',
    acceptsAutomatedSubmission: true,
    requiresIdentity: true,
    requiresAuthentication: false,
    verificationStatus: 'VERIFIED'
  };

  const sampleManifestations: FormalManifestation[] = [
    {
      manifestationId: 'MF-ROOT',
      issueId: 'OPP-MN-2026-00142',
      userId: 'user-01',
      protocolCode: 'MF-00142-ROOT',
      isRoot: true,
      status: 'QUEUED_FOR_DISPATCH',
      consentTermAccepted: true,
      documentHash: 'hash-sha256-root',
      createdAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-09-10T10:00:00.000Z'
    },
    {
      manifestationId: 'MF-A001',
      issueId: 'OPP-MN-2026-00142',
      userId: 'user-02',
      protocolCode: 'MF-00142-A001',
      isRoot: false,
      status: 'QUEUED_FOR_DISPATCH',
      consentTermAccepted: true,
      documentHash: 'hash-sha256-a001',
      createdAt: '2026-09-11T14:00:00.000Z',
      updatedAt: '2026-09-11T14:00:00.000Z'
    },
    {
      manifestationId: 'MF-A002',
      issueId: 'OPP-MN-2026-00142',
      userId: 'user-03',
      protocolCode: 'MF-00142-A002',
      isRoot: false,
      status: 'QUEUED_FOR_DISPATCH',
      consentTermAccepted: true,
      documentHash: 'hash-sha256-a002',
      createdAt: '2026-09-12T09:00:00.000Z',
      updatedAt: '2026-09-12T09:00:00.000Z'
    }
  ];

  it('[Critério AC-06] deve agrupar múltiplas adesões em lote único de despacho com chave de idempotência', () => {
    const { dispatch, items, auditEvent } = groupManifestationsForDispatch({
      issue: sampleIssue,
      manifestations: sampleManifestations,
      agency: sampleAgency,
      channel: sampleChannel,
      batchMode: 'DAILY_BATCH'
    });

    expect(dispatch.itemsCount).toBe(3);
    expect(items.length).toBe(3);
    expect(items[0].code).toBe('MF-00142-ROOT');
    expect(items[1].code).toBe('MF-00142-A001');
    expect(items[2].code).toBe('MF-00142-A002');
    expect(dispatch.dispatchId).toContain('DSP-MN-2026-00142-SEMOB');
    expect(dispatch.rawContentHash).toBeDefined();
    expect(dispatch.status).toBe('QUEUED');
    expect(auditEvent.action).toBe('CREATE_BATCH');
    expect(auditEvent.entityType).toBe('DISPATCH');
  });

  it('deve formatar e-mail de despacho ao órgão citando a Lei 13.460/2017 e metadados formais', () => {
    const { dispatch } = groupManifestationsForDispatch({
      issue: sampleIssue,
      manifestations: sampleManifestations,
      agency: sampleAgency,
      channel: sampleChannel,
      batchMode: 'HOURLY_BATCH'
    });

    const mail = buildAgencyDispatchEmail(dispatch, sampleIssue, sampleAgency, sampleChannel);

    expect(mail.to).toBe('obras@mundonovo.ms.gov.br');
    expect(mail.subject).toContain('Solicitação Coletiva de Providências');
    expect(mail.subject).toContain('3 manifestações formais vinculadas');
    expect(mail.bodyText).toContain('Lei Federal nº 13.460');
    expect(mail.bodyText).toContain('OPP-MN-2026-00142');
    expect(mail.headers?.['X-OPP-Dispatch-Id']).toBe(dispatch.dispatchId);
  });

  it('[Critério AC-08] deve gerar e-mail de cópia para o cidadão com protocolo e garantia LGPD', () => {
    const citizenMail = buildCitizenConfirmationEmail(
      'cidadao@exemplo.com.br',
      sampleManifestations[1],
      sampleIssue,
      'Secretaria Municipal de Obras (SEMOB)'
    );

    expect(citizenMail.to).toBe('cidadao@exemplo.com.br');
    expect(citizenMail.subject).toContain('Protocolo MF-00142-A001');
    expect(citizenMail.bodyText).toContain('MF-00142-A001');
    expect(citizenMail.bodyText).toContain('hash-sha256-a001');
    expect(citizenMail.bodyText).toContain('LGPD (Lei 13.709/2018)');
    expect(citizenMail.headers?.['X-OPP-Protocol-Code']).toBe('MF-00142-A001');
  });

  it('deve calcular retentativas com backoff exponencial correto (Seção 10.2)', () => {
    expect(computeRetryBackoffMinutes(0)).toBe(1);
    expect(computeRetryBackoffMinutes(1)).toBe(5);
    expect(computeRetryBackoffMinutes(2)).toBe(15);
  });
});
