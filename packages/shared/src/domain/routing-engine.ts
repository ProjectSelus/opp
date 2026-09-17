import { Issue, Agency, AgencyChannel } from './entities.js';

export type RoutingStatus =
  | 'AUTOMATED_DISPATCH_READY'
  | 'NEEDS_MANUAL_DISPATCH'
  | 'BLOCKED_UNVERIFIED_CHANNEL'
  | 'FALLBACK_GENERAL_OMBUDSMAN'
  | 'UNROUTABLE_NO_AGENCY';

export interface RoutingDecision {
  issueId: string;
  targetAgencyId: string;
  targetAgencyName: string;
  selectedChannel: AgencyChannel | null;
  routingStatus: RoutingStatus;
  canSendAutomatedEmail: boolean;
  requiresHumanReview: boolean;
  reason: string;
  evaluatedAt: string;
}

/**
 * Validação rigorosa de conformidade de canal de órgão público (Seção 9).
 */
export function validateAgencyChannel(channel: Partial<AgencyChannel>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!channel.type) {
    errors.push('Tipo de canal é obrigatório.');
  }

  if (!channel.addressOrUrl || channel.addressOrUrl.trim().length === 0) {
    errors.push('Endereço ou URL do canal é obrigatório.');
  }

  if (channel.type === 'EMAIL') {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(channel.addressOrUrl || '')) {
      errors.push('Endereço de e-mail inválido para o canal do órgão.');
    }
  }

  if (channel.type === 'WEB_PORTAL' || channel.type === 'FALABR' || channel.type === 'API') {
    if (!channel.addressOrUrl?.startsWith('http://') && !channel.addressOrUrl?.startsWith('https://')) {
      errors.push('Canais do tipo Portal, Fala.BR ou API devem conter URL válida iniciando com http:// ou https://.');
    }
  }

  // Seção 9: Para ser VERIFICADO, deve possuir link da fonte oficial comprobatória
  if (channel.verificationStatus === 'VERIFIED' && (!channel.sourceUrl || channel.sourceUrl.trim().length === 0)) {
    errors.push('Canais com status VERIFICADO devem obrigatoriamente informar a URL da fonte oficial comprobatória.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Registra formalmente a verificação de um canal por um moderador/administrador.
 */
export function verifyAgencyChannel(
  channel: AgencyChannel,
  sourceUrl: string,
  verifiedBy: string,
  acceptsAutomated: boolean
): AgencyChannel {
  if (!sourceUrl || !sourceUrl.startsWith('http')) {
    throw new Error('A fonte oficial comprobatória (Diário Oficial, Portal da Transparência, etc.) é obrigatória.');
  }

  return {
    ...channel,
    verificationStatus: 'VERIFIED',
    sourceUrl,
    verifiedAt: new Date().toISOString(),
    acceptsAutomatedSubmission: acceptsAutomated,
    notes: `${channel.notes || ''} [Verificado por ${verifiedBy} em ${new Date().toLocaleDateString('pt-BR')}]`.trim()
  };
}

/**
 * Motor de Roteamento Cívico (Seção 8, 9 & Critério AC-07).
 *
 * Determina o órgão destinatário e o canal de tramitação para um Problema Público.
 * Cumpre a regra inegociável do Critério AC-07:
 * "Canais marcados como NÃO VERIFICADOS ou que não aceitam submissão automatizada
 * NÃO devem receber e-mails automáticos sem revisão humana."
 */
export function computeIssueRouting(
  issue: Pick<Issue, 'issueId' | 'municipalityId' | 'categoryId' | 'agencyIds'>,
  availableAgencies: Agency[]
): RoutingDecision {
  const evaluatedAt = new Date().toISOString();

  // 1. Filtra órgãos ativos pertencentes ao município
  const municipalAgencies = availableAgencies.filter(
    a => a.active && a.municipalityId === issue.municipalityId
  );

  if (municipalAgencies.length === 0) {
    return {
      issueId: issue.issueId,
      targetAgencyId: '',
      targetAgencyName: 'Nenhum órgão municipal cadastrado',
      selectedChannel: null,
      routingStatus: 'UNROUTABLE_NO_AGENCY',
      canSendAutomatedEmail: false,
      requiresHumanReview: true,
      reason: `Não há órgãos cadastrados para o município "${issue.municipalityId}". Demanda retida na fila geral.`,
      evaluatedAt
    };
  }

  // 2. Busca órgão prioritário vinculado explicitamente no issue ou pela categoria
  let primaryAgency: Agency | undefined;

  if (issue.agencyIds && issue.agencyIds.length > 0) {
    primaryAgency = municipalAgencies.find(a => issue.agencyIds.includes(a.agencyId));
  }

  if (!primaryAgency) {
    primaryAgency = municipalAgencies.find(a => a.categories.includes(issue.categoryId));
  }

  // 3. Fallback: Procura Ouvidoria Geral do Município
  if (!primaryAgency) {
    const generalOmbudsman = municipalAgencies.find(
      a => a.categories.includes('ouvidoria_geral') || a.acronym?.toUpperCase() === 'OGM' || a.name.toLowerCase().includes('ouvidoria geral')
    );

    if (generalOmbudsman) {
      primaryAgency = generalOmbudsman;
      const channel = pickBestChannel(generalOmbudsman.channels);

      const isVerifiedAutomated =
        channel?.verificationStatus === 'VERIFIED' && channel?.acceptsAutomatedSubmission === true && channel?.type === 'EMAIL';

      return {
        issueId: issue.issueId,
        targetAgencyId: generalOmbudsman.agencyId,
        targetAgencyName: generalOmbudsman.name,
        selectedChannel: channel,
        routingStatus: 'FALLBACK_GENERAL_OMBUDSMAN',
        canSendAutomatedEmail: isVerifiedAutomated,
        requiresHumanReview: !isVerifiedAutomated,
        reason: `Nenhum órgão especializado encontrado para a categoria "${issue.categoryId}". Roteado para a Ouvidoria Geral do Município para redistribuição administrativa.`,
        evaluatedAt
      };
    }

    return {
      issueId: issue.issueId,
      targetAgencyId: '',
      targetAgencyName: 'Sem órgão de ouvidoria competente',
      selectedChannel: null,
      routingStatus: 'UNROUTABLE_NO_AGENCY',
      canSendAutomatedEmail: false,
      requiresHumanReview: true,
      reason: `Nenhum órgão competente ou ouvidoria geral encontrado para a categoria "${issue.categoryId}". Necessária intervenção de moderador.`,
      evaluatedAt
    };
  }

  // 4. Seleção e Avaliação de Canal do Órgão Selecionado
  const selectedChannel = pickBestChannel(primaryAgency.channels);

  if (!selectedChannel) {
    return {
      issueId: issue.issueId,
      targetAgencyId: primaryAgency.agencyId,
      targetAgencyName: primaryAgency.name,
      selectedChannel: null,
      routingStatus: 'NEEDS_MANUAL_DISPATCH',
      canSendAutomatedEmail: false,
      requiresHumanReview: true,
      reason: `O órgão "${primaryAgency.name}" não possui nenhum canal de atendimento cadastrado. Encaminhamento manual necessário.`,
      evaluatedAt
    };
  }

  // APLICAÇÃO RÍGIDA DO CRITÉRIO AC-07:
  // Canais UNVERIFIED NUNCA recebem envio automatizado
  if (selectedChannel.verificationStatus !== 'VERIFIED') {
    return {
      issueId: issue.issueId,
      targetAgencyId: primaryAgency.agencyId,
      targetAgencyName: primaryAgency.name,
      selectedChannel,
      routingStatus: 'BLOCKED_UNVERIFIED_CHANNEL',
      canSendAutomatedEmail: false,
      requiresHumanReview: true,
      reason: `[Critério AC-07] O canal ${selectedChannel.type} (${selectedChannel.addressOrUrl}) está marcado como NÃO VERIFICADO. Envio automatizado bloqueado até homologação humana da fonte oficial.`,
      evaluatedAt
    };
  }

  // Canais que não aceitam submissão automatizada (ex: Fala.BR com CAPTCHA, Portais com login individual)
  if (!selectedChannel.acceptsAutomatedSubmission) {
    return {
      issueId: issue.issueId,
      targetAgencyId: primaryAgency.agencyId,
      targetAgencyName: primaryAgency.name,
      selectedChannel,
      routingStatus: 'NEEDS_MANUAL_DISPATCH',
      canSendAutomatedEmail: false,
      requiresHumanReview: true,
      reason: `O canal ${selectedChannel.type} é verificado mas requer preenchimento assistido/manual pelo cidadão ou moderador (ex: exigência de login individual Gov.br ou Fala.BR).`,
      evaluatedAt
    };
  }

  // Canal apto para envio de e-mail automatizado ou integração direta
  return {
    issueId: issue.issueId,
    targetAgencyId: primaryAgency.agencyId,
    targetAgencyName: primaryAgency.name,
    selectedChannel,
    routingStatus: 'AUTOMATED_DISPATCH_READY',
    canSendAutomatedEmail: selectedChannel.type === 'EMAIL',
    requiresHumanReview: false,
    reason: `Canal oficial ${selectedChannel.type} verificado com aceite de envio em lote. Rota automatizada liberada.`,
    evaluatedAt
  };
}

/**
 * Seleciona o canal preferencial com base na hierarquia cívica de automação:
 * 1. EMAIL verificado que aceita automação
 * 2. API / FALABR
 * 3. WEB_PORTAL
 * 4. Qualquer outro canal disponível
 */
function pickBestChannel(channels: AgencyChannel[]): AgencyChannel | null {
  if (!channels || channels.length === 0) return null;

  // 1. Canal de e-mail verificado com aceite de automação
  const verifiedEmail = channels.find(
    c => c.type === 'EMAIL' && c.verificationStatus === 'VERIFIED' && c.acceptsAutomatedSubmission
  );
  if (verifiedEmail) return verifiedEmail;

  // 2. Qualquer canal verificado que aceita automação
  const verifiedAutomated = channels.find(
    c => c.verificationStatus === 'VERIFIED' && c.acceptsAutomatedSubmission
  );
  if (verifiedAutomated) return verifiedAutomated;

  // 3. Qualquer canal verificado
  const anyVerified = channels.find(c => c.verificationStatus === 'VERIFIED');
  if (anyVerified) return anyVerified;

  // 4. Primeiro canal cadastrado
  return channels[0];
}
