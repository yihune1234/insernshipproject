import { useEffect, useState } from 'react';
import { getAdminUsers, suspendUser, reactivateUser } from '../../api/admin';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/formatDate';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [acting, setActing] = useState(false);
  const debouncedSearch = useDebounce(search);

  const load = () => {
    setLoading(true);
    getAdminUsers({ search: debouncedSearch, page, page_size: 20 })
      .then((r) => {
        setUsers(r.data?.results || r.data || []);
        setTotalPages(Math.ceil((r.data?.count || 1) / 20));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [debouncedSearch, page]);

  const handleAction = async () => {
    setActing(true);
    try {
      if (confirm.action === 'suspend') {
        await suspendUser(confirm.id);
        toast.success('User suspended');
      } else {
        await reactivateUser(confirm.id);
        toast.success('User reactivated');
      }
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    } finally { setActing(false); }
  };

  const columns = [
    { key: 'email', label: 'Email', render: (v) => <span className="font-medium text-foreground">{v}</span> },
    { key: 'first_name', label: 'Name', render: (v, row) => `${v || ''} ${row.last_name || ''}`.trim() || '—' },
    { key: 'role', label: 'Role', render: (v) => <span className="capitalize text-xs font-medium">{v || '—'}</span> },
    { key: 'is_active', label: 'Status', render: (v) => <StatusBadge status={v ? 'active' : 'suspended'} /> },
    { key: 'date_joined', label: 'Joined', render: (v) => formatDate(v) },
    {
      key: 'id',
      label: 'Actions',
      render: (v, row) => (
        <div className="flex gap-2">
          {row.is_active
            ? <Button size="sm" variant="outline" onClick={() => setConfirm({ id: v, action: 'suspend', name: row.email })} className="text-red-600 border-red-200">Suspend</Button>
            : <Button size="sm" variant="outline" onClick={() => setConfirm({ id: v, action: 'reactivate', name: row.email })}>Reactivate</Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Users</h1>
      <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
      <Table columns={columns} data={users} loading={loading} emptyMessage="No users found." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleAction}
        loading={acting}
        title={`${confirm?.action === 'suspend' ? 'Suspend' : 'Reactivate'} User?`}
        description={`Are you sure you want to ${confirm?.action} ${confirm?.name}?`}
        confirmLabel={confirm?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
        confirmVariant={confirm?.action === 'suspend' ? 'danger' : 'primary'}
      />
    </div>
  );
}
