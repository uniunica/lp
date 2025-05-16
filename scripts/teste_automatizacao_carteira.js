const parceiros = {}; // Objeto para armazenar os parceiros
//Variáveis de carteiras
const carteiras = {
  "Carteira 1": "+553175211620",
  "Carteira 2": "+553175600226",
  "Carteira 4": "+553175273233",
  "Carteira 5": "+553193680179",
  "Carteira 6": "+553175600175",
  "NOVATOS": "+553182379090",
};
async function carregarParceiros() {
  const apiKey = "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8";
  const sheetId = "10y9u_paf91ZxcJIrQDo8ZCVL6iGAQHiOIv7XB5Cua1w";
  const range = "A2:B"; // Intervalo de células a serem lidas
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Assumindo que A = Nome, B = Carteira
    data.values.forEach(([nome, carteira]) => {
      parceiros[nome] = carteira;
    });
  } catch (error) {
    console.error("Erro ao carregar parceiros:", error);
  }
}
// Variáveis do modal
const modal = document.getElementById("consultor-modal");
const abrirModal = document.getElementById("abrir-modal");
const nomeInput = document.getElementById("nome-parceiro");
const listaAuto = document.getElementById("autocomplete-list");
const contatoSection = document.getElementById("contato-section");
const btnWhatsapp = document.getElementById("btn-whatsapp");
// Evento de abertura do modal
abrirModal.addEventListener("click", (e) => {
  e.preventDefault();
  modal.classList.remove("hidden");
  nomeInput.value = "";
  listaAuto.innerHTML = "";
  listaAuto.classList.add("hidden");
  contatoSection.classList.add("hidden");
});
// Evento de fechamento do modal
function fecharModal() {
  modal.classList.add("hidden");
}
// Evento de Autocomplete
nomeInput.addEventListener("input", function () {
  const texto = this.value.toLowerCase();
  listaAuto.innerHTML = "";
  if (texto.length === 0) {
    listaAuto.classList.add("hidden");
    return;
  }

  const sugestoes = Object.keys(parceiros).filter((nome) =>
    nome.toLowerCase().includes(texto)
  );
  if (sugestoes.length > 0) {
    listaAuto.classList.remove("hidden");
    sugestoes.forEach((nome) => {
      const item = document.createElement("li");
      item.textContent = nome;
      item.classList = "cursor-pointer px-3 py-2 hover:bg-purple-100";
      item.addEventListener("click", () => {
        nomeInput.value = nome;
        listaAuto.innerHTML = "";
        listaAuto.classList.add("hidden");
        mostrarContato(nome);
      });
      listaAuto.appendChild(item);
    });
  } else {
    listaAuto.classList.add("hidden");
  }
});
// Função para mostrar o contato
function mostrarContato(nome) {
  const carteira = parceiros[nome];
  if (carteira && carteiras[carteira]) {
    const numero = carteiras[carteira];
    const numeroVisivel = document.getElementById("numero-visivel");
    // Atualiza o texto do número visível
    numeroVisivel.textContent = `${numero}`;
    // Define as cores por carteira
    const coresPorCarteira = {
      "Carteira 1": "bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100",
      "Carteira 2": "bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100",
      "Carteira 4": "bg-pink-100 dark:bg-pink-700 text-pink-800 dark:text-pink-100",
      "Carteira 5": "bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100",
      "Carteira 6": "bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100",
      "NOVATOS": "bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-100",
    };
    // Remove todas as cores anteriores
    numeroVisivel.className = "mt-3 px-3 py-2 border rounded-lg text-sm font-medium select-text cursor-pointer transition duration-200 dark:hover:bg-purple-800";
    // Adiciona a nova cor com base na carteira
    const corClasse = coresPorCarteira[carteira];
    if (corClasse) {
      numeroVisivel.classList.add(...corClasse.split(" "));
    }
    // Atualiza o link do botão de WhatsApp
    btnWhatsapp.href = `https://wa.me/${numero}`;
    // Seleciona automaticamente o número ao clicar
    numeroVisivel.onclick = function () {
      const range = document.createRange();
      range.selectNodeContents(numeroVisivel);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    };
    // Mostrar a seção de contato
    contatoSection.classList.remove("hidden");
  }
}
document.addEventListener("DOMContentLoaded", carregarParceiros);