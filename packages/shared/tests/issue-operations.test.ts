import { describe, it, expect } from 'vitest';
import {
  Issue,
  IssueStatus,
  validateMergeIssues,
  computeMergedIssue,
  validateSplitIssue,
  computeSplitIssue
} from '../src/index.js';

describe('Issue Merge & Split Operations (AC-12 & Seção 3.4)', () => {
  const baseTarget: Issue = {
    issueId: 'OPP-MN-001',
    municipalityId: 'mundo-novo-ms',
    title: 'Falta de iluminação na Rua das Flores',
    publicSummary: 'Postes apagados',
    categoryId: 'iluminacao',
    locationApprox: {
      neighborhood: 'Centro',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: IssueStatus.OPEN,
    agencyIds: ['sec-obras'],
    rootManifestationId: 'MF-001-ROOT',
    formalSupportCount: 10,
    commentCount: 4,
    followerCount: 15,
    lastPublicActivityAt: '2026-09-10T10:00:00Z',
    searchTokens: ['iluminacao', 'rua', 'flores'],
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
    createdBy: 'user-1',
    moderationState: 'APPROVED',
    schemaVersion: 3
  };

  const baseSource: Issue = {
    issueId: 'OPP-MN-002',
    municipalityId: 'mundo-novo-ms',
    title: 'Poste quebrado e escuro na Rua das Flores esquina com JK',
    publicSummary: 'Mesmo trecho escuro',
    categoryId: 'iluminacao',
    locationApprox: {
      neighborhood: 'Centro',
      city: 'Mundo Novo',
      state: 'MS'
    },
    status: IssueStatus.OPEN,
    agencyIds: ['sec-obras'],
    rootManifestationId: 'MF-002-ROOT',
    formalSupportCount: 6,
    commentCount: 2,
    followerCount: 8,
    lastPublicActivityAt: '2026-09-11T12:00:00Z',
    searchTokens: ['poste', 'quebrado', 'flores', 'jk'],
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-11T12:00:00Z',
    createdBy: 'user-2',
    moderationState: 'APPROVED',
    schemaVersion: 3
  };

  it('should validate and merge two issues accurately', () => {
    const validation = validateMergeIssues(baseTarget, baseSource);
    expect(validation.valid).toBe(true);

    const result = computeMergedIssue(baseTarget, baseSource, 'mod-123', 'Duplicidade do mesmo trecho de iluminação');

    // Target agregou dados
    expect(result.updatedTarget.formalSupportCount).toBe(16); // 10 + 6
    expect(result.updatedTarget.commentCount).toBe(6);         // 4 + 2
    expect(result.updatedTarget.followerCount).toBe(23);       // 15 + 8
    expect(result.updatedTarget.searchTokens).toContain('jk');
    expect(result.updatedTarget.mergeHistory).toHaveLength(1);
    expect(result.updatedTarget.mergeHistory![0].sourceIssueId).toBe('OPP-MN-002');

    // Source marcado como MERGED e redirecionado
    expect(result.updatedSource.status).toBe(IssueStatus.MERGED);
    expect(result.updatedSource.mergedIntoIssueId).toBe('OPP-MN-001');

    // Auditoria append-only para ambas as partes
    expect(result.auditEvents).toHaveLength(2);
    expect(result.auditEvents[0].action).toBe('ISSUE_MERGED_AS_SOURCE');
    expect(result.auditEvents[1].action).toBe('ISSUE_MERGED_AS_TARGET');
  });

  it('should prevent illegal merges', () => {
    // Mesma entidade
    expect(validateMergeIssues(baseTarget, baseTarget).valid).toBe(false);

    // Municípios diferentes
    const otherMunicipality = { ...baseSource, municipalityId: 'eldorado-ms' };
    expect(validateMergeIssues(baseTarget, otherMunicipality).valid).toBe(false);

    // Source já unificado
    const alreadyMerged = { ...baseSource, status: IssueStatus.MERGED };
    expect(validateMergeIssues(baseTarget, alreadyMerged).valid).toBe(false);
  });

  it('should validate and split an issue correctly', () => {
    expect(validateSplitIssue(baseTarget, 3).valid).toBe(true);
    expect(validateSplitIssue(baseTarget, 0).valid).toBe(false);
    expect(validateSplitIssue(baseTarget, 10).valid).toBe(false); // não pode mover todos

    const splitResult = computeSplitIssue(
      baseTarget,
      {
        issueId: 'OPP-MN-003',
        rootManifestationId: 'MF-003-ROOT',
        title: 'Falta de iluminação específica na travessa lateral',
        publicSummary: 'Problema distinto verificado posteriormente',
        categoryId: 'iluminacao',
        locationApprox: baseTarget.locationApprox,
        searchTokens: ['travessa', 'lateral'],
        createdBy: 'mod-123'
      },
      3,
      'mod-123',
      'Desmembramento de situações territoriais distintas'
    );

    expect(splitResult.updatedOriginal.formalSupportCount).toBe(7); // 10 - 3
    expect(splitResult.newIssue.formalSupportCount).toBe(3);
    expect(splitResult.newIssue.splitFromIssueId).toBe('OPP-MN-001');
    expect(splitResult.newIssue.status).toBe(IssueStatus.OPEN);
    expect(splitResult.auditEvents).toHaveLength(2);
  });
});
