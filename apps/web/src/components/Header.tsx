import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, User } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Início', path: '/' },
    { label: 'Problemas', path: '/problemas' },
    { label: 'Como funciona', path: '/como-funciona' },
    { label: 'Órgãos', path: '/orgaos' },
    { label: 'Moderação', path: '/moderacao' },
    { label: 'Transparência', path: '/transparencia' },
    { label: 'Sobre', path: '/sobre' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-opp-blue-deep text-white shadow-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca Cívica */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-opp-green-action flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-inner group-hover:scale-105 transition-transform">
              OPP
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block leading-none">
                Ouvidoria Pública Popular
              </span>
              <span className="text-xs text-emerald-400 font-medium tracking-wide">
                Tecnologia Social Cívica
              </span>
            </div>
          </Link>

          {/* Navegação Principal */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Navegação Principal">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-opp-blue-primary text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Ações / Login */}
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-sm font-medium text-slate-200 hover:text-white border border-slate-600 hover:border-slate-500 bg-slate-800/40 transition-all"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span>Entrar</span>
            </Link>
            <Link
              to="/registrar-problema"
              className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-md text-sm font-semibold bg-opp-green-action hover:bg-emerald-600 text-white shadow-sm transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Registrar</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
