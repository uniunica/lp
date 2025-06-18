// ✅ Configuração para cache e melhorias
const MAPDATA_CACHE_CONFIG = {
  CACHE_KEY: "mapdata_polos_cache",
  CACHE_DURATION: 60 * 60 * 1000, // 1 hora
  REQUEST_TIMEOUT: 15000, // 15 segundos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// ✅ Sistema de cache inteligente
const MapDataCache = {
  get() {
    try {
      const cached = localStorage.getItem(MAPDATA_CACHE_CONFIG.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp, version } = JSON.parse(cached);

      if (Date.now() - timestamp > MAPDATA_CACHE_CONFIG.CACHE_DURATION) {
        localStorage.removeItem(MAPDATA_CACHE_CONFIG.CACHE_KEY);
        console.log("Cache de polos do mapa expirado");
        return null;
      }

      console.log("Cache de polos do mapa válido encontrado");
      return data;
    } catch (error) {
      console.warn("Erro ao ler cache de polos do mapa:", error);
      localStorage.removeItem(MAPDATA_CACHE_CONFIG.CACHE_KEY);
      return null;
    }
  },

  set(data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        version: "1.0",
      };
      localStorage.setItem(
        MAPDATA_CACHE_CONFIG.CACHE_KEY,
        JSON.stringify(cacheData)
      );
      console.log("Cache de polos do mapa salvo");
    } catch (error) {
      console.warn("Erro ao salvar cache de polos do mapa:", error);
    }
  },

  clear() {
    localStorage.removeItem(MAPDATA_CACHE_CONFIG.CACHE_KEY);
    console.log("Cache de polos do mapa limpo");
  },
};

// ✅ Sistema de indicadores visuais
const MapDataIndicators = {
  showLoading() {
    const mapContainer = document.getElementById("map");
    if (
      mapContainer &&
      !mapContainer.querySelector(".mapdata-loading-indicator")
    ) {
      const loader = document.createElement("div");
      loader.className =
        "mapdata-loading-indicator absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50";
      loader.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p class="text-gray-600 font-medium">Carregando polos do mapa...</p>
          <div class="mt-2 w-48 bg-gray-200 rounded-full h-2">
            <div class="mapdata-progress-bar bg-purple-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>
      `;
      mapContainer.style.position = "relative";
      mapContainer.appendChild(loader);
    }
  },

  updateProgress(percentage) {
    const progressBar = document.querySelector(".mapdata-progress-bar");
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
  },

  hideLoading() {
    const loader = document.querySelector(".mapdata-loading-indicator");
    if (loader) {
      loader.remove();
    }
  },

  showError(message, onRetry) {
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
      // Remove loading se existir
      this.hideLoading();

      const errorDiv = document.createElement("div");
      errorDiv.className =
        "mapdata-error-indicator absolute inset-0 flex items-center justify-center bg-red-50 border border-red-200 z-50";
      errorDiv.innerHTML = `
        <div class="text-center p-8">
          <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <h3 class="text-lg font-semibold text-red-800 mb-2">Erro ao carregar mapa</h3>
          <p class="text-red-600 mb-4">${message}</p>
          <button onclick="(${onRetry.toString()})()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
            Tentar Novamente
          </button>
        </div>
      `;
      mapContainer.appendChild(errorDiv);
    }
  },

  clearError() {
    const errorDiv = document.querySelector(".mapdata-error-indicator");
    if (errorDiv) {
      errorDiv.remove();
    }
  },

  showNotification(message, type = "info", duration = 4000) {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full";

    const styles = {
      error: "bg-red-500 text-white",
      success: "bg-green-500 text-white",
      warning: "bg-yellow-500 text-black",
      info: "bg-blue-500 text-white",
    };

    notification.className += ` ${styles[type] || styles.info}`;
    notification.innerHTML = `
      <div class="flex items-center">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg hover:opacity-70">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => (notification.style.transform = "translateX(0)"), 100);
    setTimeout(() => {
      notification.style.transform = "translateX(full)";
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },
};

// ✅ Sistema de retry com backoff
const MapDataRetry = {
  async withBackoff(fn, maxRetries = MAPDATA_CACHE_CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        const delay =
          MAPDATA_CACHE_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(
          `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`
        );

        // Atualizar progresso durante retry
        MapDataIndicators.updateProgress((attempt / maxRetries) * 50);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  },
};

// ✅ Função principal melhorada mantendo estrutura original
async function carregarPolos() {
  const apiKey = "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8";
  const sheetId = "1IxAnU18qxiEf-TjvqBEEj9L1W3CsY3-DHDxREV4APmk";
  const range = "A2:N"; // Colunas de A até N (incluindo nome, dados e coordenadas)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

  try {
    // ✅ Mostrar loading
    MapDataIndicators.showLoading();
    MapDataIndicators.updateProgress(10);

    // ✅ Verificar cache primeiro
    const cachedData = MapDataCache.get();
    if (cachedData) {
      console.log("Usando dados do cache");
      MapDataIndicators.updateProgress(50);

      // Aplicar dados do cache
      simplemaps_countrymap_mapdata.locations = cachedData;
      MapDataIndicators.updateProgress(90);

      // Carregar mapa
      if (
        typeof simplemaps_countrymap !== "undefined" &&
        typeof simplemaps_countrymap.load === "function"
      ) {
        simplemaps_countrymap.load();
      }

      MapDataIndicators.updateProgress(100);
      MapDataIndicators.hideLoading();
      MapDataIndicators.showNotification(
        "Polos carregados do cache",
        "success",
        2000
      );
      return;
    }

    MapDataIndicators.updateProgress(20);

    // ✅ Buscar dados com retry e timeout
    const data = await MapDataRetry.withBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        MAPDATA_CACHE_CONFIG.REQUEST_TIMEOUT
      );

      try {
        const response = await fetch(url, {
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

    MapDataIndicators.updateProgress(60);

    // ✅ Validar dados recebidos
    if (!data.values || data.values.length === 0) {
      throw new Error("Nenhum polo encontrado na planilha");
    }

    // ✅ Processar dados (mantendo lógica original)
    simplemaps_countrymap_mapdata.locations = {};

    data.values.forEach((row, index) => {
      try {
        const [
          nomePolo, // A // B ignorado
          ,
          responsavel, // C
          endereco, // D
          cidade, // E
          estado, // F
          cep, // G
          telefone, // H
          email, // I // J ignorado // K ignorado // L ignorado
          ,
          ,
          ,
          lat, // M
          lng, // N
        ] = row;

        // ✅ Validação básica
        if (!nomePolo || !lat || !lng) {
          console.warn(
            `Polo na linha ${index + 2} ignorado: dados obrigatórios faltando`
          );
          return;
        }

        // ✅ Validar coordenadas
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
          console.warn(
            `Polo na linha ${index + 2} ignorado: coordenadas inválidas`
          );
          return;
        }

        // ✅ Sanitizar dados para HTML (básico)
        const sanitize = (text) => {
          if (!text) return "";
          return text.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };

        // Cria a descrição com os dados combinados (mantendo estrutura original)
        const descricao = `
          <strong>Responsável:</strong> ${sanitize(responsavel)}<br>
          <strong>Endereço:</strong> ${sanitize(endereco)}<br>
          <strong>Cidade:</strong> ${sanitize(cidade)} - ${sanitize(estado)}<br>
          <strong>CEP:</strong> ${sanitize(cep)}<br>
          <strong>Telefone:</strong> ${sanitize(telefone)}<br>
          <strong>Email:</strong> ${sanitize(email)}
        `.trim();

        // Adiciona ao objeto de localizações (mantendo estrutura original)
        simplemaps_countrymap_mapdata.locations[index] = {
          name: nomePolo,
          lat: latitude,
          lng: longitude,
          description: descricao,
        };
      } catch (error) {
        console.warn(`Erro ao processar polo na linha ${index + 2}:`, error);
      }
    });

    MapDataIndicators.updateProgress(80);

    // ✅ Salvar no cache
    MapDataCache.set(simplemaps_countrymap_mapdata.locations);

    MapDataIndicators.updateProgress(90);

    // ✅ Carregar mapa (mantendo lógica original)
    if (
      typeof simplemaps_countrymap !== "undefined" &&
      typeof simplemaps_countrymap.load === "function"
    ) {
      simplemaps_countrymap.load();
    }

    MapDataIndicators.updateProgress(100);
    MapDataIndicators.hideLoading();

    const totalPolos = Object.keys(
      simplemaps_countrymap_mapdata.locations
    ).length;
    MapDataIndicators.showNotification(
      `${totalPolos} polos carregados com sucesso`,
      "success",
      3000
    );
  } catch (error) {
    console.error("Erro ao carregar polos:", error);
    MapDataIndicators.hideLoading();

    // ✅ Tratamento de erros específico
    let errorMessage = "Erro desconhecido ao carregar polos";

    if (error.name === "AbortError") {
      errorMessage = "Tempo limite excedido. Verifique sua conexão.";
    } else if (error.message.includes("HTTP 403")) {
      errorMessage = "Erro de autenticação. Contate o suporte.";
    } else if (error.message.includes("HTTP 404")) {
      errorMessage = "Planilha de polos não encontrada.";
    } else if (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      errorMessage = "Erro de conexão. Verifique sua internet.";
    } else if (error.message.includes("Nenhum polo")) {
      errorMessage = "Nenhum polo encontrado na planilha.";
    }

    // ✅ Mostrar erro com opção de retry
    MapDataIndicators.showError(errorMessage, async () => {
      MapDataIndicators.clearError();
      await carregarPolos();
    });

    MapDataIndicators.showNotification(errorMessage, "error", 5000);
  }
}

// ✅ Configuração original do mapa (mantida intacta)
var simplemaps_countrymap_mapdata = {
  main_settings: {
    //General settings
    width: "responsive", //'700' or 'responsive'
    background_color: "#FFFFFF",
    background_transparent: "yes",
    border_color: "#ffffff",
    state_description: "",
    state_color: "#d454da",
    state_hover_color: "#c82ecf",
    state_url: "",
    border_size: 1.5,
    all_states_inactive: "no",
    all_states_zoomable: "yes",

    //Location defaults
    location_description: "Polo",
    location_url: "",
    location_color: "#560180",
    location_opacity: 0.8,
    location_hover_opacity: 1,
    location_size: "20",
    location_type: "marker",
    location_image_source: "frog.png",
    location_border_color: "#FFFFFF",
    location_border: 2,
    location_hover_border: 2.5,
    all_locations_inactive: "no",
    all_locations_hidden: "no",

    //Label defaults
    label_color: "#ffffff",
    label_hover_color: "#ffffff",
    label_size: 16,
    label_font: "Arial",
    label_display: "auto",
    label_scale: "yes",
    hide_labels: "no",
    hide_eastern_labels: "no",

    //Zoom settings
    zoom: "yes",
    manual_zoom: "yes",
    back_image: "no",
    initial_back: "no",
    initial_zoom: "-1",
    initial_zoom_solo: "no",
    region_opacity: 1,
    region_hover_opacity: 0.6,
    zoom_out_incrementally: "yes",
    zoom_percentage: 0.99,
    zoom_time: 0.5,

    //Popup settings
    popup_color: "white",
    popup_opacity: 0.9,
    popup_shadow: 1,
    popup_corners: 5,
    popup_font: "12px/1.5 Verdana, Arial, Helvetica, sans-serif",
    popup_nocss: "no",

    //Advanced settings
    div: "map",
    auto_load: "yes",
    url_new_tab: "no",
    images_directory: "default",
    fade_time: 0.1,
    link_text: "View Website",
    popups: "detect",
    state_image_url: "",
    state_image_position: "",
    location_image_url: "",
  },
  state_specific: {
    BRAC: {
      name: "Acre",
    },
    BRAL: {
      name: "Alagoas",
    },
    BRAM: {
      name: "Amazonas",
    },
    BRAP: {
      name: "Amapá",
    },
    BRBA: {
      name: "Bahia",
    },
    BRCE: {
      name: "Ceará",
    },
    BRDF: {
      name: "Distrito Federal",
    },
    BRES: {
      name: "Espírito Santo",
    },
    BRGO: {
      name: "Goiás",
    },
    BRMA: {
      name: "Maranhão",
    },
    BRMG: {
      name: "Minas Gerais",
    },
    BRMS: {
      name: "Mato Grosso do Sul",
    },
    BRMT: {
      name: "Mato Grosso",
    },
    BRPA: {
      name: "Pará",
    },
    BRPB: {
      name: "Paraíba",
    },
    BRPE: {
      name: "Pernambuco",
    },
    BRPI: {
      name: "Piauí",
    },
    BRPR: {
      name: "Paraná",
    },
    BRRJ: {
      name: "Rio de Janeiro",
    },
    BRRN: {
      name: "Rio Grande do Norte",
    },
    BRRO: {
      name: "Rondônia",
    },
    BRRR: {
      name: "Roraima",
    },
    BRRS: {
      name: "Rio Grande do Sul",
    },
    BRSC: {
      name: "Santa Catarina",
    },
    BRSE: {
      name: "Sergipe",
    },
    BRSP: {
      name: "São Paulo",
    },
    BRTO: {
      name: "Tocantins",
    },
  },
  locations: {},
  labels: {
    BRAC: {
      name: "Acre",
      parent_id: "BRAC",
    },
    BRAL: {
      name: "Alagoas",
      parent_id: "BRAL",
    },
    BRAM: {
      name: "Amazonas",
      parent_id: "BRAM",
    },
    BRAP: {
      name: "Amapá",
      parent_id: "BRAP",
    },
    BRBA: {
      name: "Bahia",
      parent_id: "BRBA",
    },
    BRCE: {
      name: "Ceará",
      parent_id: "BRCE",
    },
    BRDF: {
      name: "Distrito Federal",
      parent_id: "BRDF",
    },
    BRES: {
      name: "Espírito Santo",
      parent_id: "BRES",
    },
    BRGO: {
      name: "Goiás",
      parent_id: "BRGO",
    },
    BRMA: {
      name: "Maranhão",
      parent_id: "BRMA",
    },
    BRMG: {
      name: "Minas Gerais",
      parent_id: "BRMG",
    },
    BRMS: {
      name: "Mato Grosso do Sul",
      parent_id: "BRMS",
    },
    BRMT: {
      name: "Mato Grosso",
      parent_id: "BRMT",
    },
    BRPA: {
      name: "Pará",
      parent_id: "BRPA",
    },
    BRPB: {
      name: "Paraíba",
      parent_id: "BRPB",
    },
    BRPE: {
      name: "Pernambuco",
      parent_id: "BRPE",
    },
    BRPI: {
      name: "Piauí",
      parent_id: "BRPI",
    },
    BRPR: {
      name: "Paraná",
      parent_id: "BRPR",
    },
    BRRJ: {
      name: "Rio de Janeiro",
      parent_id: "BRRJ",
    },
    BRRN: {
      name: "Rio Grande do Norte",
      parent_id: "BRRN",
    },
    BRRO: {
      name: "Rondônia",
      parent_id: "BRRO",
    },
    BRRR: {
      name: "Roraima",
      parent_id: "BRRR",
    },
    BRRS: {
      name: "Rio Grande do Sul",
      parent_id: "BRRS",
    },
    BRSC: {
      name: "Santa Catarina",
      parent_id: "BRSC",
    },
    BRSE: {
      name: "Sergipe",
      parent_id: "BRSE",
    },
    BRSP: {
      name: "São Paulo",
      parent_id: "BRSP",
    },
    BRTO: {
      name: "Tocantins",
      parent_id: "BRTO",
    },
  },
  legend: {
    entries: [],
  },
  regions: {},
};

// ✅ Inicialização (mantida original)
document.addEventListener("DOMContentLoaded", carregarPolos);

// ✅ Tratamento de conectividade
window.addEventListener("online", () => {
  console.log("Conexão restaurada");
  MapDataIndicators.showNotification("Conexão restaurada", "success", 2000);
});

window.addEventListener("offline", () => {
  console.log("Conexão perdida, usando dados em cache se disponível");
  MapDataIndicators.showNotification(
    "Sem conexão. Usando dados em cache.",
    "warning",
    3000
  );
});

// ✅ Funções utilitárias para debug (remover em produção)
window.debugMapData = {
  clearCache: () => MapDataCache.clear(),
  reloadPolos: () => carregarPolos(),
  showStats: () => {
    const cached = MapDataCache.get();
    const totalPolos = Object.keys(
      simplemaps_countrymap_mapdata.locations || {}
    ).length;
    console.log({
      totalPolos,
      cached: !!cached,
      cacheSize: cached ? Object.keys(cached).length : 0,
    });
  },
};
