// Variáveis para pesquisa dentro dos cards de links úteis:
const input = document.getElementById("pesquisa-links");
const cards = document.querySelectorAll("#cards-links a");
const mensagemSemResultado = document.getElementById("mensagem-sem-resultado");
// Evento para pesquisa de links
input.addEventListener("input", function () {
  const termo = this.value.toLowerCase();
  let encontrouResultados = false;
    // Busca nos cards
  cards.forEach((card) => {
    const titulo = card.querySelector("h3").textContent.toLowerCase();
    const descricao = card.querySelector("p").textContent.toLowerCase();
    // Verifica se o título ou descrição contém o termo pesquisado
    if (titulo.includes(termo) || descricao.includes(termo)) {
      card.style.display = "block";
      encontrouResultados = true;
    } else {
      card.style.display = "none";
    }
  });
  // Mostra ou esconde a mensagem com base no resultado
  if (encontrouResultados) {
    mensagemSemResultado.classList.add("hidden");
  } else {
    mensagemSemResultado.classList.remove("hidden");
  }
});
// Variáveis para mostrar mais/menos links
const verMaisBtn = document.getElementById("ver-mais-btn");
const recolherBtn = document.getElementById("recolher-btn");
const linksOcultos = document.querySelectorAll(".hidden-link");
// Mostrar mais
verMaisBtn.addEventListener("click", function () {
  linksOcultos.forEach((link) => link.classList.remove("hidden"));
  verMaisBtn.classList.add("hidden");
  recolherBtn.classList.remove("hidden");
});
// Recolher
recolherBtn.addEventListener("click", function () {
  linksOcultos.forEach((link) => link.classList.add("hidden"));
  recolherBtn.classList.add("hidden");
  verMaisBtn.classList.remove("hidden");
  // Rolagem suave até a seção "Links Úteis"
  const destino = document.getElementById("links-uteis");
  if (destino) {
    destino.scrollIntoView({ behavior: "smooth" });
  }
});
