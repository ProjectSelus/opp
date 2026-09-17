import React, { useState, useMemo } from 'react';
import {
  Building2,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Search,
  FileText,
  Clock,
  SendHorizontal
} from 'lucide-react';
import { mockAgencies } from '../mock/data';

export const AgenciesPage: React.FC = () => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');

  const filteredAgencies = useMemo(() => {
    return mockAgencies.filter(agency => {
      const matchesSearch =
        agency.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (agency.acronym && agency.acronym.toLowerCase().includes(searchFilter.toLowerCase())) ||
        agency.categories.some(c => c.toLowerCase().includes(searchFilter.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedStatus === 'ALL') return true;
      if (selectedStatus === 'VERIFIED') {
        return agency.channels.some(c => c.verificationStatus === 'VERIFIED');
      }
      if (selectedStatus === 'UNVERIFIED') {
        return agency.channels.some(c => c.verificationStatus === 'UNVERIFIED');
      }
      return true;
    });
  }, [searchFilter, selectedStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
          <Building2 className="w-3.5 h-3.5 text-blue-700" />
          <span>Módulo de Órgãos e Roteamento Cívico (Seções 8 & 9)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Órgãos Públicos e Canais Institucionais Cadastrados
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          A OPP mapeia, homologa e monitora os canais oficiais dos órgãos municipais. Em respeito à segurança jurídica e ao <strong>Critério AC-07</strong>, envios automáticos só são despachados para canais estritamente homologados com fonte comprobatória pública.
        </p>
      </div>

      {/* Regra de Ouro AC-07 (Banner Cívico) */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start space-x-3 text-emerald-950">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block">Política de Validação de Canais (Critério AC-07)</span>
            <p className="text-emerald-800 mt-0.5">
              Canais marcados como <strong>NÃO VERIFICADOS</strong> são imediatamente retidos para revisão humana e nunca recebem transmissões automatizadas.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 font-bold text-emerald-800 text-[11px] shadow-sm">
          Auditoria Ativa
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar por órgão, sigla ou serviço..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600">Status do Canal:</span>
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedStatus === 'ALL' ? 'bg-opp-blue-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Todos ({mockAgencies.length})
          </button>
          <button
            onClick={() => setSelectedStatus('VERIFIED')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedStatus === 'VERIFIED' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
          >
            Verificados
          </button>
          <button
            onClick={() => setSelectedStatus('UNVERIFIED')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedStatus === 'UNVERIFIED' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
          >
            Não Verificados
          </button>
        </div>
      </div>

      {/* Grade de Órgãos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAgencies.map((agency) => (
          <div key={agency.agencyId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-opp-blue-primary flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">{agency.name}</h2>
                    <span className="text-xs text-emerald-700 font-bold tracking-wider">{agency.acronym}</span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                  {agency.categories.length} competência{agency.categories.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Categorias atendidas */}
              <div className="flex flex-wrap gap-1.5">
                {agency.categories.map(cat => (
                  <span key={cat} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md uppercase">
                    {cat.replace('_', ' ')}
                  </span>
                ))}
              </div>

              {/* Canais cadastrados */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Canais de Tramitação</span>
                  <span className="text-[11px] text-slate-400 font-normal">({agency.channels.length} canal(is))</span>
                </h3>

                {agency.channels.map((channel) => {
                  const isVerified = channel.verificationStatus === 'VERIFIED';
                  return (
                    <div
                      key={channel.channelId}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                        isVerified
                          ? 'bg-slate-50/80 border-slate-200'
                          : 'bg-amber-50/70 border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 font-bold text-slate-800">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span>Tipo: {channel.type}</span>
                        </div>

                        {isVerified ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md border border-amber-300">
                            <AlertTriangle className="w-3 h-3 mr-1 text-amber-700" />
                            Não Verificado (AC-07)
                          </span>
                        )}
                      </div>

                      <div className="font-mono text-xs text-slate-800 bg-white p-2 rounded-lg border border-slate-200/80 truncate">
                        {channel.addressOrUrl}
                      </div>

                      {/* Alerta de Canal Não Verificado */}
                      {!isVerified && (
                        <div className="text-[11px] text-amber-900 font-medium bg-amber-100/80 p-2 rounded-lg">
                          ⚠️ Envio automático suspenso. Manifestações para este canal são retidas na fila de triagem humana até comprovação em Diário Oficial.
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 gap-2">
                        <span className="flex items-center space-x-1">
                          <SendHorizontal className="w-3 h-3 text-slate-400" />
                          <span>
                            {channel.acceptsAutomatedSubmission
                              ? 'Aceita Envio em Lote'
                              : 'Submissão Assistida / Manual'}
                          </span>
                        </span>

                        {channel.sourceUrl && (
                          <a
                            href={channel.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-opp-blue-light hover:underline font-bold"
                          >
                            <span>Fonte Oficial</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>

                      {channel.verifiedAt && (
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Homologado em {new Date(channel.verifiedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Base legal: Lei 13.460/2017</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Ativo na OPP
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
