// Configuração e constantes
const MODAL_CONFIG = {
  ANIMATION_DURATION: 300,
  ESCAPE_KEY: "Escape",
  FOCUSABLE_ELEMENTS:
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  MODAL_ID: "modal",
  BACKDROP_CLASS: "modal-backdrop",
};

// Classe principal para gerenciar modais de produtos
class ProductModalManager {
  constructor() {
    this.isOpen = false;
    this.previousFocus = null;
    this.modal = null;
    this.modalContent = null;
    this.focusableElements = [];
    this.firstFocusable = null;
    this.lastFocusable = null;

    this.init();
  }

  init() {
    this.modal = document.getElementById(MODAL_CONFIG.MODAL_ID);
    if (!this.modal) {
      console.error("Modal element not found");
      return;
    }

    this.modalContent = this.modal.querySelector(".modal-content");
    if (!this.modalContent) {
      console.error("Modal content element not found");
      return;
    }

    this.setupEventListeners();
    this.setupAccessibility();
  }

  // Configuração de acessibilidade
  setupAccessibility() {
    // Adicionar atributos ARIA se não existirem
    if (!this.modal.getAttribute("role")) {
      this.modal.setAttribute("role", "dialog");
    }
    if (!this.modal.getAttribute("aria-modal")) {
      this.modal.setAttribute("aria-modal", "true");
    }
    if (!this.modal.getAttribute("aria-labelledby")) {
      this.modal.setAttribute("aria-labelledby", "modal-title");
    }
  }

  // MELHORADO: Event listeners com tratamento completo
  setupEventListeners() {
    // Fechar modal clicando no backdrop
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Fechar modal com Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === MODAL_CONFIG.ESCAPE_KEY && this.isOpen) {
        this.closeModal();
      }
    });

    // Gerenciar foco com Tab
    this.modal.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        this.handleTabKey(e);
      }
    });

    // Botão de fechar
    const closeButton = this.modal.querySelector('[onclick="closeModal()"]');
    if (closeButton) {
      closeButton.removeAttribute("onclick");
      closeButton.addEventListener("click", () => this.closeModal());
    }
  }

  // Gerenciamento de foco com Tab
  handleTabKey(e) {
    if (this.focusableElements.length === 0) return;

    if (e.shiftKey) {
      // Shift + Tab (voltar)
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable.focus();
      }
    } else {
      // Tab (avançar)
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable.focus();
      }
    }
  }

  // Abertura de modal com validação completa
  openModal(productData) {
    try {
      // Validar dados de entrada
      const validatedData = this.validateProductData(productData);
      if (!validatedData) {
        console.error("Dados do produto inválidos");
        return false;
      }

      // Salvar foco atual
      this.previousFocus = document.activeElement;

      // Prevenir scroll do body
      this.preventBodyScroll(true);

      // Atualizar conteúdo do modal
      this.updateModalContent(validatedData);

      // Mostrar modal
      this.showModal();

      // Configurar foco
      this.setupFocus();

      this.isOpen = true;
      return true;
    } catch (error) {
      console.error("Erro ao abrir modal:", error);
      this.showError("Erro ao carregar informações do produto");
      return false;
    }
  }

  // Validação robusta de dados do produto
  validateProductData(data) {
    // Aceitar tanto objeto quanto parâmetros separados (compatibilidade)
    let productData;

    if (typeof data === "object" && data !== null) {
      productData = data;
    } else if (arguments.length >= 4) {
      // Compatibilidade com função original
      productData = {
        title: arguments[0],
        catalogLink: arguments[1],
        creativeLink: arguments[2],
        regulationLink: arguments[3],
      };
    } else {
      return null;
    }

    // Validar campos obrigatórios
    if (!productData.title || typeof productData.title !== "string") {
      console.error("Título do produto é obrigatório");
      return null;
    }

    // Validar e sanitizar URLs
    const links = {
      catalog: this.validateAndSanitizeUrl(productData.catalogLink, "Catálogo"),
      creative: this.validateAndSanitizeUrl(
        productData.creativeLink,
        "Criativos"
      ),
      regulation: this.validateAndSanitizeUrl(
        productData.regulationLink,
        "Regulamento"
      ),
    };

    // Verificar se pelo menos um link é válido
    const validLinks = Object.values(links).filter((link) => link !== null);
    if (validLinks.length === 0) {
      console.error("Pelo menos um link válido é necessário");
      return null;
    }

    return {
      title: this.sanitizeText(productData.title),
      description: this.sanitizeText(productData.description || ""),
      links: links,
      metadata: productData.metadata || {},
    };
  }

  // Validação e sanitização de URLs
  validateAndSanitizeUrl(url, linkType) {
    if (!url || typeof url !== "string") {
      console.warn(`${linkType}: URL não fornecida`);
      return null;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      console.warn(`${linkType}: URL vazia`);
      return null;
    }

    try {
      // Validar URL
      const urlObj = new URL(trimmedUrl);

      // Verificar protocolo seguro
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        console.warn(`${linkType}: Protocolo não seguro - ${urlObj.protocol}`);
        return null;
      }

      // Verificar domínios permitidos (opcional)
      const allowedDomains = [
        "drive.google.com",
        "docs.google.com",
        "uniunica.edu.br",
        // Adicionar outros domínios conforme necessário
      ];

      const isAllowedDomain = allowedDomains.some(
        (domain) =>
          urlObj.hostname === domain || urlObj.hostname.endsWith("." + domain)
      );

      if (!isAllowedDomain) {
        console.warn(`${linkType}: Domínio não permitido - ${urlObj.hostname}`);
        // Ainda retorna a URL, mas com aviso
      }

      return trimmedUrl;
    } catch (error) {
      console.error(`${linkType}: URL inválida - ${trimmedUrl}`, error);
      return null;
    }
  }

  // Sanitização de texto
  sanitizeText(text) {
    if (!text || typeof text !== "string") return "";

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Atualização do conteúdo do modal
  updateModalContent(productData) {
    // Atualizar título
    const titleElement = document.getElementById("modal-title");
    if (titleElement) {
      titleElement.textContent = productData.title;
    }

    // Atualizar links
    this.updateModalLinks(productData.links);

    // Adicionar descrição se fornecida
    if (productData.description) {
      this.updateModalDescription(productData.description);
    }

    // Adicionar metadata se fornecida
    if (Object.keys(productData.metadata).length > 0) {
      this.updateModalMetadata(productData.metadata);
    }
  }

  // Atualização de links do modal
  updateModalLinks(links) {
    const linkElements = {
      catalog: document.getElementById("modal-link-catalogo"),
      creative: document.getElementById("modal-link-criativos"),
      regulation: document.getElementById("modal-link-regulamento"),
    };

    Object.entries(links).forEach(([type, url]) => {
      const element = linkElements[type];
      if (element) {
        if (url) {
          element.href = url;
          element.style.display = "";
          element.setAttribute(
            "aria-label",
            `Abrir ${this.getLinkLabel(type)} em nova aba`
          );

          // Adicionar ícone de link externo se não existir
          if (!element.querySelector(".external-link-icon")) {
            this.addExternalLinkIcon(element);
          }
        } else {
          element.style.display = "none";
          element.removeAttribute("href");
        }
      }
    });
  }

  // Labels para tipos de link
  getLinkLabel(type) {
    const labels = {
      catalog: "Catálogo",
      creative: "Criativos",
      regulation: "Regulamento",
    };
    return labels[type] || type;
  }

  // Adicionar ícone de link externo
  addExternalLinkIcon(linkElement) {
    const icon = document.createElement("svg");
    icon.className = "external-link-icon w-4 h-4 ml-1 inline";
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.innerHTML =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>';

    linkElement.appendChild(icon);
  }

  // Atualizar descrição do modal
  updateModalDescription(description) {
    let descElement = document.getElementById("modal-description");
    if (!descElement) {
      descElement = document.createElement("p");
      descElement.id = "modal-description";
      descElement.className = "text-gray-600 dark:text-gray-300 text-sm mb-4";

      const titleElement = document.getElementById("modal-title");
      if (titleElement && titleElement.nextSibling) {
        titleElement.parentNode.insertBefore(
          descElement,
          titleElement.nextSibling
        );
      }
    }

    descElement.textContent = description;
  }

  // Atualizar metadata do modal
  updateModalMetadata(metadata) {
    // Implementar conforme necessário
    console.log("Metadata do produto:", metadata);
  }

  // Mostrar modal com animação
  showModal() {
    this.modal.classList.remove("hidden");
    this.modal.setAttribute("aria-hidden", "false");

    // Forçar reflow para garantir que a animação funcione
    this.modal.offsetHeight;

    setTimeout(() => {
      this.modalContent.classList.add("opacity-100", "scale-100");
      this.modalContent.classList.remove("opacity-0", "scale-95");
    }, 10);
  }

  // Configurar foco no modal
  setupFocus() {
    // Encontrar elementos focáveis
    this.focusableElements = Array.from(
      this.modal.querySelectorAll(MODAL_CONFIG.FOCUSABLE_ELEMENTS)
    ).filter((el) => !el.disabled && !el.getAttribute("aria-hidden"));

    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable =
      this.focusableElements[this.focusableElements.length - 1];

    // Focar no primeiro elemento ou no título
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    } else {
      const titleElement = document.getElementById("modal-title");
      if (titleElement) {
        titleElement.setAttribute("tabindex", "-1");
        titleElement.focus();
      }
    }
  }

  // Fechar modal
  closeModal() {
    if (!this.isOpen) return;

    this.modalContent.classList.remove("opacity-100", "scale-100");
    this.modalContent.classList.add("opacity-0", "scale-95");

    setTimeout(() => {
      this.modal.classList.add("hidden");
      this.modal.setAttribute("aria-hidden", "true");

      // Restaurar foco
      if (this.previousFocus) {
        this.previousFocus.focus();
      }

      // Restaurar scroll do body
      this.preventBodyScroll(false);

      this.isOpen = false;
    }, MODAL_CONFIG.ANIMATION_DURATION);
  }

  // Prevenir/restaurar scroll do body
  preventBodyScroll(prevent) {
    if (prevent) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    }
  }

  // Mostrar erro
  showError(message) {
    // Criar notificação de erro
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full";
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => (notification.style.transform = "translateX(0)"), 100);
    setTimeout(() => {
      notification.style.transform = "translateX(full)";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Métodos públicos para controle
  isModalOpen() {
    return this.isOpen;
  }

  getModalData() {
    return {
      isOpen: this.isOpen,
      title: document.getElementById("modal-title")?.textContent || "",
      links: {
        catalog: document.getElementById("modal-link-catalogo")?.href || "",
        creative: document.getElementById("modal-link-criativos")?.href || "",
        regulation:
          document.getElementById("modal-link-regulamento")?.href || "",
      },
    };
  }
}

// Instância global do gerenciador
let productModalManager;

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  try {
    productModalManager = new ProductModalManager();
    console.log("Sistema de modal de produtos inicializado");
  } catch (error) {
    console.error("Erro ao inicializar modal de produtos:", error);
  }
});

// Função global para compatibilidade (mantém API original)
function openModal(title, catalogLink, creativeLink, regulationLink) {
  if (!productModalManager) {
    console.error("Modal manager não inicializado");
    return false;
  }

  return productModalManager.openModal({
    title,
    catalogLink,
    creativeLink,
    regulationLink,
  });
}

// Função global para fechar modal
function closeModal() {
  if (!productModalManager) {
    console.error("Modal manager não inicializado");
    return false;
  }

  productModalManager.closeModal();
  return true;
}

// Função avançada para abrir modal com mais opções
function openProductModal(productData) {
  if (!productModalManager) {
    console.error("Modal manager não inicializado");
    return false;
  }

  return productModalManager.openModal(productData);
}

// Função para verificar se modal está aberto
function isModalOpen() {
  return productModalManager ? productModalManager.isModalOpen() : false;
}

// Debug helpers (remover em produção)
window.debugModal = {
  manager: () => productModalManager,
  data: () => productModalManager?.getModalData(),
  open: (data) => productModalManager?.openModal(data),
  close: () => productModalManager?.closeModal(),
  isOpen: () => productModalManager?.isModalOpen(),
};

// Tratamento de erros globais
window.addEventListener("error", (event) => {
  if (
    event.error &&
    event.error.message &&
    event.error.message.includes("modal")
  ) {
    console.error("Erro no sistema de modal:", event.error);
  }
});
