import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getAllOrgs, getPendingOrgs, approveOrg, rejectOrg, suspendOrg,
  getPendingRegistrations,
} from '../../api/admin';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { formatDate } from '../../utils/formatDate';
import useDebounce from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'all', label: 'All Organizations' },
  { key: 'registrations', label: 'Pending Registrations' },
];

function RegistrationsTab() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const PAGE_SIZE = 20;

  const load = () => {
    setLoading(true);
    getPendingRegistrations({ search: debouncedSearch, page, page_size: PAGE_SIZE })
      .then((r) => {
        setRegs(r.data?.results || r.data || []);
        setTotal(r.data?.count || 0);
      })
      .catch(() => toast.error('Failed to load pending registrations'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedSearch, page]);

  const columns = [
    {
      key: 'organization_name',
      label: 'Organization',
      render: (v, row) => (
        <Link
          to={`/admin/organizations/registrations/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {v}
        </Link>
      ),
    },
    { key: 'organization_type', label: 'Type', render: (v) => <span className="capitalize text-xs">{v || '—'}</span> },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'submitted_at', label: 'Submitted', render: (v) => formatDate(v) },
    {
      key: 'id', label: 'Action',
      render: (id) => (
        <Link to={`/admin/organizations/registrations/${id}`}>
          <Button size="sm" variant="outline">Review →</Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Search registrations..." className="max-w-sm" />
      <Table columns={columns} data={regs} loading={loading} emptyMessage="No pending registrations." />
      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} />
    </div>
  );
}

export default function AdminOrganizations() {
  const [params] = useSearchParams();
  const initTab = params.get('tab') === 'pending' ? 'registrations' : 'all';
  const [activeTab, setActiveTab] = useState(initTab);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [acting, setActing] = useState({});
  const debouncedSearch = useDebounce(search);

  const load = () => {
    if (activeTab === 'registrations') return;
    setLoading(true);
    const fn = status === 'pending' ? getPendingOrgs : getAllOrgs;
    fn({ search: debouncedSearch, page, page_size: 20 })
      .then((r) => {
        setOrgs(r.data?.results || r.data || []);
        setTotalPages(Math.ceil((r.data?.count || 1) / 20));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [debouncedSearch, page, status, activeTab]);

  const act = async (id, action) => {
    setActing((a) => ({ ...a, [id]: action }));
    try {
      if (action === 'approve') { await approveOrg(id, {}); toast.success('Organization approved'); }
      else if (action === 'reject') { await rejectOrg(id, { reason: 'Rejected by admin' }); toast.success('Organization rejected'); }
      else if (action === 'suspend') { await suspendOrg(id, {}); toast.success('Organization suspended'); }
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    } finally { setActing((a) => ({ ...a, [id]: null })); }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (v, row) => <Link to={`/admin/organizations/${row.id}`} className="font-medium text-primary hover:underline">{v}</Link> },
    { key: 'org_type', label: 'Type', render: (v) => <span className="capitalize text-xs">{v || '—'}</span> },
    { key: 'registration_status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Submitted', render: (v) => formatDate(v) },
    {
      key: 'id',
      label: 'Actions',
      render: (v, row) => (
        <div className="flex gap-1">
          {row.registration_status === 'pending' && (
            <>
              <Button size="sm" loading={acting[v] === 'approve'} onClick={() => act(v, 'approve')}>Approve</Button>
              <Button size="sm" variant="outline" loading={acting[v] === 'reject'} onClick={() => act(v, 'reject')} className="text-red-600 border-red-200">Reject</Button>
            </>
          )}
          {row.registration_status === 'approved' && (
            <Button size="sm" variant="outline" loading={acting[v] === 'suspend'} onClick={() => act(v, 'suspend')}>Suspend</Button>
          )}
          <Link to={`/admin/organizations/${v}`}><Button size="sm" variant="ghost">Details</Button></Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Organizations</h1>

      {/* Tabs */}
      <div className="border-b border-border flex gap-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'registrations' ? (
        <RegistrationsTab />
      ) : (
        <>
          <div className="flex gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search organizations..." className="flex-1" />
            <Select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]}
              className="w-36"
            />
          </div>
          <Table columns={columns} data={orgs} loading={loading} emptyMessage="No organizations found." />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
