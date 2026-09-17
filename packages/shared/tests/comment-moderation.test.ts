import { describe, it, expect } from 'vitest';
import {
  IssueComment,
  evaluateCommentRisk,
  applyCommentEdit,
  processCommentReport,
  maskProfanity,
  checkCommentForAuthorWarning
} from '../src/index.js';

describe('Comment Moderation and Discussion Rules (AC-03 & Seção 16/23)', () => {
  const baseComment: IssueComment = {
    commentId: 'comm-001',
    issueId: 'OPP-MN-001',
    userId: 'user-carlos',
    authorPublicName: 'Carlos S.',
    text: 'A rua fica muito escura após as 19h.',
    moderationState: 'APPROVED',
    reportCount: 0,
    createdAt: '2026-09-10T10:00:00Z'
  };

  it('should approve low risk constructive civic comments immediately', () => {
    const result = evaluateCommentRisk('Também passo por aqui todos os dias e confirmo o poste apagado.');
    expect(result.moderationState).toBe('APPROVED');
    expect(result.requiresHumanReview).toBe(false);
    expect(result.riskFlags).toHaveLength(0);
    expect(result.hasProfanity).toBe(false);
  });

  it('should detect profanity and substitute bad words with ######', () => {
    const rawText = 'Essa rua tá uma merda e uma porra de buraco!';
    const masked = maskProfanity(rawText);
    expect(masked.hasProfanity).toBe(true);
    expect(masked.foundWords).toHaveLength(2);
    expect(masked.maskedText).toBe('Essa rua tá uma ###### e uma ###### de buraco!');

    const evalResult = evaluateCommentRisk(rawText);
    expect(evalResult.sanitizedText).toBe('Essa rua tá uma ###### e uma ###### de buraco!');
    expect(evalResult.hasProfanity).toBe(true);
    expect(evalResult.riskFlags).toContain('PROFANITY_DETECTED');
  });

  it('should generate educational warnings for author before posting', () => {
    const check = checkCommentForAuthorWarning('Que merda de prefeito ladrão, vou quebrar a cara dele!');
    expect(check.hasWarnings).toBe(true);
    expect(check.hasProfanity).toBe(true);
    expect(check.hasHighRisk).toBe(true);

    const categories = check.warnings.map(w => w.category);
    expect(categories).toContain('PROFANITY');
    expect(categories).toContain('CRIME_ACCUSATION');
    expect(categories).toContain('VIOLENCE_THREAT');

    // Prévia deve conter palavrões substituídos por ######
    expect(check.previewText).toContain('Que ###### de prefeito ladrão');
  });

  it('should flag comments containing nominal accusations or sensitive risks', () => {
    const accusationResult = evaluateCommentRisk('O secretário é um corrupto e ladrão de merenda!');
    expect(accusationResult.moderationState).toBe('AUTO_FLAGGED');
    expect(accusationResult.requiresHumanReview).toBe(true);
    expect(accusationResult.riskFlags).toContain('NOMINAL_CRIME_ACCUSATION');

    const piiResult = evaluateCommentRisk('O responsável mora na casa do CPF 123.456.789-00 telefone 98888-7777');
    expect(piiResult.moderationState).toBe('AUTO_FLAGGED');
    expect(piiResult.riskFlags).toContain('PII_CPF');
    expect(piiResult.sanitizedText).not.toContain('123.456.789-00');
  });

  it('should preserve version history when comment is edited', () => {
    const { updatedComment, auditEvent } = applyCommentEdit(
      baseComment,
      'A rua fica muito escura após as 19h e os postes 4 e 5 estão sem luz.',
      'user-carlos'
    );

    expect(updatedComment.text).toContain('postes 4 e 5');
    expect(updatedComment.editHistory).toHaveLength(1);
    expect(updatedComment.editHistory![0].text).toBe(baseComment.text);
    expect(auditEvent.action).toBe('COMMENT_EDITED');
    expect(auditEvent.actorId).toBe('user-carlos');
  });

  it('should prevent non-authors from editing a comment', () => {
    expect(() => {
      applyCommentEdit(baseComment, 'Texto alterado por invasor', 'user-outro');
    }).toThrow('Apenas o autor do comentário pode editá-lo.');
  });

  it('should flag comment when reports exceed threshold', () => {
    const report1 = {
      reportId: 'rep-1',
      commentId: baseComment.commentId,
      issueId: baseComment.issueId,
      reportingUserId: 'user-maria',
      reason: 'OFFENSIVE' as const,
      createdAt: new Date().toISOString()
    };

    const firstResult = processCommentReport(baseComment, report1, 2);
    expect(firstResult.updatedComment.reportCount).toBe(1);
    expect(firstResult.shouldCreateModerationCase).toBe(false);
    expect(firstResult.updatedComment.moderationState).toBe('APPROVED');

    const report2 = {
      reportId: 'rep-2',
      commentId: baseComment.commentId,
      issueId: baseComment.issueId,
      reportingUserId: 'user-joao',
      reason: 'OFFENSIVE' as const,
      createdAt: new Date().toISOString()
    };

    const secondResult = processCommentReport(firstResult.updatedComment, report2, 2);
    expect(secondResult.updatedComment.reportCount).toBe(2);
    expect(secondResult.shouldCreateModerationCase).toBe(true);
    expect(secondResult.updatedComment.moderationState).toBe('AUTO_FLAGGED');
    expect(secondResult.auditEvent.action).toBe('COMMENT_REPORTED');
  });
});
