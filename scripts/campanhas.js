// ✅ Configuração para campanhas do Google Drive
const CAMPANHAS_CONFIG = {
  FOLDER_ID: "1z13CoSg8w5PmNqlFaiHoTRzOu7YVBQUT",
  API_KEY: "AIzaSyCRSFeco4JJ8uyptRcdIw---kOmoZNwfpM",
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutos
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // Tipos de arquivo suportados
  SUPPORTED_TYPES: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.presentation",
    "application/vnd.google-apps.spreadsheet",
  ],

  // Ícones por tipo de arquivo
  FILE_ICONS: {
    "application/pdf": "📄",
    "image/jpeg": "🖼️",
    "image/png": "🖼️",
    "image/gif": "🎞️",
    "image/webp": "🖼️",
    "application/vnd.google-apps.document": "📝",
    "application/vnd.google-apps.presentation": "📊",
    "application/vnd.google-apps.spreadsheet": "📈",
    default: "📁",
  },
};

// Classe principal para gerenciar campanhas
class CampanhasManager {
  constructor() {
    this.campanhasCache = new Map();
    this.isLoading = false;
    this.isDropdownOpen = false;
    this.campanhas = [];
    this.isInitialized = false;
    this.refreshInterval = null;

    console.log("🔔 CampanhasManager: Construtor iniciado");
    this.init();
  }

  async init() {
    console.log("🔔 CampanhasManager: Iniciando...");

    if (document.readyState === "loading") {
      console.log("🔔 CampanhasManager: Aguardando DOM...");
      await new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", resolve);
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    this.setupEventListeners();
    this.setupAutoRefresh();
    await this.carregarCampanhas();
    this.isInitialized = true;

    console.log("✅ CampanhasManager: Inicializado com sucesso");
  }

  // Configurar event listeners
  setupEventListeners() {
    console.log("🔔 CampanhasManager: Configurando event listeners...");

    // Botão do sininho (desktop)
    const campanhasToggle = document.getElementById("campanhas-toggle");
    if (campanhasToggle) {
      campanhasToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Botão mobile
    const campanhasMobile = document.getElementById("campanhas-mobile");
    if (campanhasMobile) {
      campanhasMobile.addEventListener("click", () => {
        this.abrirModalMobile();
      });
    }

    // Botão de refresh
    const campanhasRefresh = document.getElementById("campanhas-refresh");
    if (campanhasRefresh) {
      campanhasRefresh.addEventListener("click", () => {
        this.carregarCampanhas(true);
      });
    }

    // Botão de retry
    const campanhasRetry = document.getElementById("campanhas-retry");
    if (campanhasRetry) {
      campanhasRetry.addEventListener("click", () => {
        this.carregarCampanhas(true);
      });
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener("click", (e) => {
      const dropdown = document.getElementById("campanhas-dropdown");
      const toggle = document.getElementById("campanhas-toggle");

      if (
        dropdown &&
        toggle &&
        !dropdown.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        this.fecharDropdown();
      }
    });

    // Fechar dropdown com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isDropdownOpen) {
        this.fecharDropdown();
      }
    });

    console.log("✅ CampanhasManager: Event listeners configurados");
  }

  // Configurar auto-refresh
  setupAutoRefresh() {
    // Atualizar campanhas a cada 30 minutos
    this.refreshInterval = setInterval(() => {
      console.log("🔄 Auto-refresh: Atualizando campanhas...");
      this.carregarCampanhas(false, true);
    }, 30 * 60 * 1000);

    // Limpar interval quando a página for fechada
    window.addEventListener("beforeunload", () => {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    });
  }

  // Toggle dropdown
  toggleDropdown() {
    if (this.isDropdownOpen) {
      this.fecharDropdown();
    } else {
      this.abrirDropdown();
    }
  }

  // Abrir dropdown
  abrirDropdown() {
    const dropdown = document.getElementById("campanhas-dropdown");
    const toggle = document.getElementById("campanhas-toggle");

    if (dropdown && toggle) {
      dropdown.classList.remove("hidden");
      dropdown.classList.remove("opacity-0", "scale-95");
      dropdown.classList.add("opacity-100", "scale-100");

      toggle.setAttribute("aria-expanded", "true");
      this.isDropdownOpen = true;

      // Se não há campanhas carregadas, carregar agora
      if (this.campanhas.length === 0 && !this.isLoading) {
        this.carregarCampanhas();
      }

      console.log("✅ Dropdown de campanhas aberto");
    }
  }

  // Fechar dropdown
  fecharDropdown() {
    const dropdown = document.getElementById("campanhas-dropdown");
    const toggle = document.getElementById("campanhas-toggle");

    if (dropdown && toggle) {
      dropdown.classList.add("opacity-0", "scale-95");
      dropdown.classList.remove("opacity-100", "scale-100");

      setTimeout(() => {
        dropdown.classList.add("hidden");
      }, 200);

      toggle.setAttribute("aria-expanded", "false");
      this.isDropdownOpen = false;

      console.log("✅ Dropdown de campanhas fechado");
    }
  }

  // Carregar campanhas do Google Drive
  async carregarCampanhas(forceRefresh = false, silent = false) {
    const cacheKey = "campanhas_drive";

    // Verificar cache
    if (!forceRefresh && this.campanhasCache.has(cacheKey)) {
      const cached = this.campanhasCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CAMPANHAS_CONFIG.CACHE_DURATION) {
        console.log("📦 Usando campanhas do cache");
        this.campanhas = cached.data;
        this.renderizarCampanhas();
        this.atualizarBadges();
        return;
      }
    }

    if (!silent) {
      this.showLoading();
    }
    this.isLoading = true;

    try {
      console.log("🔄 Carregando campanhas do Google Drive...");

      const url = `https://www.googleapis.com/drive/v3/files?q='${CAMPANHAS_CONFIG.FOLDER_ID}'+in+parents&fields=files(id,name,mimeType,modifiedTime,webViewLink,thumbnailLink,size)&key=${CAMPANHAS_CONFIG.API_KEY}`;

      const data = await this.fetchWithRetry(url);

      if (data.files) {
        // Filtrar apenas arquivos suportados
        const campanhasValidas = data.files
          .filter((file) =>
            CAMPANHAS_CONFIG.SUPPORTED_TYPES.includes(file.mimeType)
          )
          .map((file) => ({
            id: file.id,
            nome: file.name,
            tipo: file.mimeType,
            dataModificacao: new Date(file.modifiedTime),
            link: file.webViewLink,
            thumbnail: file.thumbnailLink,
            tamanho: file.size ? this.formatarTamanho(file.size) : null,
            icone:
              CAMPANHAS_CONFIG.FILE_ICONS[file.mimeType] ||
              CAMPANHAS_CONFIG.FILE_ICONS.default,
          }))
          .sort((a, b) => b.dataModificacao - a.dataModificacao); // Mais recentes primeiro

        this.campanhas = campanhasValidas;

        // Salvar no cache
        this.campanhasCache.set(cacheKey, {
          data: campanhasValidas,
          timestamp: Date.now(),
        });

        console.log(`✅ ${campanhasValidas.length} campanhas carregadas`);
      } else {
        this.campanhas = [];
        console.log("⚠️ Nenhuma campanha encontrada");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar campanhas:", error);
      this.showError();
      return;
    } finally {
      this.isLoading = false;
      if (!silent) {
        this.hideLoading();
      }
    }

    this.renderizarCampanhas();
    this.atualizarBadges();
  }

  // Atualizar método de renderização para incluir mobile
  renderizarCampanhas() {
    // Renderização desktop (mantida igual)
    const container = document.getElementById("campanhas-lista");
    const countElement = document.getElementById("campanhas-count");

    if (!container) return;

    // Atualizar contador
    if (countElement) {
      const count = this.campanhas.length;
      countElement.textContent = `${count} ${
        count === 1 ? "campanha" : "campanhas"
      }`;
    }

    if (this.campanhas.length === 0) {
      this.showEstadoVazio();
      this.showEstadoVazioMobile(); // ✅ NOVO: Também para mobile
      return;
    }

    this.hideEstadoVazio();
    this.hideError();
    this.hideEstadoVazioMobile(); // ✅ NOVO: Também para mobile
    this.hideErrorMobile(); // ✅ NOVO: Também para mobile

    // Renderizar lista de campanhas desktop
    container.innerHTML = this.campanhas
      .map((campanha) => this.renderizarItemCampanha(campanha))
      .join("");

    // Adicionar event listeners para os itens desktop
    container.querySelectorAll(".campanha-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const campanhaId = item.dataset.campanhaId;
        const campanha = this.campanhas.find((c) => c.id === campanhaId);
        if (campanha) {
          this.abrirCampanha(campanha);
        }
      });
    });

    // Renderizar também no modal mobile se estiver aberto
    const modalMobile = document.getElementById("campanhas-modal-mobile");
    if (modalMobile && !modalMobile.classList.contains("hidden")) {
      this.renderizarCampanhasMobile();
      this.atualizarContadorMobile();
    }
  }

  // Renderizar item individual da campanha
  renderizarItemCampanha(campanha) {
    const dataFormatada = this.formatarData(campanha.dataModificacao);
    const isRecente =
      Date.now() - campanha.dataModificacao.getTime() < 24 * 60 * 60 * 1000; // 24h

    return `
      <div class="campanha-item p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
           data-campanha-id="${campanha.id}">
        <div class="flex items-start gap-3">
          <!-- Ícone do arquivo -->
          <div class="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <span class="text-lg">${campanha.icone}</span>
          </div>

          <!-- Conteúdo -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
                ${this.escapeHtml(campanha.nome)}
              </h4>
              ${
                isRecente
                  ? '<span class="flex-shrink-0 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>'
                  : ""
              }
            </div>

            <div class="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>📅 ${dataFormatada}</span>
              ${campanha.tamanho ? `<span>📦 ${campanha.tamanho}</span>` : ""}
            </div>

            <!-- Preview se for imagem -->
            ${
              campanha.thumbnail && campanha.tipo.startsWith("image/")
                ? `<div class="mt-2">
                <img src="${campanha.thumbnail}" alt="Preview" class="w-full h-20 object-cover rounded-md">
              </div>`
                : ""
            }
          </div>

          <!-- Seta -->
          <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    `;
  }

  // Abrir campanha
  abrirCampanha(campanha) {
    console.log(`🔗 Abrindo campanha: ${campanha.nome}`);

    // Fechar dropdown
    this.fecharDropdown();

    // Abrir link em nova aba
    window.open(campanha.link, "_blank", "noopener,noreferrer");

    // Analytics (opcional)
    this.trackCampanhaClick(campanha);
  }

  // Track clique na campanha (para analytics)
  trackCampanhaClick(campanha) {
    // Implementar tracking se necessário
    console.log(`📊 Campanha clicada: ${campanha.nome}`);
  }

  // Abrir modal mobile completo
  abrirModalMobile() {
    console.log("📱 Abrindo modal mobile de campanhas");

    const modal = document.getElementById("campanhas-modal-mobile");
    if (!modal) {
      console.error("❌ Modal mobile não encontrado");
      return;
    }

    // Mostrar modal
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";

    // Carregar campanhas se necessário
    if (this.campanhas.length === 0 && !this.isLoading) {
      this.carregarCampanhas();
    }

    // Renderizar campanhas no modal mobile
    this.renderizarCampanhasMobile();
    this.atualizarContadorMobile();

    // Configurar event listeners do modal mobile
    this.setupModalMobileListeners();
  }

  // Fechar modal mobile
  fecharModalMobile() {
    console.log("📱 Fechando modal mobile de campanhas");

    const modal = document.getElementById("campanhas-modal-mobile");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.style.overflow = "";
    }
  }

  // Configurar listeners do modal mobile
  setupModalMobileListeners() {
    // Botão de fechar (X)
    const closeBtn = document.getElementById("campanhas-modal-close");
    const closeBtnFooter = document.getElementById("campanhas-modal-close-btn");

    [closeBtn, closeBtnFooter].forEach((btn) => {
      if (btn) {
        btn.removeEventListener("click", this.handleModalMobileClose);
        this.handleModalMobileClose = () => this.fecharModalMobile();
        btn.addEventListener("click", this.handleModalMobileClose);
      }
    });

    // Botão de refresh
    const refreshBtn = document.getElementById("campanhas-modal-refresh");
    if (refreshBtn) {
      refreshBtn.removeEventListener("click", this.handleModalMobileRefresh);
      this.handleModalMobileRefresh = () => this.carregarCampanhas(true);
      refreshBtn.addEventListener("click", this.handleModalMobileRefresh);
    }

    // Botão de retry
    const retryBtn = document.getElementById("campanhas-modal-retry");
    if (retryBtn) {
      retryBtn.removeEventListener("click", this.handleModalMobileRetry);
      this.handleModalMobileRetry = () => this.carregarCampanhas(true);
      retryBtn.addEventListener("click", this.handleModalMobileRetry);
    }

    // Fechar ao clicar fora do modal
    const modal = document.getElementById("campanhas-modal-mobile");
    if (modal) {
      modal.removeEventListener("click", this.handleModalMobileBackdrop);
      this.handleModalMobileBackdrop = (e) => {
        if (e.target === modal) {
          this.fecharModalMobile();
        }
      };
      modal.addEventListener("click", this.handleModalMobileBackdrop);
    }
  }

  // Renderizar campanhas no modal mobile
  renderizarCampanhasMobile() {
    const container = document.getElementById("campanhas-modal-lista");

    if (!container) return;

    if (this.campanhas.length === 0) {
      this.showEstadoVazioMobile();
      return;
    }

    this.hideEstadoVazioMobile();
    this.hideErrorMobile();

    // Renderizar lista de campanhas
    container.innerHTML = this.campanhas
      .map((campanha) => this.renderizarItemCampanhaMobile(campanha))
      .join("");

    // Adicionar event listeners para os itens
    container.querySelectorAll(".campanha-item-mobile").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const campanhaId = item.dataset.campanhaId;
        const campanha = this.campanhas.find((c) => c.id === campanhaId);
        if (campanha) {
          this.abrirCampanhaMobile(campanha);
        }
      });
    });
  }

  // Renderizar item individual da campanha mobile
  renderizarItemCampanhaMobile(campanha) {
    const dataFormatada = this.formatarData(campanha.dataModificacao);
    const isRecente =
      Date.now() - campanha.dataModificacao.getTime() < 24 * 60 * 60 * 1000; // 24h

    return `
    <div class="campanha-item-mobile p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 active:bg-gray-100 dark:active:bg-gray-600"
         data-campanha-id="${campanha.id}">
      <div class="flex items-start gap-3">
        <!-- Ícone do arquivo -->
        <div class="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
          <span class="text-xl">${campanha.icone}</span>
        </div>

        <!-- Conteúdo -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between mb-2">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 pr-2">
              ${this.escapeHtml(campanha.nome)}
            </h4>
            ${
              isRecente
                ? '<span class="flex-shrink-0 inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>'
                : ""
            }
          </div>

          <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              ${dataFormatada}
            </span>
            ${
              campanha.tamanho
                ? `
              <span class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                ${campanha.tamanho}
              </span>
            `
                : ""
            }
          </div>

          <!-- Preview se for imagem -->
          ${
            campanha.thumbnail && campanha.tipo.startsWith("image/")
              ? `<div class="mt-3">
              <img src="${campanha.thumbnail}" alt="Preview" class="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600">
            </div>`
              : ""
          }

          <!-- Botão de ação -->
          <div class="mt-3">
            <div class="inline-flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
              <span>Toque para abrir</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  // Abrir campanha no mobile
  abrirCampanhaMobile(campanha) {
    console.log(`📱 Abrindo campanha mobile: ${campanha.nome}`);

    // Fechar modal
    this.fecharModalMobile();

    // Abrir link em nova aba
    window.open(campanha.link, "_blank", "noopener,noreferrer");

    // Analytics
    this.trackCampanhaClick(campanha);
  }

  // Atualizar contador mobile
  atualizarContadorMobile() {
    const countElement = document.getElementById("campanhas-modal-count");
    if (countElement) {
      const count = this.campanhas.length;
      countElement.textContent = `${count} ${
        count === 1 ? "campanha disponível" : "campanhas disponíveis"
      }`;
    }
  }

  // Estados de UI para mobile
  showLoadingMobile() {
    document
      .getElementById("campanhas-modal-loading")
      ?.classList.remove("hidden");
    this.hideEstadoVazioMobile();
    this.hideErrorMobile();
  }

  hideLoadingMobile() {
    document.getElementById("campanhas-modal-loading")?.classList.add("hidden");
  }

  showEstadoVazioMobile() {
    document
      .getElementById("campanhas-modal-vazio")
      ?.classList.remove("hidden");
    this.hideErrorMobile();
  }

  hideEstadoVazioMobile() {
    document.getElementById("campanhas-modal-vazio")?.classList.add("hidden");
  }

  showErrorMobile() {
    document.getElementById("campanhas-modal-erro")?.classList.remove("hidden");
    this.hideEstadoVazioMobile();
  }

  hideErrorMobile() {
    document.getElementById("campanhas-modal-erro")?.classList.add("hidden");
  }

  // Atualizar badges de notificação
  atualizarBadges() {
    const badge = document.getElementById("campanhas-badge");
    const badgeMobile = document.getElementById("campanhas-badge-mobile");
    const count = this.campanhas.length;

    [badge, badgeMobile].forEach((element) => {
      if (element) {
        if (count > 0) {
          element.textContent = count;
          element.classList.remove("hidden");
        } else {
          element.classList.add("hidden");
        }
      }
    });
  }

  // Atualizar método de loading para incluir mobile
  showLoading() {
    document.getElementById("campanhas-loading")?.classList.remove("hidden");
    this.showLoadingMobile(); // Também para mobile
    this.hideEstadoVazio();
    this.hideError();
  }

  hideLoading() {
    document.getElementById("campanhas-loading")?.classList.add("hidden");
    this.hideLoadingMobile(); // Também para mobile
  }

  showError() {
    document.getElementById("campanhas-erro")?.classList.remove("hidden");
    this.showErrorMobile(); // Também para mobile
    this.hideEstadoVazio();
    this.hideEstadoVazioMobile(); // Também para mobile
  }

  hideLoading() {
    document.getElementById("campanhas-loading")?.classList.add("hidden");
  }

  showEstadoVazio() {
    document.getElementById("campanhas-vazio")?.classList.remove("hidden");
    this.hideError();
  }

  hideEstadoVazio() {
    document.getElementById("campanhas-vazio")?.classList.add("hidden");
  }

  showError() {
    document.getElementById("campanhas-erro")?.classList.remove("hidden");
    this.hideEstadoVazio();
  }

  hideError() {
    document.getElementById("campanhas-erro")?.classList.add("hidden");
  }

  // Fetch com retry
  async fetchWithRetry(url, maxRetries = CAMPANHAS_CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          CAMPANHAS_CONFIG.REQUEST_TIMEOUT
        );

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay = CAMPANHAS_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(
          `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Utilitários
  formatarData(data) {
    const agora = new Date();
    const diff = agora - data;
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dias === 0) {
      return "Hoje";
    } else if (dias === 1) {
      return "Ontem";
    } else if (dias < 7) {
      return `${dias} dias atrás`;
    } else {
      return data.toLocaleDateString("pt-BR");
    }
  }

  formatarTamanho(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Método público para refresh manual
  refresh() {
    return this.carregarCampanhas(true);
  }

  // Cleanup
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.campanhasCache.clear();
    console.log("🔔 CampanhasManager: Destruído");
  }
}

// Funções globais
window.abrirCampanhas = function () {
  if (window.campanhasManager) {
    window.campanhasManager.abrirDropdown();
  }
};

window.refreshCampanhas = function () {
  if (window.campanhasManager) {
    return window.campanhasManager.refresh();
  }
};

// Inicialização
const initCampanhas = async () => {
  try {
    console.log("🚀 Iniciando CampanhasManager...");
    window.campanhasManager = new CampanhasManager();

    let attempts = 0;
    while (!window.campanhasManager.isInitialized && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.campanhasManager.isInitialized) {
      console.log("✅ Sistema de campanhas inicializado com sucesso");
    } else {
      console.error("❌ Timeout na inicialização do CampanhasManager");
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar CampanhasManager:", error);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCampanhas);
} else {
  initCampanhas();
}

// Backup de inicialização
setTimeout(() => {
  if (!window.campanhasManager) {
    console.warn(
      "⚠️ Backup: Tentando inicializar CampanhasManager novamente..."
    );
    initCampanhas();
  }
}, 2000);

// Debug helpers
window.debugCampanhas = {
  manager: () => window.campanhasManager,
  isReady: () => window.campanhasManager?.isInitialized,
  refresh: () => window.refreshCampanhas(),
  open: () => window.abrirCampanhas(),
  getCampanhas: () => window.campanhasManager?.campanhas || [],
  clearCache: () => {
    if (window.campanhasManager) {
      window.campanhasManager.campanhasCache.clear();
      console.log("Cache de campanhas limpo");
    }
  },
  testApi: async () => {
    if (window.campanhasManager) {
      try {
        await window.campanhasManager.carregarCampanhas(true);
        console.log("✅ Teste da API bem-sucedido");
      } catch (error) {
        console.error("❌ Erro no teste da API:", error);
      }
    }
  },
};
