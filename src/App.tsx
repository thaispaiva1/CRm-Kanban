import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { FilterBar } from './components/FilterBar';
import { EmptyState } from './components/EmptyState';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';
import { CRMTask, TaskStatus } from './types/crm';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  getStoredSupabaseConfig,
  getSupabaseClient,
} from './lib/supabase';
import { CheckCircle2, AlertCircle, Info, Database } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');

  // Modals & UI state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CRMTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<CRMTask | null>(null);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState<TaskStatus>('Não iniciado');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setSyncing(true);

    const cfg = getStoredSupabaseConfig();
    setIsSupabaseConfigured(cfg.isConfigured);

    try {
      const res = await fetchTasks();
      setTasks(res.tasks);
      setDataSource(res.source);
    } catch (e: any) {
      console.error('Erro ao carregar dados:', e);
      showToast('Erro ao sincronizar dados com o banco de dados.', 'error');
    } finally {
      if (isInitial) setLoading(false);
      setSyncing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Realtime Supabase subscription
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const channel = client
        .channel('tasks_realtime_crm')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          () => {
            loadData(false);
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime subscription não pôde ser iniciada:', e);
    }
  }, [isSupabaseConfigured, loadData]);

  // Handle task creation or update
  const handleSaveTask = async (
    taskData: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      if (editingTask) {
        // Updating existing
        const updated = await updateTask(editingTask.id, taskData);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        if (selectedTask?.id === updated.id) {
          setSelectedTask(updated);
        }
        showToast('Tarefa atualizada com sucesso!');
      } else {
        // Creating new
        const created = await createTask(taskData);
        setTasks((prev) => [created, ...prev]);
        showToast('Tarefa criada com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Falha ao salvar tarefa', 'error');
      throw err;
    }
  };

  // Quick move status (from drag-drop or arrows)
  const handleMoveStatus = async (taskId: string, newStatus: TaskStatus) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === newStatus) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await updateTask(taskId, { status: newStatus });
      showToast(`Status alterado para "${newStatus}"`);
    } catch (err: any) {
      console.error(err);
      showToast('Falha ao atualizar status no banco de dados', 'error');
      // Revert on error
      loadData(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    // Optimistic UI update
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }

    try {
      await deleteTask(taskId);
      showToast('Tarefa excluída permanentemente.');
    } catch (err: any) {
      console.error(err);
      showToast('Falha ao excluir tarefa', 'error');
      loadData(false);
    }
  };

  // Open modals
  const handleOpenNewTask = (status: TaskStatus = 'Não iniciado') => {
    setEditingTask(null);
    setNewTaskDefaultStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: CRMTask) => {
    setSelectedTask(null);
    setEditingTask(task);
    setNewTaskDefaultStatus(task.status);
    setIsTaskModalOpen(true);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      showToast('Nenhuma tarefa para exportar.', 'info');
      return;
    }

    const headers = ['ID', 'Título', 'Status', 'Cliente', 'Email', 'Telefone', 'Valor (R$)', 'Prioridade', 'Prazo', 'Tags', 'Criado Em'];
    const rows = tasks.map((t) => [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${(t.client_name || '').replace(/"/g, '""')}"`,
      `"${t.client_email || ''}"`,
      `"${t.client_phone || ''}"`,
      t.deal_value || 0,
      `"${t.priority}"`,
      `"${t.due_date || ''}"`,
      `"${(t.tags || []).join('; ')}"`,
      `"${t.created_at}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crm_kanban_tarefas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exportação concluída!');
  };

  // Filter & sort logic
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = !selectedPriority || t.priority === selectedPriority;

    return matchesSearch && matchesPriority;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'highest_value') {
      return (b.deal_value || 0) - (a.deal_value || 0);
    }
    if (sortBy === 'due_date') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }
    if (sortBy === 'title_asc') {
      return a.title.localeCompare(b.title);
    }
    // 'newest' default
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalValue = tasks.reduce((acc, t) => acc + (t.deal_value || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-slate-200">
      {/* Top Navbar */}
      <Navbar
        totalTasks={tasks.length}
        totalValue={totalValue}
        isSupabaseConfigured={isSupabaseConfigured}
        isSyncing={syncing}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenNewTask={() => handleOpenNewTask('Não iniciado')}
        onRefresh={() => loadData(false)}
      />

      {/* Supabase connection banner if not yet connected */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Banco de Dados Supabase:</strong> As tarefas criadas estão sendo salvas localmente no seu navegador. Para sincronizar com a sua nuvem Supabase, conecte seu projeto.
              </span>
            </div>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors shrink-0"
            >
              Conectar Supabase
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">
              Carregando quadro Kanban...
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            onOpenNewTask={() => handleOpenNewTask('Não iniciado')}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            isSupabaseConfigured={isSupabaseConfigured}
          />
        ) : (
          <>
            {/* Filter and search bar */}
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              totalResults={sortedTasks.length}
              onClearFilters={() => {
                setSearchQuery('');
                setSelectedPriority('');
              }}
              onExportCSV={handleExportCSV}
            />

            {/* If filters applied returned 0 tasks */}
            {sortedTasks.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
                <p className="text-sm text-slate-600 font-medium">
                  Nenhuma tarefa encontrada com os filtros selecionados.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPriority('');
                  }}
                  className="mt-3 text-xs font-semibold text-slate-900 underline"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <KanbanBoard
                tasks={sortedTasks}
                onOpenDetails={(t) => setSelectedTask(t)}
                onMoveStatus={handleMoveStatus}
                onOpenNewTaskWithStatus={(s) => handleOpenNewTask(s)}
              />
            )}
          </>
        )}
      </main>

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultStatus={newTaskDefaultStatus}
      />

      {/* Task Details Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onStatusChange={handleMoveStatus}
      />

      {/* Supabase Settings & Migration Modal */}
      <SupabaseSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onConfigSaved={() => loadData(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 border ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-950'
                : toast.type === 'info'
                ? 'bg-slate-900 text-white border-slate-950'
                : 'bg-emerald-900 text-white border-emerald-950'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-slate-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
