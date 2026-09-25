import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, Phone, Mail, DollarSign } from 'lucide-react';
import { CRMTask, TaskStatus } from '../types/crm';
import { formatCurrencyBRL, formatDateBR } from '../utils/formatters';

interface KanbanCardProps {
  task: CRMTask;
  onOpenDetails: (task: CRMTask) => void;
  onMoveStatus: (id: string, newStatus: TaskStatus) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onOpenDetails,
  onMoveStatus,
}) => {
  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'Em Andamento') return 'Não iniciado';
    if (current === 'Finalizado') return 'Em Andamento';
    return null;
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'Não iniciado') return 'Em Andamento';
    if (current === 'Em Andamento') return 'Finalizado';
    return null;
  };

  const prevStatus = getPrevStatus(task.status);
  const nextStatus = getNextStatus(task.status);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'Urgente':
        return 'text-rose-600 font-semibold';
      case 'Alta':
        return 'text-amber-600 font-medium';
      case 'Média':
        return 'text-blue-600 font-normal';
      case 'Baixa':
      default:
        return 'text-slate-500 font-normal';
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenDetails(task)}
      className="group bg-white rounded-lg border border-slate-200/90 hover:border-slate-300 p-3.5 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col gap-2.5 relative"
    >
      {/* Top Header: Unboxed metadata line + quick navigation */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <span className={priorityColor(task.priority)}>{task.priority}</span>
          {task.due_date && (
            <>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formatDateBR(task.due_date)}
              </span>
            </>
          )}
        </div>

        {/* Quick status shift buttons */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {prevStatus && (
            <button
              onClick={() => onMoveStatus(task.id, prevStatus)}
              title={`Voltar para "${prevStatus}"`}
              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onMoveStatus(task.id, nextStatus)}
              title={`Avançar para "${nextStatus}"`}
              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Description Snippet if present */}
      {task.description && (
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Client / Deal info */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        {task.client_name ? (
          <div className="flex items-center gap-1 text-slate-700 truncate max-w-[55%]">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{task.client_name}</span>
          </div>
        ) : (
          <div />
        )}

        {task.deal_value > 0 ? (
          <span className="font-semibold text-slate-900 font-mono tabular-nums text-xs shrink-0">
            {formatCurrencyBRL(task.deal_value)}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Sem valor</span>
        )}
      </div>

      {/* Tags rendered as clean unboxed text with subtle separator */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate pt-0.5">
          {task.tags.map((tag, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">/</span>}
              <span className="text-slate-600 hover:text-slate-900">{tag}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
