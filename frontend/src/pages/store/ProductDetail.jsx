import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, X } from 'lucide-react';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/error';

const EnquiryModal = ({ shop, product, onClose }) => {
  const [form, setForm] = useState({ customerName: '', customerPhone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/enquiries?shop=${shop.slug}`, { ...form, productId: product.id });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-serif font-semibold">Enquire</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>
        {success ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-5xl mb-3">✓</div>
            <p className="font-medium">Enquiry sent!</p>
            <p className="text-sm text-gray-500 mt-1">The store will get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-500">About: <span className="font-medium text-gray-800">{product.name}</span></p>
            <input required className="input-field" placeholder="Your name"
              value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <input required className="input-field" placeholder="Phone number" type="tel"
              value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            <textarea className="input-field" rows="3" placeholder="Your message (optional)"
              value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Sending...' : 'Send Enquiry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { slug, id } = useParams();
  const [shop, setShop] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopRes, productRes] = await Promise.all([
          api.get(`/shop?shop=${slug}`),
          api.get(`/products/${id}?shop=${slug}`)
        ]);
        setShop(shopRes.data.shop);
        setProduct(productRes.data);
      } catch {
        // handled by render
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id]);

  useEffect(() => {
    if (product?.name && shop?.name) document.title = `${product.name} — ${shop.name}`;
  }, [product, shop]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm px-4 py-4">
          <div className="max-w-6xl mx-auto"><div className="skeleton h-6 w-40" /></div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
          <div className="skeleton aspect-square w-full rounded-2xl" />
          <div className="space-y-3">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }
  if (!product || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 px-4">
        <span className="text-5xl mb-3">💎</span>
        <p className="font-medium">Product not found</p>
      </div>
    );
  }

  const primaryColor = shop.primary_color || '#C9A227';
  let phone = (shop.whatsapp_number || '').replace(/\D/g, '');
  if (phone.length === 10) {
    phone = '91' + phone; // Add default India country code if 10 digits
  }
  const textMsg = encodeURIComponent(`Hi! I'm interested in ${product.name}. Can you share more details?`);
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=${textMsg}` : null;

  const specs = [
    ['Metal', product.metal_type],
    ['Weight', product.weight ? `${product.weight} g` : null],
    ['Purity', product.purity],
    ['Stones', product.stone_details],
    ['Category', product.category_name],
  ].filter(([, v]) => v);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={`/store/${slug}`} className="text-gray-500 hover:text-gray-800"><ArrowLeft size={22} /></Link>
          <h1 className="text-lg font-serif font-bold" style={{ color: primaryColor }}>{shop.name}</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 md:py-8 grid md:grid-cols-2 gap-6 md:gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square bg-white rounded-2xl overflow-hidden border shadow-sm relative">
            {product.images?.[activeImage] ? (
              <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">💍</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${i === activeImage ? 'border-gold-500 scale-105 shadow-sm' : 'border-gray-200 opacity-70'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.is_new_arrival && <span className="bg-emerald-50 text-emerald-700 font-medium text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-200">New Arrival</span>}
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize border ${product.availability === 'available' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {product.availability?.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-gray-900 leading-tight">{product.name}</h1>
            {product.show_price && product.price ? (
              <p className="text-xl sm:text-2xl font-bold mt-2" style={{ color: primaryColor }}>
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>
            ) : (
              <p className="text-gray-500 text-sm mt-2 font-medium">Price on request</p>
            )}

            {product.description && <p className="text-gray-600 mt-3 text-sm leading-relaxed">{product.description}</p>}

            {specs.length > 0 && (
              <div className="card mt-5 divide-y divide-gray-100 text-sm">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex justify-between px-4 py-2.5">
                    <span className="text-gray-500 text-xs sm:text-sm">{label}</span>
                    <span className="font-medium text-gray-800 text-xs sm:text-sm text-right">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex gap-3 mt-8">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-3 rounded-xl transition-colors shadow-sm">
                <MessageCircle size={18} /> WhatsApp Enquiry
              </a>
            )}
            <button onClick={() => setShowEnquiry(true)}
              className="flex-1 text-white font-medium px-4 py-3 rounded-xl transition-opacity hover:opacity-90 shadow-sm"
              style={{ backgroundColor: primaryColor }}>
              Send Enquiry
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-gray-200 p-3 flex gap-2.5 z-40 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg">
        {whatsappUrl && (
          <a href={whatsappUrl}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 active:bg-emerald-700 text-white font-medium px-3 py-3 rounded-xl text-sm transition-all active:scale-[0.98]">
            <MessageCircle size={18} /> WhatsApp
          </a>
        )}
        <button onClick={() => setShowEnquiry(true)}
          className="flex-1 text-white font-medium px-3 py-3 rounded-xl text-sm transition-all active:scale-[0.98]"
          style={{ backgroundColor: primaryColor }}>
          Send Enquiry
        </button>
      </div>
      {/* Spacer so content isn't hidden behind mobile sticky bar */}
      <div className="md:hidden h-24" />

      {showEnquiry && <EnquiryModal shop={shop} product={product} onClose={() => setShowEnquiry(false)} />}
    </div>
  );
};

export default ProductDetail;
