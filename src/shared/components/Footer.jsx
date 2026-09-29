import { MessageCircle, Instagram } from 'lucide-react';
import { useWhatsappSetting } from '../../features/settings/hooks/useWhatsappSetting';
import { WHATSAPP_DEFAULT_NUMBER } from '../constants';

export function Footer() {
  const { data: waSetting } = useWhatsappSetting();
  const phoneNumber = waSetting?.phoneNumber || WHATSAPP_DEFAULT_NUMBER;
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hi! I want to ask about your products.')}`;

  return (
    <footer className="bg-white border-t border-dark-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Spill the Bill" className="w-7 h-7 object-contain" />
            <span className="font-bold text-dark-900">
              Spill the <span className="text-brand-800">Bill</span>
            </span>
          </div>

          <p className="text-xs text-dark-400 text-center">
            Jakarta's personal jastip &amp; preloved — handpicked for you &copy; {new Date().getFullYear()}
          </p>

          <div className="flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-500 transition-colors"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
