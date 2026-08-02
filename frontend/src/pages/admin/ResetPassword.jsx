import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/error';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = params.get('token');

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/admin/login', { replace: true, state: { message: 'Password reset successfully. Please sign in.' } });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-3xl font-serif font-bold text-center text-gold-500">JewelFlow</h1>
        <h2 className="text-xl font-semibold text-center mt-6">Choose a new password</h2>
        {!token ? (
          <div className="mt-6 space-y-6"><p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">This reset link is incomplete. Request a new one.</p><Link to="/admin/forgot-password" className="btn-primary block w-full text-center">Request reset link</Link></div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <input required minLength="8" className="input-field" placeholder="New password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <input required minLength="8" className="input-field" placeholder="Confirm new password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Resetting...' : 'Reset password'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
