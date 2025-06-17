// Configuração melhorada
const LINKS_CONFIG = {
  API_KEY: "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8",
  SHEET_ID: "13_QJNE8URu8LahoEq9O6VctLdCOUVurIM94TzOTyszY",
  RANGE: "A2:C",
  CACHE_KEY: "links_cache",
  CACHE_DURATION: 15 * 60 * 1000, // 15 minutos
  INITIAL_VISIBLE: 4,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  SEARCH_DEBOUNCE: 300, // ms
};

// ✅ Classe principal para gerenciar links
class LinksManager {
  constructor() {
    this.links = [];
    this.filteredLinks = [];
    this.isShowingAll = false;
    this.isLoading = false;
    this.hasError = false;
    this.searchTerm = "";
    this.searchTimeout = null;

    // Elementos DOM
    this.elements = {
      input: document.getElementById("pesquisa-links"),
      container: document.getElementById("cards-links"),
      noResults: document.getElementById("mensagem-sem-resultado"),
      showMoreBtn: document.getElementById("ver-mais-btn"),
      collapseBtn: document.getElementById("recolher-btn"),
    };

    this.init();
  }

  async init() {
    if (!this.validateElements()) return;

    this.setupEventListeners();
    await this.loadLinks();
  }

  // ✅ NOVO: Validação de elementos DOM
  validateElements() {
    const missing = Object.entries(this.elements)
      .filter(([key, element]) => !element)
      .map(([key]) => key);

    if (missing.length > 0) {
      console.error(`Elementos DOM não encontrados: ${missing.join(", ")}`);
      return false;
    }
    return true;
  }

  // ✅ MELHORADO: Sistema de cache robusto
  getCache() {
    try {
      const cached = localStorage.getItem(LINKS_CONFIG.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp, version } = JSON.parse(cached);

      if (Date.now() - timestamp > LINKS_CONFIG.CACHE_DURATION) {
        localStorage.removeItem(LINKS_CONFIG.CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.warn("Erro ao ler cache:", error);
      localStorage.removeItem(LINKS_CONFIG.CACHE_KEY);
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
      localStorage.setItem(LINKS_CONFIG.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Erro ao salvar cache:", error);
    }
  }

  // ✅ MELHORADO: Carregamento com retry e estados
  async loadLinks() {
    try {
      this.setLoadingState(true);

      // Verificar cache primeiro
      const cachedData = this.getCache();
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        this.links = cachedData;
        this.renderLinks();
        this.setLoadingState(false);
        return;
      }

      // Buscar da API com retry
      const data = await this.retryWithBackoff(async () => {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${LINKS_CONFIG.SHEET_ID}/values/${LINKS_CONFIG.RANGE}?key=${LINKS_CONFIG.API_KEY}`;

        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      });

      if (!data.values || data.values.length === 0) {
        throw new Error("Nenhum dado encontrado na planilha");
      }

      this.links = this.processLinksData(data.values);
      this.setCache(this.links);
      this.renderLinks();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  // ✅ NOVO: Retry com backoff exponencial
  async retryWithBackoff(fn, maxRetries = LINKS_CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = LINKS_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(
          `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // ✅ MELHORADO: Processamento de dados com validação
  processLinksData(values) {
    return values
      .map((row, index) => {
        try {
          const [titulo, descricao, linkUrl] = row;

          if (!titulo?.trim() || !linkUrl?.trim()) {
            console.warn(`Linha ${index + 2} ignorada: título ou URL vazio`);
            return null;
          }

          // ✅ NOVO: Validação de URL
          if (!this.isValidUrl(linkUrl.trim())) {
            console.warn(
              `Linha ${index + 2} ignorada: URL inválida - ${linkUrl}`
            );
            return null;
          }

          return {
            id: `link-${index}-${Date.now()}`,
            titulo: titulo.trim(),
            descricao: (descricao || "").trim(),
            url: linkUrl.trim(),
            searchText: this.normalizeText(`${titulo} ${descricao || ""}`),
            isHidden: index >= LINKS_CONFIG.INITIAL_VISIBLE,
          };
        } catch (error) {
          console.warn(`Erro ao processar linha ${index + 2}:`, error);
          return null;
        }
      })
      .filter(Boolean);
  }

  // ✅ NOVO: Validação de URL
  isValidUrl(string) {
    try {
      const url = new URL(string);
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  }

  // ✅ NOVO: Normalização de texto para busca
  normalizeText(text) {
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
      this.elements.container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Carregando links úteis...</p>
        </div>
      `;
      this.hideButtons();
    }
  }

  // ✅ MELHORADO: Tratamento de erros específico
  handleError(error) {
    this.hasError = true;
    console.error("Erro ao carregar links:", error);

    let errorMessage = "Erro desconhecido ao carregar links.";

    if (error.name === "AbortError") {
      errorMessage = "Tempo limite excedido. Verifique sua conexão.";
    } else if (error.message.includes("HTTP 403")) {
      errorMessage = "Erro de autenticação. Contate o suporte.";
    } else if (error.message.includes("HTTP 404")) {
      errorMessage = "Planilha não encontrada.";
    } else if (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      errorMessage = "Erro de conexão. Verifique sua internet.";
    }

    this.elements.container.innerHTML = `
      <div class="col-span-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <div class="text-red-600 dark:text-red-400 mb-4">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <p class="font-semibold">${errorMessage}</p>
        </div>
        <button onclick="linksManager.retry()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
          Tentar Novamente
        </button>
      </div>
    `;

    this.hideButtons();
  }

  // ✅ NOVO: Método para retry manual
  async retry() {
    localStorage.removeItem(LINKS_CONFIG.CACHE_KEY);
    this.hasError = false;
    await this.loadLinks();
  }

  // ✅ MELHORADO: Renderização otimizada
  renderLinks() {
    if (this.links.length === 0) {
      this.elements.container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-gray-600 dark:text-gray-400">Nenhum link útil disponível no momento.</p>
        </div>
      `;
      this.hideButtons();
      return;
    }

    this.updateFilteredLinks();
    this.updateDisplay();
    this.updateButtonsVisibility();
  }

  // ✅ MELHORADO: Busca otimizada com debounce
  setupSearch() {
    this.elements.input.addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.searchTerm = e.target.value;
        this.updateFilteredLinks();
        this.updateDisplay();
        this.updateButtonsVisibility();
      }, LINKS_CONFIG.SEARCH_DEBOUNCE);
    });
  }

  updateFilteredLinks() {
    if (!this.searchTerm.trim()) {
      this.filteredLinks = this.links;
      return;
    }

    const searchNormalized = this.normalizeText(this.searchTerm);
    this.filteredLinks = this.links.filter((link) =>
      link.searchText.includes(searchNormalized)
    );
  }

  // ✅ MELHORADO: Display com melhor performance
  updateDisplay() {
    const linksToShow = this.filteredLinks.filter((link, index) => {
      if (this.searchTerm.trim()) return true; // Mostrar todos os resultados da busca
      return this.isShowingAll || !link.isHidden;
    });

    if (linksToShow.length === 0) {
      this.showNoResults();
      return;
    }

    this.hideNoResults();
    this.elements.container.innerHTML = linksToShow
      .map((link) => this.createLinkCard(link))
      .join("");
  }

  // ✅ MELHORADO: Criação de cards mais robusta
  createLinkCard(link) {
    const safeTitle = this.escapeHtml(link.titulo);
    const safeDescription = this.escapeHtml(link.descricao);
    const safeUrl = this.escapeHtml(link.url);

    return `
      <a href="${safeUrl}"

         rel="noopener noreferrer"
         class="group block rounded-2xl p-5 bg-white/60 dark:bg-purple-900/70 backdrop-blur border border-purple-200 dark:border-purple-700 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
         data-link-id="${link.id}">
        <h3 class="text-xl font-bold text-purple-800 dark:text-purple-300 mb-2 group-hover:underline transition-colors duration-300">
          ${safeTitle}
        </h3>
        ${
          safeDescription
            ? `
          <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors duration-300">
            ${safeDescription}
          </p>
        `
            : ""
        }
        <div class="mt-3 flex items-center text-purple-600 dark:text-purple-400 text-sm group-hover:text-purple-800 dark:group-hover:text-purple-200 transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          Acessar link
        </div>
      </a>
    `;
  }

  // ✅ NOVO: Escape HTML para segurança
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ✅ MELHORADO: Controle de botões
  updateButtonsVisibility() {
    const hasHiddenLinks = this.links.some((link) => link.isHidden);
    const isSearching = this.searchTerm.trim() !== "";

    if (hasHiddenLinks && !isSearching) {
      if (this.isShowingAll) {
        this.showCollapseButton();
      } else {
        this.showMoreButton();
      }
    } else {
      this.hideButtons();
    }
  }

  showMoreButton() {
    this.elements.showMoreBtn.classList.remove("hidden");
    this.elements.collapseBtn.classList.add("hidden");
  }

  showCollapseButton() {
    this.elements.showMoreBtn.classList.add("hidden");
    this.elements.collapseBtn.classList.remove("hidden");
  }

  hideButtons() {
    this.elements.showMoreBtn.classList.add("hidden");
    this.elements.collapseBtn.classList.add("hidden");
  }

  showNoResults() {
    this.elements.noResults.classList.remove("hidden");
    this.elements.container.innerHTML = "";
  }

  hideNoResults() {
    this.elements.noResults.classList.add("hidden");
  }

  // ✅ MELHORADO: Event listeners
  setupEventListeners() {
    this.setupSearch();

    this.elements.showMoreBtn.addEventListener("click", () => {
      this.isShowingAll = true;
      this.updateDisplay();
      this.updateButtonsVisibility();
    });

    this.elements.collapseBtn.addEventListener("click", () => {
      this.isShowingAll = false;
      this.updateDisplay();
      this.updateButtonsVisibility();

      // Scroll suave para a seção
      const section = document.getElementById("links-uteis");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // ✅ NOVO: Métodos públicos para debug
  getStats() {
    return {
      total: this.links.length,
      visible: this.filteredLinks.length,
      cached: !!this.getCache(),
      loading: this.isLoading,
      error: this.hasError,
    };
  }

  async refresh() {
    localStorage.removeItem(LINKS_CONFIG.CACHE_KEY);
    await this.loadLinks();
  }
}

// ✅ MELHORADO: Sistema de notificações
const LinksNotifications = {
  show(message, type = "info", duration = 3000) {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;

    const styles = {
      error: "bg-red-500 text-white",
      success: "bg-green-500 text-white",
      warning: "bg-yellow-500 text-black",
      info: "bg-blue-500 text-white",
    };

    notification.className += ` ${styles[type] || styles.info}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => (notification.style.transform = "translateX(0)"), 100);
    setTimeout(() => {
      notification.style.transform = "translateX(full)";
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },
};

// ✅ Inicialização global
let linksManager;

document.addEventListener("DOMContentLoaded", () => {
  try {
    linksManager = new LinksManager();
    console.log("Sistema de links inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar sistema de links:", error);
    LinksNotifications.show("Erro ao carregar sistema de links", "error");
  }
});

// ✅ Tratamento de conectividade
window.addEventListener("online", () => {
  if (linksManager && linksManager.hasError) {
    LinksNotifications.show(
      "Conexão restaurada. Recarregando links...",
      "success"
    );
    linksManager.retry();
  }
});

window.addEventListener("offline", () => {
  LinksNotifications.show("Sem conexão. Usando dados em cache.", "warning");
});

// ✅ Debug helpers (remover em produção)
window.debugLinks = {
  manager: () => linksManager,
  stats: () => linksManager?.getStats(),
  refresh: () => linksManager?.refresh(),
  clearCache: () => {
    localStorage.removeItem(LINKS_CONFIG.CACHE_KEY);
    console.log("Cache de links limpo");
  },
};
