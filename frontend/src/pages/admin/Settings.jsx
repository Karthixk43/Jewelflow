import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import api from '../../api/client';
import { compressImage } from '../../utils/image';
import { getErrorMessage } from '../../utils/error';

const Settings = () => {
  const [form, setForm] = useState({
    name: '', primaryColor: '#C9A227', whatsappNumber: '', phone: '',
    email: '', address: '', instagram: '', facebook: '', businessHours: '', logo: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const slug = localStorage.getItem('shopSlug');
    api.get(`/shop?shop=${slug}`).then((res) => {
      const s = res.data.shop;
      setForm({
        name: s.name || '',
        primaryColor: s.primary_color || '#C9A227',
        whatsappNumber: s.whatsapp_number || '',
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        instagram: s.instagram || '',
        facebook: s.facebook || '',
        businessHours: s.business_hours || '',
        logo: s.logo || ''
      });
    }).finally(() => setLoading(false));
  }, []);

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const optimized = await compressImage(file, 400); // logos don't need to be large
      const fd = new FormData();
      fd.append('logo', optimized);
      const res = await api.post('/upload/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm((f) => ({ ...f, logo: res.data.url }));
    } catch (err) {
      setError(err.message?.includes("couldn't be read") ? err.message : getErrorMessage(err, 'Logo upload failed'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.put('/shop', form);
      setMessage('Settings saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-serif font-bold mb-6">Store Settings</h1>
      <form onSubmit={submit} className="card p-6 space-y-5">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border flex items-center justify-center">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-300 text-2xl">💎</span>
            )}
          </div>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Logo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={uploadLogo} disabled={uploading} />
          </label>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Store name</label>
          <input required className="input-field" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Brand color</label>
          <div className="flex items-center gap-3">
            <input type="color" className="w-12 h-10 rounded cursor-pointer border" value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
            <span className="text-sm text-gray-500">{form.primaryColor}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">WhatsApp number</label>
            <input className="input-field" placeholder="+91XXXXXXXXXX" value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Phone</label>
            <input className="input-field" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Email</label>
          <input className="input-field" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Address</label>
          <textarea className="input-field" rows="2" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Business hours</label>
          <input className="input-field" placeholder="Mon-Sat: 10am - 8pm" value={form.businessHours}
            onChange={(e) => setForm({ ...form, businessHours: e.target.value })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Instagram URL</label>
            <input className="input-field" value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Facebook URL</label>
            <input className="input-field" value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
          </div>
        </div>

        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={saving || uploading} className="btn-primary">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
