import { useState, useEffect } from 'react';
import { Phone, Calendar, Clock } from 'lucide-react';
import api from '../../api/client';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-600',
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/appointments${params}`);
      setAppointments(res.data.appointments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.patch(`/appointments/${id}/status`, { status });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold">Appointments</h1>
        <select className="input-field !w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : appointments.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No appointments yet.</div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{a.customer_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[a.status] || statusColors.pending}`}>
                    {a.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                  <a href={`tel:${a.customer_phone}`} className="flex items-center gap-1">
                    <Phone size={13} /> {a.customer_phone}
                  </a>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {new Date(a.appointment_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {a.appointment_time?.slice(0, 5)}
                  </span>
                </div>
                {a.notes && <p className="text-sm text-gray-600 mt-1">{a.notes}</p>}
              </div>
              <select className="input-field !w-36 shrink-0" value={a.status}
                onChange={(ev) => updateStatus(a.id, ev.target.value)}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;
