# Mango Farm Monitor

Sistema de monitoramento inteligente para fazendas de manga. Permite acompanhar em tempo real sensores, alertas, eventos e análises de produção de múltiplas fazendas e talhões.

## Funcionalidades

- **Dashboard de Fazendas**: Visão geral das fazendas e talhões com métricas em tempo real
- **Monitoramento de Sensores**: Acompanhamento de temperatura, umidade, pH do solo e outros parâmetros
- **Sistema de Alertas**: Notificações configuráveis para condições críticas
- **Registro de Eventos**: Histórico de atividades como irrigação, fertilização, colheita e pragas
- **Analytics**: Gráficos de produção, previsões e comparativos
- **Heatmaps**: Visualização espacial de dados dos talhões
- **Multi-organização**: Suporte a múltiplas organizações com controle de acesso
- **Painel Administrativo**: Gerenciamento de usuários, sensores e configurações

## Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework de estilização
- **shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado servidor
- **React Router** - Roteamento
- **Recharts** - Gráficos e visualizações
- **React Hook Form + Zod** - Formulários e validação
- **Axios** - Cliente HTTP

## Pré-requisitos

- Node.js 18+ (recomendado 20+)
- npm ou yarn

## Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd mango-farm-monitor

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8000/api
```

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_API_URL` | URL base da API backend | `http://localhost:8000/api` |

## Scripts Disponíveis

```bash
# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Build de desenvolvimento (com source maps)
npm run build:dev

# Preview do build de produção
npm run preview

# Linting
npm run lint
```

## Docker

### Build da imagem

```bash
# Build padrão
docker build -t mango-farm-monitor .

# Build com variáveis de ambiente customizadas
docker build \
  --build-arg VITE_API_URL=https://api.exemplo.com \
  -t mango-farm-monitor .
```

### Executar container

```bash
# Executar na porta 3000
docker run -d -p 3000:80 --name mango-monitor mango-farm-monitor

# Com restart automático
docker run -d -p 3000:80 --restart unless-stopped --name mango-monitor mango-farm-monitor
```

### Docker Compose (opcional)

Crie um arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      args:
        VITE_API_URL: ${VITE_API_URL:-http://localhost:8000/api}
    ports:
      - "3000:80"
    restart: unless-stopped
```

Execute com:

```bash
docker-compose up -d
```

## Estrutura do Projeto

```
src/
├── components/        # Componentes React reutilizáveis
│   ├── analytics/     # Componentes de analytics
│   ├── auth/          # Componentes de autenticação
│   ├── events/        # Componentes de eventos
│   ├── filters/       # Filtros globais
│   ├── heatmap/       # Visualização de heatmap
│   ├── layouts/       # Layouts da aplicação
│   └── ui/            # Componentes base (shadcn/ui)
├── config/            # Configurações
├── contexts/          # React Contexts
├── data/              # Dados mock para desenvolvimento
├── hooks/             # Custom hooks
├── lib/               # Utilitários
├── pages/             # Páginas da aplicação
│   ├── admin/         # Páginas administrativas
│   └── settings/      # Páginas de configurações
├── services/          # Serviços de API
└── types/             # Definições TypeScript
```

## Desenvolvimento

O servidor de desenvolvimento roda na porta **8080** por padrão:

```bash
npm run dev
# Acesse: http://localhost:8080
```

## Produção

Para deploy em produção:

1. Configure as variáveis de ambiente apropriadas
2. Execute o build: `npm run build`
3. Sirva os arquivos da pasta `dist/` com um servidor web (Nginx, Apache, etc.)

Ou utilize Docker conforme instruções acima.

## Licença

Propriedade de IROL. Todos os direitos reservados.
