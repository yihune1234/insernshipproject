import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, Database, Plus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { triggerLiveSync, getSyncLogs } from '../../api/issuer';
import { formatDate } from '../../utils/formatDate';

function StatusPill({ status }) {
  if (status === 'completed')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </span>
    );
  if (status === 'failed')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <XCircle className="h-3 w-3" /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
      <Clock className="h-3 w-3" /> {status}
    </span>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/40 border border-border">
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = useCallback(() => {
    setLogsLoading(true);
    getSyncLogs()
      .then((r) => {
        // Safely extract logs from response, ensuring it's always an array
        const results = r.data?.results || r.data;
        const logsArray = Array.isArray(results) ? results : [];
        setLogs(logsArray);
      })
      .catch((err) => {
        console.error('Failed to load sync logs:', err);
        setLogs([]);
      })
      .finally(() => setLogsLoading(false));
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setLastResult(null);
    try {
      const r = await triggerLiveSync();
      const result = r.data;
      setLastResult(result);
      toast.success(
        `Sync complete — ${result.created} new, ${result.updated} updated, ${result.failed} failed`,
        { duration: 6000 }
      );
      loadLogs();
    } catch (err) {
      const msg =
        err?.response?.data?.errors ||
        err?.response?.data?.message ||
        'Sync failed. Is the mock org API running on port 3001?';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credential Sync</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pull the latest records from your organization's member API and sync them into the platform.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary text-sm px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {error && (
        <div className="card border border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Sync error</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {lastResult && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h2 className="font-semibold text-foreground">Last Sync Result</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Processed"  value={lastResult.processed}  color="text-foreground" />
            <StatBox label="Created"    value={lastResult.created}    color="text-green-600 dark:text-green-400" />
            <StatBox label="Updated"    value={lastResult.updated}    color="text-blue-600 dark:text-blue-400" />
            <StatBox label="Failed"     value={lastResult.failed}     color="text-red-600 dark:text-red-400" />
          </div>
          {lastResult.errors?.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700">
              <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Errors:</p>
              {lastResult.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Sync History</h2>
          </div>
          <button onClick={loadLogs} className="text-xs text-primary hover:underline">Refresh</button>
        </div>

        {logsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10">
            <Database className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No sync runs yet. Click <strong>Sync Now</strong> to start.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 pr-4 font-medium">Started</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium text-right">Processed</th>
                  <th className="pb-2 pr-4 font-medium text-right">
                    <Plus className="inline h-3 w-3 text-green-500" /> Created
                  </th>
                  <th className="pb-2 pr-4 font-medium text-right">Updated</th>
                  <th className="pb-2 font-medium text-right">Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(log.started_at)}
                    </td>
                    <td className="py-2.5 pr-4"><StatusPill status={log.status} /></td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{log.credentials_processed}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-green-600 dark:text-green-400 font-medium">
                      {log.credentials_created}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-blue-600 dark:text-blue-400">
                      {log.credentials_updated}
                    </td>
                    <td className={`py-2.5 text-right tabular-nums ${log.credentials_failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      {log.credentials_failed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
