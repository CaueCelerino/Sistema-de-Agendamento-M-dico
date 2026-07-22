# 🔥 Guia de Configuração - Firebase Push Notifications

**Projeto:** Espaço Vida  
**Data:** 04/07/2026  
**Autores:** Lucas, Caue, Kaio, Gustavo

---

## 📋 Sumário

1. [Setup Firebase](#setup-firebase)
2. [Configurar Backend](#configurar-backend)
3. [Configurar Frontend](#configurar-frontend)
4. [Testar Notificações](#testar-notificações)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Setup Firebase

### Passo 1: Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Criar novo projeto"**
3. Nome do projeto: `Clinica5M-Production`
4. Desabilite Google Analytics (pode ativar depois)
5. Clique **"Criar"**

### Passo 2: Configurar Cloud Messaging

1. No console Firebase, vá para **"Cloud Messaging"**
2. Nas configurações, você verá:
   - **Server Key** (para o backend)
   - **VAPID Public Key** (para o frontend)
3. Guarde essas chaves!

### Passo 3: Criar Service Account

1. Vá para **Configurações do Projeto** (ícone de engrenagem)
2. Clique na aba **"Contas de serviço"**
3. Clique **"Gerar nova chave privada"**
4. Salve o arquivo JSON em local seguro

---

## 🔌 Configurar Backend

### Passo 1: Adicionar Credenciais

```bash
# Copiar credenciais Firebase
cp ~/Downloads/firebase-config.json ./backend/firebase-config.json

# Verificar se arquivo existe
ls -la backend/firebase-config.json
```

### Passo 2: Configurar .env

Abra `backend/.env` e adicione:

```env
# Firebase Credentials
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com

# OU use arquivo local em desenvolvimento:
# Deixe comentado em produção
# FIREBASE_CONFIG_FILE=./firebase-config.json
```

### Passo 3: Testar Inicialização

```bash
cd backend
npm start

# Você deve ver:
# ✅ Firebase inicializado com sucesso
```

### Passo 4: Registrar Device Token

Quando o frontend se conectar, faça uma requisição:

```bash
curl -X POST http://localhost:3000/api/notificacoes/device-token \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "fPP9...seu_token_aqui...",
    "plataforma": "web"
  }'
```

---

## 📱 Configurar Frontend

### Passo 1: Instalar SDK Firebase

```bash
cd frontend
npm install firebase
```

### Passo 2: Criar arquivo `firebase-config.js`

```javascript
// src/config/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export async function getDeviceToken() {
  const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const token = await getToken(messaging, { vapidKey: VAPID_KEY });
  return token;
}
```

### Passo 3: Configurar .env do Frontend

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
VITE_FIREBASE_VAPID_KEY=sua_vapid_key_aqui
```

### Passo 4: Criar Worker de Notificações

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "sua_api_key",
  projectId: "seu-projeto",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### Passo 5: Usar em Componente React

```jsx
// src/hooks/useNotifications.js
import { useEffect, useContext } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebaseConfig';
import { useAuth } from './useAuth';
import { api } from '../services/api';

export function useNotifications() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    // Solicitar permissão de notificações
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        // Obter device token
        getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        }).then((deviceToken) => {
          // Registrar no backend
          api.post('/notificacoes/device-token', {
            deviceToken,
            plataforma: 'web',
          }).catch(console.error);
        });
      }
    });

    // Ouvir mensagens em primeiro plano
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Notification received:', payload);
      
      // Mostrar notificação customizada
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.image,
      });
    });

    return unsubscribe;
  }, [user, token]);
}
```

### Passo 6: Usar Hook em App.jsx

```jsx
// src/App.jsx
import { useNotifications } from './hooks/useNotifications';

function App() {
  useNotifications(); // Ativar notificações

  return (
    // seu app aqui
  );
}
```

---

## ✅ Testar Notificações

### Teste 1: Health Check

```bash
curl https://api.seu-dominio.com/api/health
# Resposta: {"status":"OK",...}
```

### Teste 2: Registrar Device Token

```bash
# 1. Login primeiro
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinica.com","password":"password123"}' \
  | jq -r '.token')

# 2. Registrar device token
curl -X POST http://localhost:3000/api/notificacoes/device-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "fPP9...aqui...",
    "plataforma": "web"
  }'
```

### Teste 3: Enviar Notificação de Teste

```bash
curl -X POST http://localhost:3000/api/notificacoes/test-push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "fPP9...aqui..."
  }'
```

### Teste 4: Simulador Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá para **Cloud Messaging**
3. Clique em **"Enviar primeira mensagem"**
4. Preencha título e mensagem
5. Selecione o tópico: `clientes`
6. Clique **"Enviar"**

---

## 🆘 Troubleshooting

### Problema: "Firebase não inicializado"

**Solução:**

```bash
# Verificar arquivo de credenciais
cat backend/firebase-config.json

# Verificar variáveis de ambiente
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_PRIVATE_KEY

# Reiniciar servidor
npm start
```

### Problema: "Erro ao enviar notificação"

**Solução:**

```javascript
// Verificar token no frontend
const token = await getToken(messaging, { 
  vapidKey: process.env.VITE_FIREBASE_VAPID_KEY 
});
console.log('Device Token:', token);

// Enviar para backend
```

### Problema: "Permissão negada de notificações"

**Solução:**

1. Abra configurações do navegador
2. Procure por "Notificações" para o seu site
3. Altere para "Permitir"
4. Recarregue a página

### Problema: "VAPID_KEY inválida"

**Solução:**

1. Firebase Console → Cloud Messaging
2. Copiar exatamente a **Public Key**
3. Colar em `.env` do frontend
4. Recarregar página

---

## 📊 Rotas de Notificações Implementadas

### GET `/api/notificacoes`
Lista todas as notificações do usuário

```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/notificacoes
```

### PATCH `/api/notificacoes/:id/marcar-lida`
Marca notificação como lida

```bash
curl -X PATCH -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/notificacoes/1/marcar-lida
```

### POST `/api/notificacoes/device-token`
Registra token do dispositivo

```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceToken":"...","plataforma":"web"}' \
  http://localhost:3000/api/notificacoes/device-token
```

### POST `/api/notificacoes/test-push`
Envia notificação de teste

```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceToken":"..."}' \
  http://localhost:3000/api/notificacoes/test-push
```

---

## 🎯 Casos de Uso Implementados

1. **Agendamento Confirmado** ✅
   - Título: "✅ Agendamento Confirmado"
   - Dados: agendamentoId, data, tipo

2. **Cartão Vencido** ✅
   - Título: "⚠️ Cartão Vencido"
   - Ação: Renovar cartão

3. **Cartão Vencendo** ✅
   - Título: "⏰ Cartão Vencendo em Breve"
   - Dados: diasRestantes

4. **Lembrete de Consulta** ✅
   - Título: "🔔 Lembrete de Consulta"
   - Dados: horário, agendamentoId

5. **Broadcast para Todos** ✅
   - Tópico: `clientes`
   - Casos: promoções, avisos gerais

---

## 📚 Links Úteis

- [Firebase Documentation](https://firebase.google.com/docs)
- [FCM REST API](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [Web SDK Reference](https://firebase.google.com/docs/reference/js/messaging)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Versão:** 1.0.0  
**Última atualização:** 04/07/2026  
**Próxima revisão:** 01/08/2026
