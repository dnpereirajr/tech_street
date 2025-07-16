# Integração com AdMob - Guia Completo

## Visão Geral

O StreetTech Downloader foi estruturado para receber anúncios do Google AdMob de forma otimizada para monetização. A estrutura já está implementada e pronta para integração.

## Estrutura de Anúncios Implementada

### 1. Posições dos Anúncios

**Banner Superior (Top Banner)**
- Posição: Topo da página
- Tamanho recomendado: 728x90 (Leaderboard) ou 320x50 (Banner)
- Localização: `AdsBanner position="top"`

**Banner Lateral (Sidebar)**
- Posição: Lateral direita (desktop)
- Tamanho recomendado: 300x250 (Medium Rectangle)
- Localização: `AdsBanner position="sidebar"`

**Banner Inferior (Bottom Banner)**
- Posição: Final da página
- Tamanho recomendado: 728x90 (Leaderboard) ou 320x50 (Banner)
- Localização: `AdsBanner position="bottom"`

### 2. Tipos de Anúncios Suportados

**Banner Ads (Implementado)**
- Sempre visíveis na interface
- Integração no componente `AdsBanner`

**Anúncios Intersticiais (Preparado)**
- Podem ser exibidos antes de downloads
- Função: `showInterstitialAd()` (linha 223 em video-downloader.tsx)

**Anúncios Recompensados (Preparado)**
- Para funcionalidades premium
- Função: `showRewardedAd()` no hook `useAdMob`

## Como Integrar o AdMob

### Passo 1: Configurar conta AdMob
1. Acesse [Google AdMob](https://admob.google.com/)
2. Crie uma conta e configure seu app
3. Obtenha seu Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)

### Passo 2: Integração Web (se for PWA)

```javascript
// Adicione no <head> do index.html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"></script>
```

### Passo 3: Substituir Placeholders

No arquivo `client/src/components/ui/ads-banner.tsx`, substitua:

```typescript
// Substitua esta seção:
<div className="text-center text-muted-foreground text-sm">
  <div className="text-xs font-medium mb-1">Anúncio</div>
  // ... código placeholder
</div>

// Por código real do AdMob:
<ins className="adsbygoogle"
     style={{display: 'block'}}
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="YYYYYYYYYY"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
```

### Passo 4: Integração Mobile (se for app nativo)

Para aplicativos nativos usando Capacitor/Cordova:

```bash
npm install @capacitor-community/admob
```

```typescript
import { AdMob } from '@capacitor-community/admob';

// Inicializar
await AdMob.initialize({
  requestTrackingAuthorization: true,
  testingDevices: ['YOUR_TESTING_DEVICE_ID'],
});

// Banner
await AdMob.showBanner({
  adId: 'YOUR_BANNER_AD_ID',
  adSize: BannerAdSize.BANNER,
  position: BannerAdPosition.TOP,
});

// Intersticial
await AdMob.prepareInterstitial({
  adId: 'YOUR_INTERSTITIAL_AD_ID',
});
await AdMob.showInterstitial();
```

## Estratégia de Monetização

### 1. Frequência de Anúncios
- **Banners**: Sempre visíveis (não intrusivos)
- **Intersticiais**: Máximo 1 a cada 3 downloads
- **Recompensados**: Para funcionalidades premium opcionais

### 2. Posicionamento Otimizado
- Banner superior: Primeira visualização
- Sidebar: Visível durante uso prolongado
- Banner inferior: Após interação principal

### 3. UX Considerations
- Anúncios não interferem na funcionalidade principal
- Botão de doação como alternativa para usuários que preferem apoiar diretamente
- Estrutura responsiva para diferentes tamanhos de tela

## IDs de Teste AdMob

Durante desenvolvimento, use estes IDs de teste:

```
Banner: ca-app-pub-3940256099942544/6300978111
Intersticial: ca-app-pub-3940256099942544/1033173712
Recompensado: ca-app-pub-3940256099942544/5224354917
```

## Próximos Passos

1. **Configurar conta AdMob**
2. **Obter IDs reais de anúncio**  
3. **Substituir placeholders por código real**
4. **Testar em ambiente de desenvolvimento**
5. **Publicar e monitorar performance**

## Suporte

A estrutura está 100% pronta para receber os anúncios. Qualquer dúvida sobre implementação específica, consulte a documentação oficial do AdMob ou entre em contato.