/**
 * Operações de Ingestão e Processamento de E-mails Oficiais de Retorno (Inbound Email)
 * Seção 10, 21 e 22 — Ouvidoria Pública Popular (OPP)
 */

import { Issue, PublicAgencyResponse, AuditEvent } from './entities.js';
import { IssueStatus } from './state-machines.js';
import { sanitizeText } from '../utils/sanitizer.js';
import { computeDeterministicChecksum } from './dispatch-operations.js';

export interface InboundEmailAttachment {
  filename: string;
  contentType: string;
  sizeBytes?: number;
  contentBase64?: string;
  publicUrl?: string;
  hash?: string;
}

export interface InboundEmailPayload {
  from: string;
  to: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  headers?: Record<string, string>;
  attachments?: InboundEmailAttachment[];
  receivedAt?: string;
}

export interface ParsedEmailCorrelation {
  issueId?: string;
  manifestationId?: string;
  matchedVia: 'REPLY_TO_TAG' | 'HEADER' | 'SUBJECT' | 'BODY' | 'NONE';
}

/**
 * Extrai identificadores de correlação (issueId e manifestationId) a partir
 * do endereço de destino com tags (Plus Addressing), cabeçalhos ou assunto.
 */
export function extractCorrelationIdentifiers(payload: InboundEmailPayload): ParsedEmailCorrelation {
  // 1. Verifica cabeçalhos personalizados se existirem
  if (payload.headers) {
    const headerIssue = payload.headers['x-opp-issue-id'] || payload.headers['X-OPP-Issue-Id'];
    const headerManifestation = payload.headers['x-opp-manifestation-id'] || payload.headers['X-OPP-Manifestation-Id'];
    if (headerIssue) {
      return {
        issueId: headerIssue,
        manifestationId: headerManifestation,
        matchedVia: 'HEADER'
      };
    }
  }

  // 2. Analisa endereços de destinatário (To e Cc) buscando Plus Addressing (ex: resposta+OPP-MN-2026-00142+MF-00142-A001@...)
  const recipientList: string[] = [];
  if (Array.isArray(payload.to)) {
    recipientList.push(...payload.to);
  } else if (payload.to) {
    recipientList.push(payload.to);
  }

  if (Array.isArray(payload.cc)) {
    recipientList.push(...payload.cc);
  } else if (payload.cc) {
    recipientList.push(payload.cc);
  }

  const tagRegex = /(?:resposta|ouvidoria|retorno)\+([A-Za-z0-9\-]+)(?:\+([A-Za-z0-9\-]+))?@/i;
  for (const recipient of recipientList) {
    const match = recipient.match(tagRegex);
    if (match) {
      return {
        issueId: match[1],
        manifestationId: match[2],
        matchedVia: 'REPLY_TO_TAG'
      };
    }
  }

  // 3. Analisa o assunto buscando tokens como [OPP-MN-2026-00142] ou [OPP-MN-2026-00142-A042]
  const subjectTokenRegex = /\[?(OPP-[A-Z0-9]{2,}-\d{4}-\d+)(?:[-+]([A-Za-z0-9\-]+))?\]?/i;
  const subjectMatch = payload.subject.match(subjectTokenRegex);
  if (subjectMatch) {
    return {
      issueId: subjectMatch[1],
      manifestationId: subjectMatch[2],
      matchedVia: 'SUBJECT'
    };
  }

  // 4. Fallback no corpo do e-mail
  const bodyMatch = payload.bodyText.match(/OPP-[A-Z0-9]{2,}-\d{4}-\d+/i);
  if (bodyMatch) {
    return {
      issueId: bodyMatch[0],
      matchedVia: 'BODY'
    };
  }

  return { matchedVia: 'NONE' };
}

/**
 * Classifica a natureza do e-mail recebido:
 * - ACKNOWLEDGMENT: Auto-resposta, confirmação de recebimento ou protocolo preliminar.
 * - SUBSTANTIVE_RESOLUTION: Resposta conclusiva de mérito (serviço executado, agendado ou concluído).
 * - REJECTION: Manifestação indeferida ou não acolhida pelo órgão.
 */
export function classifyEmailResponseType(
  subject: string,
  bodyText: string
): 'ACKNOWLEDGMENT' | 'SUBSTANTIVE_RESOLUTION' | 'REJECTION' {
  const combined = `${subject} ${bodyText}`.toLowerCase();

  // Padrões de Rejeição
  const rejectionPatterns = [
    /\bindeferid[oa]\b/,
    /\bfora de compet[eê]ncia\b/,
    /\bn[aã]o procede\b/,
    /\bpedido rejeitado\b/,
    /\binviabilidade t[eé]cnica\b/
  ];
  if (rejectionPatterns.some(p => p.test(combined))) {
    return 'REJECTION';
  }

  // Padrões de Resposta Conclusiva / Mérito
  const substantivePatterns = [
    /\bexecutad[oa]\b/,
    /\bconclu[ií]d[oa]\b/,
    /\bvistoria realizada\b/,
    /\btroca efetuada\b/,
    /\breparo conclu[ií]do\b/,
    /\bservi[cç]o executado\b/,
    /\bequipe esteve no local\b/,
    /\bprovid[eê]ncia adotada\b/,
    /\blumin[aá]rias? substitu[ií]das?\b/,
    /\basfalto recapeado\b/,
    /\blixo recolhido\b/
  ];
  if (substantivePatterns.some(p => p.test(combined))) {
    return 'SUBSTANTIVE_RESOLUTION';
  }

  // Padrões de Confirmação Automática / Protocolo Provisório
  const ackPatterns = [
    /\brecebemos su?a? (mensagem|solicita[cç][aã]o|manifesta[cç][aã]o)\b/,
    /\bresposta autom[aá]tica\b/,
    /\bauto-reply\b/,
    /\bconfirma[cç][aã]o de recebimento\b/,
    /\babertura de chamado\b/,
    /\bchamado aberto\b/,
    /\bencaminhado para an[aá]lise\b/,
    /\bn[aã]o responda este e-mail\b/,
    /\bprazo legal de \d+ dias\b/
  ];
  if (ackPatterns.some(p => p.test(combined))) {
    return 'ACKNOWLEDGMENT';
  }

  // Por padrão seguro, se não houver confirmação de serviço realizado, trata como confirmação de recebimento
  return 'ACKNOWLEDGMENT';
}

/**
 * Extrai o número de protocolo oficial do órgão mencionado no e-mail ou assunto
 */
export function extractProtocolNumber(text: string, subject: string): string | undefined {
  const combined = `${subject}\n${text}`;

  // Formatos comuns: SEMOB/ILUM-2026/04481, Protocolo nº 12345/2026, Chamado aberto é SEMOB/2026-0912, etc.
  const protocolRegex = /\b(?:protocolo|chamado|of[ií]cio|processo|ticket)(?:[^A-Za-z0-9\n]*?(?:aberto|registrado|gerado|sob|de|o|é|n[ºo]|n)?)*[\s:nº#=]*([A-Za-z0-9]+(?:[\/\-_][A-Za-z0-9\/\-_]+)+|\d{4,12})\b/i;
  const match = combined.match(protocolRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback mais direto caso seja alfanumérico simples após protocolo:
  const simpleMatch = combined.match(/\b(?:protocolo|chamado)[\s:nº#]+([A-Za-z0-9\/\-_]{4,30})\b/i);
  if (simpleMatch && simpleMatch[1]) {
    return simpleMatch[1].trim();
  }

  return undefined;
}

export interface ProcessInboundEmailResult {
  publicResponse: PublicAgencyResponse;
  updatedIssueStatus: IssueStatus;
  auditEvent: AuditEvent;
  isAutoReply: boolean;
  correlation: ParsedEmailCorrelation;
}

/**
 * Processa um e-mail oficial recebido:
 * - Higieniza dados sensíveis (LGPD) no corpo da resposta
 * - Computa o hash de integridade SHA-256
 * - Extrai o protocolo e classifica o tipo de resposta
 * - Define a transição de estado correta do problema
 */
export function processInboundEmail(
  payload: InboundEmailPayload,
  issue: Issue,
  fallbackAgencyId?: string
): ProcessInboundEmailResult {
  const now = new Date().toISOString();
  const correlation = extractCorrelationIdentifiers(payload);

  // 1. Sanitização estrita de dados pessoais (LGPD)
  const { sanitizedText } = sanitizeText(payload.bodyText);
  const protocol = extractProtocolNumber(payload.bodyText, payload.subject) || `PROT-${Date.now()}`;
  const responseType = classifyEmailResponseType(payload.subject, payload.bodyText);
  const isAutoReply = responseType === 'ACKNOWLEDGMENT';

  // 2. Hash determinístico do conteúdo do e-mail oficial recebido
  const documentHash = computeDeterministicChecksum(
    `${payload.from}:${payload.subject}:${payload.bodyText}:${protocol}`
  );

  // 3. Processamento de anexos recebidos
  const attachments = (payload.attachments || []).map((att) => ({
    name: att.filename,
    url: att.publicUrl || '',
    mimeType: att.contentType,
    sizeBytes: att.sizeBytes,
    hash: att.hash || computeDeterministicChecksum(att.filename)
  }));

  const sanitizedSummary = sanitizedText.length > 250
    ? sanitizedText.substring(0, 247).trim() + '...'
    : sanitizedText;

  const agencyId = fallbackAgencyId || issue.agencyIds[0] || 'sec-obras-mn';
  const responseId = `RESP-INBOUND-${Date.now()}`;

  const publicResponse: PublicAgencyResponse = {
    responseId,
    issueId: issue.issueId,
    agencyId,
    sanitizedSummary,
    sanitizedContent: sanitizedText,
    protocolNumber: protocol,
    publishedAt: now,
    responseType,
    channelReceived: 'EMAIL',
    documentHash,
    inboundSubject: payload.subject,
    attachments
  };

  // 4. Se for resposta conclusiva de mérito, passa para RESPONDED (liberando deliberação da comunidade).
  // Se for confirmação provisória de recebimento, passa para AWAITING_RESPONSE com protocolo registrado.
  let updatedIssueStatus: IssueStatus;
  if (responseType === 'SUBSTANTIVE_RESOLUTION') {
    updatedIssueStatus = IssueStatus.RESPONDED;
  } else {
    updatedIssueStatus = IssueStatus.AWAITING_RESPONSE;
  }

  // 5. Trilha de auditoria append-only
  const auditEvent: AuditEvent = {
    eventId: `AUD-INBOUND-${responseId}`,
    timestamp: now,
    correlationId: issue.issueId,
    actorType: 'SYSTEM',
    actorId: payload.from,
    action: 'INBOUND_EMAIL_INGESTED',
    entityType: 'AGENCY_RESPONSE',
    entityId: responseId,
    metadata: {
      issueId: issue.issueId,
      sender: payload.from,
      subject: payload.subject,
      protocolNumber: protocol,
      responseType,
      matchedVia: correlation.matchedVia,
      documentHash
    }
  };

  return {
    publicResponse,
    updatedIssueStatus,
    auditEvent,
    isAutoReply,
    correlation
  };
}
