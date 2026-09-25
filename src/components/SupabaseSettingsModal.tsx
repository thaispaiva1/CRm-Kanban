import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Database, ExternalLink, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncLocalTasksToSupabase,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    tableExists?: boolean;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setTestResult(null);
      setSyncStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, anonKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha ao testar conexão',
        tableExists: false,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveSupabaseConfig(url, anonKey);
    onConfigSaved();
    onClose();
  };

  const handleClear = () => {
    setUrl('');
    setAnonKey('');
    saveSupabaseConfig('', '');
    setTestResult(null);
    onConfigSaved();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSyncLocal = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      // Save current credentials first
      saveSupabaseConfig(url, anonKey);
      const res = await syncLocalTasksToSupabase();
      if (res.error) {
        setSyncStatus(`Erro ao sincronizar: ${res.error}`);
      } else {
        setSyncStatus(`${res.synced} tarefa(s) sincronizada(s) com sucesso para o Supabase!`);
        onConfigSaved();
      }
    } catch (e: any) {
      setSyncStatus(`Erro: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Conexão com Banco de Dados Supabase
              </h2>
              <p className="text-xs text-slate-500">
                Configure as credenciais do seu projeto Supabase para persistência de dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Instructions Box */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <span>Como conectar ao seu Supabase em 3 passos:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600 leading-relaxed">
              <li>
                Acesse seu painel no <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-700 font-medium hover:underline inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-3 h-3" /></a> e selecione seu projeto.
              </li>
              <li>
                Vá em <strong>SQL Editor</strong>, cole o script SQL fornecido abaixo e clique em <strong>Run</strong> para criar a tabela <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">tasks</code>.
              </li>
              <li>
                Vá em <strong>Project Settings &gt; API</strong>, copie a <strong>Project URL</strong> e a <strong>anon public key</strong> e cole nos campos abaixo.
              </li>
            </ol>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo-seu-projeto.supabase.co"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Utilize a chave pública <em>anon public</em> (nunca a chave secret/service_role no navegador).
              </p>
            </div>
          </div>

          {/* Test connection & sync buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={testing || !url || !anonKey}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testando Conexão...' : 'Testar Conexão com Supabase'}
            </button>

            <button
              onClick={handleSyncLocal}
              disabled={syncing || !url || !anonKey}
              className="px-3.5 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              {syncing ? 'Sincronizando...' : 'Enviar Tarefas Locais para o Supabase'}
            </button>

            {url && (
              <button
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline ml-auto"
              >
                Desconectar / Limpar
              </button>
            )}
          </div>

          {/* Test results banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? testResult.tableExists
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                testResult.tableExists ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">
                  {testResult.success
                    ? testResult.tableExists
                      ? 'Conexão validada com sucesso!'
                      : 'Conectado ao Supabase (Atenção)'
                    : 'Falha na conexão'}
                </span>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {syncStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs">
              {syncStatus}
            </div>
          )}

          {/* SQL Schema helper */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800">
                Script SQL para o Supabase (SQL Editor)
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed max-h-48 border border-slate-800">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            Salvar e Conectar
          </button>
        </div>
      </div>
    </div>
  );
};
