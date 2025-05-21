// Função para abrir o modal
function openRotaModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}
// Função para fechar o modal
function closeRotaModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }
}

// Função para configurar o checklist do modal
function setupModalChecklist(etapa) {
  // Variável para armazenar o estado do checklist
  const checkboxes = [
    document.getElementById(`item1-${etapa}`),
    document.getElementById(`item2-${etapa}`),
    document.getElementById(`item3-${etapa}`),
  ];
  // Botão "Próximo" do modal
  const nextButton = document.getElementById(`next-${etapa}`);
  // Adiciona evento de clique ao botão "Próximo"
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const allChecked = checkboxes.every((c) => c.checked);
      if (allChecked) {
        nextButton.classList.remove("hidden");
      } else {
        nextButton.classList.add("hidden");
      }
    });
  });
}
// Função para abrir o próximo modal
function openNextModal(currentModalId, nextModalId) {
  document.getElementById(currentModalId).classList.add("hidden");
  document.getElementById(nextModalId).classList.remove("hidden");
}
// Inicie para cada etapa existente:
["etapa1", "etapa2", "etapa3", "etapa4"].forEach((etapa) =>
  setupModalChecklist(etapa)
);
// Configuração das prévias das imagens
document.addEventListener("DOMContentLoaded", function () {
  // Seleciona todos os elementos que são gatilhos das etapas
  const etapaTriggers = document.querySelectorAll(".etapa-trigger");
  const previewContainer = document.getElementById("image-preview-container");
  const previewImage = document.getElementById("preview-image");
  // Para cada gatilho de etapa
  etapaTriggers.forEach((trigger) => {
    // Quando o mouse entra no elemento
    trigger.addEventListener("mouseenter", function (e) {
      // Obtém o número da etapa do atributo data
      const etapaNum = this.getAttribute("data-etapa-num");
      // Define o caminho da imagem baseado no número da etapa
      const imagePath = `../imgs/modal${etapaNum}.jpg`;
      // Define a imagem de prévia
      previewImage.src = imagePath;
      // Mostra o container
      previewContainer.style.display = "block";
      // Posiciona a prévia próximo ao mouse
      positionPreview(e);
    });
    // Quando o mouse se move sobre o elemento
    trigger.addEventListener("mousemove", function (e) {
      positionPreview(e);
    });
    // Quando o mouse sai do elemento
    trigger.addEventListener("mouseleave", function () {
      // Esconde a prévia
      previewContainer.style.display = "none";
    });
  });
  // Função para posicionar a prévia próximo ao cursor
  function positionPreview(e) {
    // Obtém a posição do mouse
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    // Define a posição do container (com um pequeno offset para não cobrir o cursor)
    previewContainer.style.left = `${mouseX + 20}px`;
    previewContainer.style.top = `${mouseY + 20}px`;
  }
  // Verifica se a imagem existe e trata erros
  previewImage.addEventListener("error", function () {
    // Se a imagem não existir, mostra uma imagem padrão ou esconde o container
    previewContainer.style.display = "none";
    // Alternativamente, você pode definir uma imagem padrão:
    // previewImage.src = '../imgs/default-preview.jpg';
  });
});
