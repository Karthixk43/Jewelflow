import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/error';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | category
  const [form, setForm] = useState({ name: '', slug: '', displayOrder: 0 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/categories?shop=${localStorage.getItem('shopSlug')}`);
      setCategories(res.data.categories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openModal = (cat) => {
    setError('');
    if (cat === 'new') {
      setForm({ name: '', slug: '', displayOrder: categories.length });
    } else {
      setForm({ name: cat.name, slug: cat.slug, displayOrder: cat.display_order });
    }
    setModal(cat);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'new') {
        await api.post('/categories', form);
      } else {
        await api.put(`/categories/${modal.id}`, form);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this category? Products in it will become uncategorized.')) return;
    await api.delete(`/categories/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold">Categories</h1>
        <button onClick={() => openModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Category
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No categories yet. Create Rings, Necklaces, Earrings...</div>
      ) : (
        <div className="card divide-y">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-gray-400">/{c.slug} · order {c.display_order}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(c)} className="text-gray-400 hover:text-gold-600"><Pencil size={16} /></button>
                <button onClick={() => remove(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-serif font-semibold">{modal === 'new' ? 'Add Category' : 'Edit Category'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <input required className="input-field" placeholder="Name (e.g. Rings)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} />
              <input required className="input-field" placeholder="Slug"
                value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              <input className="input-field" type="number" placeholder="Display order"
                value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
