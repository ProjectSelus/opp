import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, MessageSquare, ArrowRight, Building2, Calendar } from 'lucide-react';
import { Issue } from '@opp/shared';
import { StatusBadge } from '../../components/StatusBadge';

interface IssueCardProps {
  issue: Issue;
  agencyName?: string;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, agencyName }) => {
  const formattedDate = new Date(issue.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      <div className="p-5">
        {/* Cabeçalho do Card: Status e Localização */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <StatusBadge status={issue.status} size="sm" />
          <span className="inline-flex items-center text-xs font-semibold text-slate-500">
            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {formattedDate}
          </span>
        </div>

        {/* Título do Problema Público */}
        <Link to={`/problemas/${issue.issueId}`}>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-opp-blue-light transition-colors leading-snug line-clamp-2 mb-2">
            {issue.title}
          </h3>
        </Link>

        {/* Resumo Sanitizado */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {issue.publicSummary}
        </p>

        {/* Metadados: Bairro e Órgão */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate font-medium text-slate-700">
              {issue.locationApprox.neighborhood} — {issue.locationApprox.city}
            </span>
          </div>
          {agencyName && (
            <div className="flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-600 flex-shrink-0" />
              <span className="truncate text-slate-600">{agencyName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé do Card: Contadores Cívicos (Adesões Formais e Discussão) */}
      <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <div className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md" title="Cidadãos que aderiram formalmente à manifestação">
            <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            <span>{issue.formalSupportCount} adesões</span>
          </div>
          <div className="flex items-center text-slate-600" title="Comentários e evidências comunitárias">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <span>{issue.commentCount}</span>
          </div>
        </div>

        <Link
          to={`/problemas/${issue.issueId}`}
          className="inline-flex items-center text-xs font-bold text-opp-blue-primary hover:text-opp-blue-light transition-colors"
        >
          <span>Ver problema</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
