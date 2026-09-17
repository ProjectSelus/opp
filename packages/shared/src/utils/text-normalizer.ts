/**
 * Normalizador de Texto e Desofuscação Cívica (Camada 1 de Moderação)
 * Trata leetspeak, espaçamentos deliberados, pontuações entre caracteres e repetições
 */

const LEET_MAP: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '3': 'e',
  '1': 'i',
  '!': 'i',
  '|': 'i',
  '0': 'o',
  '5': 's',
  '$': 's',
  '7': 't',
  '8': 'b'
};

/**
 * Converte leetspeak comum em letras do alfabeto latino (ex: p0rr4 -> porra, v1ado -> viado)
 */
export function decodeLeetspeak(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += LEET_MAP[char] || char;
  }
  return result;
}

/**
 * Remove espaçamentos e pontuações entre letras isoladas projetadas para burlar filtros
 * Exemplo: "v . s . f" -> "vsf", "t - n - c" -> "tnc", "v i a d o" -> "viado"
 */
export function collapseSpacedAcronyms(text: string): string {
  // 1. Colapsa acrônimos ofensivos conhecidos com separadores (pontos, traços, espaços)
  let res = text.replace(
    /\b(v[\s._-]*s[\s._-]*f|t[\s._-]*n[\s._-]*c|v[\s._-]*t[\s._-]*n[\s._-]*c|t[\s._-]*m[\s._-]*n[\s._-]*c|f[\s._-]*d[\s._-]*p|p[\s._-]*q[\s._-]*p|p[\s._-]*n[\s._-]*c|s[\s._-]*f[\s._-]*d|k[\s._-]*c[\s._-]*t|k[\s._-]*r[\s._-]*l)\b/gi,
    (match) => match.replace(/[\s._-]/g, '')
  );

  // 2. Colapsa sequências genéricas de 3 ou 4 letras pontuadas de forma uniforme
  res = res.replace(/\b([a-zA-Z0-9])([._-])([a-zA-Z0-9])\2([a-zA-Z0-9])(?:\2([a-zA-Z0-9]))?\b/g, (match) => {
    return match.replace(/[._-]/g, '');
  });

  return res;
}

/**
 * Reduz repetições exageradas de caracteres para um único caractere
 * Exemplo: "meeerrrdddaaa" -> "merda", "poooorrrra" -> "porra"
 */
export function collapseExcessiveRepeats(text: string): string {
  // Trata termos específicos com repetições antes de regras gerais
  let res = text
    .replace(/me+r+d+a+/gi, 'merda')
    .replace(/po+r{2,}a+/gi, 'porra');

  return res
    .replace(/(r)\1{2,}/gi, 'rr')
    .replace(/(s)\1{2,}/gi, 'ss')
    .replace(/(.)\1{2,}/g, '$1');
}

/**
 * Executa o pipeline completo de normalização de texto para desofuscação
 */
export function normalizeForModeration(rawText: string): string {
  // 1. Decodifica números/símbolos leetspeak
  const leetDecoded = decodeLeetspeak(rawText);
  // 2. Colapsa acrônimos espaçados ou pontuados
  const unspaced = collapseSpacedAcronyms(leetDecoded);
  // 3. Colapsa repetições propositais
  const deduplicated = collapseExcessiveRepeats(unspaced);

  return deduplicated;
}
