/**
 * Operações de Domínio para Manifestações Formais e Documentos (Seções 3, 8, 14 e 21)
 * Regras para adesão individual, integridade com hash SHA-256 e consentimentos
 */

import { FormalManifestation, Issue, AuditEvent, CitizenConsentRecord } from './entities.js';
import { FormalManifestationStatus } from './state-machines.js';

export const CURRENT_DOCUMENT_TEMPLATE_VERSION = 'v3.0-2026.09';

/**
 * Gera código padronizado de identificação da manifestação (Seção 3.2 & 21.2)
 * Ex: Raiz -> MF-00142-ROOT; Adesão -> MF-00142-A001
 */
export function generateManifestationCode(
  issueNumber: string | number,
  sequenceNumber?: number,
  isRoot: boolean = false
): string {
  const padIssue = String(issueNumber).padStart(5, '0');
  if (isRoot) {
    return `MF-${padIssue}-ROOT`;
  }
  const padSeq = String(sequenceNumber || 1).padStart(3, '0');
  return `MF-${padIssue}-A${padSeq}`;
}

/**
 * Valida regra de negócio: cada cidadão autenticado deve possuir no máximo
 * UMA adesão formal ativa por problema (Seção 14.1)
 */
export function validateSingleAdhesionPerUser(
  userId: string,
  existingManifestationsForIssue: FormalManifestation[]
): { valid: boolean; error?: string } {
  const activeManifestation = existingManifestationsForIssue.find(
    m => m.userId === userId && m.status !== FormalManifestationStatus.CLOSED
  );

  if (activeManifestation) {
    return {
      valid: false,
      error: 'Você já possui uma adesão formal ativa vinculada a este problema público.'
    };
  }

  return { valid: true };
}

/**
 * Parâmetros para construção do documento formal cidadão
 */
export interface BuildDocumentParams {
  manifestation: FormalManifestation;
  issue: Issue;
  citizenFullName: string;
  citizenCpfMasked: string;
  citizenEmail: string;
  agencyName: string;
  municipalityName: string;
  protocolCode: string;
  templateVersion?: string;
}

/**
 * Monta o documento estruturado e neutro "Solicitação de Providências" (Seção 21)
 */
export function buildFormalDocumentHtml(params: BuildDocumentParams): {
  html: string;
  templateVersion: string;
  referenceText: string;
} {
  const templateVersion = params.templateVersion || CURRENT_DOCUMENT_TEMPLATE_VERSION;
  const dateFormatted = new Date(params.manifestation.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const referenceText = `Esta manifestação está vinculada ao problema público ${params.issue.issueId}, registrado em ${new Date(params.issue.createdAt).toLocaleDateString('pt-BR')}, e constitui manifestação individual do requerente ${params.protocolCode}.`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Solicitação de Providências - ${params.protocolCode}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; }
    .header { border-bottom: 2px solid #0f2942; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: bold; color: #0f2942; text-transform: uppercase; margin: 0; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; }
    .meta-item { margin-bottom: 6px; }
    .meta-label { font-weight: bold; color: #334155; }
    .section-title { font-size: 14px; font-weight: bold; color: #0f2942; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; }
    .statement-box { background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; font-size: 14px; margin-bottom: 24px; }
    .legal-notice { font-size: 11px; color: #64748b; background-color: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 32px; }
    .footer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">Solicitação de Providências — Manifestação Cidadã</h1>
    <div class="subtitle">Ouvidoria Pública Popular (OPP) • Tecnologia Social Digital • Município de ${params.municipalityName}</div>
  </div>

  <div class="meta-box">
    <div class="meta-item"><span class="meta-label">Código da Manifestação:</span> ${params.protocolCode}</div>
    <div class="meta-item"><span class="meta-label">Problema Público Vinculado:</span> ${params.issue.issueId} — ${params.issue.title}</div>
    <div class="meta-item"><span class="meta-label">Órgão Destinatário:</span> ${params.agencyName}</div>
    <div class="meta-item"><span class="meta-label">Data de Registro:</span> ${dateFormatted}</div>
    <div class="meta-item"><span class="meta-label">Local Aproximado:</span> ${params.issue.locationApprox.neighborhood} — ${params.issue.locationApprox.city}</div>
  </div>

  <div class="section-title">Vínculo e Referência Institucional (Seção 21.2)</div>
  <p style="font-size: 13px; font-style: italic; color: #334155;">
    "${referenceText}"
  </p>

  <div class="section-title">Identificação do Requerente (Lei 13.460/2017)</div>
  <div class="meta-box" style="margin-bottom: 16px;">
    <div class="meta-item"><span class="meta-label">Nome Completo:</span> ${params.citizenFullName}</div>
    <div class="meta-item"><span class="meta-label">CPF (Mascarado):</span> ${params.citizenCpfMasked}</div>
    <div class="meta-item"><span class="meta-label">E-mail de Contato:</span> ${params.citizenEmail}</div>
  </div>

  <div class="section-title">Declaração / Relato do Cidadão</div>
  <div class="statement-box">
    ${params.manifestation.citizenStatement}
  </div>

  <div class="legal-notice">
    <strong>Termos e Autorização de Transmissão (Seção 18):</strong><br>
    O requerente acima identificado autorizou expressamente a plataforma Ouvidoria Pública Popular a realizar a transmissão eletrônica desta manifestação individual ao órgão competente. A OPP atua como meio técnico de organização e transmissão e não declara representar juridicamente o requerente. Documento emitido sob a disciplina da Lei Federal nº 13.460/2017 e Lei nº 13.709/2018 (LGPD).
  </div>

  <div class="footer">
    Template ${templateVersion} • Ouvidoria Pública Popular • Transmissão Eletrônica Auditável
  </div>
</body>
</html>`;

  return {
    html,
    templateVersion,
    referenceText
  };
}

/**
 * Executa a solicitação de retirada/cancelamento de manifestação (Seção 14.2)
 * Preserva o fato histórico sem deletar registros já transmitidos.
 */
export function processManifestationWithdrawal(
  manifestation: FormalManifestation,
  userId: string,
  reason: string
): { updatedManifestation: FormalManifestation; auditEvent: AuditEvent } {
  if (manifestation.userId !== userId) {
    throw new Error('Apenas o próprio cidadão autor pode solicitar a retirada da sua manifestação.');
  }

  const now = new Date().toISOString();

  const updatedManifestation: FormalManifestation = {
    ...manifestation,
    status: FormalManifestationStatus.CLOSED,
    updatedAt: now
  };

  const auditEvent: AuditEvent = {
    eventId: `audit-withdraw-${Date.now()}`,
    timestamp: now,
    actorType: 'CITIZEN',
    actorId: userId,
    action: 'MANIFESTATION_WITHDRAWN',
    entityType: 'FORMAL_MANIFESTATION',
    entityId: manifestation.manifestationId,
    metadata: {
      issueId: manifestation.issueId,
      reason,
      priorStatus: manifestation.status
    },
    correlationId: `withdraw-${manifestation.manifestationId}`
  };

  return {
    updatedManifestation,
    auditEvent
  };
}
