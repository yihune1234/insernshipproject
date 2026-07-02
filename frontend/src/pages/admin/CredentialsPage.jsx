import { useEffect, useState } from 'react';
import { getAdminCredentials } from '../../api/admin';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/formatDate';
import useDebounce from '../../hooks/useDebounce';

export default function AdminCredentials() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    getAdminCredentials({ search: debouncedSearch, page, page_size: 20 })
      .then((r) => {
        setCredentials(r.data?.results || r.data || []);
        setTotalPages(Math.ceil((r.data?.count || 1) / 20));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  const columns = [
    { key: 'credential_type_name', label: 'Type', render: (v) => <span className="font-medium">{v || '—'}</span> },
    { key: 'holder_name', label: 'Holder', render: (v, row) => v || row.holder_email || '—' },
    { key: 'organization_name', label: 'Organization' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'sync_status', label: 'Sync Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'synced_at', label: 'Synchronized', render: (v) => v ? formatDate(v) : '—' },
    { key: 'expiry_date', label: 'Expires', render: (v) => v ? formatDate(v) : '—' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Synchronized Credentials</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor credentials synchronized from external systems.</p>
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search credentials..." />
      <Table columns={columns} data={credentials} loading={loading} emptyMessage="No credentials found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
