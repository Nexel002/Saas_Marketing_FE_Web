# PromoMo Frontend 🚀

Frontend Web do PromoMo - Plataforma de Automação de Marketing com IA para pequenos negócios em Moçambique.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Stack Tecnológico](#stack-tecnológico)
- [Estrutura do Projecto](#estrutura-do-projecto)
- [Instalação](#instalação)
- [Execução](#execução)
- [Páginas](#páginas)
- [Componentes](#componentes)
- [API Client](#api-client)
- [Design System](#design-system)

## 🎯 Visão Geral

O PromoMo é uma plataforma SaaS que utiliza Inteligência Artificial para ajudar pequenos negócios a automatizar o seu marketing digital. Este repositório contém o código frontend (Web) que consome a [API do PromoMo](../SaasMarketing).

### Funcionalidades

- 💬 **Chat com IA** - Assistente inteligente para sugestões de marketing
- 🔍 **Pesquisa de Mercado** - Análise automática do sector
- 📋 **Plano Estratégico** - Identidade visual e branding
- 🎯 **Campanhas** - Criação e gestão de campanhas de marketing
- 🏢 **Perfil do Negócio** - Gestão de informações empresariais
- 📸 **Product Assets** - Upload de imagens e vídeos para uso em conteúdos
- 🎥 **Video Player** - Renderização automática de vídeos estilo Pinterest

## 🛠️ Stack Tecnológico

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 14.x | Framework React com App Router |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.x | Estilização utilitária |
| React | 18.x | Biblioteca UI |

## 📁 Estrutura do Projecto

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Páginas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Páginas protegidas
│   │   ├── dashboard/
│   │   ├── chat/
│   │   ├── campaigns/
│   │   ├── research/
│   │   ├── strategic-plan/
│   │   ├── business/
│   │   └── layout.tsx
│   ├── layout.tsx                # Layout raiz
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Estilos globais
├── components/
│   ├── Providers.tsx             # Provider global
│   ├── ui/                       # Componentes base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   └── layout/                   # Layout components
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── index.ts
├── lib/
│   └── api/                      # Cliente API
│       ├── client.ts             # Configuração fetch
│       ├── auth.ts               # Serviço de autenticação
│       ├── business.ts           # Serviço de negócios
│       └── index.ts
└── types/                        # Tipos TypeScript
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Passos

```bash
# 1. Entrar na pasta do projecto
cd SaasMarketing_FE_Web

# 2. Instalar dependências
npm install

# 3. Copiar variáveis de ambiente
cp .env.example .env.local

# 4. Editar .env.local com a URL da API
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## ▶️ Execução

```bash
# Modo desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar em produção
npm start

# Verificar tipos TypeScript
npm run typecheck

# Lint
npm run lint
```

A aplicação estará disponível em: `http://localhost:3000`

## 📄 Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login` | Página de login |
| `/register` | Página de registo |
| `/dashboard` | Dashboard principal |
| `/chat` | Assistente de IA |
| `/campaigns` | Lista de campanhas |
| `/research` | Pesquisa de mercado |
| `/strategic-plan` | Plano estratégico |
| `/business` | Perfil do negócio |

## 🧩 Componentes

### Componentes de UI

```tsx
import { Button, Card, Input } from '@/components/ui';

// Variantes de Botão
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button isLoading>Loading...</Button>

// Card
<Card variant="default" padding="lg">
  <CardHeader>Título</CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>

// Input
<Input 
  label="Email" 
  type="email" 
  error="Campo obrigatório" 
/>
```

### Componentes de Layout

```tsx
import { Sidebar, Header } from '@/components/layout';

<Sidebar isOpen={true} onClose={() => {}} />
<Header title="Dashboard" user={{ name: 'João' }} />
```

## 🔌 API Client

```tsx
import { api, authService, businessService } from '@/lib/api';

// Login
const { user, token } = await authService.login({
  email: 'user@example.com',
  password: '123456',
});

// Obter negócio
const business = await businessService.getById('business-id');

// Requisição genérica
const response = await api.get('/endpoint');
await api.post('/endpoint', { data });
```

## 🎨 Design System

### Cores

| Variável | Valor | Uso |
|----------|-------|-----|
| `--background` | `#FFFFFF` | Fundo principal |
| `--surface` | `#F8FAFC` | Cards, containers |
| `--primary` | `#6366F1` | Botões, links |
| `--accent-pink` | `#FBC5D8` | Acentos suaves |
| `--accent-blue` | `#B8D4E3` | Acentos secundários |
| `--accent-yellow` | `#FDE68A` | Alertas |

### Tipografia

- **Font**: Inter (Google Fonts)
- **Headings**: 600 weight
- **Body**: 400 weight
- **Buttons**: 500 weight

### Gradientes

```css
/* Gradiente Hero */
background: linear-gradient(135deg, #FBC5D8 0%, #B8D4E3 50%, #FDE68A 100%);
```

## 📝 Notas de Desenvolvimento

### Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=PromoMo
```

### Backend API

A API do PromoMo deve estar rodando em `http://localhost:8000`. Ver documentação da API em `/docs` (Swagger).

## 📄 Licença

Desenvolvido por NexelIT © 2026
