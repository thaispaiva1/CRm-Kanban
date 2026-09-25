import React from 'react';
import { Database, Plus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrencyBRL } from '../utils/formatters';

interface NavbarProps {
  totalTasks: number;
  totalValue: number;
  isSupabaseConfigured: boolean;
  isSyncing: boolean;
  onOpenSettings: () => void;
  onOpenNewTask: () => void;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalTasks,
  totalValue,
  isSupabaseConfigured,
  isSyncing,
  onOpenSettings,
  onOpenNewTask,
  onRefresh,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a href="/" className="text-xl font-bold tracking-tight text-slate-900">
            Nexus CRM
          </a>
          <span className="hidden sm:inline-block text-xs font-medium text-slate-400 border-l border-slate-200 pl-3">
            Quadro Kanban
          </span>
        </div>

        {/* Zone 2: Clean metrics & sync indicator */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Pipeline Total:</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">
              {formatCurrencyBRL(totalValue)}
            </span>
          </div>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Tarefas Cadastradas:</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums">
              {totalTasks}
            </span>
          </div>
        </div>

        {/* Zone 3: Primary actions & Supabase status */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            title="Atualizar dados"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isSupabaseConfigured
                ? 'border-emerald-200 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70'
                : 'border-amber-200 text-amber-800 bg-amber-50/80 hover:bg-amber-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSupabaseConfigured ? 'Supabase Conectado' : 'Configurar Supabase'}
            </span>
            <span className="sm:hidden">Supabase</span>
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 ml-0.5" />
            )}
          </button>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>
    </header>
  );
};
