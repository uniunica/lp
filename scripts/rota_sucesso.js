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
