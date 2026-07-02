import { useEffect, useState } from 'react';
import { getAuditLogs } from '../../api/admin';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { formatDateTime } from '../../utils/formatDate';
import useDebounce from '../../hooks/useDebounce';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    getAuditLogs({ search: debouncedSearch, page, page_size: 30 })
      .then((r) => {
        setLogs(r.data?.results || r.data || []);
        setTotalPages(Math.ceil((r.data?.count || 1) / 30));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  const columns = [
    { key: 'user', label: 'User', render: (v) => <span className="text-xs font-medium">{v || 'System'}</span> },
    { key: 'action', label: 'Action', render: (v) => <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{v}</span> },
    { key: 'resource_type', label: 'Resource' },
    { key: 'ip_address', label: 'IP', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'timestamp', label: 'Time', render: (v) => formatDateTime(v || '') },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
      <SearchInput value={search} onChange={setSearch} placeholder="Search logs..." />
      <Table columns={columns} data={logs} loading={loading} emptyMessage="No audit logs found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
