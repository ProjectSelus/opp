/**
 * Motor de Similaridade e Detecção de Duplicidades (Seção 12.1 & 12.3)
 * Avalia correspondência multi-critério: tokens, categoria e bairro
 */

import { Issue } from '../domain/entities.js';
import { generateSearchTokens, normalizeText } from './search-tokens.js';

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
const CIVIC_SYNONYMS: Record<string, string[]> = {
  buraco: ['cratera', 'asfalto', 'erosao', 'pavimentacao', 'panela', 'recapeamento'],
  cratera: ['buraco', 'asfalto', 'erosao'],
  iluminacao: ['poste', 'lampada', 'queimada', 'apagada', 'escuro', 'escuridao'],
  poste: ['iluminacao', 'lampada', 'fiacao'],
  lampada: ['iluminacao', 'poste', 'queimada', 'apagada'],
  lixo: ['entulho', 'limpeza', 'descarte', 'terreno', 'cacamba', 'residuos'],
  entulho: ['lixo', 'limpeza', 'descarte'],
  saude: ['posto', 'ubs', 'medicamento', 'remedio', 'medico', 'consulta', 'upa'],
  remedio: ['medicamento', 'saude', 'posto', 'farmacia'],
  onibus: ['transporte', 'coletivo', 'circular', 'linha', 'parada', 'atraso'],
  agua: ['esgoto', 'vazamento', 'saneamento', 'cano', 'bueiro']
};

/**
 * Expande lista de tokens incluindo sinônimos cívicos diretos
 */
export function expandTokensWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);

  for (const token of tokens) {
    const synonyms = CIVIC_SYNONYMS[token];
    if (synonyms) {
      for (const syn of synonyms) {
        expanded.add(syn);
      }
    }
  }

  return Array.from(expanded);
}

/**
 * Calcula similaridade multi-critério entre um novo relato e um problema existente
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

  // A. Correspondência de Tokens (Peso: 50%)
  const rawInputTokens = generateSearchTokens([criteria.title, criteria.description]);
  const expandedQueryTokens = expandTokensWithSynonyms(rawInputTokens);
  const issueTokenSet = new Set(issue.searchTokens || []);

  const matchedTokens = expandedQueryTokens.filter(t => issueTokenSet.has(t));

  if (rawInputTokens.length > 0) {
    const tokenOverlapRatio = Math.min(1, matchedTokens.length / rawInputTokens.length);
    const tokenScore = tokenOverlapRatio * 0.50;
    totalScore += tokenScore;

    if (matchedTokens.length > 0) {
      matchReasons.push(`${matchedTokens.length} termos em comum (${matchedTokens.slice(0, 3).join(', ')})`);
    }
  }

  // B. Correspondência de Categoria (Peso: 25%)
  if (criteria.categoryId && issue.categoryId) {
    if (criteria.categoryId === issue.categoryId) {
      totalScore += 0.25;
      matchReasons.push('Mesma categoria de serviço');
    }
  }

  // C. Correspondência de Localização / Bairro (Peso: 25%)
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
    similarityScore: Number(totalScore.toFixed(2)),
    matchedTokens,
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
