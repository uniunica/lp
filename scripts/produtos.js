//Função para abrir modal de produtos com informações
function openModal(titulo, linkCatalogo, linkCriativos, linkRegulamento) {
  document.getElementById("modal-title").textContent = titulo;
  document.getElementById("modal-link-catalogo").href = linkCatalogo;
  document.getElementById("modal-link-criativos").href = linkCriativos;
  document.getElementById("modal-link-regulamento").href = linkRegulamento;
  document.getElementById("modal").classList.remove("hidden");
}
//Função para fechar modal de produtos
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}
