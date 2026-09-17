import React from 'react';
import { Shield, HeartHandshake, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Tecnologia Social Aberta</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Sobre a Ouvidoria Pública Popular (OPP)
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Uma plataforma cívica em que problemas públicos são descobertos, discutidos, documentados e transformados em manifestações formais com acompanhamento e transparência coletiva.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-emerald-700 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            O que a OPP é
          </h2>
          <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
            <li>Um agregador cívico de problemas e demandas públicas reais.</li>
            <li>Um facilitador de acesso a órgãos responsáveis e canais oficiais.</li>
            <li>Um transmissor técnico de manifestações autorizadas pelo cidadão.</li>
            <li>Um histórico público moderado e transparente de encaminhamentos e respostas.</li>
            <li>Um instrumento de mobilização e controle social comunitário.</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-rose-700 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            O que a OPP não é
          </h2>
          <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
            <li>Não é uma rede social de "curtidas" ou reclamações vazias.</li>
            <li>Não é órgão público oficial nem substituto obrigatório do Estado.</li>
            <li>Não representa juridicamente os cidadãos sem mandato específico.</li>
            <li>Não decide culpa nem verdade jurídica administrativa.</li>
            <li>Não expõe dados sensíveis nem viola a LGPD.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
