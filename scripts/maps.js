//Eventos para pesquisa nos mapas
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("city-search");
  const locationList = document.getElementById("location-list");
  const citiesData = simplemaps_countrymap_mapdata.locations;

  // Função para renderizar a lista de polos
  function renderLocationList(cityList) {
    locationList.innerHTML = ""; // Limpa a lista atual

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
        focusCityOnMap(city.name); // Foca no mapa ao clicar na lista
      });
      locationList.appendChild(li);
    });
  }

  // Renderiza a lista inicial
  renderLocationList(Object.values(citiesData));

  // Atualiza a lista conforme digita
  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    if (query === "") {
      // Se o campo de pesquisa estiver vazio, renderiza a lista completa
      renderLocationList(Object.values(citiesData));
    } else {
      const filteredCities = Object.values(citiesData).filter(
        (city) =>
          city.name.toLowerCase().includes(query) ||
          city.description.toLowerCase().includes(query)
      );
      renderLocationList(filteredCities);
    }
  });

  // Centralizar no mapa a cidade selecionada
  function focusCityOnMap(cityName) {
    const cityKey = Object.keys(citiesData).find(
      (key) => citiesData[key].name === cityName
    );
    if (cityKey && simplemaps_countrymap) {
      const cityLocation = citiesData[cityKey];
      const stateKey = getStateKey(cityLocation.lat, cityLocation.lng);
      if (stateKey) {
        simplemaps_countrymap.set_zoom(4);
        simplemaps_countrymap.highlight_region(stateKey);
      }
      showCityPopup(cityLocation);
    }
  }

  function showCityPopup(cityData) {
    const popup = document.getElementById("city-info-popup");
    popup.innerHTML = `
            <h3 class="text-lg font-bold text-purple-800 mb-2">${cityData.name}</h3>
            <p class="text-sm text-gray-700 whitespace-pre-line">${cityData.description}</p>
          `;
    popup.style.position = "absolute";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)"; // Centraliza
    popup.classList.remove("hidden");
  }
});
