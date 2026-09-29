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
    if (word.length >= 2 && !STOP_WORDS.has(word)) {
      tokens.add(word);
    }
  }

  return Array.from(tokens);
}

/**
 * Distância de Levenshtein para cálculo de erros de digitação e similaridade
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // remoção
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalização de plurais e radicais simples da língua portuguesa
 */
export function stemPortuguese(word: string): string {
  if (!word || word.length <= 3) return word;

  if (word.endsWith('oes') || word.endsWith('aes')) return word.slice(0, -3) + 'ao';
  if (word.endsWith('ais')) return word.slice(0, -3) + 'al';
  if (word.endsWith('eis')) return word.slice(0, -3) + 'el';
  if (word.endsWith('ois')) return word.slice(0, -3) + 'ol';
  if (word.endsWith('uis')) return word.slice(0, -3) + 'ul';
  if (word.endsWith('res') || word.endsWith('zes') || word.endsWith('ses')) return word.slice(0, -2);
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -1); // postes -> poste
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('asfalto') && !word.endsWith('onibus')) {
    return word.slice(0, -1); // buracos -> buraco, lampadas -> lampada
  }

  return word;
}

export interface TokenMatchResult {
  matched: boolean;
  score: number; // 0.0 a 1.0
  reason: 'exact' | 'stem' | 'prefix' | 'fuzzy' | 'contains' | 'none';
}

/**
 * Compara um token de consulta com um token do issue, suportando:
 * - Match exato (1.0)
 * - Match de radical/stemming (0.95)
 * - Palavras incompletas / Prefixos (0.70 a 0.95)
 * - Substring / Contém (0.75)
 * - Similaridade / Erros de digitação leves via Levenshtein (0.70 a 0.85)
 */
export function matchSingleToken(queryToken: string, issueToken: string): TokenMatchResult {
  if (!queryToken || !issueToken) {
    return { matched: false, score: 0, reason: 'none' };
  }

  // 1. Match exato
  if (queryToken === issueToken) {
    return { matched: true, score: 1.0, reason: 'exact' };
  }

  // 2. Radical / Plural (ex: buracos -> buraco, postes -> poste)
  const qStem = stemPortuguese(queryToken);
  const iStem = stemPortuguese(issueToken);
  if (qStem === iStem || qStem === issueToken || queryToken === iStem) {
    return { matched: true, score: 0.95, reason: 'stem' };
  }

  // 3. Palavra incompleta / Prefixo (ex: "bur" -> "buraco", "ilum" -> "iluminacao")
  if (queryToken.length >= 2 && issueToken.startsWith(queryToken)) {
    const ratio = queryToken.length / issueToken.length;
    const score = Math.max(0.70, Number((0.65 + 0.35 * ratio).toFixed(2)));
    return { matched: true, score, reason: 'prefix' };
  }

  // Se o token do issue for prefixo da busca (ex: usuário digitou "asfaltamento", issue tem "asfalto")
  if (issueToken.length >= 3 && queryToken.startsWith(issueToken)) {
    const ratio = issueToken.length / queryToken.length;
    const score = Math.max(0.65, Number((0.60 + 0.35 * ratio).toFixed(2)));
    return { matched: true, score, reason: 'prefix' };
  }

  // 4. Substring contígua (ex: "medic" em "medicamentos")
  if (queryToken.length >= 3 && issueToken.includes(queryToken)) {
    return { matched: true, score: 0.75, reason: 'contains' };
  }

  // 5. Similaridade / Fuzzy (Erros de digitação leves via Levenshtein)
  const maxLen = Math.max(queryToken.length, issueToken.length);
  const minLen = Math.min(queryToken.length, issueToken.length);

  if (minLen >= 4) {
    const dist = levenshteinDistance(queryToken, issueToken);
    if (dist === 1) {
      // 1 caractere de diferença (ex: lampda -> lampada, asfauto -> asfalto, esgoto -> escoto)
      return { matched: true, score: 0.85, reason: 'fuzzy' };
    }
    if (dist === 2 && maxLen >= 6) {
      // 2 caracteres de diferença em palavras longas (ex: iluminasao -> iluminacao)
      return { matched: true, score: 0.70, reason: 'fuzzy' };
    }
  }

  return { matched: false, score: 0, reason: 'none' };
}

/**
 * Calcula score avançado de correspondência entre tokens de busca e tokens do issue
 */
export function calculateTokenScore(queryTokens: string[], issueTokens: string[]): { score: number; matched: string[] } {
  if (!queryTokens.length || !issueTokens.length) {
    return { score: 0, matched: [] };
  }

  let totalScore = 0;
  const matchedTokens: string[] = [];

  for (const qToken of queryTokens) {
    let bestScore = 0;
    let bestMatchedToken: string | null = null;

    for (const iToken of issueTokens) {
      const result = matchSingleToken(qToken, iToken);
      if (result.matched && result.score > bestScore) {
        bestScore = result.score;
        bestMatchedToken = iToken;
      }
    }

    if (bestMatchedToken) {
      matchedTokens.push(qToken);
      totalScore += bestScore;
    }
  }

  const score = totalScore / queryTokens.length;
  return { score, matched: matchedTokens };
}
