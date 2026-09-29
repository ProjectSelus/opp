import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Lightbulb,
  Car,
  HeartPulse,
  Trash2,
  Bus,
  Droplets
} from 'lucide-react';
import { SearchBar } from '../features/search/SearchBar';
import { IssueCard } from '../features/issues/IssueCard';
import { mockIssues, mockCategories, mockAgencies } from '../mock/data';

export const HomePage: React.FC = () => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Lightbulb': return <Lightbulb className="w-5 h-5 text-amber-600" />;
      case 'Car': return <Car className="w-5 h-5 text-orange-600" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-rose-600" />;
      case 'Trash2': return <Trash2 className="w-5 h-5 text-emerald-600" />;
      case 'Bus': return <Bus className="w-5 h-5 text-blue-600" />;
      default: return <Droplets className="w-5 h-5 text-cyan-600" />;
    }
  };

  const getAgencyName = (agencyId: string) => {
    return mockAgencies.find(a => a.agencyId === agencyId)?.name;
  };

  return (
    <div className="space-y-16 pb-12">
      {/* 1. HERO SEARCH-FIRST (Seção 29.2) */}
      <section className="relative z-20 civic-gradient text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="hero-overlay absolute inset-0 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-300 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4" />
            <span>Mundo Novo - MS • Participação Cívica Ativa</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Uma cidade melhor <br className="hidden sm:inline" />
            <span className="text-emerald-400">começa com a sua voz.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
            Encontre problemas públicos já registrados pela comunidade, adira formalmente à demanda e acompanhe respostas oficiais dos órgãos competentes.
          </p>

          {/* Barra de Busca Proeminente */}
          <div className="pt-4">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* 2. CAUSAS EM DESTAQUE (Categorias) */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Causas em destaque</h2>
              <p className="text-xs sm:text-sm text-slate-500">Explore problemas comunitários por área de atuação municipal</p>
            </div>
            <Link
              to="/problemas"
              className="inline-flex items-center text-xs sm:text-sm font-semibold text-opp-blue-primary hover:text-opp-blue-light"
            >
              <span>Ver todas as categorias</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {mockCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/problemas?categoria=${cat.id}`}
                className="flex flex-col items-center p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-sm transition-all text-center group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 ${cat.color} group-hover:scale-110 transition-transform`}>
                  {getCategoryIcon(cat.icon)}
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">{cat.name}</span>
                <span className="text-xs text-slate-500 mt-1 font-medium">{cat.count} problemas</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PROBLEMAS RECENTES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Problemas públicos em foco</h2>
            <p className="text-xs sm:text-sm text-slate-500">Participe de demandas ativas na sua vizinhança antes de criar um novo registro</p>
          </div>
          <Link
            to="/problemas"
            className="inline-flex items-center text-xs sm:text-sm font-bold text-opp-blue-primary hover:text-opp-blue-light"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockIssues.map((issue) => (
            <IssueCard
              key={issue.issueId}
              issue={issue}
              agencyName={issue.agencyIds[0] ? getAgencyName(issue.agencyIds[0]) : undefined}
            />
          ))}
        </div>
      </section>

      {/* 4. COMO FUNCIONA (Etapas Cívicas Transparentes) */}
      <section className="bg-slate-100/80 py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Como a OPP Funciona</h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Do problema local ao encaminhamento formal com rigor e transparência
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-opp-blue-primary flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Busca & Registro</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Você pesquisa se o problema já existe. Se não existir, relata com local aproximado e fotos.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Moderação & LGPD</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dados pessoais são higienizados e o texto é estruturado de forma neutra e objetiva.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Adesão & Encaminhamento</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Outros cidadãos aderem à demanda e o sistema transmite manifestações formais aos canais oficiais verificados.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Resposta & Transparência</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A resposta do órgão fica pública para que toda a comunidade possa fiscalizar o cumprimento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRANSPARÊNCIA QUE GERA CONFIANÇA (Números da Seção 29.1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-opp-blue-deep to-slate-900 rounded-3xl text-white p-8 sm:p-12 shadow-2xl">
          <div className="max-w-3xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Transparência que gera confiança
            </h2>
            <p className="text-slate-300 text-sm">
              Métricas consolidadas de impacto cívico em tempo real para o município de Mundo Novo.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-l-2 border-emerald-400 pl-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-white block">1.240</span>
              <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Manifestações Registradas</span>
            </div>

            <div className="border-l-2 border-blue-400 pl-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-white block">86</span>
              <span className="text-xs text-blue-300 font-semibold uppercase tracking-wider">Em Acompanhamento</span>
            </div>

            <div className="border-l-2 border-teal-400 pl-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-white block">1.032</span>
              <span className="text-xs text-teal-300 font-semibold uppercase tracking-wider">Respostas Oficiais</span>
            </div>

            <div className="border-l-2 border-amber-400 pl-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-white block">12 dias</span>
              <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Tempo Médio de Retorno</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
