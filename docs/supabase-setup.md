# Configuração do Supabase - StreetTech Downloader

## Por que Supabase?

O Supabase oferece:
- ✅ **100% Gratuito** até 500MB de dados e 2GB de transferência/mês
- ✅ **PostgreSQL** real com backup automático
- ✅ **API RESTful** automática
- ✅ **Dashboard administrativo** intuitivo
- ✅ **Escalabilidade** quando necessário

## Passo a Passo para Configuração

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub (recomendado)
4. Clique em "New Project"
5. Preencha:
   - **Name**: `streettech-downloader`
   - **Database Password**: (anote bem esta senha!)
   - **Region**: South America (São Paulo) para menor latência
6. Clique em "Create new project"

### 2. Obter URL de Conexão

Após criação do projeto:

1. Vá em **Settings** → **Database**
2. Role até **Connection string**
3. Selecione **Transaction pooler** 
4. Copie a URI e substitua `[YOUR-PASSWORD]` pela senha que você criou

A URL ficará assim:
```
postgresql://postgres.XXXXXXXX:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 3. Configurar no Projeto

**Opção A: Via Replit Secrets (Recomendado)**
1. Na sidebar do Replit, clique no ícone de cadeado (Secrets)
2. Clique em "Add new secret"
3. **Key**: `DATABASE_URL`
4. **Value**: Cole a URL completa do Supabase
5. Clique em "Add"

**Opção B: Via .env (Local)**
```env
DATABASE_URL="postgresql://postgres.XXXXXXXX:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
```

### 4. Criar Tabelas no Supabase

Execute no Supabase SQL Editor (ou automaticamente via Drizzle):

```sql
-- Tabela de vídeos
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  thumbnail TEXT,
  channel TEXT,
  views TEXT,
  upload_date TEXT,
  available_qualities JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabela de downloads
CREATE TABLE downloads (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  quality TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'mp4',
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  file_path TEXT,
  file_size TEXT,
  download_speed TEXT,
  eta TEXT,
  error TEXT,
  thumbnail TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_videos_video_id ON videos(video_id);
CREATE INDEX idx_downloads_video_id ON downloads(video_id);
CREATE INDEX idx_downloads_status ON downloads(status);
CREATE INDEX idx_downloads_created_at ON downloads(created_at DESC);
```

### 5. Testar Conexão

No terminal do Replit:
```bash
npm run db:push
```

Se tudo estiver correto, você verá:
```
✓ Your database is now in sync with your schema
```

## Vantagens da Migração

### Antes (MemStorage)
- ❌ Dados perdidos a cada restart
- ❌ Sem backup
- ❌ Limitado a uma instância

### Depois (Supabase)
- ✅ **Persistência real** de dados
- ✅ **Backup automático** diário
- ✅ **Dashboard visual** para monitorar dados
- ✅ **API REST** automática
- ✅ **Escalabilidade** ilimitada
- ✅ **Performance** otimizada com índices

## Monitoramento no Dashboard

No Supabase Dashboard você pode:

1. **Table Editor**: Ver/editar dados visualmente
2. **SQL Editor**: Executar queries personalizadas  
3. **Database**: Monitorar performance e conexões
4. **Auth**: Gerenciar usuários (se adicionar autenticação)
5. **Storage**: Para arquivos de download (futuro)

## Limites do Plano Gratuito

- **Database**: 500MB (suficiente para milhares de registros)
- **API Requests**: 50.000/mês
- **Bandwidth**: 2GB/mês
- **Storage**: 1GB

Para seu projeto, isso é mais que suficiente no início!

## Backup e Segurança

O Supabase automaticamente:
- 📄 **Backup diário** do banco
- 🔒 **SSL** em todas as conexões
- 🛡️ **Row Level Security** (se precisar)
- 📊 **Logs** de todas as operações

## Próximos Passos Opcionais

1. **Autenticação**: Adicionar login de usuários
2. **Storage**: Para hospedar arquivos baixados
3. **Edge Functions**: Para processamento serverless
4. **Real-time**: Para updates instantâneos

O projeto está 100% preparado para usar Supabase - só precisa da URL de conexão!