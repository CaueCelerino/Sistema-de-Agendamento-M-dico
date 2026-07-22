# 🎨 Identidade Visual - CLÍNICA

## Cores Corporativas

### Paleta Principal
```
🟨 Ouro Premium:    #D4AF37
⚪ Branco:           #FFFFFF
🟤 Marrom Escuro:   #5D4037
⚫ Preto Soft:       #1A1A1A
```

### Paleta Secundária
```
🟫 Marrom Claro:    #8D6E63
🟩 Verde Trigo:     #7CB342
🟦 Azul Confiança:  #1976D2
🟥 Vermelho Alerta: #D32F2F
```

### Tons de Cinza
```
Cinza 100: #F5F5F5
Cinza 300: #E0E0E0
Cinza 500: #9E9E9E
Cinza 700: #424242
```

## Tipografia

### Headlines
- **Font:** Poppins Bold (700)
- **Uso:** Títulos, Headers, CTAs
- **Tamanho:** 24px - 42px

### Subtítulos
- **Font:** Poppins SemiBold (600)
- **Uso:** Seções, Destaques
- **Tamanho:** 16px - 20px

### Body Text
- **Font:** Inter Regular (400)
- **Uso:** Descrições, Conteúdo
- **Tamanho:** 14px - 16px

### Small Text
- **Font:** Inter Regular (400)
- **Uso:** Rodapé, Pequenos textos
- **Tamanho:** 12px

## Componentes UI

### Botões

#### Botão Primário
- Fundo: Ouro (#D4AF37)
- Texto: Preto (#1A1A1A)
- Borda: Nenhuma
- Hover: Ouro mais escuro (#B8941F)
- Padding: 12px 24px
- Border-radius: 6px

#### Botão Secundário
- Fundo: Transparente
- Texto: Ouro (#D4AF37)
- Borda: 2px sólida Ouro
- Hover: Fundo Ouro 10%
- Padding: 12px 24px
- Border-radius: 6px

#### Botão Perigo
- Fundo: Vermelho (#D32F2F)
- Texto: Branco (#FFFFFF)
- Hover: Vermelho mais escuro (#B71C1C)

### Cards
- Fundo: Branco (#FFFFFF)
- Borda: 1px sólida Cinza 300
- Sombra: 0 2px 8px rgba(0,0,0,0.1)
- Padding: 16px
- Border-radius: 8px

### Inputs
- Fundo: Cinza 100 (#F5F5F5)
- Borda: 1px sólida Cinza 300
- Foco: 2px sólida Ouro
- Padding: 12px
- Border-radius: 6px

## Iconografia

- **Estilo:** Line icons, Minimal
- **Peso:** 2px
- **Tamanho padrão:** 24px
- **Paleta:** Ouro ou Preto Soft

## Espaçamento (8px Grid)

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

## Exemplo de Layout

```html
<header>
  <!-- Logo CLÍNICA -->
  <nav style="background: #FFFFFF; border-bottom: 1px solid #E0E0E0;">
    <a style="color: #D4AF37; font-weight: 700;">CLÍNICA</a>
  </nav>
</header>

<main>
  <h1 style="color: #5D4037; font-family: Poppins; font-size: 42px;">
    Bem-vindo ao Agendamento
  </h1>
  
  <button style="background: #D4AF37; color: #1A1A1A; padding: 12px 24px;">
    Agendar Consulta
  </button>
</main>

<footer style="background: #5D4037; color: #FFFFFF;">
  © 2026 CLÍNICA - Todos os direitos reservados
</footer>
```

## Importar em CSS/TailwindCSS

```css
/* tailwind.config.js */
module.exports = {
  theme: {
    colors: {
      'trigo-gold': '#D4AF37',
      'trigo-brown': '#5D4037',
      'trigo-light': '#8D6E63',
      'trigo-white': '#FFFFFF',
    },
    fontFamily: {
      'poppins': ['Poppins', 'sans-serif'],
      'inter': ['Inter', 'sans-serif'],
    }
  }
}
```

## Importar em Flutter

```dart
// lib/theme/colors.dart
class TrigoColors {
  static const Color gold = Color(0xFFD4AF37);
  static const Color brown = Color(0xFF5D4037);
  static const Color white = Color(0xFFFFFFFF);
  static const Color darkText = Color(0xFF1A1A1A);
}

// lib/theme/theme.dart
final trigoTheme = ThemeData(
  primaryColor: TrigoColors.gold,
  fontFamily: 'Poppins',
);
```

## Usar em Componentes React

```jsx
// src/styles/colors.js
export const COLORS = {
  GOLD: '#D4AF37',
  BROWN: '#5D4037',
  WHITE: '#FFFFFF',
  DARK_TEXT: '#1A1A1A',
};

// src/styles/theme.js
import { COLORS } from './colors';

export const theme = {
  colors: COLORS,
  typography: {
    headline: 'Poppins Bold',
    body: 'Inter Regular',
  }
};
```

---

**Última atualização:** 12/06/2026  
**Desenvolvedor:** Lucas  
**Empresa:** CLÍNICA
