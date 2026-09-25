import React from 'react';
import { Plus, Database, CheckCircle2 } from 'lucide-react';

interface EmptyStateProps {
  onOpenNewTask: () => void;
  onOpenSettings: () => void;
  isSupabaseConfigured: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenNewTask,
  onOpenSettings,
  isSupabaseConfigured,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs my-8">
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-700">
        <Plus className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
        Seu CRM Kanban está pronto para uso
      </h3>

      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
        Nenhuma tarefa fictícia ou dado modelo foi gerado. Você tem controle total para criar manualmente suas tarefas, clientes e oportunidades.
      </p>

      {/* Supabase status prompt */}
      <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl max-w-md mx-auto flex items-center justify-between text-xs text-left">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-slate-500" />
          <div>
            <span className="font-semibold text-slate-800 block">Banco de Dados Supabase</span>
            <span className="text-slate-500 text-[11px]">
              {isSupabaseConfigured ? 'Pronto para salvar no seu projeto' : 'Aguardando configuração de URL e Chave'}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-white border border-slate-200 hover:border-slate-300 rounded shadow-xs"
        >
          {isSupabaseConfigured ? 'Ver Conexão' : 'Configurar'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onOpenNewTask}
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Primeira Tarefa</span>
        </button>
      </div>
    </div>
  );
};
