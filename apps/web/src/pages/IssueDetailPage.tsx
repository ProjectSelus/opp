import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Building2,
  MessageSquare,
  Bookmark,
  Share2,
  Calendar,
  Send,
  FileText,
  Shield,
  AlertCircle,
  Clock,
  ArrowLeft,
  GitMerge,
  Flag,
  Reply,
  Camera,
  Check,
  X,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Award
} from 'lucide-react';
import { mockIssues, mockAgencies, mockPublicResponses } from '../mock/data';
import { StatusBadge } from '../components/StatusBadge';
import {
  evaluateCommentRisk,
  computeResolutionConsensus,
  CitizenResolutionVote,
  ResolutionVoteOption
} from '@opp/shared';

interface CommentItem {
  id: string;
  author: string;
  date: string;
  text: string;
  parentCommentId?: string;
  moderationState?: string;
  reportCount?: number;
}

interface EvidenceItem {
  id: string;
  title: string;
  author: string;
  date: string;
  url: string;
  status: 'APPROVED' | 'PENDING';
}

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTabMobile, setActiveTabMobile] = useState<'resumo' | 'historico' | 'discussao' | 'documentos'>('resumo');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(65);

  // Discussão Comunitária (Seção 23)
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; author: string } | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<'OFFENSIVE' | 'PII_LEAK' | 'CRIME_ACCUSATION' | 'SPAM' | 'OTHER'>('OFFENSIVE');
  const [reportedSuccess, setReportedSuccess] = useState<string | null>(null);

  const [commentsList, setCommentsList] = useState<CommentItem[]>([
    {
      id: 'c1',
      author: 'Carlos S.',
      date: '10 de Setembro de 2026',
      text: 'Passo aqui todos os dias voltando do trabalho à noite. A rua fica um breu total e já tivemos tentativas de assalto.'
    },
    {
      id: 'c1-rep1',
      author: 'Lucas M.',
      date: '11 de Setembro de 2026',
      text: 'Concordo plenamente, Carlos! Semana passada quase trombei com ciclistas por falta total de luz.',
      parentCommentId: 'c1'
    },
    {
      id: 'c2',
      author: 'Mariana R.',
      date: '12 de Setembro de 2026',
      text: 'Já entrei em contato com a equipe da secretaria por telefone, mas informaram que não havia ordem de serviço aberta.'
    }
  ]);

  // Evidências Comunitárias Moderadas (Módulo 15 & Seção 4.4)
  const [evidencesList, setEvidencesList] = useState<EvidenceItem[]>([
    {
      id: 'ev-1',
      title: 'Poste nº 142 com luminária queimada e fiação exposta',
      author: 'Cidadão Residente',
      date: '05/09/2026',
      url: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=80',
      status: 'APPROVED'
    }
  ]);
  const [newEvidenceDesc, setNewEvidenceDesc] = useState('');
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);

  const issue = mockIssues.find(i => i.issueId === id) || mockIssues[0];
  const agency = mockAgencies.find(a => a.agencyId === issue.agencyIds[0]);
  const officialResponse = mockPublicResponses.find(r => r.issueId === issue.issueId);

  // Votação Cívica de Resolução (Fase 9 / Seção 22)
  const [resolutionVotes, setResolutionVotes] = useState<CitizenResolutionVote[]>([
    { voteId: 'v1', issueId: issue.issueId, userId: 'user-20', vote: 'SIM', votedAt: '2026-09-16T15:40:00Z' },
    { voteId: 'v2', issueId: issue.issueId, userId: 'user-21', vote: 'SIM', votedAt: '2026-09-16T15:45:00Z' },
    { voteId: 'v3', issueId: issue.issueId, userId: 'user-22', vote: 'PARCIALMENTE', votedAt: '2026-09-16T15:50:00Z' }
  ]);
  const [userVote, setUserVote] = useState<ResolutionVoteOption | null>(null);
  const [showVoteSuccess, setShowVoteSuccess] = useState(false);

  const consensus = computeResolutionConsensus(resolutionVotes, 3);

  const handleVoteResolution = (vote: ResolutionVoteOption) => {
    setUserVote(vote);
    const newVote: CitizenResolutionVote = {
      voteId: `v-${Date.now()}`,
      issueId: issue.issueId,
      userId: 'current-user-123',
      vote,
      votedAt: new Date().toISOString()
    };
    setResolutionVotes(prev => [...prev.filter(v => v.userId !== 'current-user-123'), newVote]);
    setShowVoteSuccess(true);
    setTimeout(() => setShowVoteSuccess(false), 4000);
  };

  const handleToggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount(prev => prev - 1);
    } else {
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Avaliação de moderação e sanitização de risco (Seção 16 & 23)
    const evalResult = evaluateCommentRisk(newComment);

    const added: CommentItem = {
      id: `c-${Date.now()}`,
      author: 'Você (Cidadão)',
      date: 'Agora mesmo',
      text: evalResult.sanitizedText,
      parentCommentId: replyingTo?.commentId,
      moderationState: evalResult.moderationState
    };

    setCommentsList(prev => [...prev, added]);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingCommentId) return;

    setCommentsList(prev =>
      prev.map(c => c.id === reportingCommentId ? { ...c, reportCount: (c.reportCount || 0) + 1 } : c)
    );

    setReportedSuccess(reportingCommentId);
    setReportingCommentId(null);
    setTimeout(() => setReportedSuccess(null), 4000);
  };

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceDesc.trim()) return;

    const addedEvidence: EvidenceItem = {
      id: `ev-${Date.now()}`,
      title: newEvidenceDesc,
      author: 'Você (Cidadão)',
      date: 'Agora mesmo',
      url: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=80',
      status: 'PENDING'
    };

    setEvidencesList(prev => [addedEvidence, ...prev]);
    setNewEvidenceDesc('');
    setShowEvidenceForm(false);
  };

  const rootComments = commentsList.filter(c => !c.parentCommentId);
  const getReplies = (parentId: string) => commentsList.filter(c => c.parentCommentId === parentId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Botão Voltar */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Voltar para a pesquisa</span>
        </Link>
      </div>

      {/* CABEÇALHO DO ISSUE (Seção 29.3) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              {issue.issueId}
            </span>
            <StatusBadge status={issue.status} />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleToggleFollow}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isFollowing
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-inner'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Receba atualizações quando houver novos encaminhamentos ou respostas"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFollowing ? 'fill-current' : ''}`} />
              <span>{isFollowing ? 'Acompanhando' : 'Acompanhar'}</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>

        {/* Banner de Unificação (AC-12 & Seção 3.4) */}
        {issue.status === 'MERGED' && issue.mergedIntoIssueId && (
          <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-5 flex items-start space-x-3 text-purple-900 shadow-sm">
            <GitMerge className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <h3 className="font-extrabold text-base text-purple-950">
                Problema Público Unificado por Duplicidade (AC-12)
              </h3>
              <p className="text-xs sm:text-sm text-purple-800 leading-relaxed">
                Este relato foi identificado pela moderação como correspondente ao problema principal{' '}
                <Link to={`/problemas/${issue.mergedIntoIssueId}`} className="font-bold underline text-purple-950 hover:text-purple-700">
                  {issue.mergedIntoIssueId}
                </Link>. As manifestações formais, histórico e contadores foram consolidados no registro principal para maximizar o impacto cívico coletivo.
              </p>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
            {issue.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-emerald-600 mr-1.5 flex-shrink-0" />
              <span>{issue.locationApprox.streetApprox}, {issue.locationApprox.neighborhood} — {issue.locationApprox.city}</span>
            </div>
            {agency && (
              <div className="flex items-center">
                <Building2 className="w-4 h-4 text-blue-600 mr-1.5 flex-shrink-0" />
                <span>Órgão Relacionado: {agency.name}</span>
              </div>
            )}
            <div className="flex items-center text-slate-400">
              <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span>Registrado em {new Date(issue.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* INDICADORES E CTA PRIMÁRIO (Seção 23.3) */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-xl">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-2xl font-black text-emerald-600 block">{issue.formalSupportCount}</span>
              <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Adesões Formais</span>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-2xl font-black text-slate-700 block">{commentsList.length}</span>
              <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Comentários</span>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-2xl font-black text-blue-600 block">{followerCount}</span>
              <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Seguidores</span>
            </div>
          </div>

          <Link
            to={`/problemas/${issue.issueId}/aderir`}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-opp-green-action hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Aderir formalmente a este problema</span>
          </Link>
        </div>
      </div>

      {/* TABS MOBILE (Seção 29.3) */}
      <div className="flex md:hidden border-b border-slate-200 bg-white rounded-lg p-1">
        {(['resumo', 'historico', 'discussao', 'documentos'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTabMobile(tab)}
            className={`flex-1 py-2 text-xs font-bold capitalize rounded-md transition-colors ${
              activeTabMobile === tab
                ? 'bg-opp-blue-primary text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LAYOUT DESKTOP (70% Resumo/Histórico/Docs / 30% Discussão) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA (70%) */}
        <div className={`lg:col-span-8 space-y-8 ${activeTabMobile === 'discussao' ? 'hidden md:block' : ''}`}>
          {/* Resumo do Problema */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-600" />
              Resumo Sanitizado do Problema
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {issue.publicSummary}
            </p>
            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Este texto foi verificado deterministicamente e não contém dados pessoais sensíveis ou identificadores privados (LGPD).
              </span>
            </div>
          </section>

          {/* Resposta Oficial do Órgão e Deliberação Comunitária (Fase 9 / Seção 22) */}
          {officialResponse && (
            <section className="bg-white rounded-2xl border-2 border-emerald-300 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Resposta Oficial do Órgão Competente
                    </h2>
                    <span className="text-xs text-emerald-700 font-semibold">
                      {agency?.name || 'Órgão Responsável'} • Protocolo: {officialResponse.protocolNumber}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  Publicado em {new Date(officialResponse.publishedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Conteúdo Sanitizado da Resposta */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-sm text-slate-800 leading-relaxed">
                <p>{officialResponse.sanitizedContent}</p>
              </div>

              {/* Bloco de Escrutínio Cívico Coletivo */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Escrutínio Coletivo de Resolução (Seção 22.2)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cidadãos com manifestação vinculada deliberam sobre a efetividade prática da medida anunciada.
                    </p>
                  </div>

                  {/* Badge de Consenso Atual */}
                  <div className="flex-shrink-0">
                    {consensus.consensusStatus === 'RESOLVED' && (
                      <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Validado como Resolvido ({consensus.percentages.SIM}% SIM)
                      </span>
                    )}
                    {consensus.consensusStatus === 'PARTIALLY_RESOLVED' && (
                      <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full border border-amber-300">
                        Parcialmente Resolvido ({consensus.percentages.PARCIALMENTE}%)
                      </span>
                    )}
                    {consensus.consensusStatus === 'UNRESOLVED' && (
                      <span className="inline-flex items-center px-3 py-1 bg-rose-100 text-rose-900 font-bold text-xs rounded-full border border-rose-300">
                        Não Resolvido pela Comunidade ({consensus.percentages.NAO}%)
                      </span>
                    )}
                    {consensus.consensusStatus === 'AWAITING_QUORUM' && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-900 font-bold text-xs rounded-full border border-blue-300">
                        Aguardando Quórum ({consensus.totalVotes}/3 votos)
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de Distribuição Percentual de Votos */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${consensus.percentages.SIM}%` }}
                      className="bg-emerald-600 h-full transition-all duration-500"
                      title={`Sim: ${consensus.percentages.SIM}%`}
                    />
                    <div
                      style={{ width: `${consensus.percentages.PARCIALMENTE}%` }}
                      className="bg-amber-500 h-full transition-all duration-500"
                      title={`Parcialmente: ${consensus.percentages.PARCIALMENTE}%`}
                    />
                    <div
                      style={{ width: `${consensus.percentages.NAO}%` }}
                      className="bg-rose-600 h-full transition-all duration-500"
                      title={`Não: ${consensus.percentages.NAO}%`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-1">
                    <span className="text-emerald-700">● Sim, resolvido: {consensus.percentages.SIM}% ({consensus.counts.SIM})</span>
                    <span className="text-amber-700">● Parcialmente: {consensus.percentages.PARCIALMENTE}% ({consensus.counts.PARCIALMENTE})</span>
                    <span className="text-rose-700">● Não resolvido: {consensus.percentages.NAO}% ({consensus.counts.NAO})</span>
                    <span className="text-slate-400">Total: {consensus.totalVotes} avaliação(ões)</span>
                  </div>
                </div>

                {/* Alerta de Voto Registrado */}
                {showVoteSuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Seu voto foi registrado com sucesso e computado no consenso cívico!</span>
                  </div>
                )}

                {/* Botões de Votação Cidadã */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    {userVote ? 'Seu voto registrado:' : 'Participe: A obra ou serviço foi realmente concluído na prática?'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleVoteResolution('SIM')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                        userVote === 'SIM'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Sim, Resolvido</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVoteResolution('PARCIALMENTE')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                        userVote === 'PARCIALMENTE'
                          ? 'bg-amber-600 text-white border-amber-600 shadow'
                          : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Parcialmente</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVoteResolution('NAO')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                        userVote === 'NAO'
                          ? 'bg-rose-600 text-white border-rose-600 shadow'
                          : 'bg-white border-rose-300 text-rose-900 hover:bg-rose-50'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Não Resolvido</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVoteResolution('NAO_SEI_AVALIAR')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                        userVote === 'NAO_SEI_AVALIAR'
                          ? 'bg-slate-700 text-white border-slate-700 shadow'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>Não sei avaliar</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Galeria de Evidências Comunitárias (Módulo 15 & Seção 4.4) */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-opp-blue-light" />
                  Evidências Fotográficas e Documentais
                </h2>
                <p className="text-xs text-slate-500">Fotos e registros anexados pela comunidade e aprovados na moderação cívica</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                className="px-3 py-1.5 bg-opp-blue-primary hover:bg-opp-blue-deep text-white text-xs font-bold rounded-lg transition-colors"
              >
                + Adicionar Evidência
              </button>
            </div>

            {/* Formulário de Envio de Evidência */}
            {showEvidenceForm && (
              <form onSubmit={handleAddEvidence} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Enviar nova evidência com foto</h4>
                <input
                  type="text"
                  value={newEvidenceDesc}
                  onChange={(e) => setNewEvidenceDesc(e.target.value)}
                  placeholder="Descreva o que a foto comprova (ex: poste com numeração apagada)..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
                  required
                />
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-800">
                  Imagens são enviadas para área privada com isolamento LGPD e só aparecem publicamente após remoção de metadados e moderação.
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEvidenceForm(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-opp-green-action hover:bg-emerald-600 text-white text-xs font-bold rounded-lg"
                  >
                    Enviar para Validação
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evidencesList.map((ev) => (
                <div key={ev.id} className="border border-slate-200 rounded-xl overflow-hidden group shadow-sm bg-white">
                  <img
                    src={ev.url}
                    alt={ev.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{ev.author}</span>
                      <span>{ev.date}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                      {ev.title}
                    </p>
                    {ev.status === 'PENDING' && (
                      <span className="inline-block mt-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Em Moderação
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Linha do Tempo e Histórico de Encaminhamentos */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-opp-blue-light" />
              Linha do Tempo e Transparência
            </h2>

            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pl-6">
              {/* Evento 1 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow" />
                <span className="text-xs font-semibold text-slate-400">10 de Setembro de 2026 • 14:30</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Encaminhado ao Órgão Competente</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Despacho em lote transmitido para <strong>obras@mundonovo.ms.gov.br</strong> (Canal Oficial Verificado) contendo 42 manifestações formais autorizadas pelos cidadãos.
                </p>
                <div className="mt-2 text-xs font-mono bg-slate-100 p-2 rounded text-slate-700 inline-block">
                  Hash SHA-256 do Documento: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </div>
              </div>

              {/* Eventos de Unificação / Fusão de Demandas (Seção 3.4) */}
              {issue.mergeHistory && issue.mergeHistory.map((m, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-purple-500 border-4 border-white shadow" />
                  <span className="text-xs font-semibold text-slate-400">
                    {new Date(m.mergedAt).toLocaleDateString('pt-BR')} • Demanda Unificada
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    Unificação por Duplicidade: {m.sourceIssueId}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    O relato correspondente foi absorvido e suas manifestações foram somadas a este registro. Motivo registrado: <em>"{m.reason}"</em>.
                  </p>
                </div>
              ))}

              {/* Evento 2 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow" />
                <span className="text-xs font-semibold text-slate-400">02 de Setembro de 2026 • 10:14</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Problema Aberto e Aprovado pela Moderação</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Manifestação raiz validada e disponibilizada para consulta e adesão popular coletiva.
                </p>
              </div>
            </div>
          </section>

          {/* Documentos Formais e Respostas Institucionais */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-purple-600" />
              Documentos Formais Vinculados
            </h2>

            <div className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  PDF
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-slate-900">Carta de Encaminhamento Cidadã — Despacho DSP-00142</h4>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Lote Consolidado (AC-06)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transmitido em 10/09/2026 às 14:30 • 42 manifestações formais agrupadas • Cópias enviadas aos cidadãos (AC-08)
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Hash SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Transmitido ao Órgão
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA (30%) - DISCUSSÃO COMUNITÁRIA (Seção 23 & Critério AC-03) */}
        <div className={`lg:col-span-4 space-y-6 ${activeTabMobile !== 'discussao' ? 'hidden md:block' : ''}`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-slate-700" />
                Discussão Pública
              </h3>
              <span className="text-xs font-bold text-slate-500">{commentsList.length} relatos</span>
            </div>

            {/* ALERTA CRÍTICO OBRIGATÓRIO (Critério AC-03) */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Atenção cívica:</strong> Comentar aqui enriquece a discussão comunitária, mas <strong>não gera manifestação formal nem envio ao órgão (AC-03)</strong>. Para aderir formalmente, clique no botão verde no topo.
              </span>
            </div>

            {/* Notificação de Denúncia Enviada */}
            {reportedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Denúncia registrada para revisão da equipe de moderação cívica.</span>
              </div>
            )}

            {/* Formulário de Novo Comentário / Resposta Encadeada */}
            <form onSubmit={handleAddComment} className="space-y-3">
              {replyingTo && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs text-blue-800">
                  <span className="flex items-center">
                    <Reply className="w-3.5 h-3.5 mr-1" />
                    Respondendo a <strong>{replyingTo.author}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `Escreva sua resposta para ${replyingTo.author}...` : "Compartilhe seu relato ou evidência..."}
                rows={3}
                className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary focus:border-transparent"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-opp-blue-primary hover:bg-opp-blue-deep text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{replyingTo ? 'Publicar Resposta' : 'Publicar Comentário Comunitário'}</span>
              </button>
            </form>

            {/* Lista de Comentários Encadeados (Seção 23.2) */}
            <div className="space-y-4 pt-2">
              {rootComments.map((c) => {
                const replies = getReplies(c.id);

                return (
                  <div key={c.id} className="space-y-2">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{c.author}</span>
                        <span className="text-slate-400 text-[11px]">{c.date}</span>
                      </div>

                      <p className="text-slate-700 leading-relaxed">{c.text}</p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <button
                          type="button"
                          onClick={() => setReplyingTo({ commentId: c.id, author: c.author })}
                          className="font-semibold text-opp-blue-primary hover:underline flex items-center"
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Responder
                        </button>

                        <button
                          type="button"
                          onClick={() => setReportingCommentId(c.id)}
                          className="hover:text-rose-600 flex items-center transition-colors"
                          title="Denunciar comentário abusivo ou que exponha dados de terceiros"
                        >
                          <Flag className="w-3 h-3 mr-1" />
                          Denunciar
                        </button>
                      </div>
                    </div>

                    {/* Respostas Encadeadas (Nível 2) */}
                    {replies.map((rep) => (
                      <div key={rep.id} className="ml-5 p-3 rounded-xl bg-blue-50/40 border border-blue-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center">
                            <Reply className="w-3 h-3 mr-1 text-blue-600 rotate-180" />
                            {rep.author}
                          </span>
                          <span className="text-slate-400 text-[10px]">{rep.date}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{rep.text}</p>
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setReportingCommentId(rep.id)}
                            className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center transition-colors"
                          >
                            <Flag className="w-2.5 h-2.5 mr-1" />
                            Denunciar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Denúncia de Conteúdo (Seção 23.2) */}
      {reportingCommentId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Flag className="w-4 h-4 mr-2 text-rose-600" />
                Denunciar Comentário
              </h3>
              <button
                type="button"
                onClick={() => setReportingCommentId(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ajude a manter a Ouvidoria Pública Popular um espaço cívico seguro, sem ofensas e em conformidade com a LGPD.
            </p>

            <form onSubmit={handleSendReport} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Motivo da Denúncia
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as any)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="OFFENSIVE">Linguagem ofensiva / Agressão verbal</option>
                <option value="PII_LEAK">Exposição de dados pessoais (CPF, telefone, endereço)</option>
                <option value="CRIME_ACCUSATION">Acusação nominal de crime sem decisão judicial</option>
                <option value="SPAM">Spam ou divulgação comercial</option>
                <option value="OTHER">Outro motivo</option>
              </select>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReportingCommentId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Confirmar Denúncia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
