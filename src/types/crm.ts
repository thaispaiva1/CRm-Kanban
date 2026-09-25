export type TaskStatus = 'Não iniciado' | 'Em Andamento' | 'Finalizado';

export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface CRMTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  client_name: string;
  client_email: string;
  client_phone: string;
  deal_value: number;
  priority: TaskPriority;
  due_date: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export const KANBAN_STATUSES: { key: TaskStatus; label: string; description: string; color: string }[] = [
  {
    key: 'Não iniciado',
    label: 'Não iniciado',
    description: 'Demandas recebidas aguardando início de tratativa ou contato',
    color: 'slate',
  },
  {
    key: 'Em Andamento',
    label: 'Em Andamento',
    description: 'Oportunidades ou tarefas em negociação ou desenvolvimento ativo',
    color: 'blue',
  },
  {
    key: 'Finalizado',
    label: 'Finalizado',
    description: 'Contratos fechados, vendas concluídas ou tarefas finalizadas',
    color: 'emerald',
  },
];
