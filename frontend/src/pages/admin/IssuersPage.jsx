import { useEffect, useState } from 'react';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/formatDate';
import useDebounce from '../../hooks/useDebounce';
import api from '../../api/axios';

export default function AdminHolders() {
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    api.get('/admin-portal/holders/', { 
      params: { search: debouncedSearch, page, page_size: 20 } 
    })
      .then((r) => {
        setHolders(r.data?.top_holders || r.data || []);
        setTotalPages(Math.ceil((r.data?.total_holders || 1) / 20));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  const columns = [
    { key: 'email', label: 'Email', render: (v) => <span className="font-medium">{v || '—'}</span> },
    { key: 'total_credentials', label: 'Total Credentials', render: (v) => v ?? '—' },
    { key: 'active_credentials', label: 'Active', render: (v) => v ?? '—' },
    { key: 'revoked_credentials', label: 'Revoked', render: (v) => v ?? '—' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Holder Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor credential holders and their synchronized credentials.</p>
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search holders by email..." />
      <Table columns={columns} data={holders} loading={loading} emptyMessage="No holders found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
