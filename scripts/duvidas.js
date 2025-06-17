// Configuração da API do Google Sheets
const FAQ_CONFIG = {
  API_KEY: "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8", // ⚠️ Manter seguro em produção
  SHEET_ID: "1L4hYbKU17cqu0QmjdgbcB-UYtKZ5GbUL7OJJpN1eQj4",
  RANGE: "A2:D",
  CACHE_KEY: "faq_cache",
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

// Utilitários
const Utils = {
  // Normaliza texto para busca
  normalizeText(text) {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  // Valida estrutura de dados
  validateFaqData(data) {
    return (
      data &&
      data.values &&
      Array.isArray(data.values) &&
      data.values.length > 0
    );
  },

  // Sistema de cache melhorado
  setCache(key, data) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      version: "1.0", // Para controle de versão do cache
    };
    try {
      localStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`Cache salvo: ${key}`);
    } catch (error) {
      console.warn("Erro ao salvar cache:", error);
      // Tentar limpar cache antigo se estiver cheio
      try {
        localStorage.clear();
        localStorage.setItem(key, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error("Erro crítico no cache:", retryError);
      }
    }
  },

  getCache(key, maxAge) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, version } = JSON.parse(cached);

      // Verificar se cache expirou
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(key);
        console.log(`Cache expirado removido: ${key}`);
        return null;
      }

      console.log(`Cache válido encontrado: ${key}`);
      return data;
    } catch (error) {
      console.warn("Erro ao ler cache:", error);
      // Limpar cache corrompido
      localStorage.removeItem(key);
      return null;
    }
  },

  // ✅ NOVO: Função para retry com backoff
  async retryWithBackoff(fn, maxRetries = FAQ_CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = FAQ_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(
          `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  },

  // ✅ NOVO: Sanitizar HTML básico
  sanitizeHtml(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Permitir apenas links seguros
    const links = temp.querySelectorAll("a");
    links.forEach((link) => {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");

      // Validar URL
      try {
        const url = new URL(link.href);
        if (!["http:", "https:"].includes(url.protocol)) {
          link.remove();
        }
      } catch {
        link.remove();
      }
    });

    return temp.innerHTML;
  },
};

// Função principal melhorada
function faqSearch() {
  return {
    // Estado
    search: "",
    selected: null,
    visibleCount: 5,
    faqs: [],

    // Estados de carregamento
    isLoading: true,
    hasError: false,
    errorMessage: "",
    retryCount: 0,

    // Inicialização
    async init() {
      await this.loadFaqsFromSheet();
    },

    // ✅ MELHORADO: Carregamento com retry automático
    async loadFaqsFromSheet() {
      try {
        this.isLoading = true;
        this.hasError = false;
        this.errorMessage = "";

        // Verificar cache primeiro
        const cachedData = Utils.getCache(
          FAQ_CONFIG.CACHE_KEY,
          FAQ_CONFIG.CACHE_DURATION
        );
        if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
          this.faqs = cachedData;
          this.isLoading = false;
          console.log("Dados carregados do cache");
          return;
        }

        // Buscar dados da API com retry
        const data = await Utils.retryWithBackoff(async () => {
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${FAQ_CONFIG.SHEET_ID}/values/${FAQ_CONFIG.RANGE}?key=${FAQ_CONFIG.API_KEY}`;

          const response = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            // ✅ NOVO: Timeout para evitar travamento
            signal: AbortSignal.timeout(10000), // 10 segundos
          });

          if (!response.ok) {
            throw new Error(
              `Erro HTTP: ${response.status} - ${response.statusText}`
            );
          }

          return await response.json();
        });

        // Validação robusta de dados
        if (!Utils.validateFaqData(data)) {
          throw new Error("Dados inválidos recebidos da planilha");
        }

        // Processar dados com validação
        this.faqs = this.processFaqData(data.values);

        if (this.faqs.length === 0) {
          throw new Error("Nenhuma FAQ válida encontrada");
        }

        // Salvar no cache
        Utils.setCache(FAQ_CONFIG.CACHE_KEY, this.faqs);
        console.log(`${this.faqs.length} FAQs carregadas com sucesso`);
      } catch (error) {
        console.error("Erro ao carregar dúvidas:", error);
        this.handleLoadError(error);
      } finally {
        this.isLoading = false;
      }
    },

    // ✅ MELHORADO: Processamento de dados mais robusto
    processFaqData(values) {
      if (!Array.isArray(values)) {
        console.warn("Valores não são um array:", values);
        return [];
      }

      return values
        .filter((row, index) => {
          if (!row || !Array.isArray(row) || row.length < 2) {
            console.warn(`Linha ${index + 2} ignorada: formato inválido`);
            return false;
          }
          return true;
        })
        .map((row, index) => {
          try {
            const [pergunta, ignorar, link, resposta] = row;

            // Validação mais rigorosa
            if (!pergunta?.trim() || !resposta?.trim()) {
              console.warn(
                `Linha ${index + 2} ignorada: pergunta ou resposta vazia`
              );
              return null;
            }

            // Formatar resposta com link se existir
            let respostaFormatada = resposta.trim();

            if (link && link.trim()) {
              const linkLimpo = link.trim();
              respostaFormatada = resposta.replace(
                /{link}/g,
                `<a href="${linkLimpo}" class="text-purple-600 dark:text-purple-400 underline hover:text-purple-800 dark:hover:text-purple-300 transition-colors duration-200"  rel="noopener noreferrer">${linkLimpo}</a>`
              );
            }

            // Sanitizar HTML
            respostaFormatada = Utils.sanitizeHtml(respostaFormatada);

            return {
              id: `faq-${index}-${Date.now()}`, // ID mais único
              pergunta: pergunta.trim(),
              resposta: respostaFormatada,
              searchText: Utils.normalizeText(`${pergunta} ${resposta}`),
              originalIndex: index,
            };
          } catch (error) {
            console.warn(`Erro ao processar linha ${index + 2}:`, error);
            return null;
          }
        })
        .filter(Boolean); // Remove itens nulos
    },

    // ✅ MELHORADO: Tratamento de erros mais específico
    handleLoadError(error) {
      this.hasError = true;
      this.retryCount++;

      // Mensagens de erro mais específicas
      if (error.name === "AbortError") {
        this.errorMessage = "Tempo limite excedido. Verifique sua conexão.";
      } else if (
        error.message.includes("API Key") ||
        error.message.includes("403")
      ) {
        this.errorMessage = "Erro de autenticação. Contate o suporte.";
      } else if (error.message.includes("404")) {
        this.errorMessage =
          "Planilha não encontrada. Verifique a configuração.";
      } else if (error.message.includes("HTTP")) {
        this.errorMessage = `Erro de conexão (${error.message}). Tente novamente.`;
      } else if (
        error.message.includes("NetworkError") ||
        error.message.includes("Failed to fetch")
      ) {
        this.errorMessage =
          "Erro de rede. Verifique sua conexão com a internet.";
      } else {
        this.errorMessage = "Erro ao carregar dúvidas. Usando dados padrão.";
      }

      // Usar dados padrão como fallback
      this.faqs = this.getDefaultFaqs();
      console.log("Usando FAQs padrão como fallback");
    },

    // ✅ MELHORADO: Busca com destaque de termos
    get filteredFaqs() {
      if (!this.search.trim()) return this.faqs;

      const searchTerm = Utils.normalizeText(this.search);
      const searchWords = searchTerm
        .split(" ")
        .filter((word) => word.length > 2);

      return this.faqs
        .filter((faq) => {
          // Busca por palavras individuais para melhor precisão
          return searchWords.some((word) => faq.searchText.includes(word));
        })
        .sort((a, b) => {
          // Priorizar matches na pergunta
          const aInQuestion = Utils.normalizeText(a.pergunta).includes(
            searchTerm
          );
          const bInQuestion = Utils.normalizeText(b.pergunta).includes(
            searchTerm
          );

          if (aInQuestion && !bInQuestion) return -1;
          if (!aInQuestion && bInQuestion) return 1;
          return 0;
        });
    },

    get limitedFaqs() {
      return this.filteredFaqs.slice(0, this.visibleCount);
    },

    get hasMoreFaqs() {
      return this.filteredFaqs.length > this.visibleCount;
    },

    get searchResultsCount() {
      return this.filteredFaqs.length;
    },

    // ✅ MELHORADO: Controle de paginação
    showMore() {
      const remaining = this.filteredFaqs.length - this.visibleCount;
      this.visibleCount += Math.min(5, remaining);
    },

    showAll() {
      this.visibleCount = this.filteredFaqs.length;
    },

    resetVisible() {
      this.visibleCount = 5;
      this.selected = null;
    },

    // ✅ NOVO: Limpar pesquisa
    clearSearch() {
      this.search = "";
      this.resetVisible();
    },

    // ✅ MELHORADO: Método para recarregar dados
    async refreshFaqs() {
      localStorage.removeItem(FAQ_CONFIG.CACHE_KEY);
      this.retryCount = 0;
      await this.loadFaqsFromSheet();
    },

    // ✅ NOVO: Alternar FAQ
    toggleFaq(index) {
      this.selected = this.selected === index ? null : index;
    },

  };
}

// ✅ MELHORADO: Sistema de notificações mais robusto
const FaqNotifications = {
  show(message, type = "info", duration = 4000) {
    // Remover notificações existentes do mesmo tipo
    const existing = document.querySelectorAll(`.faq-notification-${type}`);
    existing.forEach((el) => el.remove());

    const notification = document.createElement("div");
    notification.className = `faq-notification-${type} fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;

    // Estilos baseados no tipo
    const styles = {
      error: "bg-red-500 text-white border-l-4 border-red-700",
      success: "bg-green-500 text-white border-l-4 border-green-700",
      warning: "bg-yellow-500 text-black border-l-4 border-yellow-700",
      info: "bg-blue-500 text-white border-l-4 border-blue-700",
    };

    notification.className += ` ${styles[type] || styles.info}`;

    // Ícones
    const icons = {
      error: "❌",
      success: "✅",
      warning: "⚠️",
      info: "ℹ️",
    };

    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2 text-lg">${icons[type] || icons.info}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg hover:opacity-70">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animação de entrada
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Remoção automática
    setTimeout(() => {
      notification.style.transform = "translateX(full)";
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },
};

// ✅ MELHORADO: Inicialização mais robusta
document.addEventListener("DOMContentLoaded", () => {
  // Verificar dependências
  if (typeof Alpine === "undefined") {
    console.error(
      "Alpine.js não encontrado. Certifique-se de que está carregado antes deste script."
    );
    FaqNotifications.show("Erro de dependência. Recarregue a página.", "error");
    return;
  }

  // Verificar suporte a localStorage
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
  } catch (error) {
    console.warn("localStorage não disponível, cache desabilitado");
  }

  console.log("Sistema de FAQ inicializado com sucesso");
});

// ✅ MELHORADO: Tratamento de erros globais
window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason &&
    event.reason.message &&
    (event.reason.message.includes("FAQ") ||
      event.reason.message.includes("sheets"))
  ) {
    console.error("Erro não tratado no sistema de FAQ:", event.reason);
    FaqNotifications.show(
      "Erro inesperado no sistema de dúvidas. Tente recarregar a página.",
      "error"
    );
    event.preventDefault(); // Evitar que o erro apareça no console do usuário
  }
});

// ✅ NOVO: Detectar mudanças de conectividade
window.addEventListener("online", () => {
  console.log("Conexão restaurada");
  FaqNotifications.show(
    "Conexão restaurada. Dados atualizados.",
    "success",
    2000
  );
});

window.addEventListener("offline", () => {
  console.log("Conexão perdida");
  FaqNotifications.show("Sem conexão. Usando dados em cache.", "warning", 3000);
});

// ✅ NOVO: Função utilitária para debug (remover em produção)
window.debugFaq = {
  clearCache: () => {
    localStorage.removeItem(FAQ_CONFIG.CACHE_KEY);
    console.log("Cache limpo");
  },
  showCache: () => {
    const cache = Utils.getCache(FAQ_CONFIG.CACHE_KEY, Infinity);
    console.log("Cache atual:", cache);
  },
  forceReload: async () => {
    const faqInstance = document.querySelector("[x-data]").__x.$data;
    if (faqInstance && faqInstance.refreshFaqs) {
      await faqInstance.refreshFaqs();
    }
  },
};
