/**
 * Utilitário de Sanitização Determinística de PII
 * Obrigatório antes do envio para a API Gemini e para feeds públicos (Seção 15.2 & 16.1)
 */

export interface SanitizationResult {
  sanitizedText: string;
  detectedPiiTypes: string[];
  hasPii: boolean;
}

// Padrões de detecção para documentos e dados pessoais brasileiros
const CPF_REGEX = /\b(\d{3})[.\s]?(\d{3})[.\s]?(\d{3})[-.\s]?(\d{2})\b/g;
const PHONE_REGEX = /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]?)?(?:9\d{4}|\d{4})[\s-]?\d{4}\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CEP_REGEX = /\b\d{5}[-\s]?\d{3}\b/g;
const RG_REGEX = /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9xX]\b/g;

export function maskCpf(text: string): string {
  return text.replace(CPF_REGEX, '***.***.***-**');
}

export function maskPhone(text: string): string {
  return text.replace(PHONE_REGEX, '(**) *****-****');
}

export function maskEmail(text: string): string {
  return text.replace(EMAIL_REGEX, '***@***.***');
}

export function maskCep(text: string): string {
  return text.replace(CEP_REGEX, '*****-***');
}

export function maskRg(text: string): string {
  return text.replace(RG_REGEX, '** RG REMOVIDO **');
}

/**
 * Sanitiza texto bruto do usuário, mascarando dados pessoais identificáveis.
 */
export function sanitizeText(rawText: string): SanitizationResult {
  if (!rawText) {
    return { sanitizedText: '', detectedPiiTypes: [], hasPii: false };
  }

  const detected: string[] = [];
  let currentText = rawText;

  if (CPF_REGEX.test(currentText)) {
    detected.push('CPF');
    currentText = maskCpf(currentText);
  }

  if (EMAIL_REGEX.test(currentText)) {
    detected.push('EMAIL');
    currentText = maskEmail(currentText);
  }

  if (PHONE_REGEX.test(currentText)) {
    detected.push('PHONE');
    currentText = maskPhone(currentText);
  }

  if (CEP_REGEX.test(currentText)) {
    detected.push('CEP');
    currentText = maskCep(currentText);
  }

  if (RG_REGEX.test(currentText)) {
    detected.push('RG');
    currentText = maskRg(currentText);
  }

  return {
    sanitizedText: currentText,
    detectedPiiTypes: Array.from(new Set(detected)),
    hasPii: detected.length > 0,
  };
}
