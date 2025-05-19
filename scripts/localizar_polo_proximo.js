document.addEventListener("DOMContentLoaded", () => {
  //Variáveis para o modal
  const openModalBtn = document.getElementById("open-modal-location");
  const closeModalBtn = document.getElementById("close-modal");
  const modal = document.getElementById("modal-location");
  // Varoáveis para o autocomplete
  const inputCidade = document.getElementById("cidade");
  const resultadoPolo = document.getElementById("resultado-polo");
  const resultadoDistancia = document.getElementById("resultado-distancia");
  const poloNome = document.getElementById("polo-nome");
  const distanciaKm = document.getElementById("distancia-km");
  const rotaLink = document.getElementById("rota-link");

  let municipiosData = {}; // { nomeMunicipio: { polo, distancia } }

  // Abrir o modal
  openModalBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });
  // Fechar o modal ao clicar no botão ×
  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });
  // Fechar o modal ao clicar fora da área do conteúdo
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  });
  // Função para carregar dados da aba 2
  async function carregarMunicipios() {
    const apiKey = "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8"; // CUIDADO com a chave de API exposta!
    const sheetId = "1IxAnU18qxiEf-TjvqBEEj9L1W3CsY3-DHDxREV4APmk";
    const sheetName = "Sheet3"; // Nome exato da aba
    // CORREÇÃO AQUI: Use template literals (crases)
    const range = `${sheetName}!C2:K`; // Começa na linha 2, vai da coluna C à K
    // CORREÇÃO AQUI: Use template literals (crases)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    try {
      const response = await fetch(url);
      const json = await response.json();
      const rows = json.values;

      rows.forEach((row) => {
        const municipio = row[0]?.trim();
        const polo = row[3]?.trim(); // Coluna F
        const distancia = row[8]?.trim(); // Coluna K

        if (municipio && polo && distancia) {
          municipiosData[normalizarTexto(municipio)] = { polo, distancia };
        }
      });
    } catch (error) {
      console.error("Erro ao carregar municípios:", error);
    }
    const datalist = document.getElementById("lista-cidades");
    Object.keys(municipiosData).forEach((cidade) => {
      const option = document.createElement("option");
      option.value = cidade;
      datalist.appendChild(option);
    });
  }

  // Carrega os dados ao iniciar
  carregarMunicipios();

  function normalizarTexto(texto) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  // Autocompletar básico (nativo com datalist)
  inputCidade.addEventListener("input", () => {
    const cidadeDigitada = normalizarTexto(inputCidade.value);
    const dados = municipiosData[cidadeDigitada];

    if (dados) {
      // Exibe os dados no modal
      poloNome.textContent = dados.polo;
      distanciaKm.textContent = dados.distancia;

      // Gera link de rota no Google Maps
      const origem = encodeURIComponent(inputCidade.value);
      const destino = encodeURIComponent(dados.polo);
      rotaLink.href = `https://www.google.com/maps/dir/?api=1&origin=${origem}&destination=${destino}`;

      resultadoPolo.classList.remove("hidden");
      resultadoDistancia.classList.remove("hidden");
    } else {
      // Oculta se cidade não encontrada
      resultadoPolo.classList.add("hidden");
      resultadoDistancia.classList.add("hidden");
    }
  });
});
