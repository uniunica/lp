document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("city-search");
  const locationList = document.getElementById("location-list");

  // Carrega os polos da planilha do Google Sheets
  async function carregarPolos() {
    const apiKey = "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8";
    const sheetId = "1IxAnU18qxiEf-TjvqBEEj9L1W3CsY3-DHDxREV4APmk";
    const range = "A2:N"; // Inclui até coluna N
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    try {
      const response = await fetch(url);
      const json = await response.json();
      const rows = json.values;

      const newLocations = {};

      rows.forEach((row, index) => {
        const name = row[0]?.trim(); // Coluna A – Nome do Polo
        const responsavel = row[2]?.trim() || ""; // Coluna C
        const endereco = row[3]?.trim() || ""; // Coluna D
        const cidade = row[4]?.trim() || ""; // Coluna E
        const estado = row[5]?.trim() || ""; // Coluna F
        const cep = row[6]?.trim() || ""; // Coluna G
        const telefone = row[7]?.trim() || ""; // Coluna H
        const email = row[8]?.trim() || ""; // Coluna I

        const lat = parseFloat(row[12]); // Coluna M
        const lng = parseFloat(row[13]); // Coluna N

        const description = `
Responsável: ${responsavel}
Endereço: ${endereco}
Cidade: ${cidade}
Estado: ${estado}
CEP: ${cep}
Telefone: ${telefone}
E-mail: ${email}`.trim();

        if (name && !isNaN(lat) && !isNaN(lng)) {
          newLocations[`loc_${index}`] = {
            name,
            description,
            lat,
            lng,
          };
        }
      });

      simplemaps_countrymap_mapdata.locations = newLocations;
      renderLocationList(Object.values(newLocations));
    } catch (error) {
      console.error("Erro ao carregar polos:", error);
    }
  }

  // Renderiza a lista de locais
  function renderLocationList(cityList) {
    locationList.innerHTML = "";

    const emptyPlaceholder = document.createElement("li");
    emptyPlaceholder.id = "empty-placeholder";
    emptyPlaceholder.className = "p-3 text-gray-500 italic text-center";
    emptyPlaceholder.textContent = "Nenhum polo encontrado";

    if (cityList.length === 0) {
      locationList.appendChild(emptyPlaceholder);
      return;
    }

    cityList.forEach((city) => {
      const li = document.createElement("li");
      li.classList.add("px-4", "py-2", "hover:bg-purple-100", "cursor-pointer");
      li.innerHTML = `
        <strong>${city.name}</strong><br>
        <span class="text-sm text-gray-600">${city.description}</span>
      `;
      li.addEventListener("click", () => {
        focusCityOnMap(city.name);
      });
      locationList.appendChild(li);
    });
  }

  // Busca com filtro dinâmico
  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const citiesData = simplemaps_countrymap_mapdata.locations;
    if (query === "") {
      renderLocationList(Object.values(citiesData));
    } else {
      const filtered = Object.values(citiesData).filter(
        (city) =>
          city.name.toLowerCase().includes(query) ||
          city.description.toLowerCase().includes(query)
      );
      renderLocationList(filtered);
    }
  });

  // Inicia carregando os dados
  await carregarPolos();
});
