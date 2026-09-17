import { describe, it, expect } from 'vitest';
import { normalizeText, generateSearchTokens, calculateTokenScore } from '../src/utils/search-tokens.js';

describe('Search tokens and normalization', () => {
  it('should normalize text and strip accents and special symbols', () => {
    const raw = 'Iluminação Pública - São João del-Rei / Atenção!';
    const normalized = normalizeText(raw);
    expect(normalized).toBe('iluminacao publica sao joao del rei atencao');
  });

  it('should extract meaningful tokens and ignore common Portuguese stop words', () => {
    const tokens = generateSearchTokens([
      'Falta de iluminação na Rua das Flores',
      'Bairro Centro',
      'Poste apagado'
    ]);

    expect(tokens).toContain('falta');
    expect(tokens).toContain('iluminacao');
    expect(tokens).toContain('rua');
    expect(tokens).toContain('flores');
    expect(tokens).toContain('bairro');
    expect(tokens).toContain('centro');
    expect(tokens).toContain('poste');
    expect(tokens).toContain('apagado');

    // stopwords ignoradas
    expect(tokens).not.toContain('de');
    expect(tokens).not.toContain('na');
    expect(tokens).not.toContain('das');
  });

  it('should calculate matching score between search query and issue tokens', () => {
    const queryTokens = ['buraco', 'rua', 'flores'];
    const issueTokens = ['buraco', 'rua', 'flores', 'centro', 'asfalto'];

    const match = calculateTokenScore(queryTokens, issueTokens);
    expect(match.score).toBe(1); // 100% dos tokens buscados casaram
    expect(match.matched).toEqual(['buraco', 'rua', 'flores']);

    const partialQuery = ['iluminacao', 'rua', 'flores'];
    const partialMatch = calculateTokenScore(partialQuery, issueTokens);
    expect(partialMatch.score).toBeCloseTo(0.666, 2);
    expect(partialMatch.matched).toEqual(['rua', 'flores']);
  });
});
