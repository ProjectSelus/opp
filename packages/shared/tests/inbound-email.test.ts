import { describe, it, expect } from 'vitest';
import {
  extractCorrelationIdentifiers,
  classifyEmailResponseType,
  extractProtocolNumber,
  processInboundEmail,
  buildIndividualAdhesionEmail,
  InboundEmailPayload,
  Issue,
  FormalManifestation,
  Agency,
  AgencyChannel
} from '../src/index.js';

describe('Inbound Email Pipeline & Individual Adhesion Dispatch', () => {
  const sampleIssue: Issue = {
    issueId: 'OPP-MN-2026-00142',
    municipalityId: 'mundo-novo-ms',
    title: 'Postes com lâmpadas apagadas na Rua das Flores',
    publicSummary: 'Trecho com 5 postes apagados causando escuridão.',
    categoryId: 'iluminacao',
    locationApprox: {
      neighborhood: 'Bairro Centro',
      streetApprox: 'Rua das Flores',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: 'FORWARDED',
    agencyIds: ['sec-obras-mn'],
    rootManifestationId: 'MF-00142-ROOT',
    formalSupportCount: 42,
    commentCount: 18,
    followerCount: 65,
    lastPublicActivityAt: '2026-09-15T18:20:00.000Z',
    searchTokens: ['iluminacao', 'rua', 'flores'],
    createdAt: '2026-09-02T10:14:00.000Z',
    updatedAt: '2026-09-15T18:20:00.000Z',
    createdBy: 'user-001',
    moderationState: 'APPROVED',
    schemaVersion: 3
  };

  const sampleManifestation: FormalManifestation = {
    manifestationId: 'MF-00142-A005',
    issueId: 'OPP-MN-2026-00142',
    userId: 'user-005',
    municipalityId: 'mundo-novo-ms',
    isRoot: false,
    status: 'TRANSMITTED',
    protocolCode: 'MF-00142-A005',
    citizenStatement: 'Moro no número 380 da Rua das Flores e o trecho está completamente às escuras há duas semanas.',
    useBaseText: false,
    consents: {
      termsAccepted: true,
      transmissionAuthorized: true,
      sanitizationConsent: true,
      timestamp: '2026-09-03T10:00:00.000Z',
      clientIpMasked: '177.***.***.12'
    },
    identificationRequiredByChannel: {
      fullNameProvided: true,
      cpfProvided: true,
      emailProvided: true
    },
    createdAt: '2026-09-03T10:00:00.000Z',
    updatedAt: '2026-09-03T10:00:00.000Z'
  };

  const sampleAgency: Agency = {
    agencyId: 'sec-obras-mn',
    municipalityId: 'mundo-novo-ms',
    name: 'Secretaria Municipal de Obras e Serviços Urbanos',
    acronym: 'SEMOB',
    categories: ['iluminacao', 'vias'],
    active: true,
    channels: [
      {
        channelId: 'ch-email-semob',
        agencyId: 'sec-obras-mn',
        type: 'EMAIL',
        addressOrUrl: 'obras@mundonovo.ms.gov.br',
        acceptsAutomatedSubmission: true,
        requiresIdentity: true,
        requiresAuthentication: false,
        verificationStatus: 'VERIFIED'
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };

  describe('1. Disparo Individual de Reclamação Formal Cidadã por E-mail', () => {
    it('deve construir o e-mail formal individual com Reply-To dinâmico e hash de integridade', () => {
      const email = buildIndividualAdhesionEmail({
        manifestation: sampleManifestation,
        issue: sampleIssue,
        agency: sampleAgency,
        agencyChannel: sampleAgency.channels[0],
        citizenFullName: 'Maria Aparecida Santos',
        citizenCpfMasked: '123.***.***-00',
        citizenEmail: 'maria.santos@email.com',
        municipalityName: 'Mundo Novo - MS'
      });

      expect(email.to).toBe('obras@mundonovo.ms.gov.br');
      expect(email.replyTo).toBe('resposta+OPP-MN-2026-00142+MF-00142-A005@ouvidoria.opp.org.br');
      expect(email.subject).toContain('OPP - Reclamação Cívica');
      expect(email.subject).toContain('MF-00142-A005');
      expect(email.bodyText).toContain('Maria Aparecida Santos');
      expect(email.bodyText).toContain('123.***.***-00');
      expect(email.bodyText).toContain('Lei Federal nº 13.460/2017');
      expect(email.documentHash).toHaveLength(64);
      expect(email.headers?.['X-OPP-Issue-Id']).toBe('OPP-MN-2026-00142');
      expect(email.headers?.['X-OPP-Manifestation-Id']).toBe('MF-00142-A005');
    });
  });

  describe('2. Extração de Identificadores e Correlação de E-mails Recebidos', () => {
    it('deve correlacionar o e-mail pelo endereço Reply-To dinâmico (Plus Addressing)', () => {
      const payload: InboundEmailPayload = {
        from: 'obras@mundonovo.ms.gov.br',
        to: 'resposta+OPP-MN-2026-00142+MF-00142-A005@ouvidoria.opp.org.br',
        subject: 'Re: [OPP - Reclamação Cívica] Postes com lâmpadas apagadas',
        bodyText: 'Informamos que a equipe foi acionada.'
      };

      const correlation = extractCorrelationIdentifiers(payload);
      expect(correlation.matchedVia).toBe('REPLY_TO_TAG');
      expect(correlation.issueId).toBe('OPP-MN-2026-00142');
      expect(correlation.manifestationId).toBe('MF-00142-A005');
    });

    it('deve correlacionar o e-mail pelo token presente no assunto', () => {
      const payload: InboundEmailPayload = {
        from: 'ouvidoria.geral@mundonovo.ms.gov.br',
        to: 'ouvidoria@opp.org.br',
        subject: 'Resposta ao processo [OPP-MN-2026-00142]',
        bodyText: 'O protocolo foi registrado.'
      };

      const correlation = extractCorrelationIdentifiers(payload);
      expect(correlation.matchedVia).toBe('SUBJECT');
      expect(correlation.issueId).toBe('OPP-MN-2026-00142');
    });

    it('deve correlacionar o e-mail a partir de cabeçalhos de rastreamento', () => {
      const payload: InboundEmailPayload = {
        from: 'servidor@prefeitura.gov.br',
        to: 'ouvidoria@opp.org.br',
        subject: 'Ofício de Devolutiva',
        bodyText: 'Em resposta à demanda.',
        headers: {
          'X-OPP-Issue-Id': 'OPP-MN-2026-00142',
          'X-OPP-Manifestation-Id': 'MF-00142-A001'
        }
      };

      const correlation = extractCorrelationIdentifiers(payload);
      expect(correlation.matchedVia).toBe('HEADER');
      expect(correlation.issueId).toBe('OPP-MN-2026-00142');
      expect(correlation.manifestationId).toBe('MF-00142-A001');
    });
  });

  describe('3. Classificação e Extração de Protocolo', () => {
    it('deve identificar auto-resposta de protocolo provisório como ACKNOWLEDGMENT', () => {
      const subject = 'Resposta automática: Recebemos sua mensagem';
      const body = 'Recebemos sua solicitação. O chamado aberto é SEMOB/2026-0912. O prazo legal de resposta é de 30 dias.';

      const type = classifyEmailResponseType(subject, body);
      expect(type).toBe('ACKNOWLEDGMENT');

      const protocol = extractProtocolNumber(body, subject);
      expect(protocol).toBe('SEMOB/2026-0912');
    });

    it('deve identificar resposta de mérito com serviço concluído como SUBSTANTIVE_RESOLUTION', () => {
      const subject = 'Conclusão de Serviço - Rua das Flores';
      const body = 'A equipe esteve no local e o serviço foi executado. Concluída a substituição de 5 lâmpadas danificadas conforme Protocolo SEMOB/ILUM-2026/04481.';

      const type = classifyEmailResponseType(subject, body);
      expect(type).toBe('SUBSTANTIVE_RESOLUTION');

      const protocol = extractProtocolNumber(body, subject);
      expect(protocol).toBe('SEMOB/ILUM-2026/04481');
    });
  });

  describe('4. Processamento Completo de Inbound Email com LGPD e Auditoria', () => {
    it('deve higienizar dados pessoais contidos no e-mail do servidor e marcar status RESPONDED para resposta de mérito', () => {
      const payload: InboundEmailPayload = {
        from: 'obras@mundonovo.ms.gov.br',
        to: 'resposta+OPP-MN-2026-00142@ouvidoria.opp.org.br',
        subject: 'Conclusão de Reparo de Iluminação - Rua das Flores',
        bodyText: `Em resposta ao cidadão portador do CPF 123.456.789-00 e telefone (67) 99999-1234, informamos que o serviço foi executado pela equipe de iluminação sob o protocolo SEMOB/ILUM-2026/04481. As 5 lâmpadas foram trocadas por LED.`
      };

      const result = processInboundEmail(payload, sampleIssue);

      expect(result.updatedIssueStatus).toBe('RESPONDED');
      expect(result.publicResponse.sanitizedContent).not.toContain('123.456.789-00');
      expect(result.publicResponse.sanitizedContent).toContain('***.***.***-**');
      expect(result.publicResponse.sanitizedContent).not.toContain('(67) 99999-1234');
      expect(result.publicResponse.protocolNumber).toBe('SEMOB/ILUM-2026/04481');
      expect(result.publicResponse.documentHash).toHaveLength(64);
      expect(result.isAutoReply).toBe(false);
      expect(result.auditEvent.action).toBe('INBOUND_EMAIL_INGESTED');
    });

    it('deve manter status AWAITING_RESPONSE quando o e-mail for apenas confirmação de protocolo provisório', () => {
      const payload: InboundEmailPayload = {
        from: 'ouvidoria@mundonovo.ms.gov.br',
        to: 'resposta+OPP-MN-2026-00142@ouvidoria.opp.org.br',
        subject: 'Confirmação de recebimento - Protocolo nº 99881/2026',
        bodyText: 'Recebemos sua manifestação. O processo foi encaminhado para análise técnica da SEMOB.'
      };

      const result = processInboundEmail(payload, sampleIssue);

      expect(result.updatedIssueStatus).toBe('AWAITING_RESPONSE');
      expect(result.isAutoReply).toBe(true);
      expect(result.publicResponse.responseType).toBe('ACKNOWLEDGMENT');
      expect(result.publicResponse.protocolNumber).toBe('99881/2026');
    });
  });
});
