import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, MessageSquare, Calendar, Tags } from 'lucide-react';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/error';

const StatCard = ({ icon: Icon, label, value, to, color }) => (
  <Link to={to} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </Link>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/shop/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Failed to load stats')));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-6">Dashboard</h1>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Products" value={stats?.totalProducts} to="/admin/products" color="bg-gold-500" />
        <StatCard icon={MessageSquare} label="New Enquiries" value={stats?.newEnquiries} to="/admin/enquiries" color="bg-blue-500" />
        <StatCard icon={Calendar} label="Pending Appointments" value={stats?.pendingAppointments} to="/admin/appointments" color="bg-purple-500" />
        <StatCard icon={Tags} label="Categories" value={stats?.totalCategories} to="/admin/categories" color="bg-emerald-500" />
      </div>
    </div>
  );
};

export default Dashboard;
