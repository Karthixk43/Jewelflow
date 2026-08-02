import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/error';

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { identifier });
      setResetUrl(response.data.resetUrl || '');
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to start password recovery'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-3xl font-serif font-bold text-center text-gold-500">JewelFlow</h1>
        <h2 className="text-xl font-semibold text-center mt-6">Reset your password</h2>
        <p className="text-center text-gray-500 mt-2 mb-8">Enter your username or the email saved in Shop Settings.</p>
        {sent ? (
          <div className="space-y-6">
            <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">If a matching account has a recovery email, reset instructions have been sent.</p>
            {resetUrl && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">Development mode</p>
              <p className="mt-1">Email is not configured, so use this local reset link instead.</p>
              <a href={resetUrl} className="mt-3 inline-block text-gold-700 font-medium hover:underline">Reset password now</a>
            </div>}
            <Link to="/admin/login" className="btn-primary block w-full text-center">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input required className="input-field" placeholder="Username or shop email" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Sending...' : 'Send reset link'}</button>
          </form>
        )}
        <p className="text-center text-sm text-gray-500 mt-6"><Link to="/admin/login" className="text-gold-600 font-medium hover:underline">Back to sign in</Link></p>
      </div>
    </div>
  );
};

export default ForgotPassword;
