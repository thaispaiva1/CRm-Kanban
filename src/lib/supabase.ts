import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CRMTask, SupabaseConfig, TaskStatus } from '../types/crm';

const STORAGE_KEY_URL = 'crm_supabase_url';
const STORAGE_KEY_KEY = 'crm_supabase_anon_key';
const STORAGE_KEY_LOCAL_TASKS = 'crm_tasks_fallback_v1';

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getStoredSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const storedUrl = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '').trim();
  const storedKey = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '').trim();

  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    anonKey.length > 20
  );

  return { url, anonKey, isConfigured };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (typeof window !== 'undefined') {
    if (cleanUrl) {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }

    if (cleanKey) {
      localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_KEY);
    }
  }

  // Clear cached client so next call creates new instance
  cachedClient = null;
  lastUsedUrl = '';
  lastUsedKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getStoredSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<{
  success: boolean;
  message: string;
  tableExists: boolean;
}> {
  try {
    const url = (overrideUrl !== undefined ? overrideUrl : getStoredSupabaseConfig().url).trim();
    const key = (overrideKey !== undefined ? overrideKey : getStoredSupabaseConfig().anonKey).trim();

    if (!url || !key) {
      return {
        success: false,
        message: 'URL do projeto ou Chave Anônima não foram fornecidas.',
        tableExists: false,
      };
    }

    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      return {
        success: false,
        message: 'A URL deve ser no formato https://xyzcompany.supabase.co',
        tableExists: false,
      };
    }

    const client = createClient(url, key);

    // Test querying the tasks table
    const { data, error } = await client
      .from('tasks')
      .select('id')
      .limit(1);

    if (error) {
      // 42P01 in postgres means relation "tasks" does not exist
      if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
        return {
          success: true,
          message: 'Conectado ao Supabase! Porém a tabela "tasks" ainda não foi criada. Execute o SQL fornecido na aba de configuração.',
          tableExists: false,
        };
      }

      return {
        success: false,
        message: `Erro do Supabase: ${error.message}`,
        tableExists: false,
      };
    }

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso! A tabela "tasks" está pronta.',
      tableExists: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao testar conexão: ${err?.message || 'Falha de rede'}`,
      tableExists: false,
    };
  }
}

/* ==========================================================================
   Task Operations (Supabase with LocalStorage fallback)
   ========================================================================== */

export function getLocalTasks(): CRMTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_TASKS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveLocalTasks(tasks: CRMTask[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Falha ao salvar tarefas localmente:', e);
  }
}

export async function fetchTasks(): Promise<{ tasks: CRMTask[]; source: 'supabase' | 'local'; error?: string }> {
  const client = getSupabaseClient();

  if (!client) {
    return { tasks: getLocalTasks(), source: 'local' };
  }

  try {
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar do Supabase, usando armazenamento local:', error.message);
      return { tasks: getLocalTasks(), source: 'local', error: error.message };
    }

    const mappedTasks: CRMTask[] = (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title || '',
      description: row.description || '',
      status: row.status as TaskStatus,
      client_name: row.client_name || '',
      client_email: row.client_email || '',
      client_phone: row.client_phone || '',
      deal_value: Number(row.deal_value || 0),
      priority: row.priority || 'Média',
      due_date: row.due_date || '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    }));

    // Cache locally as backup
    saveLocalTasks(mappedTasks);
    return { tasks: mappedTasks, source: 'supabase' };
  } catch (err: any) {
    console.warn('Falha de rede com Supabase:', err);
    return { tasks: getLocalTasks(), source: 'local', error: err?.message };
  }
}

export async function createTask(task: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>): Promise<CRMTask> {
  const now = new Date().toISOString();
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newTask: CRMTask = {
    ...task,
    id,
    created_at: now,
    updated_at: now,
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const payload = {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        client_name: newTask.client_name,
        client_email: newTask.client_email,
        client_phone: newTask.client_phone,
        deal_value: newTask.deal_value,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        tags: newTask.tags,
        created_at: newTask.created_at,
        updated_at: newTask.updated_at,
      };

      const { data, error } = await client
        .from('tasks')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir tarefa no Supabase:', error.message);
        throw new Error(error.message);
      }

      // Also update local cache
      const current = getLocalTasks();
      saveLocalTasks([newTask, ...current]);
      return newTask;
    } catch (err: any) {
      console.error('Falha de inserção no Supabase:', err);
      // Fallback save locally if Supabase table is missing or fails
      const current = getLocalTasks();
      saveLocalTasks([newTask, ...current]);
      throw err;
    }
  } else {
    // Save to local storage
    const current = getLocalTasks();
    saveLocalTasks([newTask, ...current]);
    return newTask;
  }
}

export async function updateTask(id: string, updates: Partial<CRMTask>): Promise<CRMTask> {
  const now = new Date().toISOString();
  const client = getSupabaseClient();

  if (client) {
    const payload: any = {
      ...updates,
      updated_at: now,
    };
    if (payload.due_date === '') {
      payload.due_date = null;
    }

    const { data, error } = await client
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar no Supabase:', error.message);
      throw new Error(error.message);
    }
  }

  // Update local cache
  const current = getLocalTasks();
  let updatedTask: CRMTask | null = null;
  const nextTasks = current.map((t) => {
    if (t.id === id) {
      updatedTask = { ...t, ...updates, updated_at: now };
      return updatedTask;
    }
    return t;
  });
  saveLocalTasks(nextTasks);

  if (!updatedTask) {
    throw new Error('Tarefa não encontrada.');
  }

  return updatedTask;
}

export async function deleteTask(id: string): Promise<void> {
  const client = getSupabaseClient();

  if (client) {
    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar do Supabase:', error.message);
      throw new Error(error.message);
    }
  }

  const current = getLocalTasks();
  saveLocalTasks(current.filter((t) => t.id !== id));
}

export async function syncLocalTasksToSupabase(): Promise<{ synced: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { synced: 0, error: 'Supabase não está configurado.' };
  }

  const localTasks = getLocalTasks();
  if (localTasks.length === 0) {
    return { synced: 0 };
  }

  try {
    const payload = localTasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      client_name: t.client_name,
      client_email: t.client_email,
      client_phone: t.client_phone,
      deal_value: t.deal_value,
      priority: t.priority,
      due_date: t.due_date || null,
      tags: t.tags,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    const { error } = await client
      .from('tasks')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { synced: 0, error: error.message };
    }

    return { synced: localTasks.length };
  } catch (err: any) {
    return { synced: 0, error: err?.message };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- Script SQL para criar a tabela de tarefas do CRM no Supabase
-- Abra o dashboard do Supabase > Vá em "SQL Editor" > Cole e execute este script

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  status text not null check (status in ('Não iniciado', 'Em Andamento', 'Finalizado')),
  client_name text default '',
  client_email text default '',
  client_phone text default '',
  deal_value numeric default 0,
  priority text default 'Média' check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')),
  due_date text,
  tags text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar segurança em nível de linha (RLS)
alter table public.tasks enable row level security;

-- Política para permitir que usuários anônimos e autenticados leiam, criem, editem e deletem tarefas
drop policy if exists "Permitir todas operações de CRM" on public.tasks;
create policy "Permitir todas operações de CRM"
  on public.tasks
  for all
  using (true)
  with check (true);

-- Habilitar publicação em tempo real para sincronização instantânea entre abas
alter publication supabase_realtime add table public.tasks;
`;
