import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Star, Shield, Zap, Heart, ShoppingBag, CreditCard, PackageCheck } from 'lucide-react';
import { WHATSAPP_DEFAULT_NUMBER } from '../shared/constants';
import { useWhatsappSetting } from '../features/settings/hooks/useWhatsappSetting';

function useScrollReveal() {
  const refs = useRef([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    refs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  return (el) => { if (el && !refs.current.includes(el)) refs.current.push(el); };
}

const MARQUEE_ITEMS = [
  'Jakarta Events', 'Seoul K-Beauty', 'Quality Preloved', 'Tokyo Finds',
  'Local Jastip', 'Trusted Picks', 'Vintage Luxury', 'Limited Drops',
  'Curated Finds', 'Handpicked Gems',
];

const stats = [
  { value: '2,400+', label: 'Happy Shoppers' },
  { value: '180+', label: 'Jastip Trips' },
  { value: '12,000+', label: 'Products Delivered' },
  { value: '99%', label: 'Satisfaction Rate' },
];

const features = [
  {
    icon: Shield,
    title: 'Verified Authentic',
    description: 'Every product personally sourced and inspected. Zero counterfeits, zero surprises — guaranteed.',
  },
  {
    icon: Zap,
    title: 'Fast & Transparent',
    description: 'Tracked from source to doorstep. You see every step, we handle every detail.',
  },
  {
    icon: Heart,
    title: 'Premium Preloved',
    description: 'Carefully graded second-hand pieces — luxury quality at honest prices.',
  },
];

const steps = [
  { num: '01', icon: ShoppingBag, title: 'Browse & Pick', desc: 'Explore active jastip events or curated preloved listings. Add your favorites to cart in seconds.' },
  { num: '02', icon: CreditCard, title: 'Checkout & Pay', desc: 'Complete checkout and upload your transfer proof — we verify and confirm your order right away.' },
  { num: '03', icon: PackageCheck, title: 'Receive & Enjoy', desc: 'Your items are packed with care, tracked end-to-end, and delivered straight to your door.' },
];

export function LandingPage() {
  const { data: waSetting } = useWhatsappSetting();
  const phoneNumber = waSetting?.phoneNumber || WHATSAPP_DEFAULT_NUMBER;
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hi! I found you from Spill the Bill. I want to ask about your products.')}`;
  const addRef = useScrollReveal();

  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes blob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          33% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          66% { border-radius: 70% 30% 50% 50% / 30% 70% 60% 40%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .reveal {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.75s cubic-bezier(.16,1,.3,1), transform 0.75s cubic-bezier(.16,1,.3,1);
        }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.2s; }
        .reveal-d3 { transition-delay: 0.3s; }
        .reveal-d4 { transition-delay: 0.4s; }
        .h-line-1 { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.05s forwards; opacity: 0; }
        .h-line-2 { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.2s forwards; opacity: 0; }
        .h-line-3 { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) 0.35s forwards; opacity: 0; }
        .h-sub { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.5s forwards; opacity: 0; }
        .h-cta { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.65s forwards; opacity: 0; }
        .h-badge { animation: fadeIn 1s ease 0.8s forwards; opacity: 0; }
        .blob-anim { animation: blob 10s ease-in-out infinite; }
        .float-anim { animation: float 4.5s ease-in-out infinite; }
        .marquee-track { animation: marquee 30s linear infinite; }
        .grid-bg {
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .feature-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.4s cubic-bezier(.16,1,.3,1);
        }
        .feature-card:hover {
          background: rgba(155,28,28,0.08);
          border-color: rgba(155,28,28,0.35);
          transform: translateY(-4px);
        }
      `}</style>

      <div className="min-h-screen bg-[#0a0303] overflow-x-hidden">

        {/* ── Navbar ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 py-4 bg-[#0a0303]/70 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Spill the Bill" className="w-9 h-9 object-contain" />
            <span className="font-bold text-white text-lg tracking-tight">
              Spill the <span className="text-brand-400">Bill</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-800 text-white rounded-full text-sm font-semibold hover:bg-brand-700 transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand-900/50"
            >
              Shop Now <ArrowRight size={14} />
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden grid-bg">
          {/* Glow orbs */}
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-brand-800/25 blob-anim blur-[120px] pointer-events-none" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-brand-600/15 blob-anim blur-[90px] pointer-events-none"
            style={{ animationDelay: '4s' }}
          />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full">
            <div className="grid lg:grid-cols-[1fr_420px] gap-16 xl:gap-24 items-center">

              {/* Left: text */}
              <div>
                <div className="h-badge inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-brand-800/40 bg-brand-950/40 backdrop-blur-sm text-brand-300 text-xs font-semibold uppercase tracking-widest mb-10">
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
                  Jakarta's Personal Jastip &amp; Preloved
                </div>

                <div className="overflow-hidden mb-2">
                  <h1 className="h-line-1 font-black text-white leading-[0.88] tracking-tight"
                    style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}>
                    Your
                  </h1>
                </div>
                <div className="overflow-hidden mb-2">
                  <h1 className="h-line-2 font-black text-brand-400 leading-[0.88] tracking-tight italic"
                    style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}>
                    Personal
                  </h1>
                </div>
                <div className="overflow-hidden mb-10">
                  <h1 className="h-line-3 font-black text-white leading-[0.88] tracking-tight"
                    style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}>
                    Shopper.
                  </h1>
                </div>

                <p className="h-sub text-white/40 text-lg leading-relaxed max-w-md mb-10">
                  Jakarta event finds, quality preloved items, and select international picks —
                  all handpicked and sourced personally for you.
                </p>

                <div className="h-cta flex flex-wrap gap-4">
                  <Link
                    to="/home"
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-brand-800 text-white rounded-full font-bold text-base hover:bg-brand-700 transition-all hover:scale-105 hover:shadow-xl hover:shadow-brand-900/60"
                  >
                    Explore Collection
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" />
                  </Link>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 border border-white/15 text-white/60 rounded-full font-medium text-base hover:border-white/40 hover:text-white transition-all"
                  >
                    <MessageCircle size={18} /> Chat Us
                  </a>
                </div>
              </div>

              {/* Right: floating visual */}
              <div className="relative hidden lg:flex items-center justify-center h-[480px]">
                {/* Orbit rings */}
                <div className="absolute w-[340px] h-[340px] rounded-full border border-brand-800/15" />
                <div className="absolute w-[460px] h-[460px] rounded-full border border-brand-800/08" />

                {/* Center logo blob */}
                <div className="relative z-10 w-44 h-44 rounded-full bg-brand-900/40 border border-brand-700/30 flex items-center justify-center backdrop-blur-sm float-anim shadow-2xl shadow-brand-950">
                  <img src="/logo.png" alt="Spill the Bill" className="w-28 h-28 object-contain" />
                </div>

                {/* Floating badges */}
                {[
                  { label: '2,400+ Shoppers', top: '10%', left: '-5%', delay: '0s' },
                  { label: '180+ Trips', top: '8%', right: '0%', delay: '1s' },
                  { label: '12K+ Products', bottom: '18%', left: '-2%', delay: '2s' },
                  { label: '99% Happy', bottom: '10%', right: '5%', delay: '1.5s' },
                ].map(({ label, delay, ...pos }, i) => (
                  <div
                    key={i}
                    className="absolute px-4 py-2.5 bg-white/[0.04] backdrop-blur-md border border-white/8 rounded-2xl text-white text-xs font-semibold float-anim"
                    style={{ ...pos, animationDelay: delay }}
                  >
                    <span className="text-brand-400 mr-1.5">✦</span>{label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
            <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
            <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        </section>

        {/* ── Marquee ── */}
        <div className="bg-brand-800 py-4 overflow-hidden border-y border-brand-700/60">
          <div className="marquee-track inline-flex gap-0 whitespace-nowrap">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-5 px-8 text-white font-bold text-xs uppercase tracking-[0.2em]">
                {item}
                <span className="text-brand-300 text-[10px]">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        <section className="bg-[#0a0303] py-32 px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <div ref={addRef} className="reveal grid lg:grid-cols-2 gap-8 items-end mb-20">
              <div>
                <span className="block text-brand-500 text-xs font-bold uppercase tracking-[0.25em] mb-4">Why choose us</span>
                <h2
                  className="text-white font-black leading-[1.0]"
                  style={{ fontSize: 'clamp(2.5rem,5vw,4rem)' }}
                >
                  The smarter way<br />to shop.
                </h2>
              </div>
              <p className="text-white/35 text-base leading-relaxed lg:pb-1 max-w-md">
                From Jakarta events to international finds and quality preloved — personally sourced, carefully vetted, fully transparent.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {features.map(({ icon: Icon, title, description }, i) => (
                <div
                  key={title}
                  ref={addRef}
                  className={`reveal reveal-d${i + 1} feature-card p-8 rounded-3xl group cursor-default relative overflow-hidden`}
                >
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-700/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-12 h-12 rounded-2xl bg-brand-800/20 border border-brand-800/30 flex items-center justify-center mb-6 group-hover:bg-brand-800/40 transition-colors duration-300">
                    <Icon size={22} className="text-brand-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{title}</h3>
                  <p className="text-white/35 text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-24 px-6 lg:px-10 bg-brand-800 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
          <div className="relative max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {stats.map(({ value, label }, i) => (
              <div key={label} ref={addRef} className={`reveal reveal-d${i + 1} text-center`}>
                <div
                  className="font-black text-white leading-none mb-2"
                  style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)' }}
                >
                  {value}
                </div>
                <div className="text-brand-200 text-xs font-semibold uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="bg-[#0a0303] py-32 px-6 lg:px-10">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div ref={addRef} className="reveal flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16 pb-8 border-b border-white/8">
              <div>
                <span className="block text-brand-500 text-xs font-bold uppercase tracking-[0.25em] mb-3">How it works</span>
                <h2 className="text-white font-black leading-tight" style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)' }}>
                  Three steps to anything.
                </h2>
              </div>
              <p className="text-white/30 text-sm max-w-xs leading-relaxed">
                From discovery to delivery — the whole journey, simplified.
              </p>
            </div>

            {/* Step rows */}
            <div className="divide-y divide-white/[0.06]">
              {steps.map(({ num, icon: Icon, title, desc }, i) => (
                <div
                  key={num}
                  ref={addRef}
                  className={`reveal reveal-d${i + 1} group py-8 px-4 -mx-4 rounded-2xl hover:bg-white/[0.018] transition-colors duration-300 cursor-default`}
                >
                  <div className="flex items-start gap-6 lg:gap-12">
                    {/* Number */}
                    <span
                      className="flex-shrink-0 font-black text-brand-800/40 leading-none select-none group-hover:text-brand-700/60 transition-colors duration-300 mt-1"
                      style={{ fontSize: 'clamp(2rem,4vw,3.25rem)', minWidth: '64px' }}
                    >
                      {num}
                    </span>

                    {/* Icon + Title + Desc */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-800/20 border border-brand-800/30 flex items-center justify-center group-hover:bg-brand-800/35 group-hover:border-brand-700/50 transition-all duration-300">
                          <Icon size={22} className="text-brand-400" />
                        </div>
                        <h3 className="text-white font-bold text-xl lg:text-2xl">{title}</h3>
                      </div>
                      <p className="text-white/35 text-sm leading-relaxed lg:max-w-lg">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#0a0303] py-32 px-6 lg:px-10">
          <div ref={addRef} className="reveal max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-800/40 bg-brand-950/40 text-brand-300 text-xs font-semibold uppercase tracking-widest mb-8">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              Trusted by 2,400+ happy shoppers
            </div>
            <h2
              className="font-black text-white leading-[1.0] mb-6"
              style={{ fontSize: 'clamp(3rem,7vw,6rem)' }}
            >
              Ready to spill<br />
              <span className="text-brand-400 italic">the bill?</span>
            </h2>
            <p className="text-white/40 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
              From local Jakarta events to quality preloved finds — your personal shopper, ready whenever you need.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Link
                to="/home"
                className="group inline-flex items-center gap-3 px-10 py-4 bg-brand-800 text-white rounded-full font-bold text-base hover:bg-brand-700 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-brand-900/60"
              >
                Start Shopping
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" />
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-10 py-4 border border-white/15 text-white/60 rounded-full font-medium hover:border-white/40 hover:text-white transition-all"
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>
            </div>

            {/* Feature row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Shield, label: 'Authenticated' },
                { icon: Zap, label: 'Fast Delivery' },
                { icon: Heart, label: 'Preloved Quality' },
                { icon: Star, label: 'Member Perks' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="w-10 h-10 rounded-xl bg-brand-800/25 border border-brand-800/30 flex items-center justify-center">
                    <Icon size={18} className="text-brand-400" />
                  </div>
                  <span className="text-white/60 text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-[#0a0303] border-t border-white/5 py-10 px-6 lg:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Spill the Bill" className="w-8 h-8 object-contain" />
              <span className="font-bold text-white">Spill the Bill</span>
            </div>
            <p className="text-white/20 text-xs">Your trusted personal shopper &mdash; &copy; {new Date().getFullYear()}</p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-500 transition-colors"
            >
              <MessageCircle size={15} /> WhatsApp Us
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}

export default LandingPage;
