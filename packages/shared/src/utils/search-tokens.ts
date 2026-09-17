/**
 * Utilitário de Normalização e Geração de Tokens de Busca
 * Suporta o SearchProvider de baixo custo baseado em Firestore (Seção 12.1)
 */

const STOP_WORDS = new Set([
  'a', 'ao', 'aos', 'aquela', 'aquelas', 'aquele', 'aqueles', 'aquilo', 'as', 'ate',
  'com', 'como', 'da', 'das', 'de', 'dela', 'delas', 'dele', 'deles', 'do', 'dos',
  'e', 'ela', 'elas', 'ele', 'eles', 'em', 'entre', 'era', 'eram', 'essa', 'essas',
  'esse', 'esses', 'esta', 'estas', 'este', 'estes', 'eu', 'foi', 'fomos', 'foram',
  'ha', 'isso', 'isto', 'ja', 'lhe', 'lhes', 'mais', 'mas', 'me', 'mesmo', 'meu',
  'meus', 'minha', 'minhas', 'na', 'nas', 'nao', 'no', 'nos', 'nossa', 'nossas',
  'nosso', 'nossos', 'num', 'numa', 'o', 'os', 'ou', 'para', 'pela', 'pelas',
  'pelo', 'pelos', 'por', 'qual', 'quando', 'que', 'quem', 'se', 'sem', 'ser',
  'seu', 'seus', 'so', 'sua', 'suas', 'tambem', 'te', 'tem', 'ter', 'teu', 'teus',
  'tu', 'tua', 'tuas', 'um', 'uma', 'umas', 'uns', 'voce', 'voces'
]);

/**
 * Remove acentuação e converte para minúsculas
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .replace(/[^a-z0-9\s]/g, ' ')   // substitui pontuação por espaço
    .replace(/\s+/g, ' ')            // colapsa múltiplos espaços
    .trim();
}

/**
 * Extrai tokens únicos relevantes para indexação e busca
 */
export function generateSearchTokens(inputs: (string | undefined | null)[]): string[] {
  const combined = inputs.filter(Boolean).join(' ');
  const normalized = normalizeText(combined);
  const words = normalized.split(' ');

  const tokens = new Set<string>();

  for (const word of words) {
    if (word.length >= 3 && !STOP_WORDS.has(word)) {
      tokens.add(word);
    }
  }

  return Array.from(tokens);
}

/**
 * Calcula score simples de correspondência entre tokens de busca e tokens do issue
 */
export function calculateTokenScore(queryTokens: string[], issueTokens: string[]): { score: number; matched: string[] } {
  if (!queryTokens.length || !issueTokens.length) {
    return { score: 0, matched: [] };
  }

  const issueSet = new Set(issueTokens);
  const matched = queryTokens.filter(token => issueSet.has(token));
  const score = matched.length / queryTokens.length;

  return { score, matched };
}
