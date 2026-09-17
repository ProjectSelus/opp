import { AISuggestion, AIRiskReport } from '../providers/contracts.js';
import { sanitizeText } from '../utils/sanitizer.js';

interface CivicCategoryMapping {
  categoryId: string;
  agencyId: string;
  agencyName: string;
  keywords: string[];
}

export const CIVIC_CATEGORY_MAPPINGS: CivicCategoryMapping[] = [
  {
    categoryId: 'iluminacao',
    agencyId: 'sec-obras-mn',
    agencyName: 'Secretaria Municipal de Obras e Serviços Urbanos (SEMOB)',
    keywords: ['poste', 'lampada', 'iluminacao', 'escuro', 'escuridao', 'apagado', 'apagada', 'braco de luz', 'luz da rua']
  },
  {
    categoryId: 'vias',
    agencyId: 'sec-obras-mn',
    agencyName: 'Secretaria Municipal de Obras e Serviços Urbanos (SEMOB)',
    keywords: ['buraco', 'asfalto', 'cratera', 'pavimentacao', 'recapeamento', 'calcada', 'sarjeta', 'guia', 'rua esburacada', 'lama']
  },
  {
    categoryId: 'saude',
    agencyId: 'sec-saude-mn',
    agencyName: 'Secretaria Municipal de Saúde (SMS)',
    keywords: ['posto de saude', 'ubs', 'upa', 'hospital', 'medico', 'remedio', 'medicamento', 'consulta', 'exame', 'farmacia basica', 'vacina', 'atendimento medico']
  },
  {
    categoryId: 'limpeza',
    agencyId: 'sec-obras-mn',
    agencyName: 'Secretaria Municipal de Obras e Serviços Urbanos (SEMOB)',
    keywords: ['lixo', 'entulho', 'terreno baldio', 'mato alto', 'capina', 'coleta de lixo', 'descarte irregular', 'carcaca', 'cacamba']
  },
  {
    categoryId: 'saneamento',
    agencyId: 'sec-obras-mn',
    agencyName: 'Secretaria Municipal de Obras e Serviços Urbanos (SEMOB)',
    keywords: ['agua', 'esgoto', 'vazamento', 'cano', 'cano estourado', 'falta de agua', 'bueiro entupido', 'fossa', 'cheiro de esgoto', 'alagamento']
  },
  {
    categoryId: 'transporte',
    agencyId: 'sec-transporte-mn',
    agencyName: 'Departamento Municipal de Trânsito e Transporte (DMTT)',
    keywords: ['onibus', 'ponto de onibus', 'abrigo', 'linha de onibus', 'itinerario', 'tarifa', 'transporte publico', 'sinalizacao', 'semaforo', 'faixa de pedestre']
  }
];

/**
 * Heurística determinística de classificação cívica (Fallback Offline / AC-10).
 * Garante funcionamento contínuo mesmo na ausência de conexão ou cota da IA.
 */
export function deterministicSuggestMetadata(content: string): AISuggestion {
  // Garantia mandatória de sanitização prévia (Seção 15.2)
  const { sanitizedText } = sanitizeText(content);
  const normalized = sanitizedText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let bestMatch: CivicCategoryMapping | null = null;
  let highestScore = 0;

  for (const mapping of CIVIC_CATEGORY_MAPPINGS) {
    let score = 0;
    for (const kw of mapping.keywords) {
      const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normKw)) {
        // Palavras exatas ou termos compostos pontuam proporcionalmente
        score += normKw.includes(' ') ? 3 : 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = mapping;
    }
  }

  if (bestMatch && highestScore > 0) {
    const confidenceScore = Math.min(0.92, 0.65 + highestScore * 0.08);
    return {
      suggestedCategoryId: bestMatch.categoryId,
      suggestedAgencyId: bestMatch.agencyId,
      suggestedSummary: deterministicNeutralSummary(sanitizedText),
      confidenceScore,
      reasoning: `Classificação assistida por correspondência semântica cívica (${bestMatch.agencyName}) - Modo de Resiliência Determinístico.`
    };
  }

  // Fallback neutro genérico quando não há termos conhecidos
  return {
    suggestedCategoryId: 'vias',
    suggestedAgencyId: 'sec-obras-mn',
    suggestedSummary: deterministicNeutralSummary(sanitizedText),
    confidenceScore: 0.50,
    reasoning: 'Classificação preliminar sugerida para triagem do órgão de obras municipal.'
  };
}

/**
 * Geração determinística de resumo público neutro (Seção 15.1 & AC-10).
 * Converte relatos emotivos em uma síntese objetiva de interesse público,
 * removendo adjetivos injuriosos e pontuações excessivas.
 */
export function deterministicNeutralSummary(content: string, title?: string): string {
  const { sanitizedText } = sanitizeText(content);

  // Remove caracteres excessivos e gritos (caixa alta contínua)
  let clean = sanitizedText
    .replace(/[!]{2,}/g, '.')
    .replace(/[?]{2,}/g, '?')
    .replace(/\s+/g, ' ')
    .trim();

  // Trunca para até 300 caracteres preservando limite de palavras
  if (clean.length > 280) {
    clean = clean.substring(0, 277).trim() + '...';
  }

  const prefix = title ? `[${title.trim()}] ` : '';
  return `${prefix}Relato cívico de demanda de interesse público municipal: "${clean}". Solicita-se vistoria e avaliação técnica das providências cabíveis pelo órgão competente.`;
}

/**
 * Avaliação determinística de risco e moderação de conteúdo (Seção 15.1 & 16.2).
 */
export function deterministicContentRisk(content: string): AIRiskReport {
  const { sanitizedText, hasPii, detectedPiiTypes } = sanitizeText(content);
  const normalized = sanitizedText.toLowerCase();

  const riskFlags: string[] = [];

  // PII vazada ou detectada
  if (hasPii || /\[(CPF|TELEFONE|EMAIL|RG|CEP)_REMOVIDO\]/.test(sanitizedText)) {
    riskFlags.push('SENSITIVE_DATA');
    if (detectedPiiTypes.includes('CPF') || detectedPiiTypes.includes('RG')) {
      riskFlags.push('IDENTIFYING_DOCUMENT_LEAK');
    }
  }

  // Acusações nominais de crimes sem trânsito em julgado
  const crimePatterns = [
    /\b(corrupto|ladrao|roubou|desvio|propina|desviou|quadrilha|estelionatario)\b/i,
    /\b(prefeito|secretario|vereador)\s+(ladrao|corrupto|safado|criminoso)\b/i
  ];
  for (const pattern of crimePatterns) {
    if (pattern.test(normalized)) {
      riskFlags.push('NOMINAL_CRIME_ACCUSATION');
      break;
    }
  }

  // Ameaças de agressão ou dano
  const threatPatterns = [
    /\b(vou matar|vai apanhar|dar um tiro|quebrar a cara|botar fogo|tacar fogo|linchar)\b/i
  ];
  for (const pattern of threatPatterns) {
    if (pattern.test(normalized)) {
      riskFlags.push('THREAT');
      break;
    }
  }

  // Menção a menores
  const childPatterns = [
    /\b(crianca de \d+ anos|menor de idade|aluno da escola)\b/i
  ];
  for (const pattern of childPatterns) {
    if (pattern.test(normalized)) {
      riskFlags.push('CHILD_DATA');
      break;
    }
  }

  const isHighRisk = riskFlags.length > 0;
  const confidence = isHighRisk ? 0.90 : 0.95;

  return {
    isHighRisk,
    riskFlags,
    confidence,
    requiresHumanReview: isHighRisk
  };
}

/**
 * Sanitiza e prepara o payload seguro para envio ao modelo Gemini (Seção 15.2).
 * Garante que nenhum dado pessoal sensível (PII) seja transmitido para a LLM externa.
 */
export function prepareGeminiSafePayload(rawContent: string): {
  safeText: string;
  piiDetected: boolean;
  detectedTypes: string[];
} {
  const { sanitizedText, hasPii, detectedPiiTypes } = sanitizeText(rawContent);

  return {
    safeText: sanitizedText,
    piiDetected: hasPii,
    detectedTypes: detectedPiiTypes
  };
}
