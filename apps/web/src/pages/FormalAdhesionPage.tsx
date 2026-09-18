import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileCheck,
  ArrowLeft,
  Lock,
  CheckCircle2,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Hash
} from 'lucide-react';
import { mockIssues, mockAgencies } from '../mock/data';
import { CURRENT_DOCUMENT_TEMPLATE_VERSION } from '@opp/shared';

export const FormalAdhesionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const issue = mockIssues.find(i => i.issueId === id) || mockIssues[0];
  const agency = mockAgencies.find(a => a.agencyId === issue.agencyIds[0]);

  // Form states
  const [useBaseText, setUseBaseText] = useState(true);
  const [customStatement, setCustomStatement] = useState('');
  const [isPublicNameVisible, setIsPublicNameVisible] = useState(true);
  const [consentSanitization, setConsentSanitization] = useState(true);
  const [consentTransmission, setConsentTransmission] = useState(true);
  const [receiveEmailCopy, setReceiveEmailCopy] = useState(true);
  const [showDocPreview, setShowDocPreview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Mock de código sequencial gerado (Seção 3.2)
  const protocolCode = useMemo(() => {
    const issueNum = issue.issueId.replace(/\D/g, '') || '00142';
    return `MF-${issueNum}-A${String(issue.formalSupportCount + 1).padStart(3, '0')}`;
  }, [issue]);

  // Hash SHA-256 simulado para o documento atual
  const simulatedHash = '8f4c2b9a7e1d5c3f9b2a1e8c7d6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f';

  const statementText = useBaseText ? issue.publicSummary : (customStatement || issue.publicSummary);

  const handleSubmitAdhesion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentSanitization || !consentTransmission) {
      alert('É necessário autorizar os consentimentos obrigatórios de transmissão.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Adesão Formal Registrada com Sucesso!
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Sua manifestação formal individual foi gerada com sucesso e <strong>o e-mail formal de reclamação foi despachado imediatamente para a ouvidoria do órgão competente</strong> ({agency?.name || 'Órgão Responsável'}).
          Assim que o órgão responder formalmente por e-mail ou ofício, nossa esteira automatizada fará a leitura do protocolo, validação de integridade e anexará a devolutiva pública aqui no portal.
        </p>

        {/* Comprovante Digital de Transmissão (Seção 18.4 & 21.3) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-700 text-left space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-900 text-sm">Comprovante Digital de Adesão</span>
            <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {protocolCode}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Problema Público Vinculado:</span>
              <span className="font-bold">{issue.issueId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Órgão Destinatário Oficial:</span>
              <span>{agency?.name || 'SEMOB'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Exposição Pública no Site (AC-05):</span>
              <span>{isPublicNameVisible ? 'Primeiro nome visível' : 'Oculto do público (anônimo no site)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Cópia no E-mail (AC-08):</span>
              <span className="text-emerald-700 font-semibold">{receiveEmailCopy ? 'Ativada (Enviada)' : 'Não solicitada'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Versão do Template:</span>
              <span className="font-mono">{CURRENT_DOCUMENT_TEMPLATE_VERSION}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500 break-all bg-slate-100 p-2.5 rounded-lg">
            <div className="flex items-center text-slate-700 font-sans font-bold mb-0.5">
              <Hash className="w-3 h-3 mr-1 text-opp-blue-light" />
              Hash SHA-256 de Integridade Documental:
            </div>
            {simulatedHash}
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Comprovante</span>
          </button>
          <Link
            to={`/problemas/${issue.issueId}`}
            className="px-6 py-2.5 bg-opp-blue-primary hover:bg-opp-blue-deep text-white text-xs sm:text-sm font-bold rounded-xl transition-all"
          >
            Voltar para o Problema
          </Link>
          <Link
            to="/"
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all"
          >
            Página Inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link
          to={`/problemas/${issue.issueId}`}
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Voltar para o problema</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 mb-2">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Adesão Formal Cidadã (Seção 4.3 & 21)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Aderir formalmente ao problema público
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Sua adesão cria a manifestação individual <strong>{protocolCode}</strong> vinculada à manifestação raiz deste problema coletivo.
          </p>
        </div>

        {/* Resumo do Problema Vinculado */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="font-bold block text-slate-900">{issue.title}</span>
          <span>{issue.locationApprox.neighborhood} — {issue.locationApprox.city}</span>
        </div>

        <form onSubmit={handleSubmitAdhesion} className="space-y-6">
          {/* Opção de Texto: Base ou Customizado */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900">
              Declaração do Cidadão
            </label>
            <div className="space-y-2">
              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="textOption"
                  checked={useBaseText}
                  onChange={() => setUseBaseText(true)}
                  className="mt-0.5 text-opp-green-action focus:ring-opp-green-action"
                />
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">Utilizar texto-base consolidado do problema</span>
                  <span>"{issue.publicSummary}"</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="textOption"
                  checked={!useBaseText}
                  onChange={() => setUseBaseText(false)}
                  className="mt-0.5 text-opp-green-action focus:ring-opp-green-action"
                />
                <div className="text-xs text-slate-700 w-full">
                  <span className="font-bold text-slate-900 block mb-0.5">Acrescentar relato individual específico</span>
                  {!useBaseText && (
                    <textarea
                      value={customStatement}
                      onChange={(e) => setCustomStatement(e.target.value)}
                      placeholder="Descreva como este problema afeta sua rotina ou informe detalhes adicionais..."
                      rows={4}
                      className="w-full mt-2 p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opp-green-action"
                      required={!useBaseText}
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Dimensões de Identidade (Seção 8.2 & Critério AC-05) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-900">
              Privacidade e Exposição Pública (Seção 8.2 & AC-05)
            </label>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublicNameVisible}
                  onChange={(e) => setIsPublicNameVisible(e.target.checked)}
                  className="w-4 h-4 text-opp-green-action rounded border-slate-300 focus:ring-opp-green-action"
                />
                <span className="text-xs text-slate-700">
                  Exibir meu primeiro nome na lista pública de apoiadores deste problema.
                </span>
              </label>
              <p className="text-[11px] text-slate-500 flex items-center">
                <Lock className="w-3 h-3 mr-1 text-slate-400" />
                Seu nome ocultado do site não compromete a identificação privada exigida pelo órgão público nos termos da Lei 13.460/2017 (Critério AC-05).
              </p>
            </div>
          </div>

          {/* Prévia do Documento Oficial Gerado (Seção 21) */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => setShowDocPreview(!showDocPreview)}
              className="flex items-center justify-between w-full text-xs font-bold text-slate-800 uppercase tracking-wider p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-opp-blue-light" />
                Prévia da Solicitação de Providências a ser Transmitida
              </span>
              {showDocPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDocPreview && (
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3 text-xs shadow-inner">
                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-xs uppercase">
                    Solicitação de Providências — Manifestação Cidadã
                  </span>
                  <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    {protocolCode}
                  </span>
                </div>

                <div className="italic text-slate-600 bg-slate-50 p-2.5 rounded text-[11px] border border-slate-100">
                  "Esta manifestação está vinculada ao problema público {issue.issueId}, registrado em {new Date(issue.createdAt).toLocaleDateString('pt-BR')}, e constitui manifestação individual do requerente {protocolCode}."
                </div>

                <div className="space-y-1 text-slate-700">
                  <p className="font-semibold text-slate-900">Texto Declaratório Transmitido:</p>
                  <p className="bg-white p-3 border border-slate-200 rounded text-slate-800 leading-relaxed">
                    {statementText}
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-1">
                  <span>Template: {CURRENT_DOCUMENT_TEMPLATE_VERSION}</span>
                  <span>Hash SHA-256: {simulatedHash.slice(0, 16)}...</span>
                </div>
              </div>
            )}
          </div>

          {/* Consentimentos Obrigatórios (Seção 8.3, Princípio P05 & AC-08) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-900">
              Autorizações e Consentimentos Legais
            </label>
            <div className="space-y-3 text-xs text-slate-700">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={consentTransmission}
                  onChange={(e) => setConsentTransmission(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-opp-green-action rounded border-slate-300 focus:ring-opp-green-action"
                  required
                />
                <span>
                  <strong>Autorização de Transmissão por E-mail (Seção 18 & Lei nº 13.460/2017):</strong> Autorizo a plataforma Ouvidoria Pública Popular (OPP) a transmitir eletronicamente esta manifestação individual ao canal de ouvidoria do órgão competente ({agency?.name || 'Órgão Responsável'}), acionando a obrigação de resposta oficial. Estou ciente de que a OPP atua como meio técnico de transmissão autorizada.
                </span>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={consentSanitization}
                  onChange={(e) => setConsentSanitization(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-opp-green-action rounded border-slate-300 focus:ring-opp-green-action"
                  required
                />
                <span>
                  <strong>Publicação Sanitizada:</strong> Declaro ciência de que a versão pública exibida no portal será higienizada para proteção de dados pessoais (LGPD).
                </span>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={receiveEmailCopy}
                  onChange={(e) => setReceiveEmailCopy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-opp-green-action rounded border-slate-300 focus:ring-opp-green-action"
                />
                <span>
                  <strong>Cópia ao Cidadão (AC-08):</strong> Desejo receber cópia digital do comprovante de encaminhamento no meu e-mail cadastrado.
                </span>
              </label>
            </div>
          </div>

          {/* Botão de Confirmação */}
          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-opp-green-action hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isSubmitting ? 'Gerando documento e registrando adesão...' : 'Confirmar e Autorizar Envio Formal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
