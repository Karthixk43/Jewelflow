import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import api from '../../api/client';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  contacted: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600',
};

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    try {
      const res = await api.get(`/enquiries${filter ? `?status=${filter}` : ''}`);
      setEnquiries(res.data.enquiries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.patch(`/enquiries/${id}/status`, { status });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold">Enquiries</h1>
        <select className="input-field w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : enquiries.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No enquiries yet</div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((e) => (
            <div key={e.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{e.customer_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[e.status] || statusColors.pending}`}>
                    {e.status}
                  </span>
                </div>
                <a href={`tel:${e.customer_phone}`} className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone size={13} /> {e.customer_phone}
                </a>
                {e.product_name && <p className="text-sm text-gold-600 mt-1">Re: {e.product_name}</p>}
                {e.message && <p className="text-sm text-gray-600 mt-1">{e.message}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(e.created_at).toLocaleString()}</p>
              </div>
              <select className="input-field w-full sm:w-36 text-sm" value={e.status}
                onChange={(ev) => updateStatus(e.id, ev.target.value)}>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Enquiries;
