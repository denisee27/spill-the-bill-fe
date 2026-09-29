import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User, ChevronRight } from 'lucide-react';
import api from '../../../shared/services/api';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import Badge from '../../../shared/components/Badge';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import EmptyState from '../../../shared/components/EmptyState';
import { formatDate } from '../../../shared/utils/format';
import { USER_ROLES } from '../../../shared/constants';

async function getUsers(search) {
  const res = await api.get('/users', { params: search ? { search } : {} });
  return res.data;
}

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', debouncedSearch],
    queryFn: () => getUsers(debouncedSearch),
    staleTime: 15_000,
  });

  const users = data?.data?.users ?? data?.users ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dark-900">Users</h1>
        <p className="text-dark-500 text-sm mt-1">{users.length} users</p>
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="search"
          aria-label="Search users"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white w-56"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={User} title="No users found" description="Try adjusting your search." />
      ) : (
        <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-50 border-b border-dark-200">
              <tr>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Name</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Email</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Phone</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Role</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Joined</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-dark-700"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {users.map((u, i) => (
                <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-dark-50/50'}>
                  <td className="px-4 py-3 font-medium text-dark-900">{u.name}</td>
                  <td className="px-4 py-3 text-dark-600">{u.email}</td>
                  <td className="px-4 py-3 text-dark-600">{u.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge color={u.role === USER_ROLES.ADMIN ? 'brand' : 'gray'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-dark-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/users/${u.id}`}
                      className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-900 text-xs font-medium"
                    >
                      Detail <ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
