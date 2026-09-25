import React from 'react';
import { Search, X, SlidersHorizontal, Download, Filter } from 'lucide-react';
import { TaskPriority, TaskStatus, CRMTask } from '../types/crm';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPriority: string;
  onPriorityChange: (p: string) => void;
  sortBy: string;
  onSortByChange: (s: string) => void;
  totalResults: number;
  onClearFilters: () => void;
  onExportCSV: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
  sortBy,
  onSortByChange,
  totalResults,
  onClearFilters,
  onExportCSV,
}) => {
  const hasActiveFilters = Boolean(searchQuery || selectedPriority);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs mb-6">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por tarefa, cliente, descrição ou tag..."
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-700 font-medium"
          >
            <option value="">Todas Prioridades</option>
            <option value="Urgente">Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-700 font-medium"
        >
          <option value="newest">Mais recentes</option>
          <option value="highest_value">Maior valor</option>
          <option value="due_date">Prazo mais próximo</option>
          <option value="title_asc">Ordem alfabética (A-Z)</option>
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-rose-600 hover:text-rose-700 px-2 py-1 hover:bg-rose-50 rounded transition-colors font-medium"
          >
            Limpar filtros
          </button>
        )}

        {/* Export CSV button */}
        <button
          onClick={onExportCSV}
          title="Exportar dados para CSV"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
