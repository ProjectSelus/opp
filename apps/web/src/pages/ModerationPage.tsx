import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  GitMerge,
  Building2,
  ExternalLink,
  AlertTriangle,
  Camera,
  MessageSquare,
  Check
} from 'lucide-react';
import { mockIssues, mockAgencies } from '../mock/data';
import { computeMergedIssue, verifyAgencyChannel } from '@opp/shared';

interface FlaggedComment {
  id: string;
  issueId: string;
  issueTitle: string;
  author: string;
  text: string;
  riskFlags: string[];
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface PendingEvidence {
  id: string;
  issueId: string;
  issueTitle: string;
  author: string;
  url: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const ModerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'comments' | 'evidences' | 'merge' | 'channels'>('comments');

  // 1. Fila de Comentários Sinalizados (Seção 16 & 24)
  const [flaggedComments, setFlaggedComments] = useState<FlaggedComment[]>([
    {
      id: 'c-flag-1',
      issueId: 'OPP-MN-2026-00142',
      issueTitle: 'Postes com lâmpadas apagadas na Rua das Flores',
      author: 'Cidadão Anônimo',
      text: 'O prefeito é um ladrão corrupto que desviou a verba da iluminação para a campanha dele!',
      riskFlags: ['NOMINAL_CRIME_ACCUSATION', 'OFFENSIVE_LANGUAGE'],
      reason: 'Acusação criminal nominal sem apresentação de boletim de ocorrência ou processo judicial (Seção 16.2).',
      status: 'PENDING'
    },
    {
      id: 'c-flag-2',
      issueId: 'OPP-MN-2026-00138',
      issueTitle: 'Buraco de grande proporção na Av. JK',
      author: 'Morador Local',
      text: 'Liguem para o fiscal no telefone (67) 99876-5432 ou falem com a filha dele menor de idade.',
      riskFlags: ['SENSITIVE_DATA', 'CHILD_DATA'],
      reason: 'Exposição de telefone pessoal de terceiro e menção a menor de idade.',
      status: 'PENDING'
    }
  ]);

  // 2. Fila de Evidências Fotográficas Pendentes (Módulo 15)
  const [pendingEvidences, setPendingEvidences] = useState<PendingEvidence[]>([
    {
      id: 'ev-pend-1',
      issueId: 'OPP-MN-2026-00142',
      issueTitle: 'Postes com lâmpadas apagadas na Rua das Flores',
      author: 'Carlos Eduardo',
      url: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=80',
      description: 'Foto tirada às 21h mostrando a escuridão completa do cruzamento.',
      status: 'PENDING'
    }
  ]);

  // 3. Ferramenta de Fusão de Issues (AC-12 & Seção 3.4)
  const [sourceIssueId, setSourceIssueId] = useState('OPP-MN-2026-00143');
  const [targetIssueId, setTargetIssueId] = useState('OPP-MN-2026-00142');
  const [mergeReason, setMergeReason] = useState('Duplicidade confirmada do mesmo segmento de postes apagados.');
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);

  // 4. Homologação de Canais de Órgãos (Critério AC-07)
  const [channelsList, setChannelsList] = useState(
    mockAgencies.flatMap(a => a.channels.map(c => ({ ...c, agencyName: a.name, acronym: a.acronym })))
  );
  const [sourceUrls, setSourceUrls] = useState<Record<string, string>>({});
  const [verifiedAlert, setVerifiedAlert] = useState<string | null>(null);

  const handleModerateComment = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setFlaggedComments(prev => prev.map(c => c.id === id ? { ...c, status: action } : c));
  };

  const handleModerateEvidence = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setPendingEvidences(prev => prev.map(e => e.id === id ? { ...e, status: action } : e));
  };

  const handleExecuteMerge = (e: React.FormEvent) => {
    e.preventDefault();
    const source = mockIssues.find(i => i.issueId === sourceIssueId);
    const target = mockIssues.find(i => i.issueId === targetIssueId);

    if (!source || !target) {
      alert('Selecione issues válidos para a fusão.');
      return;
    }

    try {
      const result = computeMergedIssue(target, source, 'moderador-auditor-01', mergeReason);
      setMergeSuccess(
        `Problema ${source.issueId} unificado com sucesso no ${target.issueId}! Total de adesões consolidadas: ${result.updatedTarget.formalSupportCount}.`
      );
    } catch (err: any) {
      alert(`Erro na fusão: ${err.message}`);
    }
  };

  const handleVerifyChannel = (channelId: string) => {
    const url = sourceUrls[channelId] || 'https://diario.mundonovo.ms.gov.br/edicao-445';
    const channel = channelsList.find(c => c.channelId === channelId);
    if (!channel) return;

    const verified = verifyAgencyChannel(
      channel,
      url,
      'auditor-cívico-01',
      true
    );

    setChannelsList(prev => prev.map(c => c.channelId === channelId ? { ...c, ...verified } : c));
    setVerifiedAlert(`Canal ${channel.type} (${channel.addressOrUrl}) homologado com sucesso! Envio automatizado liberado (AC-07).`);
    setTimeout(() => setVerifiedAlert(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Cabeçalho do Painel */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-900">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-700" />
          <span>Backoffice de Moderação Cívica & Governança (Seção 24)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Painel do Moderador Cívico
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Triagem preventiva de conteúdo, homologação de canais de órgãos oficiais (<strong>Critério AC-07</strong>), aprovação de evidências e unificação de demandas territoriais duplicadas (<strong>Critério AC-12</strong>).
        </p>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm space-x-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'comments'
              ? 'bg-opp-blue-primary text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comentários Sinalizados ({flaggedComments.filter(c => c.status === 'PENDING').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('evidences')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'evidences'
              ? 'bg-opp-blue-primary text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Evidências Comunitárias ({pendingEvidences.filter(e => e.status === 'PENDING').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'channels'
              ? 'bg-opp-blue-primary text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Homologação de Canais AC-07</span>
        </button>

        <button
          onClick={() => setActiveTab('merge')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'merge'
              ? 'bg-opp-blue-primary text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GitMerge className="w-4 h-4" />
          <span>Fusão de Problemas (AC-12)</span>
        </button>
      </div>

      {/* ABA 1: COMENTÁRIOS SINALIZADOS */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-semibold">
            Itens retidos automaticamente por filtros determinísticos de PII e acusações sem prova (Seção 16.2).
          </div>

          <div className="grid grid-cols-1 gap-4">
            {flaggedComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400">Problema: {comment.issueTitle}</span>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">Autor: {comment.author}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {comment.riskFlags.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded">
                        {f}
                      </span>
                    ))}
                    <span className={`px-2 py-0.5 font-bold text-xs rounded ${
                      comment.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      comment.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {comment.status === 'PENDING' ? 'Aguardando Revisão' : comment.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-800 border border-slate-200">
                  "{comment.text}"
                </div>

                <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Justificativa da sinalização:</strong> {comment.reason}
                  </div>
                </div>

                {comment.status === 'PENDING' && (
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleModerateComment(comment.id, 'REJECTED')}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rejeitar Conteúdo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModerateComment(comment.id, 'APPROVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprovar (Falso Positivo)</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 2: EVIDÊNCIAS FOTOGRÁFICAS */}
      {activeTab === 'evidences' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-semibold">
            Evidências fotográficas submetidas por munícipes aguardando validação de adequação ao tema (Módulo 15).
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingEvidences.map((ev) => (
              <div key={ev.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{ev.issueTitle}</span>
                    <span className="text-slate-400 font-semibold">Por: {ev.author}</span>
                  </div>

                  <img
                    src={ev.url}
                    alt={ev.description}
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />

                  <p className="text-xs text-slate-600">{ev.description}</p>
                </div>

                {ev.status === 'PENDING' ? (
                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleModerateEvidence(ev.id, 'REJECTED')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-lg transition-all"
                    >
                      Rejeitar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModerateEvidence(ev.id, 'APPROVED')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                    >
                      Aprovar Evidência
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg text-center">
                    Evidência Homologada e Publicada na Linha do Tempo
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: HOMOLOGAÇÃO DE CANAIS (CRITÉRIO AC-07) */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
            <strong>Critério AC-07:</strong> Apenas canais com status <strong>VERIFICADO</strong> e fonte oficial cadastrada recebem despachos em lote automáticos.
          </div>

          {verifiedAlert && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>{verifiedAlert}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {channelsList.map((ch) => {
              const isVerified = ch.verificationStatus === 'VERIFIED';
              return (
                <div
                  key={ch.channelId}
                  className={`p-6 bg-white rounded-2xl border shadow-sm space-y-4 ${
                    isVerified ? 'border-slate-200' : 'border-amber-300 bg-amber-50/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{ch.agencyName} ({ch.acronym})</h3>
                      <span className="text-xs text-slate-500 font-mono">Tipo: {ch.type} • Destino: {ch.addressOrUrl}</span>
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {isVerified ? 'Canal Homologado (AC-07)' : 'Não Verificado — Envios Bloqueados'}
                    </span>
                  </div>

                  {!isVerified && (
                    <div className="space-y-3 pt-3 border-t border-amber-200/60">
                      <label className="block text-xs font-bold text-slate-700">
                        URL da Fonte Comprobatória Oficial (Diário Oficial / Portal da Transparência):
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          placeholder="https://diario.mundonovo.ms.gov.br/edicao-xxx"
                          value={sourceUrls[ch.channelId] || ''}
                          onChange={(e) => setSourceUrls(prev => ({ ...prev, [ch.channelId]: e.target.value }))}
                          className="flex-grow p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyChannel(ch.channelId)}
                          className="px-5 py-2.5 bg-opp-blue-primary hover:bg-opp-blue-deep text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Homologar Canal</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isVerified && ch.sourceUrl && (
                    <div className="text-xs text-slate-500 flex items-center space-x-2 pt-2 border-t border-slate-100">
                      <span>Fonte Oficial Validada:</span>
                      <a
                        href={ch.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-opp-blue-light hover:underline font-bold font-mono inline-flex items-center"
                      >
                        <span>{ch.sourceUrl}</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 4: FUSÃO DE PROBLEMAS DUPLICADOS (CRITÉRIO AC-12) */}
      {activeTab === 'merge' && (
        <form onSubmit={handleExecuteMerge} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <GitMerge className="w-5 h-5 text-purple-600" />
              <span>Unificação de Demandas Territoriais Concorrentes (Seção 3.4 & AC-12)</span>
            </h2>
            <p className="text-xs text-slate-500">
              A unificação soma adesões e comentários no problema de destino e redireciona automaticamente o problema de origem, preservando a imutabilidade histórica.
            </p>
          </div>

          {mergeSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{mergeSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Problema de Origem (A ser absorvido e redirecionado) *
              </label>
              <select
                value={sourceIssueId}
                onChange={(e) => setSourceIssueId(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary bg-white font-mono"
              >
                {mockIssues.map(i => (
                  <option key={i.issueId} value={i.issueId}>{i.issueId} — {i.title.slice(0, 45)}...</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Problema Principal de Destino (Receberá as adesões) *
              </label>
              <select
                value={targetIssueId}
                onChange={(e) => setTargetIssueId(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary bg-white font-mono"
              >
                {mockIssues.map(i => (
                  <option key={i.issueId} value={i.issueId}>{i.issueId} — {i.title.slice(0, 45)}...</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Justificativa Técnica da Fusão (Gravada no AuditEvent) *
            </label>
            <textarea
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
              rows={3}
              placeholder="Descreva a razão da unificação (mesmo logradouro, mesmo segmento de postes, etc)..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <GitMerge className="w-4 h-4" />
              <span>Confirmar Fusão e Registrar Auditoria (AC-12)</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
