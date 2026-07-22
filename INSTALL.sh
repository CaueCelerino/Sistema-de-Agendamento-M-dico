#!/bin/bash

# Script de instalação de todas as dependências
# PROJETO 5M - CLÍNICA CLÍNICA

echo "=================================="
echo "  INSTALANDO PROJETO 5M"
echo "  CLÍNICA CLÍNICA"
echo "=================================="
echo ""

# Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "📥 Instale em: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION detectado"
echo ""

# Backend
echo "📦 Instalando Backend..."
cd backend
if [ -f "package.json" ]; then
    npm install --no-save
    if [ $? -eq 0 ]; then
        echo "✅ Backend instalado com sucesso!"
    else
        echo "❌ Erro ao instalar backend"
        exit 1
    fi
else
    echo "⚠️  package.json não encontrado no backend"
fi
cd ..
echo ""

# Frontend
echo "📦 Instalando Frontend..."
if [ ! -d "frontend/node_modules" ]; then
    echo "⏳ Frontend: Criar projeto React (primeiro uso)"
    cd frontend
    if command -v pnpm &> /dev/null; then
        pnpm create vite@latest . -- --template react
    elif command -v yarn &> /dev/null; then
        yarn create vite@latest . --template react
    else
        npm create vite@latest . -- --template react
    fi
    npm install
    cd ..
fi
echo "✅ Frontend preparado!"
echo ""

# SQLite (se necessário)
if ! command -v sqlite3 &> /dev/null; then
    echo "⚠️  SQLite3 não detectado"
    echo "💡 Para VSCode, instale extensão: SQLite (alexcvzz.vscode-sqlite)"
else
    echo "✅ SQLite3 detectado"
fi
echo ""

# Resumo
echo "=================================="
echo "  ✨ INSTALAÇÃO COMPLETA!"
echo "=================================="
echo ""
echo "🚀 Para começar:"
echo ""
echo "  Backend:"
echo "    cd backend"
echo "    npm run dev"
echo ""
echo "  Frontend:"
echo "    cd frontend"
echo "    npm start"
echo ""
echo "📊 Database:"
echo "    - Arquivo: clinica_5m.db"
echo "    - VSCode: SQLite extension"
echo ""
echo "📚 Documentação:"
echo "    - REQUISITOS.md"
echo "    - API_REFERENCE.md"
echo "    - BRANDING.md"
echo "    - SETUP_SUMMARY.md"
echo ""
