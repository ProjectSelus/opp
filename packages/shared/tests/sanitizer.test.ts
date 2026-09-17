import { describe, it, expect } from 'vitest';
import { sanitizeText, maskCpf, maskPhone, maskEmail } from '../src/utils/sanitizer.js';

describe('Sanitizer deterministic PII masking', () => {
  it('should mask CPFs in multiple formats', () => {
    const raw = 'Meu CPF é 123.456.789-00 ou 12345678900.';
    const sanitized = maskCpf(raw);
    expect(sanitized).not.toContain('123.456.789-00');
    expect(sanitized).not.toContain('12345678900');
    expect(sanitized).toContain('***.***.***-**');
  });

  it('should mask phone numbers', () => {
    const raw = 'Ligue para (11) 98765-4321 ou +55 31 91234-5678 urgente.';
    const sanitized = maskPhone(raw);
    expect(sanitized).not.toContain('98765-4321');
    expect(sanitized).toContain('(**) *****-****');
  });

  it('should mask emails', () => {
    const raw = 'Contato: cidadao.silva@exemplo.com.br para detalhes.';
    const sanitized = maskEmail(raw);
    expect(sanitized).not.toContain('cidadao.silva@exemplo.com.br');
    expect(sanitized).toContain('***@***.***');
  });

  it('should perform comprehensive multi-field sanitization and flag PII types', () => {
    const raw = 'Denúncia de João, CPF 999.888.777-66, e-mail teste@gov.br no CEP 35500-000 e tel (37) 99876-5432.';
    const result = sanitizeText(raw);

    expect(result.hasPii).toBe(true);
    expect(result.detectedPiiTypes).toContain('CPF');
    expect(result.detectedPiiTypes).toContain('EMAIL');
    expect(result.detectedPiiTypes).toContain('PHONE');
    expect(result.detectedPiiTypes).toContain('CEP');

    expect(result.sanitizedText).not.toContain('999.888.777-66');
    expect(result.sanitizedText).not.toContain('teste@gov.br');
    expect(result.sanitizedText).not.toContain('(37) 99876-5432');
    expect(result.sanitizedText).not.toContain('35500-000');
  });
});
