import { describe, it, expect } from 'vitest';
import {
  deterministicSuggestMetadata,
  deterministicNeutralSummary,
  deterministicContentRisk,
  prepareGeminiSafePayload
} from '../src/domain/ai-heuristics.js';

describe('Heurísticas de IA Assistiva e Resiliência (Fase 6 / AC-10)', () => {
  it('deve classificar corretamente categoria de iluminação pública e sugerir SEMOB', () => {
    const suggestion = deterministicSuggestMetadata(
      'O poste em frente ao número 45 está com a lâmpada queimada e a rua está no escuro total há 3 noites.'
    );

    expect(suggestion.suggestedCategoryId).toBe('iluminacao');
    expect(suggestion.suggestedAgencyId).toBe('sec-obras-mn');
    expect(suggestion.confidenceScore).toBeGreaterThan(0.7);
    expect(suggestion.reasoning).toContain('SEMOB');
  });

  it('deve classificar corretamente demanda de saúde municipal e sugerir SMS', () => {
    const suggestion = deterministicSuggestMetadata(
      'Falta de remédio para hipertensão no posto de saúde central da UBS há duas semanas.'
    );

    expect(suggestion.suggestedCategoryId).toBe('saude');
    expect(suggestion.suggestedAgencyId).toBe('sec-saude-mn');
    expect(suggestion.confidenceScore).toBeGreaterThan(0.7);
  });

  it('deve classificar via/buraco e sugerir obras', () => {
    const suggestion = deterministicSuggestMetadata(
      'Buraco enorme na Avenida Brasil, asfalto cedendo e cratera oferecendo risco de acidentes.'
    );

    expect(suggestion.suggestedCategoryId).toBe('vias');
    expect(suggestion.suggestedAgencyId).toBe('sec-obras-mn');
    expect(suggestion.confidenceScore).toBeGreaterThan(0.7);
  });

  it('deve gerar resumo público neutro sem adjetivos exaltados', () => {
    const rawContent = 'UM ABSURDO TOTAL!!!! O prefeito safado não faz nada e a rua está horrível!!!!!!';
    const summary = deterministicNeutralSummary(rawContent, 'Rua com buracos');

    expect(summary).toContain('[Rua com buracos]');
    expect(summary).not.toContain('!!!!');
    expect(summary).toContain('Relato cívico de demanda de interesse público');
  });

  it('deve sinalizar risco alto em acusação de crime nominal ou corrupção (Seção 16.2)', () => {
    const report = deterministicContentRisk('O secretário da pasta é um ladrão corrupto que desviou a verba da praça');

    expect(report.isHighRisk).toBe(true);
    expect(report.riskFlags).toContain('NOMINAL_CRIME_ACCUSATION');
    expect(report.requiresHumanReview).toBe(true);
  });

  it('deve sinalizar ameaça de violência como risco crítico', () => {
    const report = deterministicContentRisk('Se não consertarem amanhã eu vou quebrar a cara do responsável e botar fogo');

    expect(report.isHighRisk).toBe(true);
    expect(report.riskFlags).toContain('THREAT');
  });

  it('deve higienizar deterministamente PII antes de qualquer envio ao Gemini (Seção 15.2)', () => {
    const rawInput = 'Meu CPF é 012.345.678-99 e meu e-mail é cidadao@email.com. Tem vazamento de água na esquina.';
    const payload = prepareGeminiSafePayload(rawInput);

    expect(payload.piiDetected).toBe(true);
    expect(payload.detectedTypes).toContain('CPF');
    expect(payload.detectedTypes).toContain('EMAIL');
    expect(payload.safeText).not.toContain('012.345.678-99');
    expect(payload.safeText).not.toContain('cidadao@email.com');
    expect(payload.safeText).toContain('***.***.***-**');
    expect(payload.safeText).toContain('***@***.***');
    expect(payload.safeText).toContain('Tem vazamento de água na esquina.');
  });
});
