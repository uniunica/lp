document.addEventListener("DOMContentLoaded", () => {
  // --- Configurações da Planilha Google ---
  // IMPORTANTE: Substitua pelos seus próprios valores!
  const GOOGLE_SHEETS_API_KEY = "AIzaSyDqOzQWHPmUxy_6XSJM0TpFrcFyeAShVq8";
  const GOOGLE_SHEET_ID = "13_QJNE8URu8LahoEq9O6VctLdCOUVurIM94TzOTyszY";
  const SHEET_RANGE = "A2:C"; // Coluna A: Títulos, B: Descrições, C: URLs. Começando da linha 2.
  const INITIAL_VISIBLE_LINKS = 4; // Número de links visíveis inicialmente

  // --- Elementos do DOM ---
  const inputPesquisa = document.getElementById("pesquisa-links");
  const cardsLinksDiv = document.getElementById("cards-links");
  const mensagemSemResultado = document.getElementById(
    "mensagem-sem-resultado"
  );
  const verMaisBtn = document.getElementById("ver-mais-btn");
  const recolherBtn = document.getElementById("recolher-btn");

  let isVerTodosActive = false; // Controla se todos os links (incluindo os ocultos) devem ser mostrados

  async function carregarLinksUteis() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${SHEET_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Erro ao buscar dados da planilha: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();

      cardsLinksDiv.innerHTML = ""; // Limpa links estáticos ou anteriores

      if (!data.values || data.values.length === 0) {
        cardsLinksDiv.innerHTML =
          '<p class="text-center text-purple-800 dark:text-purple-200">Nenhum link útil disponível no momento.</p>';
        verMaisBtn.classList.add("hidden");
        recolherBtn.classList.add("hidden");
        mensagemSemResultado.classList.add("hidden");
        console.warn("Nenhum dado encontrado na planilha ou planilha vazia.");
        return;
      }

      data.values.forEach(([titulo, descricao, linkUrl], index) => {
        if (!titulo || !linkUrl) {
          console.warn(
            `Pulando linha ${index + 2} da planilha por falta de título ou URL.`
          );
          return;
        }

        const cardLink = document.createElement("a");
        cardLink.href = linkUrl;
        cardLink.target = "_blank";
        cardLink.rel = "noopener";
        // Estilização moderna com hover, sombras suaves e transições
        cardLink.className = `
          group block rounded-2xl p-5 bg-white/60 dark:bg-purple-900/70
          backdrop-blur border border-purple-200 dark:border-purple-700
          shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
        `;

        const h3 = document.createElement("h3");
        h3.className = `
          text-xl font-bold text-purple-800 dark:text-purple-300 mb-2
          group-hover:underline transition-colors duration-300
        `;
        h3.textContent = titulo;

        const p = document.createElement("p");
        p.className = `
          text-sm text-gray-700 dark:text-gray-300
          leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors duration-300
        `;
        p.textContent = descricao || ""; // Usa string vazia se não houver descrição

        cardLink.appendChild(h3);
        cardLink.appendChild(p);

        // Adiciona a classe 'hidden-link' para links além do limite inicial
        // A classe 'hidden' do Tailwind será gerenciada pela função updateLinkVisibility
        if (index >= INITIAL_VISIBLE_LINKS) {
          cardLink.classList.add("hidden-link");
        }

        cardsLinksDiv.appendChild(cardLink);
      });

      initializeLinkInteractions();
    } catch (error) {
      console.error("Erro ao carregar links úteis:", error);
      cardsLinksDiv.innerHTML = `<p class="text-center text-red-500">Ocorreu um erro ao carregar os links. Verifique o console para detalhes.</p>`;
      verMaisBtn.classList.add("hidden");
      recolherBtn.classList.add("hidden");
    }
  }

  function updateLinkVisibility() {
    if (!cardsLinksDiv) return; // Proteção caso o div não exista

    const termoPesquisa = inputPesquisa.value.toLowerCase();
    let encontrouResultadosNaPesquisa = false;
    const todosOsCards = cardsLinksDiv.querySelectorAll("a");

    todosOsCards.forEach((card) => {
      const titulo = card.querySelector("h3")?.textContent.toLowerCase() || "";
      const descricao =
        card.querySelector("p")?.textContent.toLowerCase() || "";
      const correspondeAPesquisa =
        termoPesquisa === "" ||
        titulo.includes(termoPesquisa) ||
        descricao.includes(termoPesquisa);

      const ehLinkOcultavel = card.classList.contains("hidden-link");
      let deveSerVisivel = false;

      if (correspondeAPesquisa) {
        if (termoPesquisa !== "") {
          // Se há termo de pesquisa, mostrar tudo que corresponde (mesmo que seja hidden-link)
          deveSerVisivel = true;
        } else {
          // Caso contrário, seguir lógica de ocultamento
          if (ehLinkOcultavel) {
            deveSerVisivel = isVerTodosActive;
          } else {
            deveSerVisivel = true;
          }
        }
      }
 else {
        deveSerVisivel = false; // Oculto pela pesquisa
      }

      if (deveSerVisivel) {
        card.classList.remove("hidden"); // Remove a classe 'hidden' do Tailwind
        encontrouResultadosNaPesquisa = true;
      } else {
        card.classList.add("hidden"); // Adiciona a classe 'hidden' do Tailwind
      }
    });

    // Gerencia mensagem de "sem resultados"
    if (encontrouResultadosNaPesquisa) {
      mensagemSemResultado.classList.add("hidden");
    } else {
      // Mostra a mensagem apenas se houver um termo de pesquisa
      if (termoPesquisa !== "") {
        mensagemSemResultado.classList.remove("hidden");
      } else {
        mensagemSemResultado.classList.add("hidden");
      }
    }

    // Atualiza visibilidade dos botões "Ver mais" / "Recolher"
    const linksRealmenteOcultaveis =
      cardsLinksDiv.querySelectorAll("a.hidden-link").length > 0;

    if (linksRealmenteOcultaveis) {
      if (isVerTodosActive) {
        verMaisBtn.classList.add("hidden");
        recolherBtn.classList.remove("hidden");
      } else {
        verMaisBtn.classList.remove("hidden");
        recolherBtn.classList.add("hidden");
      }
    } else {
      // Se não há links do tipo "hidden-link" (todos visíveis ou poucos links)
      verMaisBtn.classList.add("hidden");
      recolherBtn.classList.add("hidden");
    }
  }

  function handleInputPesquisa() {
    updateLinkVisibility();
  }

  function handleVerMais() {
    isVerTodosActive = true;
    updateLinkVisibility();
  }

  function handleRecolher() {
    isVerTodosActive = false;
    updateLinkVisibility();
    // Rolagem suave até a seção "Links Úteis"
    const destino = document.getElementById("links-uteis");
    if (destino) {
      destino.scrollIntoView({ behavior: "smooth" });
    }
  }

  function initializeLinkInteractions() {
    // Garante que os listeners sejam adicionados apenas uma vez ou sejam substituídos
    inputPesquisa.removeEventListener("input", handleInputPesquisa);
    inputPesquisa.addEventListener("input", handleInputPesquisa);

    verMaisBtn.removeEventListener("click", handleVerMais);
    verMaisBtn.addEventListener("click", handleVerMais);

    recolherBtn.removeEventListener("click", handleRecolher);
    recolherBtn.addEventListener("click", handleRecolher);

    // Define o estado visual inicial dos links e botões
    updateLinkVisibility();
  }

  // Inicia o carregamento dos links
  carregarLinksUteis();
});
