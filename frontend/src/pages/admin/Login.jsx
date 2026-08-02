import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/error';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/admin');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-3xl font-serif font-bold text-center text-gold-500">JewelFlow</h1>
        <p className="text-center text-gray-500 mt-1 mb-8">Sign in to your store dashboard</p>
        <form onSubmit={submit} className="space-y-4">
          <input required className="input-field" placeholder="Username" autoComplete="username"
            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input required className="input-field" placeholder="Password" type="password" autoComplete="current-password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="text-right -mt-2">
            <Link to="/admin/forgot-password" className="text-sm text-gold-600 font-medium hover:underline">Forgot password?</Link>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          New store? <Link to="/admin/register" className="text-gold-600 font-medium hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
