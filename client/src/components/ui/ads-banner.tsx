import React from 'react';

interface AdsBannerProps {
  position: 'top' | 'bottom' | 'sidebar';
  className?: string;
}

export function AdsBanner({ position, className = '' }: AdsBannerProps) {
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

  const getAdSlot = () => {
    // IDs de slot específicos para cada posição (você deve criar no AdMob)
    switch (position) {
      case 'top':
        return '1234567890'; // Criar slot para banner top
      case 'bottom':
        return '0987654321'; // Criar slot para banner bottom  
      case 'sidebar':
        return '1122334455'; // Criar slot para sidebar
      default:
        return '1234567890';
    }
  };

  React.useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`${getAdSize()} ${className}`}>
      <ins 
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-7984194482199524"
        data-ad-slot={getAdSlot()}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
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