import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  Bot,
  Check
} from 'lucide-react';
import { mockCategories, mockIssues } from '../mock/data';
import { IssueCard } from '../features/issues/IssueCard';
import {
  sanitizeText,
  findDuplicateCandidates,
  deterministicSuggestMetadata,
  deterministicContentRisk,
  AISuggestion,
  AIRiskReport
} from '@opp/shared';

export const NewIssuePage: React.FC = () => {
  // Etapas: 1. Busca Prévia (Search-First), 2. Detalhes & Sanitização, 3. Confirmação
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Campos do formulário
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('iluminacao');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [sanitizationAlert, setSanitizationAlert] = useState<{ hasPii: boolean; types: string[] }>({ hasPii: false, types: [] });
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState(false);

  // Estado da IA Assistiva (Seção 15 & AC-10)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiRiskReport, setAiRiskReport] = useState<AIRiskReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiApplied, setAiApplied] = useState<{ category: boolean; summary: boolean }>({ category: false, summary: false });

  // Busca inicial por similares (Passo 1)
  const similarCandidatesStep1 = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return findDuplicateCandidates(
      {
        municipalityId: 'mundo-novo-ms',
        title: searchQuery
      },
      mockIssues,
      0.25 // threshold
    );
  }, [searchQuery]);

  // Detector de duplicidades em tempo real (Passo 2 - AC-02)
  const realTimeDuplicatesStep2 = useMemo(() => {
    if (!title.trim() && !description.trim()) return [];
    return findDuplicateCandidates(
      {
        municipalityId: 'mundo-novo-ms',
        title,
        description,
        categoryId,
        neighborhood
      },
      mockIssues,
      0.35 // threshold
    );
  }, [title, description, categoryId, neighborhood]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDescription(text);
    const check = sanitizeText(text);
    setSanitizationAlert({
      hasPii: check.hasPii,
      types: check.detectedPiiTypes
    });
  };

  const handleTriggerAiAssistant = () => {
    const textToAnalyze = `${title} ${description}`.trim();
    if (!textToAnalyze) return;

    setIsAiLoading(true);
    // Aciona heurísticas de IA determinísticas / resilientes (AC-10 & Seção 15)
    setTimeout(() => {
      const suggestion = deterministicSuggestMetadata(textToAnalyze);
      const risk = deterministicContentRisk(textToAnalyze);
      setAiSuggestion(suggestion);
      setAiRiskReport(risk);
      setIsAiLoading(false);
      setAiApplied({ category: false, summary: false });
    }, 350);
  };

  const handleApplyAiCategory = () => {
    if (aiSuggestion?.suggestedCategoryId) {
      setCategoryId(aiSuggestion.suggestedCategoryId);
      setAiApplied(prev => ({ ...prev, category: true }));
    }
  };

  const handleApplyAiSummary = () => {
    if (aiSuggestion?.suggestedSummary) {
      setDescription(aiSuggestion.suggestedSummary);
      setAiApplied(prev => ({ ...prev, summary: true }));
    }
  };

  const handleConfirmNoDuplicates = () => {
    setTitle(searchQuery);
    setStep(2);
  };

  const handleSubmitNewIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Indicador de Passos Cívicos */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 text-xs font-bold text-slate-500">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-opp-blue-primary' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-opp-blue-primary text-white' : 'bg-slate-200'}`}>1</span>
          <span>1. Buscar Existente</span>
        </div>
        <div className="h-0.5 w-12 bg-slate-200" />
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-opp-blue-primary' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-opp-blue-primary text-white' : 'bg-slate-200'}`}>2</span>
          <span>2. Detalhes & Local</span>
        </div>
        <div className="h-0.5 w-12 bg-slate-200" />
        <div className={`flex items-center space-x-2 ${step === 3 ? 'text-emerald-600' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>3</span>
          <span>3. Confirmação & Fila</span>
        </div>
      </div>

      {/* PASSO 1: BUSCA PRÉVIA OBRIGATÓRIA (Princípio P01 & Critério AC-01) */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800 mb-2">
              <Search className="w-3.5 h-3.5" />
              <span>Princípio P01: Busca Antes de Criar (AC-01)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Verifique se o problema já foi registrado
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Na Ouvidoria Pública Popular, unir forças em um problema existente produz muito mais resultado do que abrir queixas duplicadas.
            </p>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o problema ou endereço (ex: lâmpada apagada ou cratera)..."
              className="w-full pl-12 pr-4 py-3 text-sm sm:text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
              autoFocus
            />
          </div>

          {searchQuery.trim() && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Problemas semelhantes encontrados ({similarCandidatesStep1.length}):
                </h3>
                <span className="text-xs text-emerald-700 font-semibold">
                  ordenado por score semântico
                </span>
              </div>

              {similarCandidatesStep1.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similarCandidatesStep1.map(({ issue, similarityScore, matchReasons }) => (
                    <div key={issue.issueId} className="relative flex flex-col justify-between">
                      <div className="absolute top-2 right-2 z-10 bg-emerald-700 text-white text-[11px] font-extrabold px-2 py-0.5 rounded shadow">
                        {Math.round(similarityScore * 100)}% similar
                      </div>
                      <IssueCard issue={issue} />
                      <div className="mt-1 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-b-lg border-x border-b border-slate-200">
                        <strong>Correspondência:</strong> {matchReasons.join(' • ')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  Nenhum problema similar foi encontrado para "{searchQuery}".
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Nenhum dos itens acima corresponde à sua situação específica?
                </p>
                <button
                  type="button"
                  onClick={handleConfirmNoDuplicates}
                  className="w-full sm:w-auto px-6 py-2.5 bg-opp-blue-primary hover:bg-opp-blue-deep text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-1"
                >
                  <span>Continuar para registrar novo problema</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PASSO 2: DETALHAMENTO & PREVENÇÃO DE DUPLICIDADE EM TEMPO REAL (AC-02) */}
      {step === 2 && (
        <form onSubmit={handleSubmitNewIssue} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Descreva o problema público
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Forneça detalhes que ajudem os órgãos responsáveis a localizar e solucionar a demanda coletiva.
            </p>
          </div>

          {/* Alerta Local de PII / LGPD */}
          {sanitizationAlert.hasPii && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center font-bold space-x-1 text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Dados Pessoais Detectados no Texto ({sanitizationAlert.types.join(', ')})</span>
              </div>
              <p>
                O sistema mascarará automaticamente CPFs, telefones ou e-mails antes da publicação pública, preservando sua privacidade (LGPD).
              </p>
            </div>
          )}

          {/* Aviso Proativo de Duplicidade em Tempo Real (AC-02: Sugere sem impedir) */}
          {realTimeDuplicatesStep2.length > 0 && !ignoreDuplicateWarning && (
            <div className="p-5 bg-indigo-50/80 border-2 border-indigo-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-indigo-600" />
                <span>Sugestão Inteligente: Problema similar detectado ({realTimeDuplicatesStep2[0].similarityScore * 100}% similar)</span>
              </div>
              <p className="text-xs text-indigo-800">
                Identificamos que <strong>"{realTimeDuplicatesStep2[0].issue.title}"</strong> ({realTimeDuplicatesStep2[0].issue.locationApprox.neighborhood}) já está em andamento. Fortalecer esse problema com a sua adesão trará resultado mais rápido do que iniciar um novo processo.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={`/problemas/${realTimeDuplicatesStep2[0].issue.issueId}/aderir`}
                  className="px-4 py-2 bg-opp-green-action hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Aderir ao problema já existente</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIgnoreDuplicateWarning(true)}
                  className="px-3 py-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                >
                  Não é o mesmo problema (Continuar criando)
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Título Resumido do Problema *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Falta de asfalto e cratera na Rua dos Ipês"
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoria de Serviço *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary bg-white"
              >
                {mockCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Centro"
                  className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rua ou Ponto de Referência
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Ex: Em frente à creche municipal"
                  className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Descrição Completa da Situação *
                </label>
                <button
                  type="button"
                  onClick={handleTriggerAiAssistant}
                  disabled={isAiLoading || (!title.trim() && !description.trim())}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiLoading ? 'Analisando com IA...' : 'Assistente Cívico IA (Sugerir)'}</span>
                </button>
              </div>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Explique o que está ocorrendo, há quanto tempo e como isso impacta os moradores locais..."
                rows={5}
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
                required
              />
            </div>

            {/* Painel de Sugestões da IA Assistiva (Seção 15.1 & AC-10) */}
            {aiSuggestion && (
              <div className="p-4 bg-slate-50 border-2 border-indigo-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-950 font-bold text-xs sm:text-sm">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>Sugestão Assistiva da IA (Não vinculativa — Seção 15.1)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Confiança: {Math.round(aiSuggestion.confidenceScore * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Sugestão de Categoria */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="text-slate-500 font-medium">Categoria Sugerida:</div>
                    <div className="font-bold text-slate-800 text-sm capitalize">
                      {mockCategories.find(c => c.id === aiSuggestion.suggestedCategoryId)?.name || aiSuggestion.suggestedCategoryId}
                    </div>
                    <p className="text-[11px] text-slate-500">{aiSuggestion.reasoning}</p>
                    <button
                      type="button"
                      onClick={handleApplyAiCategory}
                      disabled={aiApplied.category}
                      className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 disabled:bg-emerald-50 disabled:text-emerald-700"
                    >
                      {aiApplied.category ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Categoria Aplicada</span>
                        </>
                      ) : (
                        <span>Aplicar Categoria Sugerida</span>
                      )}
                    </button>
                  </div>

                  {/* Resumo Neutro Público */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="text-slate-500 font-medium">Resumo Neutro & Factual (Seção 15.1):</div>
                      <p className="text-xs text-slate-700 italic mt-1 line-clamp-3">
                        "{aiSuggestion.suggestedSummary}"
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyAiSummary}
                      disabled={aiApplied.summary}
                      className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 disabled:bg-emerald-50 disabled:text-emerald-700 mt-2"
                    >
                      {aiApplied.summary ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Resumo Neutro Aplicado</span>
                        </>
                      ) : (
                        <span>Substituir pelo Resumo Neutro</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Feedback Construtivo de Risco de Moderação */}
                {aiRiskReport && aiRiskReport.isHighRisk && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Orientação Cívica: Atenção aos termos utilizados</span>
                    </div>
                    <p className="text-[11px]">
                      Para que sua demanda tenha plena aceitação técnica e jurídica perante a ouvidoria do órgão, evite acusações criminais nominais diretas ou termos exaltados. O uso do resumo neutro ajuda a acelerar o protocolo oficial.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-opp-green-action hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Enviar para Moderação Cívica</span>
            </button>
          </div>
        </form>
      )}

      {/* PASSO 3: SUCESSO & MODERAÇÃO */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Problema Registrado com Sucesso!
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Seu relato gerou uma manifestação raiz e foi encaminhado para a fila de moderação e categorização cívica. Assim que aprovado, ele receberá um código oficial (OPP) e ficará visível para adesão de outros cidadãos.
          </p>

          <div className="pt-4">
            <Link
              to="/"
              className="px-6 py-2.5 bg-opp-blue-primary hover:bg-opp-blue-deep text-white text-sm font-bold rounded-xl transition-all inline-block"
            >
              Ir para a Página Inicial
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
