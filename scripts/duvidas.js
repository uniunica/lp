// Configuração da API do Google Sheets
const FAQ_API_KEY = "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8";
const FAQ_SHEET_ID = "1L4hYbKU17cqu0QmjdgbcB-UYtKZ5GbUL7OJJpN1eQj4";
const FAQ_RANGE = "A2:C"; // Colunas: Pergunta, Resposta, Link (opcional)

// Função principal para carregar e gerenciar as dúvidas
function faqSearch() {
  return {
    search: "",
    selected: null,
    visibleCount: 5,
    faqs: [], // Inicialmente vazio - será preenchido pelo carregamento

    // Inicialização
    async init() {
      await this.loadFaqsFromSheet();
    },

    // Carrega dados da planilha
    async loadFaqsFromSheet() {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${FAQ_SHEET_ID}/values/${FAQ_RANGE}?key=${FAQ_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        this.faqs = data.values.map((row) => {
          const [pergunta, resposta, link] = row;
          // Formata a resposta incluindo o link se existir
          const respostaFormatada = link
            ? resposta.replace(
                /{link}/g,
                `<a href="${link}" class="text-purple-600 underline" target="_blank">${link}</a>`
              )
            : resposta;

          return {
            pergunta: pergunta.trim(),
            resposta: respostaFormatada,
          };
        });
      } catch (error) {
        console.error("Erro ao carregar dúvidas:", error);
        // Fallback para dúvidas padrão caso ocorra erro
        this.faqs = getDefaultFaqs();
      }
    },

    get filteredFaqs() {
      const keyword = this.search
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!keyword) return this.faqs;

      return this.faqs.filter(
        (f) =>
          f.pergunta
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(keyword) ||
          f.resposta
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(keyword)
      );
    },

    get limitedFaqs() {
      return this.filteredFaqs.slice(0, this.visibleCount);
    },

    showMore() {
      this.visibleCount += 5;
    },

    resetVisible() {
      this.visibleCount = 5;
    },
  };
}

// Dúvidas padrão (fallback)
function getDefaultFaqs() {
  return [
    {
      pergunta: "Onde encontro os preços atuais dos nossos produtos?",
      resposta:
        'Temos um drive contendo as informações referentes ao regulamento, clique no <a href="https://drive.google.com/file/d/1FT2CSUpwZtIdP71-wCZPEHAfDGy2xRrN/view?usp=sharing" class="text-purple-600 underline">regulamento</a>.',
    },
    // ... outras dúvidas padrão
  ];
}

// Inicializa o carregamento quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  // Você pode adicionar qualquer inicialização adicional aqui se necessário
});
