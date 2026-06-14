import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { customerApi, Customer } from '../services/api';
import { EmptyState, LoadingSpinner, PageHeader } from '../components/ui';

function CustomerModal({ customer, onClose }: { customer: Customer & { orders?: unknown[] }; onClose: () => void }) {
  const daysSinceOrder = customer.last_order_at
    ? Math.floor((Date.now() - new Date(customer.last_order_at).getTime()) / 86400000)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-white">{customer.name}</h2>
            <p className="text-slate-400 text-sm mt-1">{customer.email || customer.phone}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Total Spent', value: `₹${Number(customer.total_spent).toLocaleString('en-IN')}` },
            { label: 'Orders', value: customer.order_count },
            { label: 'City', value: customer.city || '—' },
            { label: 'Last Order', value: daysSinceOrder != null ? `${daysSinceOrder} days ago` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="card-sm">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="font-medium text-white">{value}</p>
            </div>
          ))}
        </div>

        {customer.orders && customer.orders.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Order History</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(customer.orders as Array<{ id: string; order_number: string; amount: number; category: string; ordered_at: string; channel: string }>).map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-white/3 rounded-lg">
                  <div>
                    <p className="text-sm text-white">{o.order_number}</p>
                    <p className="text-xs text-slate-400">{o.category} · {o.channel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">₹{Number(o.amount).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-500">{new Date(o.ordered_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<(Customer & { orders?: unknown[] }) | null>(null);
  const limit = 20;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.list({ page, limit, search: search || undefined });
      setCustomers(res.data);
      setTotal(res.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openCustomer = async (c: Customer) => {
    const res = await customerApi.get(c.id);
    setSelected(res.data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customers"
        subtitle={`${total.toLocaleString()} total shoppers`}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Name', 'Contact', 'City', 'Orders', 'Total Spent', 'Last Order'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><LoadingSpinner size={24} className="mx-auto" /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-500 text-sm">No customers found</td></tr>
              ) : (
                customers.map((c, i) => {
                  const days = c.last_order_at
                    ? Math.floor((Date.now() - new Date(c.last_order_at).getTime()) / 86400000)
                    : null;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => openCustomer(c)}
                      className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                            {c.name[0]}
                          </div>
                          <span className="text-sm font-medium text-white">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{c.email || c.phone || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{c.city || '—'}</td>
                      <td className="px-4 py-3 text-sm text-white">{c.order_count}</td>
                      <td className="px-4 py-3 text-sm font-medium text-white">₹{Number(c.total_spent).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {days != null ? `${days}d ago` : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-slate-400">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-ghost p-2 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="btn-ghost p-2 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <CustomerModal customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
