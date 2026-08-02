import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Phone, MapPin, Instagram, Facebook, Calendar, MessageCircle, X } from 'lucide-react';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/error';

const WhatsAppButton = ({ number, productName }) => {
  if (!number) return null;
  const text = productName
    ? `Hi! I'm interested in ${productName}. Can you share more details?`
    : `Hi! I'd like to know more about your jewellery collection.`;
  let phone = number.replace(/\D/g, '');
  if (phone.length === 10) phone = '91' + phone;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={url}
      className="fixed bottom-6 right-5 bg-green-500 hover:bg-green-600 active:scale-95 text-white p-3.5 rounded-full shadow-xl z-40 transition-all flex items-center justify-center"
      title="Chat on WhatsApp"
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
    >
      <MessageCircle size={24} />
    </a>
  );
};

const AppointmentModal = ({ shop, onClose }) => {
  const [form, setForm] = useState({ customerName: '', customerPhone: '', appointmentDate: '', appointmentTime: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
      try {
        await api.post(`/appointments?shop=${shop.slug}`, form);
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
          <h3 className="text-xl font-serif font-semibold">Book a Visit</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>
        {success ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-5xl mb-3">✓</div>
            <p className="font-medium">Appointment requested!</p>
            <p className="text-sm text-gray-500 mt-1">The store will confirm shortly.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input required className="input-field" placeholder="Your name"
              value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <input required className="input-field" placeholder="Phone number" type="tel"
              value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input required className="input-field" type="date" min={new Date().toISOString().split('T')[0]}
                value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} />
              <input required className="input-field" type="time"
                value={form.appointmentTime} onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })} />
            </div>
            <textarea className="input-field" rows="2" placeholder="Notes (optional)"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const PAGE_SIZE = 24;

const Storefront = () => {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopRes, catRes] = await Promise.all([
          api.get(`/shop?shop=${slug}`),
          api.get(`/categories?shop=${slug}`)
        ]);
        setShop(shopRes.data.shop);
        setCategories(catRes.data.categories);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (shop?.name) document.title = `${shop.name} — Jewellery Collection`;
  }, [shop]);

  useEffect(() => {
    if (!shop) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ shop: slug, limit: PAGE_SIZE, offset });
      if (activeCategory) params.set('category', activeCategory);
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      api.get(`/products?${params}`).then((res) => {
        setProducts((prev) => offset === 0 ? res.data.products : [...prev, ...res.data.products]);
        setHasMore(res.data.products.length === PAGE_SIZE);
      }).catch(() => { });
    }, search ? 300 : 0); // debounce while typing
    return () => clearTimeout(timer);
  }, [shop, slug, activeCategory, search, sort, offset]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="skeleton h-6 w-40" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="skeleton h-32 w-full rounded-2xl mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-square w-full" />
                <div className="skeleton h-4 w-3/4 mt-2" />
                <div className="skeleton h-3 w-1/2 mt-1.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 px-4">
        <span className="text-5xl mb-3">💎</span>
        <p className="font-medium">Store not found</p>
        <p className="text-sm text-gray-400 mt-1">Please check the link and try again.</p>
      </div>
    );
  }

  const primaryColor = shop.primary_color || '#C9A227';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {shop.logo && <img src={shop.logo} alt={shop.name} className="h-10 w-10 rounded-full object-cover" />}
            <h1 className="text-xl md:text-2xl font-serif font-bold" style={{ color: primaryColor }}>{shop.name}</h1>
          </div>
          <button onClick={() => setShowAppointment(true)}
            className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-lg"
            style={{ backgroundColor: primaryColor }}>
            <Calendar size={16} /> <span className="hidden sm:inline">Book a Visit</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-[200px] sm:h-[220px] md:h-[300px] lg:h-[360px] overflow-hidden bg-gray-100 flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.png"
            alt="Timeless Jewellery"
            className="w-full h-full object-cover object-right sm:object-center"
          />
          {/* Very subtle gradient overlay to keep text readable while keeping the background rich and colorful */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent z-10" />
        </div>

        <div className="max-w-6xl mx-auto px-4 w-full relative z-20">
          <div className="max-w-[55%] sm:max-w-[50%] py-1">
            <h2 className="text-[17px] sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-gray-900 leading-tight">
              Timeless Jewellery,<br /> Crafted for You
            </h2>
            <p className="text-gray-600 mt-2 text-[9px] sm:text-xs md:text-sm font-medium leading-relaxed">
              Explore our collection · Enquire on WhatsApp · Visit our store
            </p>
            <div className="h-0.5 sm:h-1 w-8 sm:w-10 mt-3 rounded-full" style={{ backgroundColor: primaryColor }} />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-10" placeholder="Search jewellery..."
              value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }} />
          </div>
          <select className="input-field md:w-48" value={sort} onChange={(e) => { setSort(e.target.value); setOffset(0); }}>
            <option value="">Featured</option>
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button onClick={() => { setActiveCategory(''); setOffset(0); }}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-all active:scale-95 ${!activeCategory ? 'text-white border-transparent shadow-sm' : 'bg-white text-gray-700 border-gray-200'}`}
            style={!activeCategory ? { backgroundColor: primaryColor } : {}}>
            All Collection
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => { setActiveCategory(c.slug); setOffset(0); }}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-all active:scale-95 ${activeCategory === c.slug ? 'text-white border-transparent shadow-sm' : 'bg-white text-gray-700 border-gray-200'}`}
              style={activeCategory === c.slug ? { backgroundColor: primaryColor } : {}}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-4xl block mb-2">🔍</span>
            No products found
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p) => (
              <Link key={p.id} to={`/store/${slug}/product/${p.id}`} className="card overflow-hidden group">
                <div className="aspect-square bg-gray-100 overflow-hidden relative">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">💍</div>
                  )}
                  {p.is_new_arrival && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                  )}
                  {p.availability !== 'available' && (
                    <span className="absolute top-2 right-2 bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded-full capitalize">{p.availability?.replace('_', ' ')}</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate">{p.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[p.metal_type, p.weight ? `${p.weight}g` : null].filter(Boolean).join(' · ')}
                  </p>
                  {p.show_price && p.price && (
                    <p className="font-semibold mt-1" style={{ color: primaryColor }}>₹{Number(p.price).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center mt-8">
            <button onClick={() => setOffset((o) => o + PAGE_SIZE)} className="btn-secondary px-8">
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-serif font-semibold text-lg mb-2" style={{ color: primaryColor }}>{shop.name}</h4>
            {shop.address && <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" />{shop.address}</p>}
          </div>
          <div className="space-y-2">
            {shop.phone && <p className="flex items-center gap-2"><Phone size={16} />{shop.phone}</p>}
            {shop.business_hours && <p>{shop.business_hours}</p>}
          </div>
          <div className="flex gap-4">
            {shop.instagram && <a href={shop.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={20} /></a>}
            {shop.facebook && <a href={shop.facebook} target="_blank" rel="noopener noreferrer"><Facebook size={20} /></a>}
          </div>
        </div>
      </footer>

      <WhatsAppButton number={shop.whatsapp_number} />
      {showAppointment && <AppointmentModal shop={shop} onClose={() => setShowAppointment(false)} />}
    </div>
  );
};

export default Storefront;
