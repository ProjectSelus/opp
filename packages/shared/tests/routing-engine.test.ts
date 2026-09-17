import { describe, it, expect } from 'vitest';
import {
  computeIssueRouting,
  validateAgencyChannel,
  verifyAgencyChannel
} from '../src/domain/routing-engine.js';
import { Agency, AgencyChannel } from '../src/domain/entities.js';

describe('Motor de Roteamento Cívico e Verificação de Canais (Fase 7 / AC-07)', () => {
  const sampleAgencies: Agency[] = [
    {
      agencyId: 'sec-obras-mn',
      municipalityId: 'mundo-novo-ms',
      name: 'Secretaria Municipal de Obras e Serviços Urbanos',
      acronym: 'SEMOB',
      categories: ['iluminacao', 'vias', 'limpeza'],
      active: true,
      channels: [
        {
          channelId: 'ch-semob-email',
          agencyId: 'sec-obras-mn',
          type: 'EMAIL',
          addressOrUrl: 'obras@mundonovo.ms.gov.br',
          acceptsAutomatedSubmission: true,
          requiresIdentity: true,
          requiresAuthentication: false,
          sourceUrl: 'https://mundonovo.ms.gov.br/diario-oficial/001',
          verifiedAt: '2026-08-10T10:00:00.000Z',
          verificationStatus: 'VERIFIED'
        }
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-08-10T10:00:00.000Z'
    },
    {
      agencyId: 'sec-saude-mn',
      municipalityId: 'mundo-novo-ms',
      name: 'Secretaria Municipal de Saúde',
      acronym: 'SMS',
      categories: ['saude'],
      active: true,
      channels: [
        {
          channelId: 'ch-saude-falabr',
          agencyId: 'sec-saude-mn',
          type: 'FALABR',
          addressOrUrl: 'https://falabr.cgu.gov.br',
          acceptsAutomatedSubmission: false,
          requiresIdentity: true,
          requiresAuthentication: true,
          sourceUrl: 'https://falabr.cgu.gov.br',
          verifiedAt: '2026-07-01T10:00:00.000Z',
          verificationStatus: 'VERIFIED'
        }
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-07-01T10:00:00.000Z'
    },
    {
      agencyId: 'sec-meio-ambiente-mn',
      municipalityId: 'mundo-novo-ms',
      name: 'Secretaria Municipal de Meio Ambiente',
      acronym: 'SEMA',
      categories: ['meio_ambiente'],
      active: true,
      channels: [
        {
          channelId: 'ch-sema-unverified',
          agencyId: 'sec-meio-ambiente-mn',
          type: 'EMAIL',
          addressOrUrl: 'meioambiente.teste@mundonovo.ms.gov.br',
          acceptsAutomatedSubmission: true,
          requiresIdentity: true,
          requiresAuthentication: false,
          verificationStatus: 'UNVERIFIED' // Canal não verificado!
        }
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      agencyId: 'ouvidoria-geral-mn',
      municipalityId: 'mundo-novo-ms',
      name: 'Ouvidoria Geral do Município',
      acronym: 'OGM',
      categories: ['ouvidoria_geral'],
      active: true,
      channels: [
        {
          channelId: 'ch-ogm-email',
          agencyId: 'ouvidoria-geral-mn',
          type: 'EMAIL',
          addressOrUrl: 'ouvidoria@mundonovo.ms.gov.br',
          acceptsAutomatedSubmission: true,
          requiresIdentity: true,
          requiresAuthentication: false,
          sourceUrl: 'https://mundonovo.ms.gov.br/ouvidoria',
          verifiedAt: '2026-01-15T08:00:00.000Z',
          verificationStatus: 'VERIFIED'
        }
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-15T08:00:00.000Z'
    }
  ];

  it('deve autorizar envio automatizado para canal de e-mail oficial VERIFICADO', () => {
    const decision = computeIssueRouting(
      {
        issueId: 'OPP-001',
        municipalityId: 'mundo-novo-ms',
        categoryId: 'iluminacao',
        agencyIds: ['sec-obras-mn']
      },
      sampleAgencies
    );

    expect(decision.routingStatus).toBe('AUTOMATED_DISPATCH_READY');
    expect(decision.canSendAutomatedEmail).toBe(true);
    expect(decision.requiresHumanReview).toBe(false);
    expect(decision.targetAgencyId).toBe('sec-obras-mn');
    expect(decision.selectedChannel?.addressOrUrl).toBe('obras@mundonovo.ms.gov.br');
  });

  it('[Critério AC-07] deve BLOQUEAR envio automatizado se o canal for NÃO VERIFICADO', () => {
    const decision = computeIssueRouting(
      {
        issueId: 'OPP-002',
        municipalityId: 'mundo-novo-ms',
        categoryId: 'meio_ambiente',
        agencyIds: ['sec-meio-ambiente-mn']
      },
      sampleAgencies
    );

    expect(decision.routingStatus).toBe('BLOCKED_UNVERIFIED_CHANNEL');
    expect(decision.canSendAutomatedEmail).toBe(false);
    expect(decision.requiresHumanReview).toBe(true);
    expect(decision.reason).toContain('[Critério AC-07]');
    expect(decision.reason).toContain('NÃO VERIFICADO');
  });

  it('deve marcar como despacho manual canais que não aceitam automação (ex: Fala.BR)', () => {
    const decision = computeIssueRouting(
      {
        issueId: 'OPP-003',
        municipalityId: 'mundo-novo-ms',
        categoryId: 'saude',
        agencyIds: ['sec-saude-mn']
      },
      sampleAgencies
    );

    expect(decision.routingStatus).toBe('NEEDS_MANUAL_DISPATCH');
    expect(decision.canSendAutomatedEmail).toBe(false);
    expect(decision.requiresHumanReview).toBe(true);
  });

  it('deve fazer fallback para Ouvidoria Geral quando não há órgão especializado para a categoria', () => {
    const decision = computeIssueRouting(
      {
        issueId: 'OPP-004',
        municipalityId: 'mundo-novo-ms',
        categoryId: 'assistencia_social_inespecificada',
        agencyIds: []
      },
      sampleAgencies
    );

    expect(decision.routingStatus).toBe('FALLBACK_GENERAL_OMBUDSMAN');
    expect(decision.targetAgencyId).toBe('ouvidoria-geral-mn');
    expect(decision.canSendAutomatedEmail).toBe(true);
  });

  it('deve validar canais com regras de integridade e rejeitar e-mail inválido ou falta de sourceUrl', () => {
    const invalidEmailChannel: Partial<AgencyChannel> = {
      type: 'EMAIL',
      addressOrUrl: 'email-invalido-sem-arroba',
      verificationStatus: 'VERIFIED',
      sourceUrl: ''
    };

    const validation = validateAgencyChannel(invalidEmailChannel);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Endereço de e-mail inválido para o canal do órgão.');
    expect(validation.errors).toContain('Canais com status VERIFICADO devem obrigatoriamente informar a URL da fonte oficial comprobatória.');
  });

  it('deve atualizar status de canal para VERIFIED com fonte comprobatória', () => {
    const rawChannel: AgencyChannel = {
      channelId: 'ch-test',
      agencyId: 'sec-obras-mn',
      type: 'EMAIL',
      addressOrUrl: 'valid@mundonovo.ms.gov.br',
      acceptsAutomatedSubmission: false,
      requiresIdentity: true,
      requiresAuthentication: false,
      verificationStatus: 'UNVERIFIED'
    };

    const verified = verifyAgencyChannel(
      rawChannel,
      'https://diario.mundonovo.ms.gov.br/edicao-400',
      'auditor-cívico-01',
      true
    );

    expect(verified.verificationStatus).toBe('VERIFIED');
    expect(verified.sourceUrl).toBe('https://diario.mundonovo.ms.gov.br/edicao-400');
    expect(verified.acceptsAutomatedSubmission).toBe(true);
    expect(verified.verifiedAt).toBeDefined();
  });
});
