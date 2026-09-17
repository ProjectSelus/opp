import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { mockIssues, mockCategories, mockAgencies } from '../mock/data';
import { IssueCard } from '../features/issues/IssueCard';

export const ProblemsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('categoria') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredIssues = mockIssues.filter(issue => {
    const matchesQuery = !query.trim() ||
      issue.title.toLowerCase().includes(query.toLowerCase()) ||
      issue.publicSummary.toLowerCase().includes(query.toLowerCase()) ||
      issue.locationApprox.neighborhood.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || issue.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;

    return matchesQuery && matchesCategory && matchesStatus;
  });

  const getAgencyName = (agencyId: string) => {
    return mockAgencies.find(a => a.agencyId === agencyId)?.name;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Problemas Públicos Registrados
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore as demandas da comunidade, adira às manifestações ou acompanhe as respostas do município.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por termo, rua ou bairro..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs sm:text-sm p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
          >
            <option value="all">Todas as Categorias</option>
            {mockCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs sm:text-sm p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-opp-blue-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="OPEN">Aberto para Adesão</option>
            <option value="FORWARDED">Encaminhado ao Órgão</option>
            <option value="AWAITING_RESPONSE">Aguardando Resposta</option>
            <option value="RESOLVED">Resolvido</option>
          </select>
        </div>
      </div>

      {/* Lista de Resultados */}
      {filteredIssues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.issueId}
              issue={issue}
              agencyName={issue.agencyIds[0] ? getAgencyName(issue.agencyIds[0]) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <p className="text-slate-600 text-sm">
            Nenhum problema encontrado para os filtros selecionados.
          </p>
          <a
            href="/registrar-problema"
            className="inline-block px-5 py-2.5 bg-opp-green-action hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm"
          >
            Registrar este problema
          </a>
        </div>
      )}
    </div>
  );
};
