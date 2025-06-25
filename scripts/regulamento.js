// ✅ Configuração para consulta de preços e regulamentos
const REGULAMENTO_CONFIG = {
  SHEET_ID: "1IhFx17oIkf8SSp179g8SeYOkaJgDa6gFCsKrqZ9mlMo",
  API_KEY: "AIzaSyCRSFeco4JJ8uyptRcdIw---kOmoZNwfpM",
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutos
  REQUEST_TIMEOUT: 15000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // ✅ NOVO: Mapeamento específico das colunas por modalidade
  MODALIDADES_SCHEMA: {
    GRADUAÇÃO: {
      nome: "GRADUAÇÃO",
      colunas: {
        A: { key: "curso", label: "Curso - Titularidade", icon: "🎓" },
        B: { key: "tempo_valor", label: "Tempo e Valor do Curso", icon: "⏱️" },
        C: {
          key: "preco_ancoragem",
          label: "Preço de Ancoragem (Início da venda)",
          icon: "🏷️",
        },
        D: {
          key: "preco_venda",
          label: "Preço de Venda (Fechamento da Venda)",
          icon: "💰",
        },
        E: { key: "preco_final", label: "Preço Final (Follow-Up)", icon: "🎯" },
        F: {
          key: "preco_especial",
          label: "Preço Especial (Ex-Aluno e Cobrir Concorrência)",
          icon: "⭐",
        },
      },
      campo_principal: "curso",
    },

    "PÓS GRADUAÇÃO": {
      nome: "PÓS GRADUAÇÃO",
      colunas: {
        A: { key: "curso", label: "Curso", icon: "🎓" },
        B: { key: "forma_pagamento", label: "Forma de Pagamento", icon: "💳" },
        C: { key: "preco_ancoragem", label: "Preço de Ancoragem", icon: "🏷️" },
        D: { key: "preco_venda", label: "Preço de Venda", icon: "💰" },
        E: { key: "preco_final", label: "Preço Final", icon: "🎯" },
        F: { key: "preco_especial", label: "Preço Especial", icon: "⭐" },
      },
      campo_principal: "curso",
    },

    "SEGUNDA GRADUAÇÃO": {
      nome: "SEGUNDA GRADUAÇÃO",
      colunas: {
        A: {
          key: "curso_desejado",
          label: "Curso que o Aluno Deseja Matricular",
          icon: "🎓",
        },
        B: {
          key: "grau_formacao",
          label: "Grau/Formação que o Aluno Possui",
          icon: "📜",
        },
        C: {
          key: "curso_possui",
          label: "Curso que o Aluno Possui",
          icon: "📚",
        },
        D: { key: "tempo_cursar", label: "Tempo a Cursar", icon: "⏱️" },
        E: {
          key: "carga_estagio",
          label: "Carga Horária de Estágio",
          icon: "🏢",
        },
        F: {
          key: "carga_atividades",
          label: "Carga Horária de Atividades Complementares",
          icon: "📋",
        },
        G: {
          key: "formulario_padrao",
          label: "Formulário de Aproveitamento Padrão",
          icon: "📄",
          ignorar: true,
        },
        H: {
          key: "link_formulario",
          label: "Link do Formulário de Aproveitamento",
          icon: "🔗",
        },
        I: { key: "forma_pagamento", label: "Formas de Pagamento", icon: "💳" },
        J: {
          key: "preco_ancoragem",
          label: "Preço de Ancoragem (Início da venda)",
          icon: "🏷️",
        },
        K: {
          key: "preco_venda",
          label: "Preço de Venda (Fechamento da Venda)",
          icon: "💰",
        },
        L: { key: "preco_final", label: "Preço Final (Follow-Up)", icon: "🎯" },
        M: {
          key: "preco_especial",
          label: "Preço Especial (Ex-Aluno e Cobrir Concorrência)",
          icon: "⭐",
        },
      },
      campo_principal: "curso_desejado",
    },

    "DISCIPLINAS ISOLADAS": {
      nome: "DISCIPLINAS ISOLADAS",
      colunas: {
        A: { key: "disciplinas", label: "Disciplinas", icon: "📚" },
        B: { key: "boleto_pix", label: "Boleto Única/PIX", icon: "🏦" },
        C: { key: "pix_cartao", label: "PIX/Cartão de Crédito", icon: "💳" },
        D: {
          key: "menor_preco",
          label: "Menor Preço (Ex-Alunos, Follow-up e Cobrir Concorrência)",
          icon: "⭐",
        },
      },
      campo_principal: "disciplinas",
    },

    EJA: {
      nome: "EJA",
      colunas: {
        A: { key: "nome_curso", label: "Nome do Curso", icon: "🎓" },
        B: { key: "duracao", label: "Duração", icon: "⏱️" },
        C: { key: "boleto_bancario", label: "Boleto Bancário", icon: "🏦" },
        D: { key: "cartao_credito", label: "Cartão de Crédito", icon: "💳" },
      },
      campo_principal: "nome_curso",
    },

    "CURSO TÉCNICO": {
      nome: "CURSO TÉCNICO",
      colunas: {
        A: { key: "disciplinas", label: "Disciplinas", icon: "📚" },
        B: { key: "duracao", label: "Duração", icon: "⏱️" },
        C: { key: "boleto_parcelado", label: "Boleto Parcelado", icon: "🏦" },
        D: { key: "cartao_credito", label: "Cartão de Crédito", icon: "💳" },
      },
      campo_principal: "disciplinas",
    },
  },
};

// ✅ Classe principal para gerenciar consulta de preços
class RegulamentoManager {
  constructor() {
    this.cursosCache = new Map();
    this.isLoading = false;
    this.currentModalidade = null;
    this.currentSchema = null;
    this.currentCursos = [];
    this.filteredCursos = [];
    this.isInitialized = false;
    this.selectedCurso = null;

    console.log("🔧 RegulamentoManager: Construtor iniciado");
    this.init();
  }

  async init() {
    console.log("🔧 RegulamentoManager: Iniciando...");

    if (document.readyState === "loading") {
      console.log("🔧 RegulamentoManager: Aguardando DOM...");
      await new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", resolve);
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    this.setupEventListeners();
    this.setupModal();
    this.isInitialized = true;

    console.log("✅ RegulamentoManager: Inicializado com sucesso");
  }

  setupEventListeners() {
    console.log("🔧 RegulamentoManager: Configurando event listeners...");

    this.setupButtonListener();
    this.setupModalidadeListener();
    this.setupSearchListener();
    this.setupExportListener();
    this.setupKeyboardListeners();

    console.log("✅ RegulamentoManager: Event listeners configurados");
  }

  setupButtonListener() {
    const trySetupButton = (attempt = 1) => {
      const btnAbrirModal = document.getElementById("abrir-modal-precos");

      if (btnAbrirModal) {
        console.log('✅ Botão "abrir-modal-precos" encontrado');

        btnAbrirModal.removeEventListener("click", this.handleButtonClick);

        this.handleButtonClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("🔘 Botão clicado - abrindo modal");
          this.abrirModal();
        };

        btnAbrirModal.addEventListener("click", this.handleButtonClick);
        btnAbrirModal.style.cursor = "pointer";
        btnAbrirModal.setAttribute("data-modal-ready", "true");

        return true;
      } else {
        console.warn(
          `❌ Tentativa ${attempt}: Botão "abrir-modal-precos" não encontrado`
        );

        if (attempt < 5) {
          setTimeout(() => trySetupButton(attempt + 1), 500);
        } else {
          console.error(
            '❌ ERRO: Botão "abrir-modal-precos" não foi encontrado após 5 tentativas'
          );
          this.debugElements();
        }
        return false;
      }
    };

    trySetupButton();
  }

  setupModalidadeListener() {
    const modalidadeSelect = document.getElementById("modalidade-select");
    if (modalidadeSelect) {
      console.log("✅ Seletor de modalidade encontrado");
      modalidadeSelect.addEventListener("change", (e) => {
        this.selecionarModalidade(e.target.value);
      });
    } else {
      console.warn("❌ Seletor de modalidade não encontrado");
    }
  }

  setupSearchListener() {
    const cursoSearch = document.getElementById("curso-search");
    if (cursoSearch) {
      console.log("✅ Campo de busca encontrado");
      cursoSearch.addEventListener("input", (e) => {
        this.filtrarCursos(e.target.value);
      });
    } else {
      console.warn("❌ Campo de busca não encontrado");
    }
  }

  setupExportListener() {
    const btnExportar = document.getElementById("exportar-dados");
    if (btnExportar) {
      console.log("✅ Botão de exportar encontrado");
      btnExportar.addEventListener("click", () => this.exportarDados());
    } else {
      console.warn("❌ Botão de exportar não encontrado");
    }
  }

  setupKeyboardListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.fecharModal();
      }
    });
  }

  setupModal() {
    const modal = document.getElementById("modal-precos");
    if (modal) {
      console.log("✅ Modal encontrado");
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.fecharModal();
        }
      });
    } else {
      console.warn("❌ Modal não encontrado");
    }
  }

  abrirModal() {
    console.log("🔘 abrirModal() chamado");

    const modal = document.getElementById("modal-precos");
    if (!modal) {
      console.error("❌ ERRO: Modal não encontrado ao tentar abrir");
      this.debugElements();
      return;
    }

    console.log("🔘 Modal encontrado, abrindo...");

    try {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      document.body.style.overflow = "hidden";

      console.log("✅ Modal aberto com sucesso");

      setTimeout(() => {
        const modalidadeSelect = document.getElementById("modalidade-select");
        if (modalidadeSelect) {
          modalidadeSelect.focus();
          console.log("✅ Foco definido no seletor de modalidade");
        }
      }, 300);
    } catch (error) {
      console.error("❌ ERRO ao abrir modal:", error);
    }
  }

  fecharModal() {
    console.log("🔘 fecharModal() chamado");

    const modal = document.getElementById("modal-precos");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.style.overflow = "";

      this.resetModal();
      console.log("✅ Modal fechado");
    } else {
      console.warn("❌ Modal não encontrado ao tentar fechar");
    }
  }

  // ✅ NOVO: Reset completo do modal
  resetModal() {
    try {
      const modalidadeSelect = document.getElementById("modalidade-select");
      const cursoSearch = document.getElementById("curso-search");

      if (modalidadeSelect) modalidadeSelect.value = "";
      if (cursoSearch) {
        cursoSearch.value = "";
        cursoSearch.disabled = true;
        cursoSearch.placeholder = "Digite o nome do curso...";
      }

      this.showEstadoVazio();
      this.hideResultados();
      this.hideDetalhes();

      // ✅ NOVO: Limpar estados específicos
      this.currentModalidade = null;
      this.currentSchema = null;
      this.currentCursos = [];
      this.filteredCursos = [];
      this.selectedCurso = null;

      console.log("✅ Modal resetado completamente");
    } catch (error) {
      console.error("❌ Erro ao resetar modal:", error);
    }
  }

  // ✅ NOVO: Selecionar modalidade com schema específico
  async selecionarModalidade(modalidade) {
    console.log(`🔘 Modalidade selecionada: ${modalidade}`);

    if (!modalidade) {
      this.resetModal();
      return;
    }

    // ✅ NOVO: Definir schema da modalidade
    this.currentModalidade = modalidade;
    this.currentSchema = REGULAMENTO_CONFIG.MODALIDADES_SCHEMA[modalidade];

    if (!this.currentSchema) {
      console.error(`❌ Schema não encontrado para modalidade: ${modalidade}`);
      this.showError(`Configuração não encontrada para ${modalidade}`);
      return;
    }

    try {
      this.showLoading();
      this.hideEstadoVazio();
      this.hideDetalhes();

      const cursos = await this.carregarCursos(modalidade);

      if (cursos && cursos.length > 0) {
        this.currentCursos = cursos;
        this.filteredCursos = [...cursos];
        this.renderizarCursos(cursos);
        this.showResultados();

        // Habilitar busca
        const cursoSearch = document.getElementById("curso-search");
        if (cursoSearch) {
          cursoSearch.disabled = false;
          cursoSearch.placeholder = `Buscar em ${cursos.length} ${this.currentSchema.campo_principal}s...`;
        }

        console.log(`✅ ${cursos.length} cursos carregados para ${modalidade}`);
      } else {
        this.showEmptyState(`Nenhum curso encontrado para ${modalidade}`);
      }
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      this.showError("Erro ao carregar cursos. Tente novamente.");
    } finally {
      this.hideLoading();
    }
  }

  // ✅ NOVO: Carregar cursos com processamento específico por modalidade
  async carregarCursos(modalidade) {
    const cacheKey = modalidade;
    if (this.cursosCache.has(cacheKey)) {
      const cached = this.cursosCache.get(cacheKey);
      if (Date.now() - cached.timestamp < REGULAMENTO_CONFIG.CACHE_DURATION) {
        console.log(`Usando cache para ${modalidade}`);
        return cached.data;
      }
    }

    const range = `${modalidade}!A:Z`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${REGULAMENTO_CONFIG.SHEET_ID}/values/${range}?key=${REGULAMENTO_CONFIG.API_KEY}`;

    const data = await this.fetchWithRetry(url);

    if (!data.values || data.values.length < 2) {
      return [];
    }

    const cursos = this.processarDadosCursosEspecifico(data.values, modalidade);

    this.cursosCache.set(cacheKey, {
      data: cursos,
      timestamp: Date.now(),
    });

    return cursos;
  }

  // ✅ NOVO: Processar dados específicos por modalidade
  processarDadosCursosEspecifico(rows, modalidade) {
    if (!rows || rows.length < 2) return [];

    const schema = this.currentSchema;
    if (!schema) return [];

    const cursos = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const curso = {
        id: `${modalidade}_${i}_${Date.now()}`,
        modalidade: modalidade,
        linha: i + 1,
      };

      // ✅ NOVO: Mapear colunas baseado no schema específico
      Object.entries(schema.colunas).forEach(([coluna, config]) => {
        if (config.ignorar) return;

        const colunaIndex = this.getColumnIndex(coluna);
        const valor = row[colunaIndex] || "";
        curso[config.key] = valor.trim();
      });

      // ✅ NOVO: Verificar se tem o campo principal preenchido
      const campoPrincipal = schema.campo_principal;
      if (curso[campoPrincipal] && curso[campoPrincipal].trim()) {
        curso.nome = curso[campoPrincipal];
        curso.searchText = this.normalizeText(curso[campoPrincipal]);
        cursos.push(curso);
      }
    }

    console.log(`✅ Processados ${cursos.length} cursos para ${modalidade}`);
    return cursos;
  }

  // ✅ NOVO: Converter letra da coluna para índice
  getColumnIndex(coluna) {
    return coluna.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
  }

  // ✅ MODIFICADO: Renderizar cursos com container para detalhes inline
  renderizarCursos(cursos) {
    const container = document.getElementById("lista-cursos");
    if (!container) return;

    if (cursos.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-gray-500 dark:text-gray-400">Nenhum curso encontrado</p>
        </div>
      `;
      return;
    }

    container.innerHTML = cursos
      .map((curso) => this.renderizarItemCursoComDetalhes(curso))
      .join("");

    // Adicionar event listeners
    container.querySelectorAll(".curso-item").forEach((item) => {
      item.addEventListener("click", () => {
        const cursoId = item.dataset.cursoId;
        const curso = cursos.find((c) => c.id === cursoId);
        if (curso) {
          this.toggleDetalhesCurso(curso, item);
        }
      });
    });
  }

  // ✅ NOVO: Renderizar item do curso com container para detalhes
  renderizarItemCursoComDetalhes(curso) {
    const schema = this.currentSchema;
    if (!schema) return "";

    const tags = this.criarTagsCurso(curso, schema);

    return `
      <div class="curso-wrapper" data-curso-id="${curso.id}">
        <div class="curso-item bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 cursor-pointer"
             data-curso-id="${curso.id}">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h5 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">${this.escapeHtml(
                curso.nome
              )}</h5>
              <div class="flex flex-wrap gap-2 text-sm">
                ${tags}
              </div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0 ml-4">
              <span class="curso-status text-xs text-gray-500 dark:text-gray-400">Clique para ver detalhes</span>
              <svg class="w-5 h-5 text-gray-400 transition-transform duration-200 curso-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
        </div>
        
        <!-- ✅ NOVO: Container para detalhes inline -->
        <div class="curso-detalhes hidden mt-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700 transition-all duration-300" 
             data-curso-id="${curso.id}">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Informações Detalhadas
            </h4>
            <button class="fechar-detalhes text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50" 
                    data-curso-id="${curso.id}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="curso-info-container space-y-3">
            <!-- Detalhes serão inseridos aqui -->
          </div>
        </div>
      </div>
    `;
  }

  // ✅ NOVO: Toggle detalhes do curso (expandir/recolher)
  toggleDetalhesCurso(curso, itemElement) {
    const wrapper = itemElement.closest('.curso-wrapper');
    const detalhesContainer = wrapper.querySelector('.curso-detalhes');
    const chevron = wrapper.querySelector('.curso-chevron');
    const status = wrapper.querySelector('.curso-status');
    const infoContainer = detalhesContainer.querySelector('.curso-info-container');

    // ✅ NOVO: Fechar outros detalhes abertos
    this.fecharTodosDetalhes();

    // ✅ NOVO: Se este curso já estava selecionado, apenas fechar
    if (this.selectedCurso && this.selectedCurso.id === curso.id) {
      this.selectedCurso = null;
      this.esconderBotaoExportar();
      return;
    }

    // ✅ NOVO: Marcar como selecionado
    this.selectedCurso = curso;

    // ✅ NOVO: Gerar conteúdo dos detalhes
    const detalhesHTML = this.gerarDetalhesHTML(curso);
    infoContainer.innerHTML = detalhesHTML;

    // ✅ NOVO: Mostrar detalhes com animação
    detalhesContainer.classList.remove('hidden');

    // ✅ NOVO: Atualizar visual do item
    itemElement.classList.add('bg-purple-50', 'dark:bg-purple-900/30', 'border-purple-400', 'dark:border-purple-500');
    chevron.style.transform = 'rotate(180deg)';
    status.textContent = 'Detalhes expandidos';

    // ✅ NOVO: Configurar botão de fechar
    const btnFechar = detalhesContainer.querySelector('.fechar-detalhes');
    if (btnFechar) {
      btnFechar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fecharDetalhes(curso.id);
      });
    }

    // ✅ NOVO: Mostrar botão de exportar
    this.mostrarBotaoExportar();

    // ✅ NOVO: Scroll suave para o item
    setTimeout(() => {
      wrapper.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 100);

    console.log(`✅ Detalhes expandidos para: ${curso.nome}`);
  }

  // ✅ NOVO: Fechar todos os detalhes abertos
  fecharTodosDetalhes() {
    const todosDetalhes = document.querySelectorAll('.curso-detalhes');
    const todosItens = document.querySelectorAll('.curso-item');
    const todosChevrons = document.querySelectorAll('.curso-chevron');
    const todosStatus = document.querySelectorAll('.curso-status');

    todosDetalhes.forEach(detalhe => {
      detalhe.classList.add('hidden');
    });

    todosItens.forEach(item => {
      item.classList.remove('bg-purple-50', 'dark:bg-purple-900/30', 'border-purple-400', 'dark:border-purple-500');
    });

    todosChevrons.forEach(chevron => {
      chevron.style.transform = 'rotate(0deg)';
    });

    todosStatus.forEach(status => {
      status.textContent = 'Clique para ver detalhes';
    });
  }

  // ✅ NOVO: Fechar detalhes específicos
  fecharDetalhes(cursoId) {
    const wrapper = document.querySelector(`[data-curso-id="${cursoId}"].curso-wrapper`);
    if (!wrapper) return;

    const detalhesContainer = wrapper.querySelector('.curso-detalhes');
    const itemElement = wrapper.querySelector('.curso-item');
    const chevron = wrapper.querySelector('.curso-chevron');
    const status = wrapper.querySelector('.curso-status');

    detalhesContainer.classList.add('hidden');
    itemElement.classList.remove('bg-purple-50', 'dark:bg-purple-900/30', 'border-purple-400', 'dark:border-purple-500');
    chevron.style.transform = 'rotate(0deg)';
    status.textContent = 'Clique para ver detalhes';

    this.selectedCurso = null;
    this.esconderBotaoExportar();

    console.log(`✅ Detalhes fechados para curso ID: ${cursoId}`);
  }

  // ✅ NOVO: Gerar HTML dos detalhes
  gerarDetalhesHTML(curso) {
    const schema = this.currentSchema;
    if (!schema) {
      return `
        <div class="text-center py-4 text-gray-500 dark:text-gray-400">
          <p>Erro: Schema da modalidade não encontrado.</p>
        </div>
      `;
    }

    const cards = Object.entries(schema.colunas)
      .filter(
        ([coluna, config]) =>
          !config.ignorar && curso[config.key] && curso[config.key].trim()
      )
      .map(([coluna, config]) =>
        this.criarCardInformacao(config, curso[config.key])
      )
      .join("");

    return cards || `
      <div class="text-center py-4 text-gray-500 dark:text-gray-400">
        <p>Informações detalhadas não disponíveis para este curso.</p>
      </div>
    `;
  }

  // ✅ NOVO: Mostrar/esconder botão de exportar
  mostrarBotaoExportar() {
    const btnExportar = document.getElementById("exportar-dados");
    if (btnExportar) {
      btnExportar.classList.remove("hidden");
      btnExportar.classList.add("flex");
    }
  }

  esconderBotaoExportar() {
    const btnExportar = document.getElementById("exportar-dados");
    if (btnExportar) {
      btnExportar.classList.add("hidden");
      btnExportar.classList.remove("flex");
    }
  }

  // ✅ MANTIDO: Criar tags específicas por modalidade
  criarTagsCurso(curso, schema) {
    const tags = [];

    switch (this.currentModalidade) {
      case "GRADUAÇÃO":
        if (curso.tempo_valor)
          tags.push(
            `<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">⏱️ ${this.escapeHtml(
              curso.tempo_valor
            )}</span>`
          );
        if (curso.preco_venda)
          tags.push(
            `<span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">💰 ${this.escapeHtml(
              curso.preco_venda
            )}</span>`
          );
        break;

      case "PÓS GRADUAÇÃO":
        if (curso.forma_pagamento)
          tags.push(
            `<span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs">💳 ${this.escapeHtml(
              curso.forma_pagamento
            )}</span>`
          );
        if (curso.preco_venda)
          tags.push(
            `<span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">💰 ${this.escapeHtml(
              curso.preco_venda
            )}</span>`
          );
        break;

      case "SEGUNDA GRADUAÇÃO":
        if (curso.grau_formacao)
          tags.push(
            `<span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs">📜 ${this.escapeHtml(
              curso.grau_formacao
            )}</span>`
          );
        if (curso.tempo_cursar)
          tags.push(
            `<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">⏱️ ${this.escapeHtml(
              curso.tempo_cursar
            )}</span>`
          );
        break;

      case "DISCIPLINAS ISOLADAS":
        if (curso.boleto_pix)
          tags.push(
            `<span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">🏦 ${this.escapeHtml(
              curso.boleto_pix
            )}</span>`
          );
        break;

      case "EJA":
        if (curso.duracao)
          tags.push(
            `<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">⏱️ ${this.escapeHtml(
              curso.duracao
            )}</span>`
          );
        if (curso.boleto_bancario)
          tags.push(
            `<span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">🏦 ${this.escapeHtml(
              curso.boleto_bancario
            )}</span>`
          );
        break;

      case "CURSO TÉCNICO":
        if (curso.duracao)
          tags.push(
            `<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">⏱️ ${this.escapeHtml(
              curso.duracao
            )}</span>`
          );
        if (curso.boleto_parcelado)
          tags.push(
            `<span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">🏦 ${this.escapeHtml(
              curso.boleto_parcelado
            )}</span>`
          );
        break;
    }

    return tags.join("");
  }

  // ✅ MANTIDO: Criar card de informação
  criarCardInformacao(config, valor) {
    const isPrice =
      config.key.includes("preco") ||
      config.key.includes("boleto") ||
      config.key.includes("cartao");
    const isLink = config.key.includes("link") && valor.startsWith("http");

    let valorFormatado = this.escapeHtml(valor);

    if (isLink) {
      valorFormatado = `<a href="${valor}"  class="text-purple-600 dark:text-purple-400 hover:underline break-all">${valor}</a>`;
    }

    return `
      <div class="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
        <span class="text-xl flex-shrink-0">${config.icon}</span>
        <div class="flex-1 min-w-0">
          <dt class="font-semibold text-gray-900 dark:text-gray-100 mb-1">${
            config.label
          }</dt>
          <dd class="text-gray-700 dark:text-gray-300 ${
            isPrice
              ? "font-mono text-lg font-semibold text-green-600 dark:text-green-400"
              : ""
          }">${valorFormatado}</dd>
        </div>
      </div>
    `;
  }

  // ✅ MODIFICADO: Filtrar cursos e manter estado dos detalhes
  filtrarCursos(query) {
    if (!query.trim()) {
      this.filteredCursos = [...this.currentCursos];
    } else {
      const normalizedQuery = this.normalizeText(query);
      this.filteredCursos = this.currentCursos.filter((curso) =>
        curso.searchText.includes(normalizedQuery)
      );
    }

    // ✅ NOVO: Verificar se curso selecionado ainda está na lista filtrada
    const cursoSelecionadoAindaVisivel = this.selectedCurso && 
      this.filteredCursos.find(c => c.id === this.selectedCurso.id);

    this.renderizarCursos(this.filteredCursos);

    // ✅ NOVO: Reabrir detalhes se o curso ainda estiver visível
    if (cursoSelecionadoAindaVisivel) {
      setTimeout(() => {
        const wrapper = document.querySelector(`[data-curso-id="${this.selectedCurso.id}"].curso-wrapper`);
        const itemElement = wrapper?.querySelector('.curso-item');
        if (wrapper && itemElement) {
          this.toggleDetalhesCurso(this.selectedCurso, itemElement);
        }
      }, 100);
    } else if (this.selectedCurso) {
      // ✅ NOVO: Limpar seleção se curso não está mais visível
      this.selectedCurso = null;
      this.esconderBotaoExportar();
    }
  }

  // ✅ Fetch com retry (mantido)
  async fetchWithRetry(url, maxRetries = REGULAMENTO_CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          REGULAMENTO_CONFIG.REQUEST_TIMEOUT
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

        const delay = REGULAMENTO_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.warn(
          `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // ✅ NOVO: Exportar dados com informações específicas da modalidade
  exportarDados() {
    if (this.filteredCursos.length === 0) {
      this.showNotification("Nenhum curso para exportar", "warning");
      return;
    }

    try {
      const dados = {
        modalidade: this.currentModalidade,
        schema: this.currentSchema,
        total_cursos: this.filteredCursos.length,
        data_exportacao: new Date().toISOString(),
        cursos: this.filteredCursos,
        curso_selecionado: this.selectedCurso,
      };

      const dataStr = JSON.stringify(dados, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `regulamento_${this.currentModalidade
        .toLowerCase()
        .replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      this.showNotification("Dados exportados com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      this.showNotification("Erro ao exportar dados", "error");
    }
  }

  // ✅ Utilitários de UI (mantidos)
  showLoading() {
    const loading = document.getElementById("loading-precos");
    if (loading) loading.classList.remove("hidden");
  }

  hideLoading() {
    const loading = document.getElementById("loading-precos");
    if (loading) loading.classList.add("hidden");
  }

  showResultados() {
    const resultados = document.getElementById("resultados-container");
    if (resultados) resultados.classList.remove("hidden");
  }

  hideResultados() {
    const resultados = document.getElementById("resultados-container");
    if (resultados) resultados.classList.add("hidden");
  }

  // ✅ MODIFICADO: Métodos de detalhes agora são inline
  showDetalhes() {
    // Não usado mais - detalhes são inline
  }

  hideDetalhes() {
    this.fecharTodosDetalhes();
    this.selectedCurso = null;
    this.esconderBotaoExportar();
  }

  showEstadoVazio() {
    const estado = document.getElementById("estado-vazio");
    if (estado) estado.classList.remove("hidden");
  }

  hideEstadoVazio() {
    const estado = document.getElementById("estado-vazio");
    if (estado) estado.classList.add("hidden");
  }

  showEmptyState(message) {
    const container = document.getElementById("lista-cursos");
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-gray-500 dark:text-gray-400">${message}</p>
        </div>
      `;
    }
    this.showResultados();
  }

  showError(message) {
    this.showEmptyState(message);
  }

  debugElements() {
    console.log("🔍 DEBUG: Verificando elementos...");
    console.log(
      "🔍 Botão abrir-modal-precos:",
      document.getElementById("abrir-modal-precos")
    );
    console.log("🔍 Modal precos:", document.getElementById("modal-precos"));
    console.log(
      "🔍 Todos os botões na página:",
      document.querySelectorAll("button")
    );
    console.log(
      '🔍 Elementos com ID que contém "modal":',
      document.querySelectorAll('[id*="modal"]')
    );
  }

  normalizeText(text) {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = "info") {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

// ✅ Funções globais para compatibilidade (mantidas)
window.fecharModalPrecos = function () {
  console.log("🔘 fecharModalPrecos() global chamada");
  if (window.regulamentoManager) {
    window.regulamentoManager.fecharModal();
  } else {
    console.error("❌ regulamentoManager não encontrado");
  }
};

window.abrirModalPrecos = function () {
  console.log("🔘 abrirModalPrecos() global chamada");
  if (window.regulamentoManager) {
    window.regulamentoManager.abrirModal();
  } else {
    console.error("❌ regulamentoManager não encontrado");
  }
};

// ✅ Inicialização (mantida)
const initRegulamento = async () => {
  try {
    console.log("🚀 Iniciando RegulamentoManager...");
    window.regulamentoManager = new RegulamentoManager();

    let attempts = 0;
    while (!window.regulamentoManager.isInitialized && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.regulamentoManager.isInitialized) {
      console.log("✅ Sistema de consulta de preços inicializado com sucesso");
    } else {
      console.error("❌ Timeout na inicialização do RegulamentoManager");
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar RegulamentoManager:", error);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRegulamento);
} else {
  initRegulamento();
}

setTimeout(() => {
  if (!window.regulamentoManager) {
    console.warn(
      "⚠️ Backup: Tentando inicializar RegulamentoManager novamente..."
    );
    initRegulamento();
  }
}, 2000);

// ✅ Debug helpers melhorados
window.debugRegulamento = {
  manager: () => window.regulamentoManager,
  isReady: () => window.regulamentoManager?.isInitialized,
  openModal: () => window.abrirModalPrecos(),
  closeModal: () => window.fecharModalPrecos(),
  testButton: () => {
    const btn = document.getElementById("abrir-modal-precos");
    console.log("🔍 Botão encontrado:", btn);
    if (btn) {
      btn.click();
    }
  },
  clearCache: () => {
    if (window.regulamentoManager) {
      window.regulamentoManager.cursosCache.clear();
      console.log("Cache limpo");
    }
  },
  testModalidade: (modalidade) => {
    if (window.regulamentoManager) {
      window.regulamentoManager.selecionarModalidade(modalidade);
    }
  },
  debugElements: () => {
    if (window.regulamentoManager) {
      window.regulamentoManager.debugElements();
    }
  },
  getSchema: (modalidade) => {
    return REGULAMENTO_CONFIG.MODALIDADES_SCHEMA[modalidade];
  },
  getCurrentData: () => {
    if (window.regulamentoManager) {
      return {
        modalidade: window.regulamentoManager.currentModalidade,
        schema: window.regulamentoManager.currentSchema,
        cursos: window.regulamentoManager.currentCursos,
        filtered: window.regulamentoManager.filteredCursos,
        selected: window.regulamentoManager.selectedCurso,
      };
    }
  },
  // ✅ NOVO: Helpers para testar detalhes inline
  toggleCourse: (cursoId) => {
    const wrapper = document.querySelector(`[data-curso-id="${cursoId}"].curso-wrapper`);
    const item = wrapper?.querySelector('.curso-item');
    if (item) {
      item.click();
    }
  },
  closeAllDetails: () => {
    if (window.regulamentoManager) {
      window.regulamentoManager.fecharTodosDetalhes();
    }
  }
};