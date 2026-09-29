/**
 * Motor de Similaridade e Detecção de Duplicidades (Seção 12.1 & 12.3)
 * Avalia correspondência multi-critério: tokens, categoria e bairro
 */

import { Issue } from '../domain/entities.js';
import { generateSearchTokens, normalizeText, matchSingleToken, TokenMatchResult } from './search-tokens.js';

export interface SimilarityCriteria {
  municipalityId: string;
  title: string;
  description?: string;
  categoryId?: string;
  neighborhood?: string;
}

export interface ScoredCandidate {
  issue: Issue;
  similarityScore: number; // 0.0 a 1.0 (ou 0% a 100%)
  matchedTokens: string[];
  matchReasons: string[];
}

/**
 * Mapa de expansão semântica de termos cívicos frequentes em municípios brasileiros
 */
export const CIVIC_SYNONYMS: Record<string, string[]> = {
  buraco: ['cratera', 'asfalto', 'erosao', 'pavimentacao', 'panela', 'recapeamento', 'rua', 'via', 'calcada', 'bueiro', 'vala'],
  cratera: ['buraco', 'asfalto', 'erosao', 'pavimentacao', 'panela'],
  asfalto: ['buraco', 'pavimentacao', 'recapeamento', 'via', 'rua', 'cratera'],
  pavimentacao: ['asfalto', 'buraco', 'recapeamento', 'calcada'],
  iluminacao: ['poste', 'lampada', 'queimada', 'apagada', 'escuro', 'escuridao', 'luz', 'fiacao', 'braco'],
  poste: ['iluminacao', 'lampada', 'fiacao', 'escuro', 'apagada', 'queimada', 'luz'],
  lampada: ['iluminacao', 'poste', 'queimada', 'apagada', 'luz'],
  luz: ['iluminacao', 'poste', 'lampada', 'escuridao', 'apagada', 'escuro'],
  escuro: ['iluminacao', 'escuridao', 'poste', 'lampada', 'apagada', 'luz'],
  escuridao: ['iluminacao', 'escuro', 'poste', 'lampada', 'apagada'],
  lixo: ['entulho', 'limpeza', 'descarte', 'terreno', 'cacamba', 'residuos', 'sujeira', 'mato', 'capim'],
  entulho: ['lixo', 'limpeza', 'descarte', 'residuos', 'cacamba'],
  limpeza: ['lixo', 'entulho', 'varricao', 'terreno', 'mato', 'capim', 'sujeira'],
  mato: ['limpeza', 'terreno', 'capim', 'lixo', 'entulho'],
  saude: ['posto', 'ubs', 'medicamento', 'remedio', 'medico', 'consulta', 'upa', 'farmacia', 'exame', 'vacina', 'atendimento'],
  remedio: ['medicamento', 'saude', 'posto', 'farmacia', 'falta'],
  medicamento: ['remedio', 'saude', 'posto', 'farmacia', 'falta'],
  medico: ['consulta', 'posto', 'ubs', 'upa', 'saude', 'atendimento'],
  posto: ['ubs', 'upa', 'saude', 'atendimento', 'consulta', 'medico', 'remedio'],
  ubs: ['posto', 'saude', 'upa', 'atendimento'],
  onibus: ['transporte', 'coletivo', 'circular', 'linha', 'parada', 'ponto', 'atraso', 'itinerario', 'horario'],
  transporte: ['onibus', 'circular', 'coletivo', 'linha', 'parada', 'tarifa', 'horario'],
  agua: ['esgoto', 'vazamento', 'saneamento', 'cano', 'bueiro', 'falta', 'torneira', 'encanamento', 'tubulacao'],
  esgoto: ['agua', 'vazamento', 'saneamento', 'fossa', 'bueiro', 'mau', 'cheiro'],
  vazamento: ['agua', 'cano', 'esgoto', 'encanamento', 'torneira'],
  bueiro: ['boca', 'lobo', 'esgoto', 'agua', 'chuva', 'tampa']
};

/**
 * Expande lista de tokens incluindo sinônimos cívicos diretos e termos de palavras incompletas
 */
export function expandTokensWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);

  for (const token of tokens) {
    // 1. Sinônimo direto
    const direct = CIVIC_SYNONYMS[token];
    if (direct) {
      for (const syn of direct) {
        expanded.add(syn);
      }
    }

    // 2. Expansão por prefixo de termos cívicos chave (ex: "bura" -> "buraco" -> sinônimos)
    if (token.length >= 3) {
      for (const [key, synonyms] of Object.entries(CIVIC_SYNONYMS)) {
        if (key.startsWith(token) || token.startsWith(key)) {
          expanded.add(key);
          for (const syn of synonyms) {
            expanded.add(syn);
          }
        }
      }
    }
  }

  return Array.from(expanded);
}

/**
 * Calcula similaridade multi-critério entre uma busca ou novo relato e um problema existente
 */
export function calculateIssueSimilarity(
  criteria: SimilarityCriteria,
  issue: Issue
): ScoredCandidate | null {
  // 1. Invariante: mesmo município
  if (criteria.municipalityId !== issue.municipalityId) {
    return null;
  }

  // 2. Não comparar com problemas ocultados ou rejeitados
  if (issue.status === 'HIDDEN' || issue.moderationState === 'REJECTED') {
    return null;
  }

  const matchReasons: string[] = [];
  let totalScore = 0;

  // Montar conjunto abrangente de tokens do issue
  const allIssueTokens = new Set<string>([
    ...(issue.searchTokens || []),
    ...generateSearchTokens([
      issue.title,
      issue.publicSummary,
      issue.locationApprox?.neighborhood,
      issue.locationApprox?.streetApprox
    ])
  ]);
  const issueTokenList = Array.from(allIssueTokens);

  // A. Correspondência de Frase / Substring direta (Bônus de até 20%)
  const normQuery = normalizeText(criteria.title || '');
  const normTitle = normalizeText(issue.title || '');
  const normSummary = normalizeText(issue.publicSummary || '');
  const normNeigh = normalizeText(issue.locationApprox?.neighborhood || '');
  const normStreet = normalizeText(issue.locationApprox?.streetApprox || '');

  let phraseBonus = 0;
  if (normQuery.length >= 3) {
    if (normTitle.includes(normQuery)) {
      phraseBonus = 0.25;
      matchReasons.push('Correspondência direta no título');
    } else if (normSummary.includes(normQuery)) {
      phraseBonus = 0.15;
      matchReasons.push('Correspondência direta no resumo');
    } else if (normStreet.includes(normQuery) || normNeigh.includes(normQuery)) {
      phraseBonus = 0.15;
      matchReasons.push('Correspondência direta no endereço/bairro');
    }
  }

  // B. Correspondência de Tokens com Prefixo, Stemming e Fuzzy (Peso Base: 50%)
  const rawInputTokens = generateSearchTokens([criteria.title, criteria.description]);
  const expandedQueryTokens = expandTokensWithSynonyms(rawInputTokens);

  // Mapeia melhor match encontrado para cada token da busca expandida
  const matchedTokensMap = new Map<string, { matchedToken: string; score: number; reason: TokenMatchResult['reason'] }>();

  for (const qToken of expandedQueryTokens) {
    let bestMatch: { matchedToken: string; score: number; reason: TokenMatchResult['reason'] } | null = null;

    for (const iToken of issueTokenList) {
      const result = matchSingleToken(qToken, iToken);
      if (result.matched && (!bestMatch || result.score > bestMatch.score)) {
        bestMatch = { matchedToken: iToken, score: result.score, reason: result.reason };
      }
    }

    if (bestMatch) {
      matchedTokensMap.set(qToken, bestMatch);
    }
  }

  const matchedTokensSet = new Set<string>();

  if (rawInputTokens.length > 0) {
    let totalMatchedWeight = 0;

    for (const rawToken of rawInputTokens) {
      // 1. Match direto ou aproximado do próprio token digitado
      let bestScoreForRawToken = 0;
      const direct = matchedTokensMap.get(rawToken);
      if (direct) {
        bestScoreForRawToken = direct.score;
        matchedTokensSet.add(direct.matchedToken);
        matchedTokensSet.add(rawToken);
      }

      // 2. Match através de sinônimos cívicos ou expansões por prefixo
      const expansions = expandTokensWithSynonyms([rawToken]);
      for (const exp of expansions) {
        if (exp === rawToken) continue;
        const synMatch = matchedTokensMap.get(exp);
        if (synMatch) {
          matchedTokensSet.add(synMatch.matchedToken);
          matchedTokensSet.add(exp);
          const discounted = synMatch.score * 0.90;
          if (discounted > bestScoreForRawToken) {
            bestScoreForRawToken = discounted;
          }
        }
      }

      totalMatchedWeight += bestScoreForRawToken;
    }

    const uniqueMatchedIssueTokens = Array.from(matchedTokensSet).filter(t => issueTokenList.includes(t));
    const tokenRatio = Math.min(1, Math.max(
      totalMatchedWeight / rawInputTokens.length,
      uniqueMatchedIssueTokens.length / rawInputTokens.length
    ));
    const tokenScore = Math.min(0.55, tokenRatio * 0.50 + phraseBonus);
    totalScore += tokenScore;

    if (matchedTokensSet.size > 0) {
      const displayTokens = Array.from(matchedTokensSet).filter(t => issueTokenList.includes(t));
      matchReasons.push(`${displayTokens.length || matchedTokensSet.size} termos correspondentes (${(displayTokens.length ? displayTokens : Array.from(matchedTokensSet)).slice(0, 3).join(', ')})`);
    }
  } else if (phraseBonus > 0) {
    totalScore += phraseBonus;
  }

  // C. Correspondência de Categoria (Peso: 25%)
  if (criteria.categoryId && issue.categoryId) {
    if (criteria.categoryId === issue.categoryId) {
      totalScore += 0.25;
      matchReasons.push('Mesma categoria de serviço');
    }
  } else if (issue.categoryId && rawInputTokens.some(t => issue.categoryId === t || issue.categoryId?.startsWith(t))) {
    // Se o usuário digitou o nome/prefixo da categoria
    totalScore += 0.15;
    matchReasons.push('Categoria compatível com a busca');
  }

  // D. Correspondência de Localização / Bairro (Peso: 25%)
  if (criteria.neighborhood && issue.locationApprox?.neighborhood) {
    const normInputNeigh = normalizeText(criteria.neighborhood);
    const normIssueNeigh = normalizeText(issue.locationApprox.neighborhood);

    if (normInputNeigh && normIssueNeigh) {
      if (normInputNeigh === normIssueNeigh) {
        totalScore += 0.25;
        matchReasons.push(`Mesmo bairro (${issue.locationApprox.neighborhood})`);
      } else if (normIssueNeigh.includes(normInputNeigh) || normInputNeigh.includes(normIssueNeigh)) {
        totalScore += 0.15;
        matchReasons.push('Bairro ou região aproximada');
      }
    }
  }

  return {
    issue,
    similarityScore: Number(Math.min(1.0, totalScore).toFixed(2)),
    matchedTokens: Array.from(matchedTokensSet),
    matchReasons
  };
}

/**
 * Encontra candidatos a duplicidade classificados por relevância
 */
export function findDuplicateCandidates(
  criteria: SimilarityCriteria,
  candidates: Issue[],
  minScoreThreshold: number = 0.35
): ScoredCandidate[] {
  const scoredList: ScoredCandidate[] = [];

  for (const candidate of candidates) {
    const result = calculateIssueSimilarity(criteria, candidate);
    if (result && result.similarityScore >= minScoreThreshold) {
      scoredList.push(result);
    }
  }

  // Ordena decrescente por score de similaridade
  return scoredList.sort((a, b) => b.similarityScore - a.similarityScore);
}
