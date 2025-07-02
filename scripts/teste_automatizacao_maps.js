// Configuração melhorada
const MAPS_CONFIG = {
  API_KEY: "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8",
  SHEET_ID: "1IxAnU18qxiEf-TjvqBEEj9L1W3CsY3-DHDxREV4APmk",
  RANGE: "A2:N",
  CACHE_KEY: "polos_cache",
  CACHE_DURATION: 60 * 60 * 1000, // 1 hora (polos não mudam frequentemente)
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  SEARCH_DEBOUNCE: 300,
  REQUEST_TIMEOUT: 15000, // 15 segundos
};

// ✅ Classe principal para gerenciar mapas e polos
class MapsManager {
  constructor() {
    this.polos = [];
    this.filteredPolos = [];
    this.isLoading = false;
    this.hasError = false;
    this.searchTimeout = null;

    // Elementos DOM
    this.elements = {
      searchInput: document.getElementById("city-search"),
      locationList: document.getElementById("location-list"),
    };

    this.init();
  }

  async init() {
    if (!this.validateElements()) return;
    if (!this.validateDependencies()) return;

    this.setupEventListeners();
    await this.loadPolos();
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

  // ✅ NOVO: Validação de dependências externas
  validateDependencies() {
    if (typeof simplemaps_countrymap_mapdata === "undefined") {
      console.error("Dependência simplemaps_countrymap_mapdata não encontrada");
      this.showError("Erro: biblioteca de mapas não carregada");
      return false;
    }
    return true;
  }

  // ✅ MELHORADO: Sistema de cache robusto
  getCache() {
    try {
      const cached = localStorage.getItem(MAPS_CONFIG.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp, version } = JSON.parse(cached);

      if (Date.now() - timestamp > MAPS_CONFIG.CACHE_DURATION) {
        localStorage.removeItem(MAPS_CONFIG.CACHE_KEY);
        console.log("Cache de polos expirado");
        return null;
      }

      console.log("Cache de polos válido encontrado");
      return data;
    } catch (error) {
      console.warn("Erro ao ler cache de polos:", error);
      localStorage.removeItem(MAPS_CONFIG.CACHE_KEY);
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
      localStorage.setItem(MAPS_CONFIG.CACHE_KEY, JSON.stringify(cacheData));
      console.log("Cache de polos salvo");
    } catch (error) {
      console.warn("Erro ao salvar cache de polos:", error);
    }
  }

  // ✅ MELHORADO: Carregamento com retry e estados
  async loadPolos() {
    try {
      this.setLoadingState(true);

      // Verificar cache primeiro
      const cachedData = this.getCache();
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        this.polos = cachedData;
        this.updateMapData();
        this.renderLocationList();
        this.setLoadingState(false);
        return;
      }

      // Buscar da API com retry
      const data = await this.retryWithBackoff(async () => {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${MAPS_CONFIG.SHEET_ID}/values/${MAPS_CONFIG.RANGE}?key=${MAPS_CONFIG.API_KEY}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          MAPS_CONFIG.REQUEST_TIMEOUT
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
        throw new Error("Nenhum polo encontrado na planilha");
      }

      this.polos = this.processPolosData(data.values);

      if (this.polos.length === 0) {
        throw new Error("Nenhum polo válido encontrado");
      }

      this.setCache(this.polos);
      this.updateMapData();
      this.renderLocationList();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  // ✅ NOVO: Retry com backoff exponencial
  async retryWithBackoff(fn, maxRetries = MAPS_CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = MAPS_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(
          `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // ✅ MELHORADO: Processamento de dados com validação rigorosa
  processPolosData(rows) {
    const validPolos = [];
    const errors = [];

    rows.forEach((row, index) => {
      try {
        // Validar se a linha tem dados suficientes
        if (!row || row.length < 14) {
          errors.push(`Linha ${index + 2}: dados insuficientes`);
          return;
        }

        const polo = this.extractPoloData(row, index);

        if (this.validatePolo(polo, index + 2)) {
          validPolos.push(polo);
        } else {
          errors.push(`Linha ${index + 2}: dados inválidos`);
        }
      } catch (error) {
        errors.push(`Linha ${index + 2}: erro ao processar - ${error.message}`);
      }
    });

    if (errors.length > 0) {
      console.warn("Erros encontrados ao processar polos:", errors);
    }

    console.log(
      `${validPolos.length} polos válidos processados de ${rows.length} linhas`
    );
    return validPolos;
  }

  // ✅ NOVO: Extração de dados do polo
  extractPoloData(row, index) {
    const [
      name,
      ,
      responsavel,
      endereco,
      cidade,
      estado,
      cep,
      telefone,
      email,
      ,
      ,
      ,
      lat,
      lng,
    ] = row;

    return {
      id: `polo_${index}_${Date.now()}`,
      name: (name || "").trim(),
      responsavel: (responsavel || "").trim(),
      endereco: (endereco || "").trim(),
      cidade: (cidade || "").trim(),
      estado: (estado || "").trim(),
      cep: (cep || "").trim(),
      telefone: (telefone || "").trim(),
      email: (email || "").trim(),
      lat: this.parseCoordinate(lat),
      lng: this.parseCoordinate(lng),
      searchText: this.normalizeText(
        `${name} ${cidade} ${estado} ${responsavel}`
      ),
    };
  }

  // ✅ NOVO: Parse seguro de coordenadas
  parseCoordinate(value) {
    if (value === undefined || value === null || value === "") return NaN;

    const parsed = parseFloat(value);
    return isNaN(parsed) ? NaN : parsed;
  }

  // ✅ NOVO: Validação de polo
  validatePolo(polo, lineNumber) {
    const errors = [];

    if (!polo.name) {
      errors.push("Nome obrigatório");
    }

    if (isNaN(polo.lat) || isNaN(polo.lng)) {
      errors.push("Coordenadas inválidas");
    }

    // Validar range de coordenadas para Brasil
    if (!isNaN(polo.lat) && (polo.lat < -35 || polo.lat > 6)) {
      errors.push("Latitude fora do range do Brasil");
    }

    if (!isNaN(polo.lng) && (polo.lng < -75 || polo.lng > -30)) {
      errors.push("Longitude fora do range do Brasil");
    }

    // Validar email se fornecido
    if (polo.email && !this.isValidEmail(polo.email)) {
      errors.push("Email inválido");
    }

    if (errors.length > 0) {
      console.warn(`Linha ${lineNumber}: ${errors.join(", ")}`);
      return false;
    }

    return true;
  }

  // ✅ NOVO: Validação de email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ✅ NOVO: Normalização de texto melhorada
  normalizeText(text) {
    if (!text) return "";
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
      this.elements.locationList.innerHTML = `
        <li class="p-4 text-center">
          <div class="flex flex-col items-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
            <span class="text-gray-600 dark:text-gray-400">Carregando polos...</span>
          </div>
        </li>
      `;
      this.elements.searchInput.disabled = true;
    } else {
      this.elements.searchInput.disabled = false;
    }
  }

  // ✅ MELHORADO: Tratamento de erros específico
  handleError(error) {
    this.hasError = true;
    console.error("Erro ao carregar polos:", error);

    let errorMessage = "Erro desconhecido ao carregar polos.";
    let actionButton = "";

    if (error.name === "AbortError") {
      errorMessage = "Tempo limite excedido. Verifique sua conexão.";
      actionButton = `<button onclick="mapsManager.retry()" class="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors">Tentar Novamente</button>`;
    } else if (error.message.includes("HTTP 403")) {
      errorMessage = "Erro de autenticação. Contate o suporte.";
    } else if (error.message.includes("HTTP 404")) {
      errorMessage = "Planilha de polos não encontrada.";
    } else if (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      errorMessage = "Erro de conexão. Verifique sua internet.";
      actionButton = `<button onclick="mapsManager.retry()" class="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors">Tentar Novamente</button>`;
    }

    this.showError(errorMessage, actionButton);
  }

  // ✅ NOVO: Exibir erro visual
  showError(message, actionButton = "") {
    this.elements.locationList.innerHTML = `
      <li class="p-4 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="text-red-600 dark:text-red-400">
          <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <p class="font-medium">${message}</p>
          ${actionButton}
        </div>
      </li>
    `;
  }

  // ✅ NOVO: Método para retry manual
  async retry() {
    localStorage.removeItem(MAPS_CONFIG.CACHE_KEY);
    this.hasError = false;
    await this.loadPolos();
  }

  // ✅ MELHORADO: Atualização de dados do mapa
  updateMapData() {
    try {
      const locations = {};

      this.polos.forEach((polo, index) => {
        locations[polo.id] = {
          name: polo.name,
          description: this.formatPoloDescription(polo),
          lat: polo.lat,
          lng: polo.lng,
        };
      });

      simplemaps_countrymap_mapdata.locations = locations;
      console.log(`${Object.keys(locations).length} polos adicionados ao mapa`);
    } catch (error) {
      console.error("Erro ao atualizar dados do mapa:", error);
    }
  }

  // ✅ MELHORADO: Formatação da descrição do polo
  formatPoloDescription(polo) {
    const fields = [
      { label: "Responsável", value: polo.responsavel },
      { label: "Endereço", value: polo.endereco },
      { label: "Cidade", value: polo.cidade },
      { label: "Estado", value: polo.estado },
      { label: "CEP", value: polo.cep },
      { label: "Telefone", value: polo.telefone },
      { label: "E-mail", value: polo.email },
    ];

    return fields
      .filter((field) => field.value)
      .map(
        (field) =>
          `<strong>${field.label}:</strong> ${this.escapeHtml(field.value)}`
      )
      .join("<br>");
  }

  // ✅ NOVO: Escape HTML para segurança
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ✅ MELHORADO: Renderização da lista
  renderLocationList(polosList = null) {
    const polos = polosList || this.polos;

    this.elements.locationList.innerHTML = "";

    if (polos.length === 0) {
      this.showEmptyState();
      return;
    }

    const fragment = document.createDocumentFragment();

    polos.forEach((polo) => {
      const li = this.createPoloListItem(polo);
      fragment.appendChild(li);
    });

    this.elements.locationList.appendChild(fragment);
  }

  // ✅ NOVO: Estado vazio
  showEmptyState() {
    const emptyLi = document.createElement("li");
    emptyLi.className =
      "p-4 text-gray-500 dark:text-gray-400 italic text-center";
    emptyLi.innerHTML = `
      <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <p>Nenhum polo encontrado, clique no botão abaixo para localizar o polo mais próximo</p>
    `;
    this.elements.locationList.appendChild(emptyLi);
  }

  // ✅ MELHORADO: Criação de item da lista
  createPoloListItem(polo) {
    const li = document.createElement("li");
    li.className =
      "px-4 py-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer transition-colors duration-200 border-b border-purple-100 dark:border-purple-800 last:border-b-0";

    li.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3"></div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-purple-800 dark:text-purple-300 truncate">${this.escapeHtml(
            polo.name
          )}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            ${polo.endereco ? ` End.: ${this.escapeHtml(polo.endereco)}` : ""}
            ${polo.cep ? ` - CEP: ${this.escapeHtml(polo.cep)}` : ""}
          </p>
          ${
            polo.responsavel
              ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Resp.: ${this.escapeHtml(
                  polo.responsavel
                )}</p>`
              : ""
          }
          ${
            polo.telefone
              ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Tel.: ${this.escapeHtml(
                  polo.telefone
                )}</p>`
              : ""
          }
          ${
            polo.email
              ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Email: ${this.escapeHtml(
                  polo.email
                )}</p>`
              : ""
          }
        </div>
        <div class="flex-shrink-0 ml-2">
          <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    `;

    li.addEventListener("click", () => {
      this.focusCityOnMap(polo.name);
    });

    return li;
  }

  // ✅ MELHORADO: Foco no mapa
  focusCityOnMap(cityName) {
    try {
      if (typeof focusCityOnMap === "function") {
        focusCityOnMap(cityName);
      } else {
        console.warn("Função focusCityOnMap não encontrada");
      }
    } catch (error) {
      console.error("Erro ao focar no mapa:", error);
    }
  }

  // ✅ MELHORADO: Busca com debounce
  setupEventListeners() {
    this.elements.searchInput.addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value);
      }, MAPS_CONFIG.SEARCH_DEBOUNCE);
    });

    // Limpar busca com Escape
    this.elements.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.target.value = "";
        this.performSearch("");
      }
    });
  }

  // ✅ NOVO: Execução da busca
  performSearch(query) {
    const normalizedQuery = this.normalizeText(query);

    if (!normalizedQuery) {
      this.renderLocationList();
      return;
    }

    const filtered = this.polos.filter((polo) =>
      polo.searchText.includes(normalizedQuery)
    );

    this.renderLocationList(filtered);
  }

  // ✅ NOVO: Métodos públicos para debug e controle
  getStats() {
    return {
      total: this.polos.length,
      cached: !!this.getCache(),
      loading: this.isLoading,
      error: this.hasError,
    };
  }

  async refresh() {
    localStorage.removeItem(MAPS_CONFIG.CACHE_KEY);
    await this.loadPolos();
  }

  exportPolos() {
    const dataStr = JSON.stringify(this.polos, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "polos_export.json";
    link.click();
    URL.revokeObjectURL(url);
  }
}

// ✅ Sistema de notificações
const MapsNotifications = {
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
let mapsManager;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    mapsManager = new MapsManager();
    console.log("Sistema de mapas inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar sistema de mapas:", error);
    MapsNotifications.show("Erro ao carregar sistema de mapas", "error");
  }
});

// ✅ Tratamento de conectividade
window.addEventListener("online", () => {
  if (mapsManager && mapsManager.hasError) {
    MapsNotifications.show(
      "Conexão restaurada. Recarregando polos...",
      "success"
    );
    mapsManager.retry();
  }
});

window.addEventListener("offline", () => {
  MapsNotifications.show("Sem conexão. Usando dados em cache.", "warning");
});

// ✅ Debug helpers (remover em produção)
window.debugMaps = {
  manager: () => mapsManager,
  stats: () => mapsManager?.getStats(),
  refresh: () => mapsManager?.refresh(),
  export: () => mapsManager?.exportPolos(),
  clearCache: () => {
    localStorage.removeItem(MAPS_CONFIG.CACHE_KEY);
    console.log("Cache de polos limpo");
  },
};
