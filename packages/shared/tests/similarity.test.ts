import { describe, it, expect } from 'vitest';
import {
  Issue,
  IssueStatus,
  calculateIssueSimilarity,
  findDuplicateCandidates,
  expandTokensWithSynonyms
} from '../src/index.js';

describe('Similarity and Duplicate Prevention Engine (AC-01, AC-02 & Seção 12)', () => {
  const existingIssue: Issue = {
    issueId: 'OPP-MN-001',
    municipalityId: 'mundo-novo-ms',
    title: 'Postes com lâmpadas apagadas há mais de duas semanas na Rua das Flores',
    publicSummary: 'Trecho escuro gerando insegurança',
    categoryId: 'iluminacao',
    locationApprox: {
      neighborhood: 'Centro',
      streetApprox: 'Rua das Flores',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: IssueStatus.OPEN,
    agencyIds: ['sec-obras'],
    rootManifestationId: 'MF-001-ROOT',
    formalSupportCount: 15,
    commentCount: 4,
    followerCount: 20,
    lastPublicActivityAt: '2026-09-10T10:00:00Z',
    searchTokens: ['iluminacao', 'rua', 'flores', 'centro', 'lampada', 'apagada', 'poste'],
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
    createdBy: 'user-1',
    moderationState: 'APPROVED',
    schemaVersion: 3
  };

  const potholeIssue: Issue = {
    issueId: 'OPP-MN-002',
    municipalityId: 'mundo-novo-ms',
    title: 'Buraco perigoso na esquina da JK',
    publicSummary: 'Erosão no asfalto com risco de acidentes',
    categoryId: 'vias',
    locationApprox: {
      neighborhood: 'Berneck',
      streetApprox: 'Av JK',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: IssueStatus.AWAITING_RESPONSE,
    agencyIds: ['sec-obras'],
    rootManifestationId: 'MF-002-ROOT',
    formalSupportCount: 30,
    commentCount: 8,
    followerCount: 40,
    lastPublicActivityAt: '2026-09-11T10:00:00Z',
    searchTokens: ['buraco', 'asfalto', 'berneck', 'erosao', 'jk'],
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-11T10:00:00Z',
    createdBy: 'user-2',
    moderationState: 'APPROVED',
    schemaVersion: 3
  };

  it('should expand civic synonyms correctly', () => {
    const tokens = ['cratera', 'lixo'];
    const expanded = expandTokensWithSynonyms(tokens);
    expect(expanded).toContain('buraco');
    expect(expanded).toContain('asfalto');
    expect(expanded).toContain('entulho');
  });

  it('should calculate high similarity for duplicates with matching category and neighborhood', () => {
    const candidate = calculateIssueSimilarity(
      {
        municipalityId: 'mundo-novo-ms',
        title: 'Lâmpada queimada e poste escuro na Rua das Flores',
        categoryId: 'iluminacao',
        neighborhood: 'Centro'
      },
      existingIssue
    );

    expect(candidate).not.toBeNull();
    expect(candidate!.similarityScore).toBeGreaterThanOrEqual(0.70);
    expect(candidate!.matchReasons).toContain('Mesma categoria de serviço');
    expect(candidate!.matchReasons).toContain('Mesmo bairro (Centro)');
  });

  it('should find duplicates even when using civic synonyms (e.g. cratera -> buraco)', () => {
    const candidate = calculateIssueSimilarity(
      {
        municipalityId: 'mundo-novo-ms',
        title: 'Cratera enorme no asfalto danificando suspensão de carros',
        categoryId: 'vias',
        neighborhood: 'Berneck'
      },
      potholeIssue
    );

    expect(candidate).not.toBeNull();
    // tokens 'cratera' expandiu para 'buraco' e 'asfalto'
    expect(candidate!.matchedTokens).toContain('buraco');
    expect(candidate!.matchedTokens).toContain('asfalto');
    expect(candidate!.similarityScore).toBeGreaterThanOrEqual(0.70);
  });

  it('should rank and filter duplicate candidates appropriately', () => {
    const candidates = findDuplicateCandidates(
      {
        municipalityId: 'mundo-novo-ms',
        title: 'Poste apagado na escuridão',
        categoryId: 'iluminacao',
        neighborhood: 'Centro'
      },
      [existingIssue, potholeIssue]
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0].issue.issueId).toBe('OPP-MN-001');
    expect(candidates[0].similarityScore).toBeGreaterThanOrEqual(0.50);
  });

  it('should discard issues from different municipalities or hidden issues', () => {
    const diffCityCandidate = calculateIssueSimilarity(
      {
        municipalityId: 'outra-cidade-ms',
        title: 'Poste apagado',
        categoryId: 'iluminacao'
      },
      existingIssue
    );
    expect(diffCityCandidate).toBeNull();

    const hiddenIssue = { ...existingIssue, status: IssueStatus.HIDDEN };
    const hiddenCandidate = calculateIssueSimilarity(
      {
        municipalityId: 'mundo-novo-ms',
        title: 'Poste apagado',
        categoryId: 'iluminacao'
      },
      hiddenIssue
    );
    expect(hiddenCandidate).toBeNull();
  });

  it('should find issues using incomplete words (prefixes / autocomplete)', () => {
    // Busca com prefixo "bur" deve casar com "buraco"
    const potholeCandidate = calculateIssueSimilarity(
      {
        municipalityId: 'mundo-novo-ms',
        title: 'bur'
      },
      potholeIssue
    );
    expect(potholeCandidate).not.toBeNull();
    expect(potholeCandidate!.similarityScore).toBeGreaterThanOrEqual(0.30);
    expect(potholeCandidate!.matchedTokens).toContain('buraco');

    // Busca com prefixo "ilum" deve casar com "iluminacao"
    const lightCandidate = calculateIssueSimilarity(
      {
        municipalityId: 'mundo-novo-ms',
        title: 'ilum'
      },
      existingIssue
    );
    expect(lightCandidate).not.toBeNull();
    expect(lightCandidate!.similarityScore).toBeGreaterThanOrEqual(0.30);
    expect(lightCandidate!.matchedTokens).toContain('iluminacao');
  });

  it('should find issues using fuzzy matching and typo tolerance', () => {
    // Erro leve de digitação: "iluminasao" com s
    const typoCandidate = calculateIssueSimilarity(
      {
        municipalityId: 'mundo-novo-ms',
        title: 'iluminasao'
      },
      existingIssue
    );
    expect(typoCandidate).not.toBeNull();
    expect(typoCandidate!.similarityScore).toBeGreaterThanOrEqual(0.30);

    // Variação de plural: "postes" vs "poste"
    const pluralCandidate = calculateIssueSimilarity(
      {
        municipalityId: 'mundo-novo-ms',
        title: 'postes apagados'
      },
      existingIssue
    );
    expect(pluralCandidate).not.toBeNull();
    expect(pluralCandidate!.similarityScore).toBeGreaterThanOrEqual(0.40);
  });

  it('should find duplicates when prefix of civic synonym is used (e.g. crat -> cratera -> buraco)', () => {
    const candidate = calculateIssueSimilarity(
      {
        municipalityId: 'mundo-novo-ms',
        title: 'crat'
      },
      potholeIssue
    );
    expect(candidate).not.toBeNull();
    expect(candidate!.similarityScore).toBeGreaterThanOrEqual(0.30);
    expect(candidate!.matchedTokens).toContain('buraco');
  });
});
