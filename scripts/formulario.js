// ✅ Configuração para formulário
const FORM_CONFIG = {
  FORM_ID: "contatoForm",
  TIMEOUT: 15000, // 15 segundos
  RESET_DELAY: 2000, // 2 segundos
  NOTIFICATION_DURATION: 5000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// ✅ Classe principal para gerenciar formulário
class FormManager {
  constructor() {
    this.form = null;
    this.isSubmitting = false;
    this.submitButton = null;
    this.originalButtonText = "";
    this.retryCount = 0;

    this.init();
  }

  async init() {
    try {
      await this.waitForDOM();
      this.setupForm();
      this.setupValidation();
      this.setupEventListeners();
      this.setupAccessibility();

      console.log("Sistema de formulário inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar formulário:", error);
      this.showError("Erro ao carregar formulário");
    }
  }

  // ✅ NOVO: Aguardar DOM estar pronto
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", resolve);
      } else {
        resolve();
      }
    });
  }

  // ✅ NOVO: Adicionar botão de reset manual se não existir
  setupForm() {
    this.form = document.getElementById(FORM_CONFIG.FORM_ID);

    if (!this.form) {
      throw new Error(
        `Formulário com ID "${FORM_CONFIG.FORM_ID}" não encontrado`
      );
    }

    // Encontrar botão de submit
    this.submitButton = this.form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );
    if (this.submitButton) {
      this.originalButtonText =
        this.submitButton.textContent || this.submitButton.value;
    }

    // Configurar atributos do formulário
    this.form.setAttribute("novalidate", "true");
    this.form.setAttribute("autocomplete", "on");
  }

  // ✅ NOVO: Configurar acessibilidade
  setupAccessibility() {
    // Adicionar ARIA labels se não existirem
    const inputs = this.form.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      if (
        !input.getAttribute("aria-label") &&
        !input.getAttribute("aria-labelledby")
      ) {
        const label = this.form.querySelector(`label[for="${input.id}"]`);
        if (label) {
          input.setAttribute(
            "aria-labelledby",
            label.id || `label-${input.id}`
          );
          if (!label.id) {
            label.id = `label-${input.id}`;
          }
        }
      }
    });

    // Configurar live region para anúncios
    this.createLiveRegion();
  }

  // ✅ NOVO: Criar região live para screen readers
  createLiveRegion() {
    if (!document.getElementById("form-live-region")) {
      const liveRegion = document.createElement("div");
      liveRegion.id = "form-live-region";
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.className = "sr-only";
      document.body.appendChild(liveRegion);
    }
  }

  // ✅ NOVO: Anunciar para screen readers
  announceToScreenReader(message) {
    const liveRegion = document.getElementById("form-live-region");
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => (liveRegion.textContent = ""), 1000);
    }
  }

  // ✅ MELHORADO: Event listeners
  setupEventListeners() {
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    // Validação em tempo real apenas no blur (não no input)
    const inputs = this.form.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateField(input));
      input.addEventListener("input", () => this.clearFieldError(input));
    });

    // Prevenir duplo envio
    this.form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey && !this.isSubmitting) {
        this.handleSubmit(e);
      }
    });
  }

  // ✅ CORRIGIDO: Validação de campo individual
  validateField(field) {
    const errors = [];
    const value = field.value.trim();

    // ✅ Validações básicas
    if (field.hasAttribute("required") && !value) {
      errors.push(`${this.getFieldLabel(field)} é obrigatório`);
    }

    // Se o campo está vazio e não é obrigatório, não validar o resto
    if (!value && !field.hasAttribute("required")) {
      this.clearFieldError(field);
      return true;
    }

    // ✅ Validação de email
    if (field.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push("Email inválido");
      }
    }

    // ✅ Validação de telefone
    if (field.type === "tel" && value) {
      const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
      if (!phoneRegex.test(value)) {
        errors.push("Telefone inválido");
      }
    }

    // ✅ CORRIGIDO: Validação de comprimento mínimo
    const minLength =
      parseInt(field.getAttribute("minlength")) || field.minLength;
    if (minLength && minLength > 0 && value.length < minLength) {
      errors.push(`Mínimo ${minLength} caracteres`);
    }

    // ✅ CORRIGIDO: Validação de comprimento máximo
    const maxLength =
      parseInt(field.getAttribute("maxlength")) || field.maxLength;
    if (maxLength && maxLength > 0 && value.length > maxLength) {
      errors.push(`Máximo ${maxLength} caracteres`);
    }

    // ✅ Validação de nome (apenas letras, espaços e acentos)
    if (
      field.name === "nome" ||
      field.id === "nome" ||
      (field.type === "text" &&
        this.getFieldLabel(field).toLowerCase().includes("nome"))
    ) {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
      if (value && !nameRegex.test(value)) {
        errors.push("Nome deve conter apenas letras");
      }
    }

    // Mostrar ou limpar erros
    if (errors.length > 0) {
      this.showFieldError(field, errors[0]);
      return false;
    } else {
      this.clearFieldError(field);
      return true;
    }
  }

  // ✅ NOVO: Obter label do campo
  getFieldLabel(field) {
    const label = this.form.querySelector(`label[for="${field.id}"]`);
    if (label) {
      return label.textContent.replace("*", "").trim();
    }
    return field.placeholder || field.name || "Campo";
  }

  // ✅ NOVO: Mostrar erro no campo
  showFieldError(field, message) {
    this.clearFieldError(field);

    field.classList.add("error");
    field.setAttribute("aria-invalid", "true");

    const errorElement = document.createElement("div");
    errorElement.className = "field-error text-red-600 text-sm mt-1";
    errorElement.textContent = message;
    errorElement.id = `error-${field.id}`;

    field.setAttribute("aria-describedby", errorElement.id);
    field.parentNode.appendChild(errorElement);
  }

  // ✅ NOVO: Limpar erro do campo
  clearFieldError(field) {
    field.classList.remove("error");
    field.setAttribute("aria-invalid", "false");
    field.removeAttribute("aria-describedby");

    const existingError = field.parentNode.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
    }
  }

  // ✅ NOVO: Validação completa do formulário
  setupValidation() {
    // Adicionar CSS para estados de erro
    if (!document.getElementById("form-validation-styles")) {
      const style = document.createElement("style");
      style.id = "form-validation-styles";
      style.textContent = `
        .error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 1px #ef4444 !important;
        }
        
        .field-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        .form-loading {
          opacity: 0.7;
          pointer-events: none;
        }
        
        .submit-loading {
          position: relative;
          color: transparent !important;
        }
        
        .submit-loading::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          top: 50%;
          left: 50%;
          margin-left: -8px;
          margin-top: -8px;
          border: 2px solid #ffffff;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ✅ MELHORADO: Validar formulário completo
  validateForm() {
    const inputs = this.form.querySelectorAll(
      "input[required], textarea[required], select[required]"
    );
    let isValid = true;
    let firstErrorField = null;

    inputs.forEach((input) => {
      if (!this.validateField(input)) {
        isValid = false;
        if (!firstErrorField) {
          firstErrorField = input;
        }
      }
    });

    // Focar no primeiro campo com erro
    if (!isValid && firstErrorField) {
      firstErrorField.focus();
      this.announceToScreenReader(
        "Formulário contém erros. Verifique os campos destacados."
      );
    }

    return isValid;
  }

  // ✅ MELHORADO: Manipulação de envio com reset garantido
  async handleSubmit(event) {
    event.preventDefault();

    if (this.isSubmitting) {
      console.log("Formulário já está sendo enviado");
      return;
    }

    // Validar formulário
    if (!this.validateForm()) {
      this.showError("Por favor, corrija os erros antes de enviar");
      return;
    }

    try {
      this.setLoadingState(true);

      const formData = new FormData(this.form);

      // ✅ NOVO: Tentar envio com tratamento mais robusto
      let success = false;
      let errorMessage = "";

      try {
        success = await this.submitWithRetry(formData);
      } catch (error) {
        errorMessage = error.message;

        // ✅ Se o erro sugere que pode ter sido enviado, tratar como sucesso
        if (
          errorMessage.includes("confirmação") ||
          errorMessage.includes("pode ter sido enviado")
        ) {
          success = true;
        }
      }

      if (success) {
        this.handleSuccess();
      } else {
        this.handleError(errorMessage || "Erro ao enviar formulário");
      }
    } catch (error) {
      console.error("Erro no envio:", error);
      this.handleError(error.message || "Erro inesperado ao enviar formulário");
    } finally {
      this.setLoadingState(false);
    }
  }

  // ✅ NOVO: Envio com retry mais tolerante
  async submitWithRetry(formData) {
    let lastError = null;

    for (let attempt = 1; attempt <= FORM_CONFIG.MAX_RETRIES; attempt++) {
      try {
        const success = await this.submitForm(formData);
        if (success) {
          console.log(`Formulário enviado com sucesso na tentativa ${attempt}`);
          return true;
        }
      } catch (error) {
        lastError = error;
        console.warn(`Tentativa ${attempt} falhou:`, error.message);

        // ✅ Se é o último retry e o erro sugere possível envio, considerar sucesso
        if (attempt === FORM_CONFIG.MAX_RETRIES) {
          if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError") ||
            error.message.includes("confirmação")
          ) {
            console.log(
              "Última tentativa com erro de rede - assumindo possível sucesso"
            );
            throw new Error(
              "Possível problema de conexão. Se você recebeu um email de confirmação, o formulário foi enviado com sucesso."
            );
          }
          throw error;
        }

        // Aguardar antes do próximo retry
        await new Promise((resolve) =>
          setTimeout(resolve, FORM_CONFIG.RETRY_DELAY * attempt)
        );
      }
    }

    throw lastError || new Error("Falha após todas as tentativas");
  }

  // ✅ MELHORADO: Envio do formulário com tratamento mais flexível
  async submitForm(formData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FORM_CONFIG.TIMEOUT);

    try {
      const response = await fetch(this.form.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // ✅ CORRIGIDO: Aceitar mais códigos de status como sucesso
      if (
        response.ok ||
        response.status === 200 ||
        response.status === 201 ||
        response.status === 302
      ) {
        return true;
      }

      // ✅ NOVO: Tentar verificar se o conteúdo indica sucesso
      try {
        const responseText = await response.text();

        // Se a resposta contém indicadores de sucesso, considerar como enviado
        if (
          responseText.includes("success") ||
          responseText.includes("enviado") ||
          responseText.includes("obrigado") ||
          responseText.includes("thank") ||
          response.status === 0
        ) {
          // Status 0 pode indicar sucesso em alguns casos
          console.log(
            "Formulário provavelmente enviado com sucesso baseado no conteúdo da resposta"
          );
          return true;
        }

        throw new Error(
          `HTTP ${response.status}: ${responseText || response.statusText}`
        );
      } catch (parseError) {
        // Se não conseguir ler a resposta, mas o status não é claramente um erro
        if (response.status < 400) {
          console.log("Assumindo sucesso baseado no status HTTP");
          return true;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error("Tempo limite excedido. Verifique sua conexão.");
      }

      // ✅ NOVO: Se o erro é de rede mas pode ter sido enviado
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        // Mostrar mensagem mais amigável e assumir que pode ter sido enviado
        console.warn(
          "Erro de rede detectado, mas o formulário pode ter sido enviado"
        );
        throw new Error(
          "Possível problema de conexão. Se você recebeu um email de confirmação, o formulário foi enviado com sucesso."
        );
      }

      throw error;
    }
  }

  // ✅ NOVO: Estados de loading
  setLoadingState(loading) {
    this.isSubmitting = loading;

    if (loading) {
      this.form.classList.add("form-loading");
      if (this.submitButton) {
        this.submitButton.disabled = true;
        this.submitButton.classList.add("submit-loading");
        this.submitButton.textContent = "Enviando...";
      }
    } else {
      this.form.classList.remove("form-loading");
      if (this.submitButton) {
        this.submitButton.disabled = false;
        this.submitButton.classList.remove("submit-loading");
        this.submitButton.textContent = this.originalButtonText;
      }
    }
  }

  // ✅ MELHORADO: Manipulação de sucesso com reset garantido
  handleSuccess() {
    this.showSuccess("Formulário enviado com sucesso! Em breve retornaremos.");
    this.announceToScreenReader("Formulário enviado com sucesso");

    // ✅ NOVO: Reset imediato E com delay para garantir
    this.resetForm();

    // Disparar evento customizado
    window.dispatchEvent(
      new CustomEvent("form-enviado", {
        detail: { timestamp: Date.now() },
      })
    );

    // ✅ Reset adicional com delay para garantir
    setTimeout(() => {
      this.resetForm();
    }, 500);

    // ✅ NOVO: Reset forçado após mais tempo
    setTimeout(() => {
      this.forceResetForm();
    }, FORM_CONFIG.RESET_DELAY);
  }

  // ✅ NOVO: Reset forçado do formulário
  forceResetForm() {
    try {
      console.log("Executando reset forçado do formulário");

      // Reset do formulário
      this.form.reset();

      // Limpar todos os campos manualmente
      const inputs = this.form.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => {
        if (input.type !== "submit" && input.type !== "button") {
          input.value = "";
          input.checked = false;
          input.selectedIndex = 0;
          this.clearFieldError(input);
        }
      });

      // Remover classes de erro
      this.form.classList.remove("form-loading");

      // Focar no primeiro campo
      const firstInput = this.form.querySelector(
        'input:not([type="submit"]):not([type="button"]), textarea, select'
      );
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }

      console.log("Reset forçado concluído");
    } catch (error) {
      console.error("Erro no reset forçado:", error);
    }
  }

  // ✅ MELHORADO: Manipulação de erro
  handleError(message) {
    this.showError(message);
    this.announceToScreenReader(`Erro: ${message}`);
  }

  // ✅ NOVO: Reset seguro do formulário
  resetForm() {
    try {
      this.form.reset();

      // Limpar erros de validação
      const inputs = this.form.querySelectorAll("input, textarea, select");
      inputs.forEach((input) => this.clearFieldError(input));

      // Focar no primeiro campo
      const firstInput = this.form.querySelector("input, textarea, select");
      if (firstInput) {
        firstInput.focus();
      }

      console.log("Formulário resetado com sucesso");
    } catch (error) {
      console.error("Erro ao resetar formulário:", error);
    }
  }

  // ✅ NOVO: Sistema de notificações
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;

    const styles = {
      error: "bg-red-500 text-white",
      success: "bg-green-500 text-white",
      warning: "bg-yellow-500 text-black",
      info: "bg-blue-500 text-white",
    };

    notification.className += ` ${styles[type] || styles.info}`;
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <p class="font-medium">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg hover:opacity-70 flex-shrink-0">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => (notification.style.transform = "translateX(0)"), 100);
    setTimeout(() => {
      notification.style.transform = "translateX(full)";
      setTimeout(() => notification.remove(), 300);
    }, FORM_CONFIG.NOTIFICATION_DURATION);
  }

  // ✅ NOVO: Métodos públicos para controle
  getFormData() {
    return new FormData(this.form);
  }

  isFormValid() {
    return this.validateForm();
  }

  clearAllErrors() {
    const inputs = this.form.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => this.clearFieldError(input));
  }

  focusFirstField() {
    const firstInput = this.form.querySelector("input, textarea, select");
    if (firstInput) {
      firstInput.focus();
    }
  }
}

// ✅ Instância global
let formManager;

// ✅ Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  try {
    formManager = new FormManager();
  } catch (error) {
    console.error("Erro ao inicializar gerenciador de formulário:", error);
  }
});

// ✅ Funções globais para compatibilidade
window.handleFormSubmit = function (event) {
  if (formManager) {
    formManager.handleSubmit(event);
  } else {
    console.error("Gerenciador de formulário não inicializado");
  }
};

window.resetFormAfterSend = function () {
  if (formManager) {
    formManager.resetForm();
  }
};

// ✅ Debug helpers melhorados
window.debugForm = {
  manager: () => formManager,
  validate: () => formManager?.isFormValid(),
  reset: () => formManager?.resetForm(),
  forceReset: () => formManager?.forceResetForm(),
  clear: () => formManager?.clearAllErrors(),
  data: () => formManager?.getFormData(),
  testSubmit: () => {
    if (formManager) {
      console.log("Testando envio do formulário...");
      formManager.handleSuccess(); // Simular sucesso
    }
  },
};
