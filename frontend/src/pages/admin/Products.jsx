import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Camera, Star } from 'lucide-react';
import api from '../../api/client';
import { compressImage } from '../../utils/image';
import { getErrorMessage } from '../../utils/error';

const emptyForm = {
  name: '', description: '', categoryId: '', metalType: '', weight: '', purity: '',
  stoneDetails: '', price: '', showPrice: false, availability: 'available',
  isNewArrival: false, isFeatured: false, isHidden: false, images: []
};

const ProductModal = ({ product, categories, onClose, onSaved }) => {
  const [form, setForm] = useState(product ? {
    name: product.name || '',
    description: product.description || '',
    categoryId: product.category_id || '',
    metalType: product.metal_type || '',
    weight: product.weight || '',
    purity: product.purity || '',
    stoneDetails: product.stone_details || '',
    price: product.price || '',
    showPrice: product.show_price || false,
    availability: product.availability || 'available',
    isNewArrival: product.is_new_arrival || false,
    isFeatured: product.is_featured || false,
    isHidden: product.is_hidden || false,
    images: product.images || []
  } : emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      // Auto-convert & compress every photo format — camera, gallery, WhatsApp, screenshots
      const results = await Promise.allSettled(files.map((f) => compressImage(f)));
      const good = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
      const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason.message);

      if (good.length) {
        const fd = new FormData();
        good.forEach((f) => fd.append('images', f));
        const res = await api.post('/upload/products', fd);
        setForm((prev) => ({ ...prev, images: [...prev.images, ...res.data.urls] }));
      }
      if (failed.length) {
        setError(failed.join(' '));
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Upload failed. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const uploadImages = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const makeCover = (url) => {
    setForm((prev) => ({ ...prev, images: [url, ...prev.images.filter((i) => i !== url)] }));
  };

  const removeImage = (url) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((i) => i !== url) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        weight: form.weight === '' ? null : form.weight,
        price: form.price === '' ? null : form.price,
      };
      if (product) {
        await api.put(`/products/${product.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-serif font-semibold">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input required className="input-field" placeholder="Product name *"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="input-field" rows="2" placeholder="Description"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="grid grid-cols-2 gap-3">
            <select className="input-field" value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input-field" value={form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.value })}>
              <option value="available">Available</option>
              <option value="made_to_order">Made to Order</option>
              <option value="sold_out">Sold Out</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input className="input-field" placeholder="Metal (e.g. Gold)"
              value={form.metalType} onChange={(e) => setForm({ ...form, metalType: e.target.value })} />
            <input className="input-field" placeholder="Weight (g)" type="number" step="0.01" min="0"
              value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            <input className="input-field" placeholder="Purity (e.g. 22K)"
              value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })} />
          </div>

          <input className="input-field" placeholder="Stone details (e.g. 0.5ct Diamond)"
            value={form.stoneDetails} onChange={(e) => setForm({ ...form, stoneDetails: e.target.value })} />

          <div className="grid grid-cols-2 gap-3 items-center">
            <input className="input-field" placeholder="Price (₹)" type="number" step="0.01" min="0"
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.showPrice}
                onChange={(e) => setForm({ ...form, showPrice: e.target.checked })} />
              Show price to customers
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isNewArrival}
                onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} />
              New Arrival
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isHidden}
                onChange={(e) => setForm({ ...form, isHidden: e.target.checked })} />
              Hidden
            </label>
          </div>

          {/* Photos */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Photos</p>
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-gold-500 bg-gold-50' : 'border-gray-300 hover:border-gold-400 hover:bg-gold-50/50'
              }`}>
              <Camera size={28} className="mx-auto text-gold-500 mb-2" />
              {uploading ? (
                <p className="text-sm font-medium text-gold-600">Uploading your photos...</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Tap to add photos of your jewellery</p>
                  <p className="text-xs text-gray-400 mt-1">Camera, gallery, WhatsApp images, screenshots — any photo works, any size. We optimize them automatically.</p>
                </>
              )}
              <input type="file" accept="image/*" multiple hidden onChange={uploadImages} disabled={uploading} />
            </label>
            {form.images.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {form.images.map((url, i) => (
                  <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-gold-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">Cover</span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                      {i !== 0 && (
                        <button type="button" onClick={() => makeCover(url)} title="Make cover photo"
                          className="text-white hover:text-gold-300">
                          <Star size={16} />
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(url)} title="Remove"
                        className="text-white hover:text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {form.images.length > 1 && (
              <p className="text-xs text-gray-400 mt-1.5">The cover photo is what customers see first — tap ★ on a photo to make it the cover.</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | product object

  const load = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/products/admin/all'),
        api.get(`/categories?shop=${localStorage.getItem('shopSlug')}`)
      ]);
      setProducts(pRes.data.products);
      setCategories(cRes.data.categories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  const toggleHidden = async (p) => {
    await api.put(`/products/${p.id}`, { isHidden: !p.is_hidden });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold">Products</h1>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No products yet. Add your first one!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className={`card overflow-hidden ${p.is_hidden ? 'opacity-60' : ''}`}>
              <div className="aspect-square bg-gray-100">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">💍</div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm truncate">{p.name}</h3>
                <p className="text-xs text-gray-500">{p.category_name || 'Uncategorized'}</p>
                {p.price && <p className="text-sm font-semibold text-gold-600 mt-1">₹{Number(p.price).toLocaleString('en-IN')}</p>}
                <div className="flex gap-1 mt-3">
                  <button onClick={() => setModal(p)} className="flex-1 btn-secondary py-1.5 text-xs flex items-center justify-center gap-1">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => toggleHidden(p)} className="btn-secondary py-1.5 px-2.5" title={p.is_hidden ? 'Show' : 'Hide'}>
                    {p.is_hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button onClick={() => remove(p.id)} className="btn-secondary py-1.5 px-2.5 text-red-500" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
};

export default Products;
