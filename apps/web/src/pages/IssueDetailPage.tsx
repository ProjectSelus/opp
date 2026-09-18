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
  Award,
  AlertTriangle,
  Edit3,
  Download,
  Mail,
  Eye,
  FileCheck,
  Printer
} from 'lucide-react';
import { mockIssues, mockAgencies, mockPublicResponses } from '../mock/data';
import { StatusBadge } from '../components/StatusBadge';
import {
  evaluateCommentRisk,
  checkCommentForAuthorWarning,
  AuthorCommentWarningCheck,
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
  const [commentWarning, setCommentWarning] = useState<AuthorCommentWarningCheck | null>(null);
  const [commentSuccessFeedback, setCommentSuccessFeedback] = useState<string | null>(null);
  const [hasEverTriggeredWarning, setHasEverTriggeredWarning] = useState(false);

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
  const [selectedDocModal, setSelectedDocModal] = useState<{
    title: string;
    subtitle: string;
    protocol?: string;
    date: string;
    hash: string;
    type: 'DISPATCH' | 'AGENCY_RESPONSE';
    content: string;
    attachments?: Array<{ name: string; url: string; mimeType: string; sizeBytes?: number; hash?: string }>;
  } | null>(null);

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

    // 1. Verificação prévia de conscientização cívica do autor
    const warningCheck = checkCommentForAuthorWarning(newComment);

    if (warningCheck.hasWarnings) {
      // Registra que este rascunho acionou intervenção preventiva de aviso
      setHasEverTriggeredWarning(true);
      // Abre o aviso interativo para o autor: opção de editar ou postar mesmo assim
      setCommentWarning(warningCheck);
      return;
    }

    // Se não há avisos ativos, mas o autor já havia acionado aviso anteriormente e editou,
    // enviamos com hadWarningIntervention = hasEverTriggeredWarning (cai no AUTO_FLAGGED)
    executePostComment(newComment, hasEverTriggeredWarning);
  };

  const executePostComment = (textToPost: string, hadWarningIntervention = false) => {
    // Avalia o risco e substitui palavrões por ###### (sem avisar antes)
    const evalResult = evaluateCommentRisk(textToPost, hadWarningIntervention);

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
    setCommentWarning(null);
    setHasEverTriggeredWarning(false);

    if (evalResult.moderationState === 'AUTO_FLAGGED') {
      setCommentSuccessFeedback('Comentário registrado e encaminhado para revisão da equipe de moderação cívica.');
    } else {
      setCommentSuccessFeedback('Comentário publicado com sucesso na discussão pública!');
    }

    setTimeout(() => setCommentSuccessFeedback(null), 5000);
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
              {/* Evento 1: Resposta Oficial Recebida por E-mail */}
              {officialResponse && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow" />
                  <span className="text-xs font-semibold text-slate-400">
                    {new Date(officialResponse.publishedAt).toLocaleDateString('pt-BR')} • {new Date(officialResponse.publishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <h4 className="text-sm font-bold text-slate-900">Resposta Oficial Conclusiva Recebida por E-mail</h4>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      E-mail Institucional Ingerido
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    A Secretaria Municipal ({agency?.name || 'Órgão Responsável'}) enviou devolutiva oficial institucional referente ao protocolo <strong>{officialResponse.protocolNumber}</strong>. O conteúdo foi sanitizado e disponibilizado com seus anexos oficiais para deliberação da comunidade.
                  </p>
                  <div className="mt-2 text-xs font-mono bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-200 inline-block break-all">
                    Hash SHA-256 da Devolutiva: {officialResponse.documentHash || '8f4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afb'}
                  </div>
                </div>
              )}

              {/* Evento 2: Reclamações Formais Transmitidas */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow" />
                <span className="text-xs font-semibold text-slate-400">10 de Setembro de 2026 • 14:30</span>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <h4 className="text-sm font-bold text-slate-900">Reclamações Formais Cidadãs Transmitidas ao Órgão</h4>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    42 Manifestações Individuais
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Reclamações formais individuais autorizadas pelos moradores encaminhadas via e-mail para <strong>obras@mundonovo.ms.gov.br</strong> (Canal Oficial Verificado) sob a disciplina da Lei Federal nº 13.460/2017, com Reply-To dinâmico para recebimento automático da resposta.
                </p>
                <div className="mt-2 text-xs font-mono bg-slate-100 p-2 rounded text-slate-700 inline-block break-all">
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

              {/* Evento 3: Problema Aberto */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-400 border-4 border-white shadow" />
                <span className="text-xs font-semibold text-slate-400">02 de Setembro de 2026 • 10:14</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Problema Aberto e Aprovado pela Moderação</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Manifestação raiz validada e disponibilizada para consulta e adesão popular coletiva.
                </p>
              </div>
            </div>
          </section>

          {/* Documentos Formais e Respostas Institucionais */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-purple-600" />
                  Documentos Formais Vinculados
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Expedientes oficiais de envio e retorno auditados com assinatura criptográfica SHA-256
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {officialResponse ? '2 documentos oficiais' : '1 documento oficial'}
              </span>
            </div>

            <div className="space-y-4">
              {/* 1. DOCUMENTO DE RETORNO: RESPOSTA OFICIAL DA SECRETARIA / E-MAIL INGERIDO */}
              {officialResponse && (
                <div className="border-2 border-emerald-200 bg-emerald-50/30 rounded-xl p-5 space-y-4 transition-all hover:border-emerald-300">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            Ofício & Resposta Oficial — Protocolo {officialResponse.protocolNumber}
                          </h4>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            Devolutiva Oficial do Órgão
                          </span>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Recebido por E-mail
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Emitido pela {agency?.name || 'Secretaria Competente'} • Recebido e verificado em {new Date(officialResponse.publishedAt).toLocaleDateString('pt-BR')} às {new Date(officialResponse.publishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 break-all">
                          Hash SHA-256 de Autenticidade: <code>{officialResponse.documentHash || '8f4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afb'}</code>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDocModal({
                          title: `Ofício & Resposta Oficial — Protocolo ${officialResponse.protocolNumber}`,
                          subtitle: `Emitido pela ${agency?.name || 'Secretaria Municipal de Obras e Serviços Urbanos'}`,
                          protocol: officialResponse.protocolNumber,
                          date: new Date(officialResponse.publishedAt).toLocaleString('pt-BR'),
                          hash: officialResponse.documentHash || '8f4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afb',
                          type: 'AGENCY_RESPONSE',
                          content: officialResponse.sanitizedContent,
                          attachments: officialResponse.attachments
                        })
                      }
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 flex-shrink-0 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar Devolutiva</span>
                    </button>
                  </div>

                  {/* Anexos Oficiais */}
                  {officialResponse.attachments && officialResponse.attachments.length > 0 && (
                    <div className="pt-3 border-t border-emerald-100 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700 text-[11px]">Arquivos Anexados pelo Órgão:</span>
                      {officialResponse.attachments.map((att, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setSelectedDocModal({
                              title: att.name,
                              subtitle: `Anexo Oficial do Protocolo ${officialResponse.protocolNumber}`,
                              protocol: officialResponse.protocolNumber,
                              date: new Date(officialResponse.publishedAt).toLocaleString('pt-BR'),
                              hash: att.hash || '8f4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afb',
                              type: 'AGENCY_RESPONSE',
                              content: officialResponse.sanitizedContent
                            })
                          }
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold text-[11px] transition-colors"
                        >
                          <FileText className="w-3 h-3 text-emerald-600" />
                          <span>{att.name}</span>
                          <Download className="w-3 h-3 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. DOCUMENTO DE IDA: CARTA DE ENCAMINHAMENTO CIDADÃ / DESPACHO */}
              <div className="border border-slate-200 bg-white rounded-xl p-5 space-y-4 hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      PDF
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Carta de Reclamação Formal Cidadã — Despacho DSP-00142
                        </h4>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {issue.formalSupportCount} Adesões Cidadãs Vinculadas
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          Transmitido ao Órgão
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Transmitido eletronicamente via e-mail em 10/09/2026 às 14:30 para obras@mundonovo.ms.gov.br • Cópias enviadas aos cidadãos (AC-08)
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 break-all">
                        Hash SHA-256: <code>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDocModal({
                        title: 'Carta de Reclamação Formal Cidadã — Despacho DSP-00142',
                        subtitle: `Expediente oficial transmitido à ${agency?.name || 'SEMOB'}`,
                        protocol: 'DSP-00142',
                        date: '10 de Setembro de 2026 às 14:30',
                        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                        type: 'DISPATCH',
                        content: `SOLICITAÇÃO COLETIVA DE PROVIDÊNCIAS — MANIFESTAÇÕES FORMAIS VINCULADAS\n\nIdentificador do Problema: ${issue.issueId}\nTítulo: ${issue.title}\nLocalização: ${issue.locationApprox.neighborhood} — ${issue.locationApprox.streetApprox || ''}\nTotal de Requerentes Cadastrados: ${issue.formalSupportCount} cidadãos munícipes.\n\nFundamentação Legal: Lei Federal nº 13.460/2017 e Lei nº 13.709/2018 (LGPD).\n\nSíntese das Manifestações:\n"${issue.publicSummary}"\n\nAs manifestações formais foram outorgadas com autorização expressa para encaminhamento à ouvidoria pública do órgão competente. A Ouvidoria Pública Popular (OPP) atua como meio técnico de transmissão autorizada.`
                      })
                    }
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 flex-shrink-0 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar Expediente</span>
                  </button>
                </div>
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

            {/* Notificação de Sucesso de Comentário / Máscara de Palavrão */}
            {commentSuccessFeedback && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>{commentSuccessFeedback}</span>
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

      {/* MODAL EDUCATIVO DE AVISO DE MODERAÇÃO PRÉ-POSTAGEM */}
      {commentWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Aviso de Moderação e Convivência Cívica
                  </h3>
                  <p className="text-xs text-slate-500">
                    Identificamos pontos de atenção antes da publicação
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCommentWarning(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explicação contextual */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Para assegurar um ambiente democrático, construtivo e em conformidade legal (LGPD e integridade cívica), sua mensagem se enquadra na(s) seguinte(s) situação(ões):
            </p>

            {/* Lista de situações identificadas */}
            <div className="space-y-2.5">
              {commentWarning.warnings.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                      {w.title}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-semibold">
                      {w.category}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{w.description}</p>
                  <p className="text-[11px] text-amber-800 italic pt-0.5">
                    💡 {w.recommendation}
                  </p>
                </div>
              ))}
            </div>

            {/* Ações: Editar ou Postar Mesmo Assim */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCommentWarning(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>Editar Comentário</span>
              </button>
              <button
                type="button"
                onClick={() => executePostComment(commentWarning.originalText, true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Postar Mesmo Assim</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE DOCUMENTO FORMAL VINCULADO (PDF / OFÍCIO / RESPOSTA OFICIAL) */}
      {selectedDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
            {/* Header do Modal */}
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                  selectedDocModal.type === 'AGENCY_RESPONSE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-opp-blue-primary/30 text-blue-300 border border-blue-400/30'
                }`}>
                  {selectedDocModal.type === 'AGENCY_RESPONSE' ? <Mail className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      selectedDocModal.type === 'AGENCY_RESPONSE'
                        ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/50'
                        : 'bg-blue-900/80 text-blue-300 border border-blue-700/50'
                    }`}>
                      {selectedDocModal.type === 'AGENCY_RESPONSE' ? 'Resposta Oficial do Órgão' : 'Expediente Formal Cidadão'}
                    </span>
                    {selectedDocModal.protocol && (
                      <span className="text-[11px] font-mono text-slate-300">
                        Protocolo: <strong>{selectedDocModal.protocol}</strong>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mt-1 leading-snug">
                    {selectedDocModal.title}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedDocModal.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadados e Integridade Criptográfica */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between text-slate-600 gap-2">
                <span><strong>Data/Hora de Registro:</strong> {selectedDocModal.date}</span>
                <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-[11px]">
                  <FileCheck className="w-3.5 h-3.5 mr-1" />
                  Integridade Verificada
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 break-all bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-400 font-sans block text-[10px] uppercase font-bold tracking-wider">Assinatura Digital & Hash SHA-256:</span>
                {selectedDocModal.hash}
              </div>
            </div>

            {/* Conteúdo do Documento */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs leading-relaxed text-slate-800">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                {selectedDocModal.content}
              </div>

              {/* Anexos se houver */}
              {selectedDocModal.attachments && selectedDocModal.attachments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center">
                    <Download className="w-3.5 h-3.5 mr-1.5 text-opp-blue-primary" />
                    Arquivos Anexados Disponíveis ({selectedDocModal.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDocModal.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between hover:bg-slate-50"
                      >
                        <div className="truncate mr-2">
                          <p className="font-semibold text-slate-800 truncate">{att.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {att.sizeBytes ? `${Math.round(att.sizeBytes / 1024)} KB • ` : ''}{att.mimeType}
                          </p>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-opp-blue-primary/10 text-opp-blue-primary hover:bg-opp-blue-primary hover:text-white rounded text-[11px] font-bold flex items-center space-x-1 flex-shrink-0 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Baixar</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nota de fé pública e transparência */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start space-x-2">
                <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Acesso Público sob a Lei nº 13.460/2017:</strong> Este documento formal é disponibilizado com integridade garantida por hash criptográfico e anonimização de dados pessoais sensíveis conforme a Lei Geral de Proteção de Dados (LGPD).
                </p>
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Salvar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDocModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Fechar Visualizador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
