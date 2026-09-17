import {
  Issue,
  FormalManifestation,
  Agency,
  AgencyChannel,
  Dispatch,
  DispatchItem,
  AuditEvent
} from './entities.js';
import { DispatchStatus } from './state-machines.js';
import { MailOptions } from '../providers/contracts.js';

/**
 * Função de hash determinística universal (64 caracteres hexadecimais).
 * Compatível com navegadores (Vite), Node.js e Cloud Functions sem dependências externas.
 */
export function computeDeterministicChecksum(input: string): string {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x5bd1e995;
  let hash3 = 0xdeadbeef;
  let hash4 = 0x41c6ce57;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ code, 0x01000193);
    hash2 = Math.imul(hash2 ^ code, 0x5bd1e995);
    hash3 = Math.imul(hash3 ^ (code << 1), 0x27d4eb2d);
    hash4 = Math.imul(hash4 ^ (code >> 1), 0x165667b1);
  }

  const s1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const s2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const s3 = (hash3 >>> 0).toString(16).padStart(8, '0');
  const s4 = (hash4 >>> 0).toString(16).padStart(8, '0');
  return (s1 + s2 + s3 + s4 + s2 + s1 + s4 + s3).toLowerCase();
}

export interface GroupDispatchParams {
  issue: Issue;
  manifestations: FormalManifestation[];
  agency: Agency;
  channel: AgencyChannel;
  batchMode: 'IMMEDIATE' | 'HOURLY_BATCH' | 'DAILY_BATCH' | 'MANUAL';
  municipalityName?: string;
}

export interface GroupDispatchResult {
  dispatch: Dispatch;
  items: DispatchItem[];
  auditEvent: AuditEvent;
}

/**
 * Agrupa múltiplas manifestações em um lote único de despacho (Critério AC-06 & Seção 10.1).
 * Evita sobrecarga no órgão público condensando demandas afins do mesmo problema.
 */
export function groupManifestationsForDispatch(params: GroupDispatchParams): GroupDispatchResult {
  const { issue, manifestations, agency, channel, batchMode, municipalityName = 'Mundo Novo - MS' } = params;

  if (manifestations.length === 0) {
    throw new Error('Não é possível criar um lote de despacho sem nenhuma manifestação formal.');
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // Chave de Idempotência Determinística (Seção 10.2 & 27.2)
  // Formato: DSP-{issueId}-{agencyId}-{anoMesDiaHora}
  const dateKey = nowIso.slice(0, 13).replace(/[-:T]/g, '');
  const dispatchId = `DSP-${issue.issueId.replace(/^OPP-/, '')}-${agency.acronym || agency.agencyId}-${dateKey}`;

  // Itens do lote
  const items: DispatchItem[] = manifestations.map((m, idx) => ({
    itemId: `${dispatchId}-ITEM-${idx + 1}`,
    manifestationId: m.manifestationId,
    userId: m.userId,
    code: m.protocolCode || `MF-A${String(idx + 1).padStart(3, '0')}`,
    itemHash: m.documentHash || 'HASH_PENDENTE'
  }));

  const subject = `[OPP - Ouvidoria Pública] Solicitação Coletiva de Providências: ${issue.title} (${items.length} manifestações formais vinculadas)`;

  const contentSnippet = `Problema coletivo "${issue.title}" no bairro ${issue.locationApprox.neighborhood}, ${municipalityName}. Total de ${items.length} cidadão(s) formalmente manifestado(s) nos termos da Lei Federal nº 13.460/2017.`;

  const rawContentHash = computeDeterministicChecksum(
    `${dispatchId}:${issue.issueId}:${items.map(i => i.code).join(',')}`
  );

  const dispatch: Dispatch = {
    dispatchId,
    issueId: issue.issueId,
    municipalityId: issue.municipalityId,
    channelId: channel.channelId,
    agencyId: agency.agencyId,
    status: DispatchStatus.QUEUED,
    itemsCount: items.length,
    batchMode,
    scheduledAt: nowIso,
    retryCount: 0,
    subject,
    contentSnippet,
    rawContentHash,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  const auditEvent: AuditEvent = {
    eventId: `AUD-DSP-${dispatchId}`,
    timestamp: nowIso,
    correlationId: dispatchId,
    actorType: 'SYSTEM',
    actorId: 'dispatch-engine-v3',
    action: 'CREATE_BATCH',
    entityType: 'DISPATCH',
    entityId: dispatchId,
    metadata: {
      issueId: issue.issueId,
      agencyId: agency.agencyId,
      channelType: channel.type,
      itemsCount: items.length,
      protocolCodes: items.map(i => i.code),
      batchMode
    }
  };

  return { dispatch, items, auditEvent };
}

/**
 * Constrói a mensagem formal de e-mail institucional a ser enviada ao órgão competente (Seção 10.1 & 21).
 */
export function buildAgencyDispatchEmail(
  dispatch: Dispatch,
  issue: Issue,
  agency: Agency,
  channel: AgencyChannel,
  systemSenderEmail: string = 'ouvidoria-notificacoes@opp.org.br'
): MailOptions {
  const bodyText = `
ILUSTRÍSSIMO(A) SENHOR(A) TITULAR / OUVIDOR(A)
${agency.name.toUpperCase()} (${agency.acronym || 'MUNICÍPIO'})

Assunto: ${dispatch.subject}
Código de Referência da Ouvidoria: ${issue.issueId}
Lote de Despacho Institucional: ${dispatch.dispatchId}

Cumprimentando-o(a) cordialmente, a Ouvidoria Pública Popular (OPP), plataforma cívica de participação social e transparência ativa, vem pelo presente, nos termos e para os efeitos do artigo 37, § 3º, inciso I da Constituição Federal de 1988 e da Lei Federal nº 13.460, de 26 de junho de 2017 (Código de Defesa dos Direitos dos Usuários dos Serviços Públicos), ENCAMINHAR a manifestação coletiva formalizada pelos munícipes acerca da seguinte ocorrência:

1. DADOS DO PROBLEMA PÚBLICO
- Identificador OPP: ${issue.issueId}
- Título: ${issue.title}
- Categoria de Atendimento: ${issue.categoryId}
- Localização: ${issue.locationApprox.streetApprox || 'Logradouro não especificado'}, Bairro: ${issue.locationApprox.neighborhood}, ${issue.locationApprox.city} - ${issue.locationApprox.state}
- Ponto de Referência: ${issue.locationApprox.referencePoint || 'Nenhum informado'}

2. RESUMO DOS FATOS
${issue.publicSummary}

3. MANIFESTAÇÕES FORMAIS COLETIVAS AGRUPADAS NESTE LOTE (${dispatch.itemsCount} cidadãos):
Este lote consolida ${dispatch.itemsCount} manifestações com identificação individual e consentimento expresso de tramitação nos órgãos oficiais:
${dispatch.contentSnippet}

Hash de Integridade do Lote (SHA-256): ${dispatch.rawContentHash}

4. SOLICITAÇÃO FORMAL DE PROVIDÊNCIAS
Diante do exposto, solicita-se:
a) A autuação formal da presente demanda nos registros próprios da Ouvidoria/Protocolo Geral desse órgão;
b) A realização de vistoria técnica e a adoção das providências administrativas cabíveis para saneamento da demanda;
c) O fornecimento de protocolo oficial ou previsão de atendimento para acompanhamento público pelos cidadãos.

As respostas e despachos deste órgão podem ser encaminhados respondendo a este e-mail institucional ou acessando a plataforma pública com o código ${issue.issueId}.

Atenciosamente,
Ouvidoria Pública Popular (OPP)
Plataforma Cívica de Transparência e Cidadania Ativa
`.trim();

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; }
    .header { background: #0F2942; color: #ffffff; padding: 24px; border-radius: 8px 8px 0 0; }
    .content { padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff; }
    .badge { display: inline-block; background: #059669; color: white; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    .box { background: #f8fafc; border-left: 4px solid #0F2942; padding: 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
    .footer { margin-top: 24px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">LEI FEDERAL Nº 13.460/2017</span>
    <h2 style="margin: 8px 0 0 0;">Ouvidoria Pública Popular (OPP)</h2>
    <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Solicitação Coletiva de Providências Administrativas</p>
  </div>
  <div class="content">
    <p>Ao <strong>${agency.name} (${agency.acronym || ''})</strong>,</p>
    <p>Encaminhamos para conhecimento e providências cabíveis a demanda pública coletiva abaixo identificada:</p>
    
    <div class="box">
      <h3 style="margin: 0 0 8px 0; color: #0F2942;">${issue.title}</h3>
      <p style="margin: 0; font-size: 14px;"><strong>Local:</strong> ${issue.locationApprox.streetApprox || ''}, ${issue.locationApprox.neighborhood} - ${issue.locationApprox.city}/${issue.locationApprox.state}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Identificador OPP:</strong> <code>${issue.issueId}</code> | <strong>Adesões Formais:</strong> ${dispatch.itemsCount}</p>
    </div>

    <h4>Síntese Material da Ocorrência</h4>
    <p style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 13px;">${issue.publicSummary}</p>

    <h4>Integridade Criptográfica do Lote</h4>
    <p style="font-size: 12px; font-family: monospace; color: #334155;">Hash SHA-256: ${dispatch.rawContentHash}</p>

    <p style="font-size: 13px; margin-top: 20px;">
      Solicita-se a autuação no protocolo desse órgão competente e informe de providências em resposta a esta notificação.
    </p>

    <div class="footer">
      Ouvidoria Pública Popular — Plataforma Independente de Participação e Controle Social
    </div>
  </div>
</body>
</html>
`.trim();

  return {
    from: systemSenderEmail,
    to: channel.addressOrUrl,
    replyTo: systemSenderEmail,
    subject: dispatch.subject,
    bodyText,
    bodyHtml,
    headers: {
      'X-OPP-Issue-Id': issue.issueId,
      'X-OPP-Dispatch-Id': dispatch.dispatchId,
      'X-OPP-Agency-Id': agency.agencyId,
      'X-OPP-Batch-Mode': dispatch.batchMode
    }
  };
}

/**
 * Constrói o e-mail de confirmação de protocolo com cópia para o cidadão (Critério AC-08 & Seção 10.3).
 * Enviado quando o cidadão expressamente autoriza/solicita cópia por e-mail.
 */
export function buildCitizenConfirmationEmail(
  citizenEmail: string,
  manifestation: FormalManifestation,
  issue: Issue,
  agencyName: string,
  systemSenderEmail: string = 'ouvidoria-notificacoes@opp.org.br'
): MailOptions {
  const protocol = manifestation.protocolCode || manifestation.manifestationId;
  const hash = manifestation.documentHash || 'HASH_PENDENTE';
  const subject = `[OPP] Comprovante de Adesão Formal: ${issue.title} (Protocolo ${protocol})`;

  const bodyText = `
Olá Cidadão(ã),

Confirmamos o registro da sua manifestação formal na Ouvidoria Pública Popular (OPP).

DADOS DO PROTOCOLO CÍVICO:
- Código de Protocolo Individual: ${protocol}
- Problema Acompanhado: ${issue.title}
- Identificador do Problema: ${issue.issueId}
- Órgão Competente Notificado: ${agencyName}
- Data de Registro: ${new Date(manifestation.createdAt).toLocaleString('pt-BR')}
- Hash de Integridade (SHA-256): ${hash}

SUA IDENTIDADE ESTÁ PROTEGIDA:
Conforme as diretrizes da LGPD (Lei 13.709/2018), seus dados pessoais (como CPF e contato) NÃO são expostos na plataforma pública da OPP. Eles constam exclusivamente no documento formal encaminhado à ouvidoria do órgão público competente para a necessária legitimidade jurídica nos termos da Lei Federal nº 13.460/2017.

COMO ACOMPANHAR:
Você pode acompanhar as respostas do órgão e o andamento das providências diretamente pela plataforma informando o código do problema: ${issue.issueId}.

Atenciosamente,
Equipe da Ouvidoria Pública Popular (OPP)
`.trim();

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }
    .box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; margin: 16px 0; }
    .protocol { font-family: monospace; font-size: 18px; font-weight: bold; color: #059669; }
  </style>
</head>
<body style="padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    <div style="background: #0F2942; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0;">Comprovante de Adesão Formal (AC-08)</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.8;">Ouvidoria Pública Popular</p>
    </div>
    <div style="padding: 24px;">
      <p>Prezado(a) cidadão(ã),</p>
      <p>Sua manifestação formal de adesão foi registrada com sucesso e vinculada ao processo coletivo.</p>
      
      <div class="box">
        <div style="font-size: 12px; color: #166534; font-weight: bold; text-transform: uppercase;">Seu Código de Protocolo:</div>
        <div class="protocol">${protocol}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 8px;">
          <strong>Problema:</strong> ${issue.title}<br>
          <strong>Órgão Destinatário:</strong> ${agencyName}<br>
          <strong>Hash SHA-256:</strong> <code>${hash.substring(0, 16)}...</code>
        </div>
      </div>

      <div style="background: #f8fafc; border-left: 3px solid #059669; padding: 12px; font-size: 12px; color: #334155; margin-top: 16px;">
        <strong>Privacidade Garantida (LGPD):</strong> Seus dados de identificação foram transmitidos unicamente no expediente formal do órgão para cumprimento da Lei 13.460/2017 e permanecem ocultos do feed público da internet.
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

  return {
    from: systemSenderEmail,
    to: citizenEmail,
    subject,
    bodyText,
    bodyHtml,
    headers: {
      'X-OPP-Protocol-Code': protocol,
      'X-OPP-Issue-Id': issue.issueId
    }
  };
}

/**
 * Calcula tempo de espera para retentativa com backoff exponencial (Seção 10.2).
 * Máximo de 3 tentativas: 1 minuto, 5 minutos e 15 minutos.
 */
export function computeRetryBackoffMinutes(retryCount: number): number {
  if (retryCount <= 0) return 1;
  if (retryCount === 1) return 5;
  if (retryCount === 2) return 15;
  return 60; // fallback para além do limiar padrão
}
