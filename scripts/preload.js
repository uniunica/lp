document.addEventListener("DOMContentLoaded", function () {
  const preloader = document.getElementById("preloader");
  const progressBar = document.getElementById("progress-bar");
  const mainContent = document.getElementById("main-content");

  // Lista de recursos a serem carregados
  const resources = [
    // Imagens
    "logo.png",
    "gruporpominas-preto.png",
    "favicon.png",

    //Tailwind CSS
    "https://cdn.tailwindcss.com",

    // CSS
    "style.css",

    // Scripts
    "scripts/main.js",
    "scripts/produtos.js",
    "scripts/links.js",
    "mapa/teste_automatizacao_mapdata.js", // Dados do mapa antes do script do mapa
    "mapa/countrymap.js", // Script do mapa depois dos dados
    "scripts/teste_automatizacao_maps.js", // Este parece genérico, verifique a ordem
    "scripts/localizar_polo_proximo.js",
    "scripts/rota_sucesso.js",
    "scripts/formulario.js",
    "scripts/duvidas.js",
    "scripts/teste_automatizacao_carteira.js",

    // APIs externas (verificação apenas)
    "https://unpkg.com/alpinejs",
  ];

  let loaded = 0;
  const total = resources.length;

  function updateProgress(resource) {
    loaded++;
    const progress = Math.round((loaded / total) * 100);
    progressBar.style.width = `${progress}%`;

    if (loaded === total) {
      // Adiciona um pequeno atraso para garantir que tudo foi carregado
      setTimeout(() => {
        preloader.classList.add("fade-out");

        // Remove o preloader após a animação
        setTimeout(() => {
          preloader.style.display = "none";
          mainContent.style.display = "block";

          // Dispara evento para scripts que dependem do DOM
          document.dispatchEvent(new Event("preload-complete"));
        }, 500);
      }, 500);
    }
  }

  resources.forEach((resource) => {
    if (resource.endsWith(".css")) {
      // Para CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = resource;
      link.onload = () => updateProgress(resource);
      link.onerror = () => {
        console.error(`Failed to load CSS: ${resource}`);
        updateProgress(resource);
      };
      document.head.appendChild(link);
    } else if (
      resource.endsWith(".js") ||
      (resource.startsWith("http") && resource.includes(".js"))
    ) {
      // <<< MODIFICADO AQUI
      // Para JS (local ou externo que termina em .js ou que você sabe que é um script)
      const script = document.createElement("script");
      script.src = resource;
      // Para scripts externos, 'async = false' pode ajudar a manter a ordem se necessário,
      // mas o preload já os carrega sequencialmente na array.
      // script.async = false; // Descomente se a ordem de execução for crítica entre scripts carregados assim
      script.onload = () => updateProgress(resource);
      script.onerror = () => {
        console.error(`Failed to load SCRIPT: ${resource}`);
        updateProgress(resource);
      };
      document.body.appendChild(script); // Scripts geralmente vão no body
    } else if (
      resource.startsWith("http") &&
      !resource.includes(".js") &&
      !resource.endsWith(".css")
    ) {
      // <<< MODIFICADO AQUI
      // Para outras APIs externas ou recursos que não são JS/CSS (verificação apenas)
      fetch(resource, { mode: "no-cors" })
        .then(() => updateProgress(resource))
        .catch(() => {
          console.error(`Failed to fetch resource: ${resource}`);
          updateProgress(resource);
        });
    } else if (
      !resource.startsWith("http") &&
      (resource.endsWith(".png") ||
        resource.endsWith(".jpg") ||
        resource.endsWith(".jpeg") ||
        resource.endsWith(".gif") ||
        resource.endsWith(".svg") ||
        resource.endsWith(".webp"))
    ) {
      // Para imagens (extensões mais comuns)
      const img = new Image();
      img.src = resource;
      img.onload = () => updateProgress(resource);
      img.onerror = () => {
        console.error(`Failed to load IMAGE: ${resource}`);
        updateProgress(resource);
      };
    } else {
      // Recurso desconhecido ou não tratado especificamente (ex: placeholders para cookies/cache)
      console.warn(
        `Resource type not specifically handled, assuming generic load: ${resource}`
      );
      updateProgress(resource); // Marcar como carregado de qualquer forma
    }
  });

  // Verifica cookies e cache
  try {
    if (navigator.cookieEnabled) {
      updateProgress("Cookies");
    }

    if ("caches" in window) {
      caches.keys().then(() => updateProgress("Cache"));
    } else {
      updateProgress("Cache");
    }
  } catch (e) {
    updateProgress("Cookies/Cache");
  }
});
