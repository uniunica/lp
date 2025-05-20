// Configuração do DarkMode
tailwind.config = {
  darkMode: "class",
};
// Toggle do menu mobile
document.getElementById("menu-toggle").addEventListener("click", function () {
  const menu = document.getElementById("mobile-menu");
  menu.classList.toggle("hidden");
});
// Lógica para aplicar o tema na carga inicial e para os botões de toggle
(function () {
  const docElement = document.documentElement;
  const themeToggles = document.querySelectorAll(".theme-toggle-button");
  const sunIcons = document.querySelectorAll(".sun-icon");
  const moonIcons = document.querySelectorAll(".moon-icon");
  const toggleTexts = document.querySelectorAll(".toggle-text"); // Para o botão mobile
  // Função para aplicação de tema
  function applyTheme(theme) {
    if (theme === "dark") {
      docElement.classList.add("dark");
      sunIcons.forEach((icon) => icon.classList.remove("hidden"));
      moonIcons.forEach((icon) => icon.classList.add("hidden"));
      themeToggles.forEach((button) =>
        button.setAttribute("aria-pressed", "true")
      );
      themeToggles.forEach((button) =>
        button.setAttribute("aria-label", "Alternar para modo claro")
      );
      toggleTexts.forEach((text) => (text.textContent = "Modo Claro")); // Exemplo para mobile
    } else {
      docElement.classList.remove("dark");
      sunIcons.forEach((icon) => icon.classList.add("hidden"));
      moonIcons.forEach((icon) => icon.classList.remove("hidden"));
      themeToggles.forEach((button) =>
        button.setAttribute("aria-pressed", "false")
      );
      themeToggles.forEach((button) =>
        button.setAttribute("aria-label", "Alternar para modo escuro")
      );
      toggleTexts.forEach((text) => (text.textContent = "Modo Escuro")); // Exemplo para mobile
    }
  }
  function toggleTheme() {
    const currentTheme = docElement.classList.contains("dark")
      ? "light"
      : "dark";
    localStorage.setItem("theme", currentTheme);
    applyTheme(currentTheme);
  }
  // Aplica tema na carga
  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyTheme(savedTheme);
  // Event listeners para os botões
  themeToggles.forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });
})();