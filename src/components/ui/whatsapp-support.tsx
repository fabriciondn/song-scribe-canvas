import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WhatsAppSupport = () => {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5519995081355?text=oi%20vim%20pelo%20site%20da%20compuse%2C%20poderia%20me%20ajudar%3F', '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      size="lg"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 animate-in fade-in slide-in-from-bottom-4"
      aria-label="Suporte via WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};
