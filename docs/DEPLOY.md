# 🚀 Documentação de Deploy - Projeto 5M Clínica

**Versão:** 1.0.0  
**Data:** 04/07/2026  
**Autores:** Lucas, Caue, Kaio, Gustavo

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração de Ambiente](#configuração-de-ambiente)
3. [Deploy do Backend](#deploy-do-backend)
4. [Deploy do Frontend](#deploy-do-frontend)
5. [Deploy do Banco de Dados](#deploy-do-banco-de-dados)
6. [Configuração do Firebase](#configuração-do-firebase)
7. [Testes de Produção](#testes-de-produção)
8. [Monitoramento e Logs](#monitoramento-e-logs)
9. [Rollback e Contingência](#rollback-e-contingência)
10. [Suporte e Troubleshooting](#suporte-e-troubleshooting)

---

## 🔧 Pré-requisitos

### Software Necessário

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **Git** ≥ 2.40.0
- **PostgreSQL** ≥ 14.0 (produção)
- **Docker** ≥ 20.0 (opcional, recomendado)
- **Docker Compose** ≥ 2.0 (opcional, recomendado)

### Credenciais Necessárias

- Firebase Admin SDK Credentials (JSON file)
- Chave privada JWT
- Credenciais do banco de dados PostgreSQL
- Certificados SSL/TLS

### Servidores Recomendados

- **Backend:** Linux (Ubuntu 22.04 LTS)
- **Frontend:** Nginx ou Apache
- **Banco de Dados:** PostgreSQL em servidor dedicado
- **CDN:** CloudFront ou Cloudflare (opcional)

---

## 🌍 Configuração de Ambiente

### 1. Variáveis de Ambiente - Backend

Criar arquivo `.env` no diretório `backend/`:

```bash
# Ambiente
NODE_ENV=production
PORT=3000

# Database
DB_TYPE=postgresql
DB_HOST=seu-servidor-postgres.com
DB_PORT=5432
DB_NAME=clinica_5m_prod
DB_USER=clinica_user
DB_PASSWORD=sua_senha_super_segura

# JWT
JWT_SECRET=sua_chave_secreta_muito_longa_e_complexa_com_min_32_caracteres
JWT_EXPIRE=7d

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=seu-projeto-firebase
FIREBASE_PRIVATE_KEY=$(cat firebase-config.json | jq -r '.private_key')
FIREBASE_CLIENT_EMAIL=seu-service-account@seu-projeto.iam.gserviceaccount.com

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@clinica.com
SMTP_PASSWORD=sua_senha_aplicacao
SMTP_FROM=noreply@clinica.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/clinica-api/app.log

# CORS
CORS_ORIGIN=https://seu-dominio.com

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Variáveis de Ambiente - Frontend

Criar arquivo `.env` no diretório `frontend/`:

```bash
# API
VITE_API_URL=https://api.seu-dominio.com
VITE_API_TIMEOUT=30000

# Firebase (para notificações)
VITE_FIREBASE_PROJECT_ID=seu-projeto-firebase
VITE_FIREBASE_APP_ID=seu-app-id

# Ambiente
VITE_ENV=production
VITE_LOG_LEVEL=error
```

### 3. Estrutura de Diretórios em Produção

```
/opt/clinica/
├── backend/
│   ├── src/
│   ├── node_modules/
│   ├── .env
│   └── package.json
├── frontend/
│   ├── dist/
│   ├── node_modules/
│   ├── .env
│   └── package.json
├── database/
│   └── backups/
└── logs/
    ├── backend/
    └── nginx/
```

---

## 📦 Deploy do Backend

### Opção 1: Docker (Recomendado)

#### Criar Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar arquivos
COPY backend/package*.json ./
COPY backend/.env ./.env.production

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY backend/src ./src

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar aplicação
CMD ["npm", "start"]
```

#### Build e Deploy com Docker

```bash
# Build da imagem
docker build -t clinica-api:1.0.0 -f backend/Dockerfile .

# Tag para registry
docker tag clinica-api:1.0.0 seu-registry.com/clinica-api:1.0.0

# Push para registry
docker push seu-registry.com/clinica-api:1.0.0

# Executar container
docker run -d \
  --name clinica-api \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file backend/.env.production \
  -v /opt/clinica/logs/backend:/app/logs \
  seu-registry.com/clinica-api:1.0.0
```

#### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    image: clinica-api:1.0.0
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      JWT_SECRET: ${JWT_SECRET}
      FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
    volumes:
      - ./logs/backend:/app/logs
      - ./firebase-config.json:/app/firebase-config.json:ro
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - clinica-network

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: clinica_5m_prod
      POSTGRES_USER: clinica_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    restart: unless-stopped
    networks:
      - clinica-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - clinica-network

volumes:
  postgres_data:

networks:
  clinica-network:
    driver: bridge
```

### Opção 2: Deploy Direto em Servidor Linux

```bash
# 1. Clonar repositório
git clone seu-repo.git /opt/clinica
cd /opt/clinica/backend

# 2. Instalar dependências
npm install --production

# 3. Copiar .env
cp .env.example .env
nano .env  # Editar com suas configurações

# 4. Migrar banco de dados
npm run migrate

# 5. Iniciar com PM2
npm install -g pm2
pm2 start src/server.js --name "clinica-api" --env production
pm2 save
pm2 startup

# 6. Verificar status
pm2 status
pm2 logs clinica-api
```

#### Configurar Nginx como Proxy Reverso

```nginx
upstream clinica_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.seu-dominio.com;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.seu-dominio.com;

    ssl_certificate /etc/nginx/ssl/seu-dominio.crt;
    ssl_certificate_key /etc/nginx/ssl/seu-dominio.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    location / {
        proxy_pass http://clinica_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
}
```

---

## 🎨 Deploy do Frontend

### Build Production

```bash
cd frontend

# Instalar dependências
npm install

# Build otimizado
npm run build

# Testar build localmente
npm run preview
```

### Deploy em Nginx

```bash
# Copiar arquivos de produção
sudo cp -r dist/* /var/www/seu-dominio.com/

# Definir permissões
sudo chown -R www-data:www-data /var/www/seu-dominio.com/

# Configurar Nginx
cat > /etc/nginx/sites-available/seu-dominio.com << 'EOF'
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    ssl_certificate /etc/nginx/ssl/seu-dominio.crt;
    ssl_certificate_key /etc/nginx/ssl/seu-dominio.key;

    root /var/www/seu-dominio.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF

# Ativar site
sudo ln -s /etc/nginx/sites-available/seu-dominio.com /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### Deploy em AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync para S3
aws s3 sync dist/ s3://seu-bucket-clinica/ --delete

# Invalidar cache CloudFront
aws cloudfront create-invalidation \
  --distribution-id SEU_DISTRIBUTION_ID \
  --paths "/*"
```

---

## 💾 Deploy do Banco de Dados

### Migração de SQLite para PostgreSQL

```bash
# 1. Backup do banco SQLite
cp clinica_5m.db clinica_5m.db.backup

# 2. Instalar ferramentas de migração
npm install -g sqlite-to-postgresql

# 3. Executar migração
sqlite-to-postgresql -f clinica_5m.db postgresql://user:password@host:5432/clinica_5m_prod

# 4. Verificar integridade
psql -U clinica_user -d clinica_5m_prod -c "SELECT COUNT(*) FROM usuarios;"
```

### Backup Automático

```bash
#!/bin/bash
# /opt/clinica/scripts/backup-db.sh

BACKUP_DIR="/opt/clinica/database/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="clinica_5m_prod"

pg_dump -U clinica_user $DB_NAME | gzip > $BACKUP_DIR/clinica_$DATE.sql.gz

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "clinica_*.sql.gz" -mtime +7 -delete

echo "Backup realizado: $BACKUP_DIR/clinica_$DATE.sql.gz"
```

Adicionar ao crontab:

```bash
# Backup diário às 2 da manhã
0 2 * * * /opt/clinica/scripts/backup-db.sh
```

---

## 🔥 Configuração do Firebase

### 1. Criar Projeto Firebase

1. Acessar [Firebase Console](https://console.firebase.google.com/)
2. Clicar "Criar Novo Projeto"
3. Nome: "Espaço Vida"
4. Ativar Google Analytics (opcional)

### 2. Configurar Cloud Messaging

```bash
# No console Firebase:
# 1. Ir para "Cloud Messaging"
# 2. Gerar chaves Web Push
# 3. Copiar VAPID Public Key para frontend
# 4. Salvar Server Key
```

### 3. Criar Service Account

```bash
# No console Firebase:
# 1. Projeto Settings → Service Accounts
# 2. Clicar "Generate New Private Key"
# 3. Salvar JSON localmente
# 4. Copiar para: backend/firebase-config.json
```

### 4. Ativar Firebase Services

- Cloud Messaging
- Realtime Database (opcional)
- Cloud Storage (para uploads)
- Authentication (opcional)

---

## ✅ Testes de Produção

### 1. Health Check

```bash
curl https://api.seu-dominio.com/api/health
```

Resposta esperada:

```json
{
  "status": "OK",
  "message": "Projeto 5M - API Backend Clínica",
  "timestamp": "2026-07-04T15:30:00Z",
  "authors": ["Lucas", "Caue", "Kaio", "Gustavo"]
}
```

### 2. Teste de Login

```bash
curl -X POST https://api.seu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinica.com","password":"password123"}'
```

### 3. Teste de Notificação

```bash
curl -X POST https://api.seu-dominio.com/api/notificacoes/test-push \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceToken":"seu_token_aqui"}'
```

### 4. Teste de Performance

```bash
# Usar Apache Bench
ab -n 100 -c 10 https://api.seu-dominio.com/api/health

# Usar wrk
wrk -t4 -c100 -d30s https://api.seu-dominio.com/api/health
```

### 5. Rodar Testes Automatizados

```bash
cd backend
npm test

# Com cobertura
npm run test:coverage
```

---

## 📊 Monitoramento e Logs

### Logs do Sistema

```bash
# Backend (PM2)
pm2 logs clinica-api

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Banco de Dados
sudo tail -f /var/log/postgresql/postgresql.log
```

### Ferramentas de Monitoramento

#### 1. PM2 Plus (Gratuito)

```bash
pm2 install pm2-logrotate
pm2 web  # Interface web em http://localhost:9615
```

#### 2. DataDog (Pago)

```bash
# Instalar agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=sua_key DD_SITE=datadoghq.com bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_agent.sh)"

# Configurar Node.js
npm install --save dd-trace
```

#### 3. ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# docker-compose.yml
version: '3'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    ports:
      - "5000:5000"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
```

---

## 🔄 Rollback e Contingência

### Rollback Manual

```bash
# Verificar versões anteriores
docker images

# Parar versão atual
docker stop clinica-api

# Executar versão anterior
docker run -d \
  --name clinica-api \
  seu-registry.com/clinica-api:0.9.0

# Verificar status
docker logs clinica-api
```

### Rollback do Banco de Dados

```bash
# Lista de backups
ls -lh /opt/clinica/database/backups/

# Restaurar do backup
gunzip < /opt/clinica/database/backups/clinica_20260703_020000.sql.gz | \
  psql -U clinica_user -d clinica_5m_prod
```

### Plano de Contingência

1. **Monitorar alertas** em tempo real
2. **Manter backups** diários testados
3. **Documentar issues** comuns
4. **Ter plano de comunicação** com usuários
5. **Testar recovery** periodicamente

---

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

#### 1. API não responde

```bash
# Verificar se serviço está rodando
pm2 status

# Restart
pm2 restart clinica-api

# Verificar logs
pm2 logs clinica-api
```

#### 2. Erro de conexão com banco

```bash
# Testar conexão
psql -U clinica_user -d clinica_5m_prod -c "SELECT 1;"

# Verificar configuração .env
cat backend/.env | grep DB_

# Reiniciar conexão
pm2 restart clinica-api
```

#### 3. Notificações não chegam

```bash
# Verificar credenciais Firebase
cat backend/firebase-config.json | head -5

# Testar envio
curl -X POST https://api.seu-dominio.com/api/notificacoes/test-push
```

#### 4. Certificado SSL expirado

```bash
# Renovar com Let's Encrypt
sudo certbot renew --dry-run

# Ou renovar manualmente
sudo certbot certonly --standalone -d seu-dominio.com
```

### Contato de Suporte

- **Desenvolvedor Principal:** Lucas
- **Email:** lucas@clinica.com
- **Slack:** #clinica-5m-support
- **Wiki:** https://wiki.clinica.com/projeto-5m

---

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado e testado
- [ ] Firebase credenciais configuradas
- [ ] SSL/TLS certificados válidos
- [ ] Backup do banco realizado
- [ ] Health check respondendo
- [ ] Testes automatizados passando
- [ ] Logs funcionando corretamente
- [ ] Monitoramento ativo
- [ ] Alertas configurados
- [ ] Documentação atualizada
- [ ] Usuários notificados sobre deploy

---

**Versão:** 1.0.0  
**Última atualização:** 04/07/2026  
**Próxima revisão:** 01/08/2026
