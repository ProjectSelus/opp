import React from 'react';
import { Shield, ExternalLink, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Coluna 1: Missão & Tecnologia Social */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-base">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>Ouvidoria Pública Popular (OPP)</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              Tecnologia Social digital destinada a ajudar cidadãos a identificar problemas públicos existentes,
              reunir evidências, aderir formalmente a demandas e tornar respostas institucionais de interesse coletivo mais transparentes.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <HeartHandshake className="w-4 h-4" />
              <span>Iniciativa de participação cidadã sem fins lucrativos</span>
            </div>
          </div>

          {/* Coluna 2: Transparência & Normas */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Transparência Cívica</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/como-funciona" className="hover:text-white transition-colors">Como a OPP Funciona</a></li>
              <li><a href="/transparencia" className="hover:text-white transition-colors">Métricas e Indicadores</a></li>
              <li><a href="/orgaos" className="hover:text-white transition-colors">Canais Oficiais e Órgãos</a></li>
              <li><span className="text-slate-500">Lei 13.460/2017 (Direitos do Usuário)</span></li>
            </ul>
          </div>

          {/* Coluna 3: Privacidade & LGPD */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Privacidade e Dados</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/privacidade" className="hover:text-white transition-colors">Privacidade por Padrão</a></li>
              <li><a href="/termos" className="hover:text-white transition-colors">Termos de Transmissão</a></li>
              <li><span className="text-slate-500">LGPD: Dados Pessoais Isolados</span></li>
              <li>
                <a
                  href="https://falabr.cgu.gov.br"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 hover:text-white transition-colors text-emerald-400"
                >
                  <span>Portal Fala.BR</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Ouvidoria Pública Popular. Desenvolvido como Tecnologia Social aberta e replicável.</p>
          <p className="text-slate-500">
            A OPP atua como transmissora técnica autorizada pelo cidadão e não substitui os canais oficiais do Estado.
          </p>
        </div>
      </div>
    </footer>
  );
};
