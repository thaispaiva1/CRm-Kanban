import React, { useState } from 'react';
import { Plus, Inbox } from 'lucide-react';
import { CRMTask, TaskStatus, KANBAN_STATUSES } from '../types/crm';
import { KanbanCard } from './KanbanCard';
import { formatCurrencyBRL } from '../utils/formatters';

interface KanbanBoardProps {
  tasks: CRMTask[];
  onOpenDetails: (task: CRMTask) => void;
  onMoveStatus: (id: string, newStatus: TaskStatus) => void;
  onOpenNewTaskWithStatus: (status: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onOpenDetails,
  onMoveStatus,
  onOpenNewTaskWithStatus,
}) => {
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveStatus(taskId, status);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {KANBAN_STATUSES.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.key);
        const columnTotalValue = columnTasks.reduce((acc, curr) => acc + (curr.deal_value || 0), 0);
        const isDragTarget = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
            className={`rounded-xl border transition-colors flex flex-col min-h-[580px] bg-slate-100/60 p-3.5 ${
              isDragTarget
                ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200'
                : 'border-slate-200/80'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  col.key === 'Não iniciado'
                    ? 'bg-slate-400'
                    : col.key === 'Em Andamento'
                    ? 'bg-blue-500'
                    : 'bg-emerald-500'
                }`} />
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  {col.label}
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenNewTaskWithStatus(col.key)}
                  title={`Adicionar tarefa em "${col.label}"`}
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Column Value Summary */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 mb-2 font-mono">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-700 tabular-nums">
                {formatCurrencyBRL(columnTotalValue)}
              </span>
            </div>

            {/* Cards List or Empty Column */}
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onOpenDetails={onOpenDetails}
                    onMoveStatus={onMoveStatus}
                  />
                ))
              ) : (
                <div className="h-44 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-4 text-center text-slate-400">
                  <Inbox className="w-6 h-6 stroke-1 mb-1.5 text-slate-300" />
                  <p className="text-xs text-slate-500 font-medium">
                    Nenhuma tarefa aqui
                  </p>
                  <button
                    onClick={() => onOpenNewTaskWithStatus(col.key)}
                    className="mt-2 text-[11px] text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
                  >
                    + Criar nesta etapa
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
