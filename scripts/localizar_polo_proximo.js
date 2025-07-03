document.addEventListener("DOMContentLoaded", () => {
  // === CONFIGURAÇÕES E CONSTANTES ===
  const CONFIG = {
    API_KEY: "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8",
    SHEET_ID: "1IxAnU18qxiEf-TjvqBEEj9L1W3CsY3-DHDxREV4APmk",
    SHEET_NAME: "Sheet3",
    RANGE: "C2:X",
    DEBOUNCE_DELAY: 300,
    MIN_SEARCH_LENGTH: 2,
    SIMILARITY_THRESHOLD: 0.7,
    BRASIL_BOUNDS: {
      LAT_MIN: -35,
      LAT_MAX: 5,
      LNG_MIN: -75,
      LNG_MAX: -30,
    },
  };

  // === ELEMENTOS DOM ===
  const elements = {
    modal: {
      openBtn: document.getElementById("open-modal-location"),
      closeBtn: document.getElementById("close-modal"),
      container: document.getElementById("modal-location"),
    },
    search: {
      input: document.getElementById("cidade"),
      datalist: document.getElementById("lista-cidades"),
      error: document.getElementById("erro-cidade"),
    },
    results: {
      polo: document.getElementById("resultado-polo"),
      distancia: document.getElementById("resultado-distancia"),
      poloNome: document.getElementById("polo-nome"),
      unidadeNome: document.getElementById("unidade-nome"),
      distanciaKm: document.getElementById("distancia-km"),
      rotaLink: document.getElementById("rota-link"),
    },
    map: {
      container: document.getElementById("map-container"),
      infoRota: document.getElementById("info-rota"),
      rotaDistancia: document.getElementById("rota-distancia"),
      rotaTempo: document.getElementById("rota-tempo"),
    },
  };

  // === ESTADO DA APLICAÇÃO ===
  const state = {
    map: null,
    routingControl: null,
    municipiosData: new Map(),
    polosData: new Map(),
    timeoutId: null,
    isLoading: false,
  };

  // === CLASSES E UTILITÁRIOS ===
  class Logger {
    static info(message, data = null) {
      console.log(`ℹ️ ${message}`, data || "");
    }

    static success(message, data = null) {
      console.log(`✅ ${message}`, data || "");
    }

    static warn(message, data = null) {
      console.warn(`⚠️ ${message}`, data || "");
    }

    static error(message, data = null) {
      console.error(`❌ ${message}`, data || "");
    }
  }

  class DataProcessor {
    static normalizeText(text) {
      if (!text) return "";
      return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    }

    static parseCoordinate(coord) {
      if (!coord) return null;
      const num = parseFloat(coord.replace(",", "."));
      return isNaN(num) ? null : num;
    }

    static validateBrazilCoordinates(lat, lng) {
      return (
        lat >= CONFIG.BRASIL_BOUNDS.LAT_MIN &&
        lat <= CONFIG.BRASIL_BOUNDS.LAT_MAX &&
        lng >= CONFIG.BRASIL_BOUNDS.LNG_MIN &&
        lng <= CONFIG.BRASIL_BOUNDS.LNG_MAX
      );
    }

    static createPoloKey(endereco, unidade) {
      // Cria uma chave única baseada no endereço e unidade
      const enderecoNorm = this.normalizeText(endereco);
      const unidadeNorm = this.normalizeText(unidade);
      return `${enderecoNorm}|${unidadeNorm}`;
    }

    static matchPoloData(endereco, unidade, polosMap) {
      const searchKey = this.createPoloKey(endereco, unidade);

      // Busca exata primeiro
      if (polosMap.has(searchKey)) {
        return polosMap.get(searchKey);
      }

      // Busca por similaridade
      for (const [key, polo] of polosMap) {
        const similarity = StringSimilarity.calculate(searchKey, key);
        if (similarity > CONFIG.SIMILARITY_THRESHOLD) {
          Logger.info(`Match por similaridade (${similarity.toFixed(2)}):`, {
            searchKey,
            foundKey: key,
          });
          return polo;
        }
      }

      return null;
    }
  }

  class StringSimilarity {
    static calculate(str1, str2) {
      const len1 = str1.length;
      const len2 = str2.length;

      if (len1 === 0) return len2 === 0 ? 1 : 0;
      if (len2 === 0) return 0;

      const matrix = Array(len2 + 1)
        .fill(null)
        .map(() => Array(len1 + 1).fill(null));

      for (let i = 0; i <= len1; i++) matrix[0][i] = i;
      for (let j = 0; j <= len2; j++) matrix[j][0] = j;

      for (let j = 1; j <= len2; j++) {
        for (let i = 1; i <= len1; i++) {
          const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1,
            matrix[j - 1][i - 1] + cost
          );
        }
      }

      const distance = matrix[len2][len1];
      return 1 - distance / Math.max(len1, len2);
    }
  }

  class UIManager {
    static showLoading(element, show = true) {
      if (show) {
        element.innerHTML =
          '<span class="loading-spinner"></span> Carregando...';
      }
    }

    static hideAllResults() {
      elements.results.polo.classList.add("hidden");
      elements.results.distancia.classList.add("hidden");
      elements.map.container.classList.add("hidden");
      elements.map.infoRota.classList.add("hidden");
      elements.search.error.classList.add("hidden");

      if (state.routingControl) {
        state.map.removeControl(state.routingControl);
        state.routingControl = null;
      }
    }

    static showError(message) {
      elements.search.error.querySelector("p").textContent = message;
      elements.search.error.classList.remove("hidden");
    }

    static updateResults(dados) {
      elements.results.poloNome.textContent = dados.polo;
      elements.results.unidadeNome.textContent = dados.unidade;
      elements.results.distanciaKm.textContent = dados.distancia;

      const origemGoogle = encodeURIComponent(dados.nomeOriginal);
      const destinoGoogle = encodeURIComponent(dados.polo);
      elements.results.rotaLink.href = `https://www.google.com/maps/dir/?api=1&origin=${origemGoogle}&destination=${destinoGoogle}`;

      elements.results.polo.classList.remove("hidden");
      elements.results.distancia.classList.remove("hidden");
    }
  }

  // === CARREGAMENTO DE DADOS ===
  class DataLoader {
    static async loadMunicipiosData() {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}!${CONFIG.RANGE}?key=${CONFIG.API_KEY}`;

      try {
        state.isLoading = true;
        Logger.info("Iniciando carregamento dos dados da planilha...");

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        const rows = json.values;

        if (!rows || rows.length === 0) {
          throw new Error("Nenhum dado encontrado na planilha");
        }

        Logger.info(`Total de linhas encontradas: ${rows.length}`);

        await this.processData(rows);
        this.populateDatalist();

        Logger.success(
          `Carregamento concluído: ${state.municipiosData.size} municípios e ${state.polosData.size} polos`
        );
      } catch (error) {
        Logger.error("Erro ao carregar dados:", error);
        UIManager.showError(
          "Erro ao carregar dados da planilha. Tente novamente."
        );
      } finally {
        state.isLoading = false;
      }
    }

    static async processData(rows) {
      let municipiosProcessados = 0;
      let polosProcessados = 0;
      let erros = 0;

      // Primeira passada: coleta todos os polos únicos
      const polosUnicos = new Map();

      rows.forEach((row, index) => {
        const enderecoCompleto = row[19]?.trim(); // Coluna V
        const latPolo = row[20]?.trim(); // Coluna W
        const lonPolo = row[21]?.trim(); // Coluna X

        if (enderecoCompleto && latPolo && lonPolo) {
          const lat = DataProcessor.parseCoordinate(latPolo);
          const lng = DataProcessor.parseCoordinate(lonPolo);

          if (lat && lng && DataProcessor.validateBrazilCoordinates(lat, lng)) {
            const key = DataProcessor.normalizeText(enderecoCompleto);
            if (!polosUnicos.has(key)) {
              polosUnicos.set(key, {
                endereco: enderecoCompleto,
                lat,
                lng,
                linha: index + 2,
              });
              polosProcessados++;
            }
          }
        }
      });

      Logger.info(`Polos únicos encontrados: ${polosProcessados}`);

      // Segunda passada: processa municípios e faz match com polos
      rows.forEach((row, index) => {
        try {
          const municipio = row[0]?.trim(); // Coluna C
          const latMunicipio = row[1]?.trim(); // Coluna D
          const lonMunicipio = row[2]?.trim(); // Coluna E
          const enderecoPoloF = row[3]?.trim(); // Coluna F
          const unidade = row[7]?.trim(); // Coluna J
          const distancia = row[8]?.trim(); // Coluna K

          if (
            !municipio ||
            !enderecoPoloF ||
            !unidade ||
            !distancia ||
            !latMunicipio ||
            !lonMunicipio
          ) {
            return;
          }

          const latMun = DataProcessor.parseCoordinate(latMunicipio);
          const lonMun = DataProcessor.parseCoordinate(lonMunicipio);

          if (
            !latMun ||
            !lonMun ||
            !DataProcessor.validateBrazilCoordinates(latMun, lonMun)
          ) {
            return;
          }

          // Busca o polo correspondente
          const poloKey = DataProcessor.createPoloKey(enderecoPoloF, unidade);
          let poloEncontrado = null;

          // Busca por correspondência exata ou similar nos polos únicos
          for (const [key, polo] of polosUnicos) {
            if (
              key.includes(DataProcessor.normalizeText(enderecoPoloF)) ||
              key.includes(DataProcessor.normalizeText(unidade))
            ) {
              poloEncontrado = polo;
              break;
            }
          }

          if (poloEncontrado) {
            const chave = DataProcessor.normalizeText(municipio);
            state.municipiosData.set(chave, {
              nomeOriginal: municipio,
              polo: enderecoPoloF,
              unidade: unidade,
              distancia: distancia,
              coordsMunicipio: {
                lat: latMun,
                lng: lonMun,
              },
              coordsPolo: {
                lat: poloEncontrado.lat,
                lng: poloEncontrado.lng,
              },
            });
            municipiosProcessados++;

            if (municipiosProcessados <= 3) {
              Logger.info(`Município processado:`, {
                nome: municipio,
                polo: enderecoPoloF,
                coordsPolo: {
                  lat: poloEncontrado.lat,
                  lng: poloEncontrado.lng,
                },
              });
            }
          }
        } catch (error) {
          erros++;
          if (erros <= 5) {
            Logger.warn(`Erro ao processar linha ${index + 2}:`, error);
          }
        }
      });

      Logger.success(
        `Processamento concluído: ${municipiosProcessados} municípios, ${erros} erros`
      );
    }

    static populateDatalist() {
      if (!elements.search.datalist) {
        Logger.error("Elemento datalist não encontrado");
        return;
      }

      elements.search.datalist.innerHTML = "";

      for (const dados of state.municipiosData.values()) {
        const option = document.createElement("option");
        option.value = dados.nomeOriginal;
        elements.search.datalist.appendChild(option);
      }

      Logger.info(
        `Datalist populado com ${elements.search.datalist.children.length} opções`
      );
    }
  }

  // === SISTEMA DE BUSCA ===
  class SearchEngine {
    static findSimilarCity(input) {
      const normalized = DataProcessor.normalizeText(input);
      const cities = Array.from(state.municipiosData.keys());

      if (cities.length === 0) {
        Logger.warn("Nenhum município disponível para busca");
        return null;
      }

      // Busca exata
      if (state.municipiosData.has(normalized)) {
        Logger.info("Busca exata encontrada:", normalized);
        return normalized;
      }

      // Busca por início
      const startsWith = cities.find((city) => city.startsWith(normalized));
      if (startsWith) {
        Logger.info("Busca por início encontrada:", startsWith);
        return startsWith;
      }

      // Busca por substring
      const contains = cities.find((city) => city.includes(normalized));
      if (contains) {
        Logger.info("Busca por substring encontrada:", contains);
        return contains;
      }

      // Busca por similaridade
      const similar = cities
        .map((city) => ({
          city,
          similarity: StringSimilarity.calculate(normalized, city),
        }))
        .filter((item) => item.similarity > CONFIG.SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity);

      if (similar.length > 0) {
        Logger.info("Busca por similaridade encontrada:", similar[0]);
        return similar[0].city;
      }

      Logger.info("Nenhuma cidade encontrada para:", input);
      return null;
    }
  }

  // === SISTEMA DE MAPAS ===
  class MapManager {
    static initializeMap() {
      if (!state.map) {
        state.map = L.map("map-container").setView([-14.235, -51.925], 4);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(state.map);
        Logger.info("Mapa inicializado");
      }
    }

    static async createRoute(dados) {
      try {
        const { coordsMunicipio, coordsPolo } = dados;

        if (
          !this.validateCoordinates(coordsMunicipio) ||
          !this.validateCoordinates(coordsPolo)
        ) {
          throw new Error("Coordenadas inválidas");
        }

        // Remove rota anterior
        if (state.routingControl) {
          state.map.removeControl(state.routingControl);
        }

        // Cria nova rota
        state.routingControl = L.Routing.control({
          waypoints: [
            L.latLng(coordsMunicipio.lat, coordsMunicipio.lng),
            L.latLng(coordsPolo.lat, coordsPolo.lng),
          ],
          routeWhileDragging: false,
          show: false,
          addWaypoints: false,
          summaryTemplate:
            "<h2>{name}</h2><h3>Distância: {distance}, Duração: {time}</h3>",
          createMarker: (i, waypoint, n) =>
            this.createCustomMarker(i, waypoint, dados),
        });

        // Event listeners
        state.routingControl.on("routesfound", this.handleRouteFound);
        state.routingControl.on("routingerror", (e) =>
          this.handleRouteError(e, dados)
        );

        state.routingControl.addTo(state.map);

        // Ajusta visualização
        this.fitMapBounds(coordsMunicipio, coordsPolo);

        Logger.success("Rota criada com sucesso");
      } catch (error) {
        Logger.error("Erro ao criar rota:", error);
        this.handleRouteError(error, dados);
      }
    }

    static createCustomMarker(index, waypoint, dados) {
      const iconUrls = {
        origin:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
        destination:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
      };

      const icon = L.icon({
        iconUrl: index === 0 ? iconUrls.origin : iconUrls.destination,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        shadowSize: [41, 41],
      });

      return L.marker(waypoint.latLng, {
        icon,
        draggable: false,
        title:
          index === 0
            ? `Origem: ${dados.nomeOriginal}`
            : `Destino: ${dados.unidade}`,
      });
    }

    static handleRouteFound(e) {
      const summary = e.routes[0].summary;
      const distanciaKm = (summary.totalDistance / 1000).toFixed(1);
      const tempoSegundos = summary.totalTime;
      const horas = Math.floor(tempoSegundos / 3600);
      const minutos = Math.floor((tempoSegundos % 3600) / 60);

      const tempoFormatado =
        horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;

      elements.map.rotaDistancia.textContent = `${distanciaKm} km`;
      elements.map.rotaTempo.textContent = tempoFormatado;

      Logger.success(`Rota calculada: ${distanciaKm}km, ${tempoFormatado}`);
    }

    static handleRouteError(error, dados) {
      Logger.error("Erro na rota:", error);

      elements.map.rotaDistancia.textContent = `${dados.distancia} km*`;
      elements.map.rotaTempo.textContent = "Não disponível";

      // Remove nota anterior
      const notaAnterior = elements.map.infoRota.querySelector(".text-xs");
      if (notaAnterior) notaAnterior.remove();

      // Adiciona nota explicativa
      const nota = document.createElement("p");
      nota.className = "text-xs text-gray-500 dark:text-gray-400 mt-2";
      nota.textContent = "* Distância da planilha (rota não calculada)";
      elements.map.infoRota.appendChild(nota);
    }

    static validateCoordinates(coords) {
      return (
        coords &&
        typeof coords.lat === "number" &&
        typeof coords.lng === "number" &&
        !isNaN(coords.lat) &&
        !isNaN(coords.lng) &&
        coords.lat >= -90 &&
        coords.lat <= 90 &&
        coords.lng >= -180 &&
        coords.lng <= 180
      );
    }

    static fitMapBounds(coordsMunicipio, coordsPolo) {
      const group = new L.featureGroup([
        L.marker([coordsMunicipio.lat, coordsMunicipio.lng]),
        L.marker([coordsPolo.lat, coordsPolo.lng]),
      ]);
      state.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  // === EVENT LISTENERS ===
  function setupEventListeners() {
    // Modal
    elements.modal.openBtn?.addEventListener("click", () => {
      elements.modal.container.classList.remove("hidden");
      elements.modal.container.classList.add("flex");
      MapManager.initializeMap();
    });

    elements.modal.closeBtn?.addEventListener("click", () => {
      elements.modal.container.classList.add("hidden");
      elements.modal.container.classList.remove("flex");
    });

    elements.modal.container?.addEventListener("click", (event) => {
      if (event.target === elements.modal.container) {
        elements.modal.container.classList.add("hidden");
        elements.modal.container.classList.remove("flex");
      }
    });

    // Busca
    elements.search.input?.addEventListener("input", handleSearchInput);
  }

  async function handleSearchInput() {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
    }

    elements.search.error.classList.add("hidden");

    state.timeoutId = setTimeout(async () => {
      const input = elements.search.input.value.trim();

      if (input.length < CONFIG.MIN_SEARCH_LENGTH) {
        UIManager.hideAllResults();
        return;
      }

      if (state.isLoading) {
        UIManager.showError("Carregando dados... Aguarde.");
        return;
      }

      Logger.info(`Buscando por: "${input}"`);

      const cityKey = SearchEngine.findSimilarCity(input);

      if (cityKey) {
        const dados = state.municipiosData.get(cityKey);
        await processSearchResult(dados);
      } else {
        UIManager.hideAllResults();
        UIManager.showError("Cidade não encontrada. Verifique a digitação.");
      }
    }, CONFIG.DEBOUNCE_DELAY);
  }

  async function processSearchResult(dados) {
    try {
      Logger.info("Processando resultado:", dados);

      UIManager.updateResults(dados);

      // Mostra mapa e loading
      elements.map.container.classList.remove("hidden");
      UIManager.showLoading(elements.map.rotaDistancia);
      UIManager.showLoading(elements.map.rotaTempo);
      elements.map.infoRota.classList.remove("hidden");

      setTimeout(() => state.map?.invalidateSize(), 100);

      // Cria rota
      await MapManager.createRoute(dados);
    } catch (error) {
      Logger.error("Erro ao processar resultado:", error);
      UIManager.showError("Erro ao processar dados. Tente novamente.");
    }
  }

  // === INICIALIZAÇÃO ===
  async function initialize() {
    Logger.info("Inicializando aplicação...");

    setupEventListeners();
    await DataLoader.loadMunicipiosData();

    Logger.success("Aplicação inicializada com sucesso!");
  }

  // Inicia a aplicação
  initialize();
});
