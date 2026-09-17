import React from 'react';
import { Search, ShieldAlert, Send, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Como Funciona a Ouvidoria Pública Popular
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Entenda o ciclo completo de um problema público, desde a busca comunitária até a fiscalização da resposta do órgão responsável.
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-opp-blue-primary flex items-center justify-center font-extrabold text-xl flex-shrink-0">
            1
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-opp-blue-primary" />
              Busca Antes de Criar (Princípio P01)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              O cidadão inicia pela barra de busca. Ao encontrar um problema já registrado sobre o mesmo assunto ou endereço, ele pode acompanhar a demanda, comentar e aderir formalmente à manifestação. Isso evita dispersão e aumenta a pressão cívica com número expressivo de requerentes.
            </p>
          </div>
        </div>

        <div className="flex gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold text-xl flex-shrink-0">
            2
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-amber-600" />
              Moderação e Sanitização LGPD (Seção 15 & 16)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Caso nenhum problema existente corresponda, o cidadão registra um novo relato. O sistema remove ou mascara automaticamente CPFs, telefones e identificadores privados. Uma IA assistiva sugere órgão e categoria, e a equipe de moderação cívica valida o registro antes da publicação pública.
            </p>
          </div>
        </div>

        <div className="flex gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xl flex-shrink-0">
            3
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <Send className="w-5 h-5 mr-2 text-emerald-600" />
              Adesão Formal e Transmissão em Lote (Seção 18 & 19)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cada cidadão que adere formalmente assina eletronicamente uma autorização e recebe uma cópia por e-mail. Para evitar sobrecarga nos órgãos e garantir seriedade, o sistema consolida as manifestações em lotes organizados, enviados com documentos comprobatórios e hash de integridade SHA-256.
            </p>
          </div>
        </div>

        <div className="flex gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-xl flex-shrink-0">
            4
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-purple-600" />
              Resposta Oficial e Avaliação Cidadã (Seção 24.1)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Quando a prefeitura ou secretaria responde, a versão pública higienizada fica visível na linha do tempo do problema. Os próprios cidadãos afetados avaliam se a resposta realmente solucionou a situação ou se a demanda continua pendente.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 text-center">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-8 py-3.5 bg-opp-green-action hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all"
        >
          <span>Buscar problemas na minha cidade</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
