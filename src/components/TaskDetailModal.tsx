import React, { useState } from 'react';
import {
  X,
  Edit2,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Tag,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { CRMTask, TaskStatus, KANBAN_STATUSES } from '../types/crm';
import { formatCurrencyBRL, formatDateBR } from '../utils/formatters';

interface TaskDetailModalProps {
  task: CRMTask | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: CRMTask) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, newStatus: TaskStatus) => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !task) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Format phone for whatsapp link if numbers only
  const rawPhone = (task.client_phone || '').replace(/\D/g, '');
  const whatsappUrl = rawPhone.length >= 10 ? `https://wa.me/55${rawPhone}` : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status atual:</span>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
            >
              {KANBAN_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Editar Tarefa"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              title="Excluir Tarefa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between gap-3 text-xs">
              <span className="text-rose-900 font-medium">
                Tem certeza que deseja excluir esta tarefa permanentemente?
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-1 text-white bg-rose-600 hover:bg-rose-700 rounded font-medium disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          {/* Main Title & Metadata */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span>Prioridade: <strong className="text-slate-700">{task.priority}</strong></span>
              {task.due_date && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Prazo: <strong>{formatDateBR(task.due_date)}</strong>
                  </span>
                </>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {task.title}
            </h2>
          </div>

          {/* Key Value & Client Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200/80">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Valor da Oportunidade
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrencyBRL(task.deal_value || 0)}
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Cliente / Contato
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <User className="w-4 h-4 text-slate-400" />
                <span>{task.client_name || 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* Contact Actions if email or phone available */}
          {(task.client_email || task.client_phone) && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Canais de Contato
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {task.client_email && (
                  <a
                    href={`mailto:${task.client_email}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{task.client_email}</span>
                  </a>
                )}

                {task.client_phone && (
                  <a
                    href={`tel:${task.client_phone}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{task.client_phone}</span>
                  </a>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 hover:bg-emerald-100 transition-colors font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Description / Notes */}
          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1.5">
              Descrição e Anotações
            </span>
            {task.description ? (
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Nenhuma anotação registrada para esta tarefa.
              </p>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                Etiquetas
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                {task.tags.map((tag, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-300">/</span>}
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {tag}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Cadastrado em {new Date(task.created_at).toLocaleDateString('pt-BR')}
          </span>
          <button
            onClick={() => onEdit(task)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Tarefa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
