import { Issue, Municipality, Agency } from '@opp/shared';

export const mockMunicipality: Municipality = {
  municipalityId: 'mundo-novo-ms',
  name: 'Mundo Novo',
  state: 'MS',
  ibgeCode: '5005682',
  branding: {
    heroTitle: 'Uma cidade melhor começa com a sua voz.',
    heroSubtitle: 'Registre problemas, acompanhe as soluções e ajude a construir uma cidade mais justa, transparente e participativa.',
    primaryColor: '#0F2942',
    secondaryColor: '#059669'
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z'
};

export const mockCategories = [
  { id: 'iluminacao', name: 'Iluminação Pública', icon: 'Lightbulb', count: 183, color: 'bg-amber-100 text-amber-800' },
  { id: 'vias', name: 'Vias e Buracos', icon: 'Car', count: 142, color: 'bg-orange-100 text-orange-800' },
  { id: 'saude', name: 'Saúde Municipal', icon: 'HeartPulse', count: 216, color: 'bg-rose-100 text-rose-800' },
  { id: 'limpeza', name: 'Limpeza Urbana', icon: 'Trash2', count: 98, color: 'bg-emerald-100 text-emerald-800' },
  { id: 'transporte', name: 'Transporte Público', icon: 'Bus', count: 59, color: 'bg-blue-100 text-blue-800' },
  { id: 'saneamento', name: 'Água e Esgoto', icon: 'Droplets', count: 77, color: 'bg-cyan-100 text-cyan-800' }
];

export const mockAgencies: Agency[] = [
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
        sourceUrl: 'https://mundonovo.ms.gov.br/ouvidoria',
        verifiedAt: '2026-08-10T10:00:00.000Z',
        verificationStatus: 'VERIFIED',
        notes: 'Canal oficial verificado para solicitações de reparo e manutenção'
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
        verificationStatus: 'VERIFIED',
        notes: 'Canal assistido via integração federal Fala.BR'
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
    categories: ['meio_ambiente', 'limpeza'],
    active: true,
    channels: [
      {
        channelId: 'ch-sema-unverified',
        agencyId: 'sec-meio-ambiente-mn',
        type: 'EMAIL',
        addressOrUrl: 'meioambiente.ouvidoria@mundonovo.ms.gov.br',
        acceptsAutomatedSubmission: true,
        requiresIdentity: true,
        requiresAuthentication: false,
        verificationStatus: 'UNVERIFIED',
        notes: 'Canal em processo de auditoria de conformidade. Envios automáticos suspensos (AC-07).'
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
        sourceUrl: 'https://mundonovo.ms.gov.br/transparencia/ouvidoria',
        verifiedAt: '2026-01-15T08:00:00.000Z',
        verificationStatus: 'VERIFIED',
        notes: 'Canal institucional central para redistribuição e triagem geral'
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z'
  }
];

export const mockIssues: Issue[] = [
  {
    issueId: 'OPP-MN-2026-00142',
    municipalityId: 'mundo-novo-ms',
    title: 'Postes com lâmpadas apagadas há mais de duas semanas na Rua das Flores',
    publicSummary: 'Trecho residencial com mais de 5 postes consecutivos sem iluminação pública, gerando insegurança no período noturno para estudantes e trabalhadores.',
    categoryId: 'iluminacao',
    locationApprox: {
      neighborhood: 'Bairro Centro',
      streetApprox: 'Rua das Flores, altura do nº 400',
      referencePoint: 'Próximo à Escola Municipal',
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
    searchTokens: ['iluminacao', 'rua', 'flores', 'centro', 'lampada', 'apagada', 'poste'],
    createdAt: '2026-09-02T10:14:00.000Z',
    updatedAt: '2026-09-15T18:20:00.000Z',
    createdBy: 'user-001',
    moderationState: 'APPROVED',
    schemaVersion: 3,
    mergeHistory: [
      {
        sourceIssueId: 'OPP-MN-2026-00143',
        mergedAt: '2026-09-08T15:30:00.000Z',
        reason: 'Duplicidade confirmada do mesmo segmento de postes na Rua das Flores',
        moderatorId: 'mod-01'
      }
    ]
  },
  {
    issueId: 'OPP-MN-2026-00143',
    municipalityId: 'mundo-novo-ms',
    title: 'Poste com lâmpada queimada na Rua das Flores altura do 450',
    publicSummary: 'Mesmo trecho da via sem iluminação noturna.',
    categoryId: 'iluminacao',
    locationApprox: {
      neighborhood: 'Bairro Centro',
      streetApprox: 'Rua das Flores, 450',
      referencePoint: 'Próximo à esquina',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: 'MERGED',
    mergedIntoIssueId: 'OPP-MN-2026-00142',
    agencyIds: ['sec-obras-mn'],
    rootManifestationId: 'MF-00143-ROOT',
    formalSupportCount: 5,
    commentCount: 1,
    followerCount: 6,
    lastPublicActivityAt: '2026-09-08T15:30:00.000Z',
    searchTokens: ['iluminacao', 'rua', 'flores', 'poste'],
    createdAt: '2026-09-05T14:00:00.000Z',
    updatedAt: '2026-09-08T15:30:00.000Z',
    createdBy: 'user-004',
    moderationState: 'APPROVED',
    schemaVersion: 3
  },
  {
    issueId: 'OPP-MN-2026-00138',
    municipalityId: 'mundo-novo-ms',
    title: 'Buraco de grande proporção dificultando tráfego na Av. JK',
    publicSummary: 'Erosão no asfalto com risco iminente de acidentes e danos a veículos no cruzamento principal.',
    categoryId: 'vias',
    locationApprox: {
      neighborhood: 'Bairro Berneck',
      streetApprox: 'Avenida Juscelino Kubitschek',
      referencePoint: 'Em frente ao posto de combustível',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: 'AWAITING_RESPONSE',
    agencyIds: ['sec-obras-mn'],
    rootManifestationId: 'MF-00138-ROOT',
    formalSupportCount: 86,
    commentCount: 31,
    followerCount: 112,
    lastPublicActivityAt: '2026-09-14T14:45:00.000Z',
    searchTokens: ['buraco', 'av', 'jk', 'berneck', 'asfalto', 'transito'],
    createdAt: '2026-08-28T08:30:00.000Z',
    updatedAt: '2026-09-14T14:45:00.000Z',
    createdBy: 'user-002',
    moderationState: 'APPROVED',
    schemaVersion: 3
  },
  {
    issueId: 'OPP-MN-2026-00129',
    municipalityId: 'mundo-novo-ms',
    title: 'Acúmulo de lixo e entulho em área verde no bairro Fleck',
    publicSummary: 'Descarte irregular de resíduos de construção civil e galhos em área pública, com risco de proliferação de insetos.',
    categoryId: 'limpeza',
    locationApprox: {
      neighborhood: 'Bairro Fleck',
      streetApprox: 'Rua São Paulo',
      referencePoint: 'Ao lado da área de lazer',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: 'RESOLVED',
    agencyIds: ['sec-obras-mn'],
    rootManifestationId: 'MF-00129-ROOT',
    formalSupportCount: 29,
    commentCount: 12,
    followerCount: 45,
    lastPublicActivityAt: '2026-09-12T11:10:00.000Z',
    searchTokens: ['lixo', 'entulho', 'fleck', 'limpeza', 'terreno'],
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-09-12T11:10:00.000Z',
    createdBy: 'user-003',
    moderationState: 'APPROVED',
    schemaVersion: 3
  }
];

export const mockPublicResponses = [
  {
    responseId: 'RESP-MN-2026-0089',
    issueId: 'OPP-MN-2026-00142',
    agencyId: 'sec-obras-mn',
    sanitizedSummary: 'Serviço de manutenção de iluminação pública executado pela equipe de campo no trecho da Rua das Flores.',
    sanitizedContent: 'A Secretaria Municipal de Obras e Serviços Urbanos (SEMOB) informa que uma equipe do departamento de iluminação compareceu ao local e concluiu a substituição de 5 lâmpadas de vapor de sódio danificadas por novas luminárias LED de 100W, restabelecendo a iluminação integral da via pública.',
    protocolNumber: 'SEMOB/ILUM-2026/04481',
    publishedAt: '2026-09-16T15:30:00.000Z'
  }
];

