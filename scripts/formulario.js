// Função para resetar o formulário após o envio
function resetFormAfterSend() {
  setTimeout(() => {
    document.getElementById("contatoForm").reset();
  }, 1000);
}
// Função para envio de formulário
function handleFormSubmit(event) {
  event.preventDefault();
  const form = document.getElementById("contatoForm");
  fetch(form.action, {
    method: "POST",
    body: new FormData(form),
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (response.ok) {
        form.reset();
        window.dispatchEvent(new Event("form-enviado"));
      } else {
        alert("Formulário enviado. Em breve retornaremos");
      }
    })
    .catch(() => alert("Erro ao enviar. Tente novamente."));
}
