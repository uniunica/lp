# 🌐 Landing Page – Setor de Expansão e Negócios | UniÚnica

Bem-vindo ao repositório da **Landing Page do Setor de Expansão e Negócios da UniÚnica**. Esta página serve como um hub centralizado para parceiros, polos e consultores da instituição, oferecendo acesso rápido a informações institucionais, materiais de apoio, localização dos polos e canais de contato com o setor responsável.

---

## 📌 Visite a página

**URL pública:** [https://uniunica.github.io/lp/](https://uniunica.github.io/lp/)

---

## 📂 Conteúdo da Página

A landing page está dividida em seções funcionais:

- **Home** – Apresentação institucional e boas-vindas
- **Produtos** – Acesso a materiais de divulgação dos cursos (Graduação, Pós etc.)
- **Links Úteis** – Ferramentas para o dia a dia dos polos e consultores
- **Mapa Interativo** – Visualização geográfica dos polos ativos
- **Dúvidas Frequentes** – FAQ para suporte rápido
- **Contato** – Modal interativo para localizar seu consultor via WhatsApp

---

## 🛠️ Tecnologias Utilizadas

- **HTML5**  
- **Tailwind CSS** (via CDN)  
- **Alpine.js** – Para interatividade e comportamento dinâmico  
- **Animate.css** – Animações suaves  
- **JavaScript** – Scripts personalizados (ex: modal, autocomplete)  
- **Mapa Interativo** – Scripts `mapdata.js` e `countrymap.js` personalizados

---

## ▶️ Como Usar

### 1. **Acessar**
Acesse diretamente pelo navegador via:
https://uniunica.github.io/lp/


### 2. **Navegar**
Use o menu fixo no topo da página para ir até:

- Home (`#home`)
- Produtos (`#produtos`)
- Links úteis (`#links-uteis`)
- Mapa de polos (`#mapa`)
- Dúvidas (`#duvidas`)
- Contato (`#contato`)

### 3. **Entrar em Contato**
Clique em **"Entre em contato com seu consultor"** na seção principal. Um modal será exibido pedindo seu nome. Com base nisso, o sistema sugere o consultor responsável e fornece o link direto para WhatsApp.

---

## ⚙️ Como Rodar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/uniunica/lp.git
Acesse a pasta:
cd lp
Abra o index.html no navegador:
start index.html
# ou
open index.html

🧩 Estrutura de Arquivos

📁 lp/
├── index.html          # Página principal
├── style.css           # Estilos personalizados
├── logo.png            # Logotipo do setor
├── favicon.png         # Ícone do site
├── scripts             # Scripts gerais
    ├── carteira.js     # Script do modal de carteiras
    └── duvidas.js      # Script da seção de dúvidas
    ├── formulario.js   # Script da seção de formulário
    └── links.js        # Script da seção de links úteis
    ├── maps.js         # Script da seção de mapas
    └── produtos.js     # Script da seção de produtos
└── mapa/
    ├── mapdata.js      # Dados do mapa
    └── countrymap.js   # Script de renderização do mapa
    
🖌️ Personalização
Para adaptar a página:
    Textos: Edite diretamente as seções dentro do index.html.
    Consultores: O autocomplete pode ser personalizado via script JS embutido (não incluso neste trecho).
    Produtos: A lista pode ser modificada alterando os botões no bloco #produtos, incluindo nome, links de pastas e materiais.

✨ Desenvolvido por
Equipe do Setor de Expansão e Negócios – UniÚnica
Idealizado, executado e mantido por Felipe Toledo e colaboradores.