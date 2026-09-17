import React from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle2, Building2, ShieldAlert } from 'lucide-react';

export const TransparencyPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Painel de Transparência Pública Cívica (Módulo 14)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Acompanhamento aberto de tempo de resposta, volume de adesões e efetividade da resolução de problemas públicos.
        </p>
      </div>

      {/* Cartões Principais de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Total de Manifestações</span>
            <BarChart3 className="w-4 h-4 text-opp-blue-light" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block">1.240</span>
          <span className="text-xs text-emerald-600 font-semibold">+18% em relação ao mês anterior</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Respostas Recebidas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block">83.2%</span>
          <span className="text-xs text-slate-500">1.032 manifestações com resposta oficial</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Tempo Médio de Resposta</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block">12 dias</span>
          <span className="text-xs text-slate-500">Dentro do prazo da Lei 13.460/2017</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Adesões Coletivas</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block">3.567</span>
          <span className="text-xs text-slate-500">Cidadãos participando ativamente</span>
        </div>
      </div>

      {/* Detalhamento por Órgão e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-opp-blue-primary" />
            Demandas por Secretaria Municipal
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Secretaria de Obras e Serviços Urbanos (SEMOB)</span>
                <span>48% (595 problemas)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-opp-blue-primary h-2 rounded-full" style={{ width: '48%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Secretaria Municipal de Saúde (SMS)</span>
                <span>28% (347 problemas)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>DEMUTRAN / Trânsito</span>
                <span>14% (174 problemas)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '14%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Meio Ambiente e Outros</span>
                <span>10% (124 problemas)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2 text-emerald-600" />
            Avaliação Cidadã de Efetividade (Seção 24.1)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            A OPP registra separadamente se o órgão respondeu e se o problema foi efetivamente sanado segundo os próprios moradores afetados.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-xl font-bold text-emerald-800 block">64%</span>
              <span className="text-emerald-700 font-semibold">Totalmente Resolvido</span>
            </div>
            <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-center">
              <span className="text-xl font-bold text-cyan-800 block">21%</span>
              <span className="text-cyan-700 font-semibold">Parcialmente Resolvido</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
              <span className="text-xl font-bold text-rose-800 block">11%</span>
              <span className="text-rose-700 font-semibold">Não Resolvido</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xl font-bold text-slate-800 block">4%</span>
              <span className="text-slate-600 font-semibold">Em Avaliação</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
