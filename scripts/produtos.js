function openModal(title, catalogLink, creativeLink, regulationLink) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-link-catalogo").href = catalogLink;
  document.getElementById("modal-link-criativos").href = creativeLink;
  document.getElementById("modal-link-regulamento").href = regulationLink;

  const modal = document.getElementById("modal");
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.querySelector(".modal-content").classList.add("opacity-100", "scale-100");
  }, 50);
}
function closeModal() {
  const modalContent = document.querySelector("#modal .modal-content");
  modalContent.classList.remove("opacity-100", "scale-100");
  setTimeout(() => {
    document.getElementById("modal").classList.add("hidden");
  }, 300);
}
