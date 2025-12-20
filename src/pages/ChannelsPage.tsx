import ChannelManager from '@/components/dashboard/ChannelManager';
import { useLanguage } from '@/contexts/LanguageContext';
import { Youtube } from 'lucide-react';

const ChannelsPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Youtube className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('channels')}</h1>
          <p className="text-muted-foreground">YouTube, TikTok, RuTube, Max, Telegram</p>
        </div>
      </div>
      
      <div className="max-w-3xl">
        <ChannelManager />
      </div>
    </div>
  );
};

export default ChannelsPage;
