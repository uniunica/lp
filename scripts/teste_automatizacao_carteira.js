// Configuração melhorada
const CARTEIRA_CONFIG = {
  API_KEY: "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8",
  SHEET_ID: "10y9u_paf91ZxcJIrQDo8ZCVL6iGAQHiOIv7XB5Cua1w",
  RANGE: "A2:B",
  CACHE_KEY: "parceiros_cache",
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  SEARCH_DEBOUNCE: 300,
  MAX_SUGGESTIONS: 10,
  REQUEST_TIMEOUT: 15000,
};

// ✅ Configuração de carteiras (considere mover para backend em produção)
const CARTEIRAS_CONFIG = {
  "Carteira 1": {
    numero: "+553175211620",
    cor: "bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100",
    nome: "Carteira Amarela",
  },
  "Carteira 2": {
    numero: "+553175600226",
    cor: "bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100",
    nome: "Carteira Verde",
  },
  "Carteira 4": {
    numero: "+553175273233",
    cor: "bg-pink-100 dark:bg-pink-700 text-pink-800 dark:text-pink-100",
    nome: "Carteira Rosa",
  },
  "Carteira 5": {
    numero: "+553193680179",
    cor: "bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100",
    nome: "Carteira Vermelha",
  },
  "Carteira 6": {
    numero: "+553175600175",
    cor: "bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100",
    nome: "Carteira Âmbar",
  },
  NOVATOS: {
    numero: "+553182379090",
    cor: "bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-100",
    nome: "Carteira Novatos",
  },
};

// ✅ Classe principal para gerenciar sistema de carteiras
class CarteiraManager {
  constructor() {
    this.parceiros = {};
    this.isLoading = false;
    this.hasError = false;
    this.searchTimeout = null;
    this.modalOpen = false;
    this.previousFocus = null;
    this.currentSuggestionIndex = -1;

    // Elementos DOM
    this.elements = {
      modal: document.getElementById("consultor-modal"),
      abrirModal: document.getElementById("abrir-modal"),
      nomeInput: document.getElementById("nome-parceiro"),
      listaAuto: document.getElementById("autocomplete-list"),
      contatoSection: document.getElementById("contato-section"),
      btnWhatsapp: document.getElementById("btn-whatsapp"),
      numeroVisivel: document.getElementById("numero-visivel"),
    };

    this.init();
  }

  async init() {
    if (!this.validateElements()) return;

    this.setupEventListeners();
    this.setupAccessibility();
    await this.carregarParceiros();
  }

  // ✅ NOVO: Validação de elementos DOM
  validateElements() {
    const missing = Object.entries(this.elements)
      .filter(([key, element]) => !element)
      .map(([key]) => key);

    if (missing.length > 0) {
      console.error(`Elementos DOM não encontrados: ${missing.join(", ")}`);
      this.showError("Erro de inicialização: elementos não encontrados");
      return false;
    }
    return true;
  }

  // ✅ NOVO: Configuração de acessibilidade
  setupAccessibility() {
    // Configurar modal
    this.elements.modal.setAttribute("role", "dialog");
    this.elements.modal.setAttribute("aria-modal", "true");
    this.elements.modal.setAttribute("aria-labelledby", "modal-title");
    this.elements.modal.setAttribute("aria-hidden", "true");

    // Configurar input
    this.elements.nomeInput.setAttribute("role", "combobox");
    this.elements.nomeInput.setAttribute("aria-expanded", "false");
    this.elements.nomeInput.setAttribute("aria-autocomplete", "list");
    this.elements.nomeInput.setAttribute("aria-controls", "autocomplete-list");

    // Configurar lista
    this.elements.listaAuto.setAttribute("role", "listbox");
    this.elements.listaAuto.setAttribute(
      "aria-label",
      "Sugestões de parceiros"
    );
  }

  // ✅ MELHORADO: Event listeners com acessibilidade
  setupEventListeners() {
    // Abrir modal
    this.elements.abrirModal.addEventListener("click", (e) => {
      e.preventDefault();
      this.openModal();
    });

    // Fechar modal com clique fora
    this.elements.modal.addEventListener("click", (e) => {
      if (e.target === this.elements.modal) {
        this.closeModal();
      }
    });

    // Fechar modal com Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modalOpen) {
        this.closeModal();
      }
    });

    // Busca com debounce
    this.elements.nomeInput.addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value);
      }, CARTEIRA_CONFIG.SEARCH_DEBOUNCE);
    });

    // Navegação por teclado na lista
    this.elements.nomeInput.addEventListener("keydown", (e) => {
      this.handleKeyboardNavigation(e);
    });

    // Limpar busca com Escape
    this.elements.nomeInput.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.elements.listaAuto.classList.contains("hidden")
      ) {
        e.target.value = "";
        this.clearSuggestions();
      }
    });
  }

  // ✅ NOVO: Navegação por teclado
  handleKeyboardNavigation(e) {
    const suggestions = this.elements.listaAuto.querySelectorAll("li");

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.currentSuggestionIndex = Math.min(
          this.currentSuggestionIndex + 1,
          suggestions.length - 1
        );
        this.updateSuggestionFocus(suggestions);
        break;

      case "ArrowUp":
        e.preventDefault();
        this.currentSuggestionIndex = Math.max(
          this.currentSuggestionIndex - 1,
          -1
        );
        this.updateSuggestionFocus(suggestions);
        break;

      case "Enter":
        e.preventDefault();
        if (
          this.currentSuggestionIndex >= 0 &&
          suggestions[this.currentSuggestionIndex]
        ) {
          this.selectSuggestion(
            suggestions[this.currentSuggestionIndex].textContent
          );
        }
        break;

      case "Escape":
        this.clearSuggestions();
        break;
    }
  }

  // ✅ NOVO: Atualizar foco nas sugestões
  updateSuggestionFocus(suggestions) {
    suggestions.forEach((suggestion, index) => {
      suggestion.classList.toggle(
        "bg-purple-100",
        index === this.currentSuggestionIndex
      );
      suggestion.setAttribute(
        "aria-selected",
        index === this.currentSuggestionIndex ? "true" : "false"
      );
    });

    this.elements.nomeInput.setAttribute(
      "aria-activedescendant",
      this.currentSuggestionIndex >= 0
        ? `suggestion-${this.currentSuggestionIndex}`
        : ""
    );
  }

  // ✅ MELHORADO: Abertura de modal com acessibilidade
  openModal() {
    this.previousFocus = document.activeElement;

    this.elements.modal.classList.remove("hidden");
    this.elements.modal.setAttribute("aria-hidden", "false");

    // Limpar estado
    this.elements.nomeInput.value = "";
    this.clearSuggestions();
    this.hideContact();

    // Prevenir scroll do body
    document.body.style.overflow = "hidden";

    // Focar no input
    setTimeout(() => {
      this.elements.nomeInput.focus();
    }, 100);

    this.modalOpen = true;
  }

  // ✅ MELHORADO: Fechamento de modal
  closeModal() {
    this.elements.modal.classList.add("hidden");
    this.elements.modal.setAttribute("aria-hidden", "true");

    // Restaurar scroll do body
    document.body.style.overflow = "";

    // Restaurar foco
    if (this.previousFocus) {
      this.previousFocus.focus();
    }

    this.modalOpen = false;
  }

  // ✅ MELHORADO: Sistema de cache robusto
  getCache() {
    try {
      const cached = localStorage.getItem(CARTEIRA_CONFIG.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp, version } = JSON.parse(cached);

      if (Date.now() - timestamp > CARTEIRA_CONFIG.CACHE_DURATION) {
        localStorage.removeItem(CARTEIRA_CONFIG.CACHE_KEY);
        console.log("Cache de parceiros expirado");
        return null;
      }

      console.log("Cache de parceiros válido encontrado");
      return data;
    } catch (error) {
      console.warn("Erro ao ler cache de parceiros:", error);
      localStorage.removeItem(CARTEIRA_CONFIG.CACHE_KEY);
      return null;
    }
  }

  setCache(data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: "1.0",
      };
      localStorage.setItem(
        CARTEIRA_CONFIG.CACHE_KEY,
        JSON.stringify(cacheData)
      );
      console.log("Cache de parceiros salvo");
    } catch (error) {
      console.warn("Erro ao salvar cache de parceiros:", error);
    }
  }

  // ✅ MELHORADO: Carregamento com retry e estados
  async carregarParceiros() {
    try {
      this.setLoadingState(true);

      // Verificar cache primeiro
      const cachedData = this.getCache();
      if (cachedData && Object.keys(cachedData).length > 0) {
        this.parceiros = cachedData;
        this.setLoadingState(false);
        return;
      }

      // Buscar da API com retry
      const data = await this.retryWithBackoff(async () => {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CARTEIRA_CONFIG.SHEET_ID}/values/${CARTEIRA_CONFIG.RANGE}?key=${CARTEIRA_CONFIG.API_KEY}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          CARTEIRA_CONFIG.REQUEST_TIMEOUT
        );

        try {
          const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      });

      if (!data.values || data.values.length === 0) {
        throw new Error("Nenhum parceiro encontrado na planilha");
      }

      this.parceiros = this.processParceirosData(data.values);

      if (Object.keys(this.parceiros).length === 0) {
        throw new Error("Nenhum parceiro válido encontrado");
      }

      this.setCache(this.parceiros);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  // ✅ NOVO: Retry com backoff exponencial
  async retryWithBackoff(fn, maxRetries = CARTEIRA_CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = CARTEIRA_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(
          `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // ✅ MELHORADO: Processamento de dados com validação
  processParceirosData(values) {
    const validParceiros = {};
    const errors = [];

    values.forEach((row, index) => {
      try {
        if (!row || row.length < 2) {
          errors.push(`Linha ${index + 2}: dados insuficientes`);
          return;
        }

        const [nome, carteira] = row;

        if (!nome?.trim()) {
          errors.push(`Linha ${index + 2}: nome vazio`);
          return;
        }

        if (!carteira?.trim()) {
          errors.push(`Linha ${index + 2}: carteira vazia`);
          return;
        }

        // Validar se a carteira existe na configuração
        if (!CARTEIRAS_CONFIG[carteira.trim()]) {
          errors.push(
            `Linha ${index + 2}: carteira "${carteira}" não configurada`
          );
          return;
        }

        const nomeNormalizado = this.normalizeText(nome.trim());
        validParceiros[nomeNormalizado] = {
          nomeOriginal: nome.trim(),
          carteira: carteira.trim(),
          searchText: nomeNormalizado,
        };
      } catch (error) {
        errors.push(`Linha ${index + 2}: erro ao processar - ${error.message}`);
      }
    });

    if (errors.length > 0) {
      console.warn("Erros encontrados ao processar parceiros:", errors);
    }

    console.log(
      `${Object.keys(validParceiros).length} parceiros válidos processados de ${
        values.length
      } linhas`
    );
    return validParceiros;
  }

  // ✅ NOVO: Normalização de texto
  normalizeText(text) {
    if (!text || typeof text !== "string") return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ✅ MELHORADO: Estados de loading
  setLoadingState(loading) {
    this.isLoading = loading;

    if (loading) {
      this.elements.nomeInput.disabled = true;
      this.elements.nomeInput.placeholder = "Carregando parceiros...";
    } else {
      this.elements.nomeInput.disabled = false;
      this.elements.nomeInput.placeholder = "Seu nome...";
    }
  }

  // ✅ MELHORADO: Tratamento de erros específico
  handleError(error) {
    this.hasError = true;
    console.error("Erro ao carregar parceiros:", error);

    let errorMessage = "Erro desconhecido ao carregar parceiros.";

    if (error.name === "AbortError") {
      errorMessage = "Tempo limite excedido. Verifique sua conexão.";
    } else if (error.message.includes("HTTP 403")) {
      errorMessage = "Erro de autenticação. Contate o suporte.";
    } else if (error.message.includes("HTTP 404")) {
      errorMessage = "Planilha de parceiros não encontrada.";
    } else if (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      errorMessage = "Erro de conexão. Verifique sua internet.";
    }

    this.showError(errorMessage);

    // Habilitar input mesmo com erro
    this.elements.nomeInput.disabled = false;
    this.elements.nomeInput.placeholder = "Erro ao carregar dados";
  }

  // ✅ NOVO: Exibir erro visual
  showError(message) {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full";
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg hover:opacity-70">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => (notification.style.transform = "translateX(0)"), 100);
    setTimeout(() => {
      notification.style.transform = "translateX(full)";
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // ✅ MELHORADO: Busca de parceiros
  performSearch(query) {
    if (!query || !query.trim()) {
      this.clearSuggestions();
      return;
    }

    const queryNormalized = this.normalizeText(query);
    const suggestions = Object.values(this.parceiros)
      .filter((parceiro) => parceiro.searchText.includes(queryNormalized))
      .slice(0, CARTEIRA_CONFIG.MAX_SUGGESTIONS)
      .sort((a, b) => {
        // Priorizar matches no início do nome
        const aStartsWith = a.searchText.startsWith(queryNormalized);
        const bStartsWith = b.searchText.startsWith(queryNormalized);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        return a.nomeOriginal.localeCompare(b.nomeOriginal);
      });

    this.renderSuggestions(suggestions);
  }

  // ✅ MELHORADO: Renderizar sugestões
  renderSuggestions(suggestions) {
    this.elements.listaAuto.innerHTML = "";
    this.currentSuggestionIndex = -1;

    if (suggestions.length === 0) {
      this.clearSuggestions();
      return;
    }

    const fragment = document.createDocumentFragment();

    suggestions.forEach((parceiro, index) => {
      const item = document.createElement("li");
      item.id = `suggestion-${index}`;
      item.className =
        "cursor-pointer px-3 py-2 hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors duration-200";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", "false");

      // Destacar termo de busca
      const highlightedName = this.highlightSearchTerm(
        parceiro.nomeOriginal,
        this.elements.nomeInput.value
      );

      item.innerHTML = `
        <div class="flex items-center justify-between">
          <span>${highlightedName}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">${parceiro.carteira}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        this.selectSuggestion(parceiro.nomeOriginal);
      });

      fragment.appendChild(item);
    });

    this.elements.listaAuto.appendChild(fragment);
    this.elements.listaAuto.classList.remove("hidden");
    this.elements.nomeInput.setAttribute("aria-expanded", "true");
  }

  // ✅ NOVO: Destacar termo de busca
  highlightSearchTerm(text, term) {
    if (!term) return this.escapeHtml(text);

    const escapedText = this.escapeHtml(text);
    const escapedTerm = this.escapeHtml(term);
    const regex = new RegExp(`(${escapedTerm})`, "gi");

    return escapedText.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-600">$1</mark>'
    );
  }

  // ✅ NOVO: Escape HTML
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ✅ MELHORADO: Selecionar sugestão
  selectSuggestion(nome) {
    this.elements.nomeInput.value = nome;
    this.clearSuggestions();
    this.mostrarContato(nome);
  }

  // ✅ MELHORADO: Limpar sugestões
  clearSuggestions() {
    this.elements.listaAuto.innerHTML = "";
    this.elements.listaAuto.classList.add("hidden");
    this.elements.nomeInput.setAttribute("aria-expanded", "false");
    this.currentSuggestionIndex = -1;
  }

  // ✅ MELHORADO: Mostrar contato
  mostrarContato(nome) {
    try {
      const nomeNormalizado = this.normalizeText(nome);
      const parceiro = this.parceiros[nomeNormalizado];

      if (!parceiro) {
        this.showError("Parceiro não encontrado");
        return;
      }

      const carteiraConfig = CARTEIRAS_CONFIG[parceiro.carteira];
      if (!carteiraConfig) {
        this.showError("Configuração da carteira não encontrada");
        return;
      }

      // Atualizar informações do contato
      this.updateContactInfo(carteiraConfig, parceiro);

      // Mostrar seção de contato
      this.elements.contatoSection.classList.remove("hidden");

      // Anunciar para screen readers
      this.announceContact(parceiro, carteiraConfig);
    } catch (error) {
      console.error("Erro ao mostrar contato:", error);
      this.showError("Erro ao exibir informações do contato");
    }
  }

  // ✅ NOVO: Atualizar informações do contato
  updateContactInfo(carteiraConfig, parceiro) {
    // Atualizar número visível
    this.elements.numeroVisivel.textContent = carteiraConfig.numero;

    // Remover classes de cor anteriores
    this.elements.numeroVisivel.className =
      "mt-3 px-3 py-2 border rounded-lg text-sm font-medium select-text cursor-pointer transition duration-200";

    // Adicionar nova cor
    if (carteiraConfig.cor) {
      this.elements.numeroVisivel.className += ` ${carteiraConfig.cor}`;
    }

    // Atualizar link do WhatsApp
    const whatsappUrl = `https://wa.me/${carteiraConfig.numero}`;
    this.elements.btnWhatsapp.href = whatsappUrl;
    this.elements.btnWhatsapp.setAttribute(
      "aria-label",
      `Conversar com ${parceiro.nomeOriginal} via WhatsApp`
    );

    // Configurar seleção de texto
    this.elements.numeroVisivel.onclick = () => {
      this.selectText(this.elements.numeroVisivel);
    };
  }

  // ✅ MELHORADO: Seleção de texto
  selectText(element) {
    try {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      // Feedback visual
      element.classList.add("bg-blue-100");
      setTimeout(() => {
        element.classList.remove("bg-blue-100");
      }, 1000);
    } catch (error) {
      console.error("Erro ao selecionar texto:", error);
    }
  }

  // ✅ NOVO: Anunciar contato para acessibilidade
  announceContact(parceiro, carteiraConfig) {
    const announcement = `Contato encontrado: ${parceiro.nomeOriginal}, ${carteiraConfig.nome}, número ${carteiraConfig.numero}`;

    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.textContent = announcement;

    document.body.appendChild(announcer);
    setTimeout(() => announcer.remove(), 1000);
  }

  // ✅ NOVO: Ocultar contato
  hideContact() {
    this.elements.contatoSection.classList.add("hidden");
    this.elements.numeroVisivel.textContent = "";
    this.elements.btnWhatsapp.href = "#";
  }

  // ✅ NOVO: Método para retry manual
  async retry() {
    localStorage.removeItem(CARTEIRA_CONFIG.CACHE_KEY);
    this.hasError = false;
    await this.carregarParceiros();
  }

  // ✅ NOVO: Métodos públicos para controle
  getStats() {
    return {
      totalParceiros: Object.keys(this.parceiros).length,
      totalCarteiras: Object.keys(CARTEIRAS_CONFIG).length,
      cached: !!this.getCache(),
      loading: this.isLoading,
      error: this.hasError,
      modalOpen: this.modalOpen,
    };
  }

  async refresh() {
    localStorage.removeItem(CARTEIRA_CONFIG.CACHE_KEY);
    await this.carregarParceiros();
  }

  exportParceiros() {
    const dataStr = JSON.stringify(this.parceiros, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "parceiros_export.json";
    link.click();
    URL.revokeObjectURL(url);
  }
}

// ✅ Função global para compatibilidade
function fecharModal() {
  if (carteiraManager) {
    carteiraManager.closeModal();
  }
}

// ✅ Instância global
let carteiraManager;

// ✅ Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  try {
    carteiraManager = new CarteiraManager();
    console.log("Sistema de carteiras inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar sistema de carteiras:", error);
  }
});

// ✅ Tratamento de conectividade
window.addEventListener("online", () => {
  if (carteiraManager && carteiraManager.hasError) {
    console.log("Conexão restaurada, recarregando parceiros...");
    carteiraManager.retry();
  }
});

window.addEventListener("offline", () => {
  console.log("Conexão perdida, usando dados em cache");
});

// ✅ Debug helpers (remover em produção)
window.debugCarteira = {
  manager: () => carteiraManager,
  stats: () => carteiraManager?.getStats(),
  refresh: () => carteiraManager?.refresh(),
  export: () => carteiraManager?.exportParceiros(),
  clearCache: () => {
    localStorage.removeItem(CARTEIRA_CONFIG.CACHE_KEY);
    console.log("Cache de parceiros limpo");
  },
};
