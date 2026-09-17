import { GoogleGenAI } from '@google/genai';
import {
  AIProvider,
  AISuggestion,
  AIRiskReport,
  prepareGeminiSafePayload,
  deterministicSuggestMetadata,
  deterministicNeutralSummary,
  deterministicContentRisk,
  SYSTEM_SAFETY_INSTRUCTION,
  encapsulateUntrustedInput
} from '@opp/shared';

export interface GeminiAIProviderOptions {
  apiKey?: string;
  modelName?: string;
}

/**
 * Provedor de Inteligência Artificial Assistiva baseado no Google Gemini (Seção 15).
 * Cumpre:
 * - Seção 15.1: IA estritamente assistiva, sem poderes decisórios soberanos.
 * - Seção 15.2: Higienização determinística local prévia e mandatória antes de qualquer envio à LLM.
 * - Defesa de Prompt Injection: Sanitização de comandos de sobrescrita e encapsulamento em tags XML seguras.
 * - Critério AC-10: Modo de resiliência e fallback offline automático em caso de falta de chave, erro ou timeout.
 */
export class GeminiAIProvider implements AIProvider {
  private client: GoogleGenAI | null = null;
  private modelName: string;

  constructor(options: GeminiAIProviderOptions = {}) {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    this.modelName = options.modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Sugere categoria e órgão de destino a partir do relato do cidadão (Seção 15.1).
   */
  async suggestMetadata(rawContent: string): Promise<AISuggestion> {
    // 1. Sanitização prévia mandatória (Seção 15.2) e Defesa de Injeção de Prompt
    const { safeText } = prepareGeminiSafePayload(rawContent);

    // 2. Fallback imediato se não houver cliente configurado (AC-10)
    if (!this.client) {
      return deterministicSuggestMetadata(safeText);
    }

    try {
      const prompt = `${SYSTEM_SAFETY_INSTRUCTION}

Você é o módulo de triagem assistiva da Ouvidoria Pública Popular (OPP).
Analise o seguinte relato cívico previamente sanitizado contido na tag <user_input_untrusted>:
${encapsulateUntrustedInput(safeText)}

Retorne APENAS um objeto JSON válido com a seguinte estrutura:
{
  "suggestedCategoryId": "iluminacao" | "vias" | "saude" | "limpeza" | "saneamento" | "transporte",
  "suggestedAgencyId": "sec-obras-mn" | "sec-saude-mn" | "sec-transporte-mn",
  "suggestedAgencyName": "Nome descritivo do órgão",
  "suggestedSummary": "Resumo objetivo e neutro de 1 a 2 frases sobre a demanda",
  "confidenceScore": número entre 0.0 e 1.0,
  "reasoning": "Breve justificativa técnica da classificação"
}`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const responseText = response.text?.trim() || '';
      // Limpa possíveis delimitadores markdown de código gerados pelo modelo
      const jsonStr = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(jsonStr);

      return {
        suggestedCategoryId: parsed.suggestedCategoryId || 'vias',
        suggestedAgencyId: parsed.suggestedAgencyId || 'sec-obras-mn',
        suggestedSummary: parsed.suggestedSummary || deterministicNeutralSummary(safeText),
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.85,
        reasoning: parsed.reasoning || `Classificação assistida por IA (${this.modelName})`
      };
    } catch (error) {
      console.warn('[GeminiAIProvider] Falha na chamada ao Gemini API. Acionando fallback determinístico (AC-10):', error);
      return deterministicSuggestMetadata(safeText);
    }
  }

  /**
   * Gera resumo público neutro e objetivo (Seção 15.1).
   */
  async generateNeutralSummary(rawContent: string): Promise<string> {
    const { safeText } = prepareGeminiSafePayload(rawContent);

    if (!this.client) {
      return deterministicNeutralSummary(safeText);
    }

    try {
      const prompt = `${SYSTEM_SAFETY_INSTRUCTION}

Você é o redator neutro da Ouvidoria Pública Popular (OPP).
Reescreva o relato cívico a seguir, contido na tag <user_input_untrusted>, em uma síntese objetiva, neutra, formal e livre de adjetivos acusatórios:
${encapsulateUntrustedInput(safeText)}

Regras:
1. Máximo de 280 caracteres.
2. Não invente detalhes inexistentes.
3. Tom cívico, técnico e respeitoso.
4. Retorne apenas o texto da síntese.`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const summary = response.text?.trim();
      if (summary && summary.length > 10) {
        return summary;
      }
      return deterministicNeutralSummary(safeText);
    } catch (error) {
      console.warn('[GeminiAIProvider] Erro ao gerar resumo neutro com Gemini. Usando fallback:', error);
      return deterministicNeutralSummary(safeText);
    }
  }

  /**
   * Avaliação de risco de moderação para triagem (Seção 15.1 & 16.2).
   */
  async evaluateContentRisk(rawContent: string): Promise<AIRiskReport> {
    const { safeText, piiDetected, promptInjectionDetected } = prepareGeminiSafePayload(rawContent);

    // Heurística local de alta sensibilidade
    const localReport = deterministicContentRisk(safeText);
    if (piiDetected) {
      localReport.isHighRisk = true;
      if (!localReport.riskFlags.includes('SENSITIVE_DATA')) {
        localReport.riskFlags.push('SENSITIVE_DATA');
      }
    }
    if (promptInjectionDetected) {
      localReport.isHighRisk = true;
      if (!localReport.riskFlags.includes('PROMPT_INJECTION_ATTEMPT')) {
        localReport.riskFlags.push('PROMPT_INJECTION_ATTEMPT');
      }
    }

    if (!this.client) {
      return localReport;
    }

    try {
      const prompt = `${SYSTEM_SAFETY_INSTRUCTION}

Você é o auditor de moderação cívica da Ouvidoria Pública Popular (OPP).
Avalie o seguinte texto cívico contido na tag <user_input_untrusted>:
${encapsulateUntrustedInput(safeText)}

Identifique se há:
1. Acusações nominais de crimes contra pessoas sem decisão judicial (NOMINAL_CRIME_ACCUSATION).
2. Ameaças de violência física ou dano ao patrimônio (THREAT).
3. Discurso de ódio ou injúria racial/social (HATE_SPEECH).
4. Menção a crianças ou dados de menores (CHILD_DATA).

Retorne APENAS um objeto JSON:
{
  "isHighRisk": boolean,
  "riskFlags": string[],
  "confidence": number,
  "requiresHumanReview": boolean
}`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const text = response.text?.trim() || '';
      const jsonStr = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(jsonStr);

      // Combina bandeiras locais com bandeiras do Gemini para máxima segurança
      const combinedFlags = Array.from(new Set([...localReport.riskFlags, ...(parsed.riskFlags || [])]));
      const isHighRisk = localReport.isHighRisk || !!parsed.isHighRisk;

      return {
        isHighRisk,
        riskFlags: combinedFlags,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : localReport.confidence,
        requiresHumanReview: isHighRisk || !!parsed.requiresHumanReview
      };
    } catch (error) {
      console.warn('[GeminiAIProvider] Erro ao avaliar risco com Gemini. Usando relatório determinístico local:', error);
      return localReport;
    }
  }

  /**
   * Análise Semântica Contextual de Toxicidade e Discriminação (Camada 3 de Moderação)
   * Avalia ofensas compostas, preconceito, etarismo, homofobia e ataques que passam por regex simples
   */
  async evaluateCivicToxicity(rawContent: string): Promise<{
    isToxic: boolean;
    categories: string[];
    explanation: string;
    flaggedTerms: string[];
  }> {
    const { safeText, promptInjectionDetected } = prepareGeminiSafePayload(rawContent);

    if (promptInjectionDetected) {
      return {
        isToxic: true,
        categories: ['PROMPT_INJECTION_ATTEMPT'],
        explanation: 'Comando de injeção de prompt ou tentativa de sobrescrita de instruções do sistema.',
        flaggedTerms: ['[PROMPT_INJECTION]']
      };
    }

    if (!this.client) {
      const risk = deterministicContentRisk(safeText);
      return {
        isToxic: risk.isHighRisk,
        categories: risk.riskFlags,
        explanation: risk.isHighRisk ? 'Identificado risco por regras locais.' : 'Conteúdo adequado.',
        flaggedTerms: []
      };
    }

    try {
      const prompt = `${SYSTEM_SAFETY_INSTRUCTION}

Você é o auditor semântico de integridade cívica da Ouvidoria Pública Popular (OPP).
Avalie a mensagem contida na tag <user_input_untrusted>:
${encapsulateUntrustedInput(safeText)}

Analise se há toxicidade cívica, ataques pessoais pejorativos (ex: homofobia, etarismo, preconceito, acusações sem provas, desrespeito à honra).
Nota cívica: Críticas duras aos serviços públicos ("asfalto péssimo", "falta remédio") são LEGÍTIMAS. Ofensas a pessoas ("velho viado", "ladrão", "idiota") são INADEQUADAS.

Retorne APENAS um objeto JSON:
{
  "isToxic": boolean,
  "categories": string[],
  "explanation": "Breve justificativa técnica",
  "flaggedTerms": string[]
}`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      const text = response.text?.trim() || '';
      const jsonStr = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(jsonStr);

      return {
        isToxic: !!parsed.isToxic,
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        explanation: parsed.explanation || 'Avaliação semântica processada com sucesso.',
        flaggedTerms: Array.isArray(parsed.flaggedTerms) ? parsed.flaggedTerms : []
      };
    } catch (error) {
      console.warn('[GeminiAIProvider] Erro ao avaliar toxicidade semântica com Gemini. Usando fallback:', error);
      const risk = deterministicContentRisk(safeText);
      return {
        isToxic: risk.isHighRisk,
        categories: risk.riskFlags,
        explanation: 'Fallback determinístico local executado.',
        flaggedTerms: []
      };
    }
  }
}
