# Sistema de Agendamento Médico - Deploy no Railway

Seu repositório GitHub está pronto para deploy no Railway! 🚀

## Próximos passos:

### 1. Ir no Railway e criar novo projeto

- Acesse: https://railway.app
- Faça login com sua conta GitHub
- Clique em **"New Project"**
- Selecione **"Deploy from GitHub repo"**
- Procure por: `Sistema-de-Agendamento-Médico`
- Autorize e selecione

### 2. Railway vai detectar automaticamente

- Railway vai ver que é Node.js
- Ele vai procurar `Procfile` e encontrará
- Build vai começar automaticamente

### 3. Adicionar variáveis de ambiente

No Railway, ir em **Variables** e adicionar:

```
NODE_ENV=production
PORT=3000
DB_TYPE=mysql
DB_HOST=seu-servidor-hostgator.com
DB_PORT=3306
DB_NAME=clinica_5m_prod
DB_USER=clinica_user
DB_PASSWORD=Medicinaespacovid@26
JWT_SECRET=sua_chave_super_secreta_aqui_minimo_32_caracteres
CORS_ORIGIN=https://seu-dominio-hostgator.com
```

### 4. Fazer Deploy

- Railway vai fazer build automaticamente
- Quando terminar, você vai receber uma URL como:
  ```
  https://sistema-de-agendamento-mdico-production.up.railway.app
  ```

### 5. Atualizar Frontend

Com a URL do Railway, edite `frontend/.env.production`:

```
VITE_API_URL=https://sistema-de-agendamento-mdico-production.up.railway.app/api
```

Depois:
```bash
cd frontend
npm run build
```

Faça upload de `frontend/dist/` novamente para Hostgator.

---

**Pronto! Seu projeto está configurado para deploy.** 🎉
