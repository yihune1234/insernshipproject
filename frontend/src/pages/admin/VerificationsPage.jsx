import { useEffect, useState } from 'react';
import { getAdminVerifications } from '../../api/admin';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { formatDateTime } from '../../utils/formatDate';
import { CheckCircle, XCircle } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    getAdminVerifications({ search: debouncedSearch, page, page_size: 20 })
      .then((r) => {
        setVerifications(r.data?.results || r.data || []);
        setTotalPages(Math.ceil((r.data?.count || 1) / 20));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  const columns = [
    { key: 'verifier_name', label: 'Verifier' },
    { key: 'credential_type', label: 'Credential Type', render: (v) => v || '—' },
    {
      key: 'is_valid',
      label: 'Result',
      render: (v) => v
        ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="h-3 w-3" />Valid</span>
        : <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><XCircle className="h-3 w-3" />Invalid</span>,
    },
    { key: 'verified_at', label: 'Date', render: (v) => formatDateTime(v || '') },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Verifications</h1>
      <SearchInput value={search} onChange={setSearch} placeholder="Search verifications..." />
      <Table columns={columns} data={verifications} loading={loading} emptyMessage="No verifications found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
