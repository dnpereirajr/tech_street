# Compilar para APK - StreetTech Downloader

## Visão Geral

Para transformar sua aplicação web em um APK Android, você tem várias opções. Vou explicar as melhores abordagens para seu projeto.

## Opção 1: Capacitor (Recomendada) 🚀

O Capacitor é a melhor opção para converter React em aplicativo nativo.

### Configuração Inicial

```bash
# Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Inicializar Capacitor
npx cap init "StreetTech Downloader" "com.streettech.downloader"

# Adicionar plataforma Android
npx cap add android
```

### Configuração para APK

1. **Criar arquivo capacitor.config.ts**:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.streettech.downloader',
  appName: 'StreetTech Downloader',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-7984194482199524~0000000000', // ID do app no AdMob
      testingDevices: ['YOUR_TESTING_DEVICE_ID'],
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false
    }
  }
};

export default config;
```

2. **Configurar build script em package.json**:
```json
{
  "scripts": {
    "build:mobile": "npm run build && npx cap sync android",
    "android": "npx cap open android"
  }
}
```

### Integração AdMob Mobile

```bash
# Instalar plugin AdMob
npm install @capacitor-community/admob
npx cap sync
```

### Compilar APK

```bash
# 1. Build da aplicação
npm run build:mobile

# 2. Abrir Android Studio
npm run android

# 3. No Android Studio:
# - Build > Generate Signed Bundle/APK
# - Escolher APK
# - Configurar keystore (primeira vez)
# - Build Release APK
```

## Opção 2: Cordova (Alternativa)

```bash
npm install -g cordova
cordova create streettech-app com.streettech.downloader "StreetTech Downloader"
cd streettech-app
cordova platform add android
cordova plugin add cordova-plugin-admob-free
```

## Opção 3: PWA + TWA (Mais Simples)

### Trusted Web Activity - Google Play Store

1. **Configurar PWA** no projeto atual:
```json
// Em package.json, adicionar workbox
"scripts": {
  "build:pwa": "npm run build && workbox generateSW"
}
```

2. **Usar Bubblewrap** para gerar APK:
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://seudominio.com/manifest.json
bubblewrap build
```

## Configuração Específica para AdMob

### Mobile (Capacitor)
```typescript
import { AdMob } from '@capacitor-community/admob';

export class MobileAdService {
  async initialize() {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: ['YOUR_DEVICE_ID'],
    });
  }

  async showBanner() {
    await AdMob.showBanner({
      adId: 'ca-app-pub-7984194482199524/BANNER_SLOT_ID',
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.TOP,
    });
  }

  async showInterstitial() {
    await AdMob.prepareInterstitial({
      adId: 'ca-app-pub-7984194482199524/INTERSTITIAL_SLOT_ID',
    });
    await AdMob.showInterstitial();
  }
}
```

## Estrutura de Arquivos para Mobile

```
streettech-downloader/
├── android/                 # Projeto Android nativo
├── src/                     # Código React (atual)
├── dist/public/            # Build da web
├── capacitor.config.ts     # Configuração Capacitor
└── android/app/src/main/
    ├── AndroidManifest.xml # Permissões
    └── res/
        ├── mipmap/         # Ícones do app
        └── values/         # Strings e cores
```

## Permissões Necessárias

No `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="com.google.android.gms.permission.AD_ID" />
```

## Processo Completo de Build

### 1. Preparação
```bash
# Instalar dependências Android
npm install @capacitor/android @capacitor-community/admob

# Build da aplicação web
npm run build
```

### 2. Configuração Mobile
```bash
# Inicializar Capacitor (uma vez)
npx cap init

# Adicionar plataforma Android
npx cap add android

# Sincronizar arquivos
npx cap sync android
```

### 3. Desenvolvimento e Debug
```bash
# Executar em emulador/dispositivo
npx cap run android

# Ou abrir no Android Studio
npx cap open android
```

### 4. Build de Produção

No Android Studio:
1. **Build** → **Generate Signed Bundle/APK**
2. Escolher **APK**
3. Configurar **Keystore** (guarde bem as senhas!)
4. Selecionar **release**
5. Build APK

O arquivo APK estará em:
`android/app/build/outputs/apk/release/app-release.apk`

## Teste e Distribuição

### Teste Local
- Instalar APK diretamente no dispositivo
- Usar `adb install app-release.apk`

### Google Play Store
1. Criar conta Google Play Developer ($25 única vez)
2. Upload do APK/AAB
3. Preencher informações da store
4. Enviar para revisão

### Distribuição Alternativa
- APKPure, F-Droid
- Site próprio para download direto
- Firebase App Distribution para testes

## Considerações Importantes

### Performance
- App será executado em WebView nativo
- Performance similar ao browser móvel
- Ideal para aplicações web responsivas

### Limitações
- Acesso limitado a APIs nativas
- Dependente de conexão para downloads
- Tamanho do APK: ~10-20MB

### Vantagens
- Código único para web e mobile
- Desenvolvimento rápido
- Fácil manutenção
- AdMob funcionando perfeitamente

A estrutura atual do seu projeto já está 100% preparada para conversão em APK! O layout responsivo e a integração AdMob facilitarão muito o processo.