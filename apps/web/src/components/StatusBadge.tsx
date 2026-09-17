import React from 'react';
import {
  FileEdit,
  Clock,
  Users,
  Send,
  Hourglass,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Archive,
  GitMerge,
  EyeOff
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
      role="status"
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

function getStatusConfig(status: string) {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Rascunho',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
        icon: FileEdit
      };
    case 'UNDER_MODERATION':
      return {
        label: 'Em Moderação',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
        icon: Clock
      };
    case 'OPEN':
      return {
        label: 'Aberto para Adesão',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        icon: Users
      };
    case 'FORWARDED':
      return {
        label: 'Encaminhado ao Órgão',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-300',
        icon: Send
      };
    case 'AWAITING_RESPONSE':
      return {
        label: 'Aguardando Resposta',
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-300',
        icon: Hourglass
      };
    case 'RESPONDED':
      return {
        label: 'Com Resposta Institucional',
        bg: 'bg-teal-50',
        text: 'text-teal-800',
        border: 'border-teal-300',
        icon: MessageSquare
      };
    case 'PARTIALLY_RESOLVED':
      return {
        label: 'Parcialmente Resolvido',
        bg: 'bg-cyan-50',
        text: 'text-cyan-800',
        border: 'border-cyan-300',
        icon: CheckCircle2
      };
    case 'RESOLVED':
      return {
        label: 'Problema Resolvido',
        bg: 'bg-green-100',
        text: 'text-green-900',
        border: 'border-green-400',
        icon: CheckCircle2
      };
    case 'UNRESOLVED':
      return {
        label: 'Sem Solução / Cobrança',
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-300',
        icon: AlertCircle
      };
    case 'MERGED':
      return {
        label: 'Unificado / Redirecionado',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-300',
        icon: GitMerge
      };
    case 'HIDDEN':
      return {
        label: 'Oculto da Moderação',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
        icon: EyeOff
      };
    case 'CLOSED':
    case 'ARCHIVED':
    default:
      return {
        label: 'Arquivado',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-300',
        icon: Archive
      };
  }
}
