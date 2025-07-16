import React from 'react';
import { Card } from '@/components/ui/card';

interface AdsBannerProps {
  position: 'top' | 'bottom' | 'sidebar';
  className?: string;
}

export function AdsBanner({ position, className = '' }: AdsBannerProps) {
  // Placeholder para AdMob - será substituído por código real do AdMob
  const getAdSize = () => {
    switch (position) {
      case 'top':
      case 'bottom':
        return 'w-full h-20'; // Banner 320x50 ou 728x90
      case 'sidebar':
        return 'w-48 h-64'; // Medium Rectangle 300x250
      default:
        return 'w-full h-20';
    }
  };

  return (
    <Card className={`${getAdSize()} ${className} border-dashed border-muted/50 bg-muted/20 flex items-center justify-center`}>
      <div className="text-center text-muted-foreground text-sm">
        <div className="text-xs font-medium mb-1">Anúncio</div>
        <div className="text-xs opacity-60">
          {position === 'top' && 'Banner Top 728x90'}
          {position === 'bottom' && 'Banner Bottom 728x90'}
          {position === 'sidebar' && 'Medium Rectangle 300x250'}
        </div>
        {/* 
        Aqui será integrado o código do AdMob:
        
        Para React/Web AdMob, usar:
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"></script>
        
        Ou para aplicativo mobile com Capacitor:
        import { AdMob } from '@capacitor-community/admob';
        */}
      </div>
    </Card>
  );
}

// Hook para controlar anúncios
export function useAdMob() {
  const showBannerAd = (position: string) => {
    // Implementar lógica do AdMob aqui
    console.log(`Showing banner ad at ${position}`);
  };

  const showInterstitialAd = () => {
    // Implementar anúncio intersticial
    console.log('Showing interstitial ad');
  };

  const showRewardedAd = () => {
    // Implementar anúncio recompensado
    console.log('Showing rewarded ad');
  };

  return {
    showBannerAd,
    showInterstitialAd,
    showRewardedAd,
  };
}