import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/error';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    shopName: '', shopSlug: '', username: '', password: '',
    fullName: '', whatsappNumber: '', phone: '', email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setShopName = (name) => setForm({ ...form, shopName: name, shopSlug: slugify(name) });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/admin');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="card w-full max-w-lg p-8">
        <h1 className="text-3xl font-serif font-bold text-center text-gold-500">JewelFlow</h1>
        <p className="text-center text-gray-500 mt-1 mb-8">Register your jewellery store</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <input required className="input-field" placeholder="Store name"
              value={form.shopName} onChange={(e) => setShopName(e.target.value)} />
            {form.shopSlug && (
              <p className="text-xs text-gray-400 mt-1">Your store URL: /store/{form.shopSlug}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required className="input-field" placeholder="Username" autoComplete="username"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <input required className="input-field" placeholder="Password" type="password" autoComplete="new-password" minLength={6}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <input className="input-field" placeholder="Your full name"
            value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" placeholder="WhatsApp number" type="tel"
              value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} />
            <input className="input-field" placeholder="Phone" type="tel"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <input className="input-field" placeholder="Email" type="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating store...' : 'Create Store'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered? <Link to="/admin/login" className="text-gold-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
