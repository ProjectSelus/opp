import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, ArrowRight, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { mockIssues } from '../../mock/data';
import { findDuplicateCandidates, ScoredCandidate } from '@opp/shared';
import { StatusBadge } from '../../components/StatusBadge';

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  className?: string;
  compact?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  onSearch,
  className = '',
  compact = false
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<ScoredCandidate[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length >= 3) {
      const candidates = findDuplicateCandidates(
        {
          municipalityId: 'mundo-novo-ms',
          title: query
        },
        mockIssues,
        0.20 // threshold mais suave para preview
      );
      setSuggestions(candidates.slice(0, 4));
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [query]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setShowDropdown(false);
    if (onSearch) {
      onSearch(query);
    } else {
      navigate(`/problemas?q=${encodeURIComponent(query)}`);
    }
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    setShowDropdown(false);
    if (onSearch) {
      onSearch(tag);
    } else {
      navigate(`/problemas?q=${encodeURIComponent(tag)}`);
    }
  };

  const quickTags = [
    { label: 'iluminação', query: 'iluminação' },
    { label: 'saúde', query: 'posto de saúde remédios' },
    { label: 'buracos', query: 'buraco asfalto' },
    { label: 'limpeza', query: 'lixo entulho limpeza' },
    { label: 'transporte', query: 'ônibus transporte' },
  ];

  if (compact) {
    return (
      <form onSubmit={handleSearchSubmit} className={`relative flex items-center ${className}`}>
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar problemas na cidade..."
          className="w-full pl-9 pr-20 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opp-green-action focus:border-transparent transition-all"
        />
        <button
          type="submit"
          className="absolute right-1 px-3 py-1 bg-opp-blue-primary hover:bg-opp-blue-deep text-white text-xs font-semibold rounded-md transition-colors"
        >
          Buscar
        </button>
      </form>
    );
  }

  return (
    <div ref={containerRef} className={`w-full max-w-3xl mx-auto relative ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row gap-2 shadow-2xl rounded-2xl p-2 bg-white/95 backdrop-blur border border-white/40">
        <div className="relative flex-grow flex items-center">
          <Search className="w-6 h-6 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 3 && setShowDropdown(true)}
            placeholder="O que está acontecendo na sua cidade?"
            className="w-full pl-12 pr-4 py-3.5 text-base sm:text-lg text-slate-800 placeholder-slate-400 bg-transparent rounded-xl focus:outline-none"
            aria-label="Buscar problemas públicos"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-opp-green-action hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-base rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          <Search className="w-5 h-5" />
          <span>Buscar</span>
        </button>
      </form>

      {/* Dropdown de Sugestões Instantâneas em Tempo Real (Seção 12 & AC-01) */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Problemas semelhantes já cadastrados</span>
            <span className="text-emerald-700 font-semibold lowercase">busca antes de criar</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {suggestions.map(({ issue, similarityScore, matchReasons }) => (
              <Link
                key={issue.issueId}
                to={`/problemas/${issue.issueId}`}
                onClick={() => setShowDropdown(false)}
                className="p-3.5 hover:bg-emerald-50/40 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={issue.status} size="sm" />
                    <span className="text-[11px] font-mono text-slate-400">{issue.issueId}</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {Math.round(similarityScore * 100)}% relevante
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-opp-blue-light transition-colors line-clamp-1">
                    {issue.title}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 text-emerald-600 mr-1" />
                      {issue.locationApprox.neighborhood}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {matchReasons.join(' • ')}
                    </span>
                  </p>
                </div>

                <div className="flex-shrink-0 flex items-center space-x-3 text-xs font-semibold text-slate-600">
                  <span className="flex items-center text-emerald-700 bg-emerald-100/60 px-2 py-1 rounded">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    {issue.formalSupportCount}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="text-xs font-bold text-opp-blue-primary hover:text-opp-blue-light"
            >
              Ver todos os resultados para "{query}" →
            </button>
          </div>
        </div>
      )}

      {/* Tags de sugestão rápida */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-200">
        <span className="font-semibold text-slate-300 flex items-center">
          <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
          Exemplos frequentes:
        </span>
        {quickTags.map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => handleTagClick(tag.query)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-slate-100 transition-colors backdrop-blur-sm"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
};
