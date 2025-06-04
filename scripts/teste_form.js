/* const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new URLSearchParams();
  formData.append("nome", document.querySelector("#nome").value);
  formData.append("email", document.querySelector("#email").value);
  formData.append("telefone", document.querySelector("#telefone").value);
  formData.append("mensagem", document.querySelector("#mensagem").value);

  try {
    const resposta = await fetch(
      "https://script.google.com/macros/s/AKfycbyWRq8bfSHE4NX0zNkVMGGV28B4sz0ki2bVNCRc0lLeTpHGZIjVVB3fCXTxsVOliKskPQ/exec",
      {
        method: "POST",
        mode: "no-cors",
        redirect: "follow",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const resultado = await resposta.text();
    console.log("Resposta do script:", resultado);
    alert("Mensagem enviada com sucesso!");
  } catch (erro) {
    console.error("Erro ao enviar:", erro);
    alert("Erro ao enviar o formulário.");
  }
});
*/
document.getElementById("contatoForm").addEventListener("submit", function(e) {
  e.preventDefault(); // impede envio padrão do formulário

  const form = e.target;
  const dados = new FormData(form);

  fetch("https://script.google.com/macros/s/AKfycbyJZtkYjolqET6pAqPpVuBZ5S8VMM51ML69QVnqLRtyx-pY61MTSrnVW0IwDZ4YQrp1jA/exec", {
    method: "POST",
    body: dados,
  })
  .then(response => {
    if (response.ok) {
      alert("Mensagem enviada com sucesso!");
      form.reset();
    } else {
      return response.text().then(texto => {
        alert("Erro ao enviar: " + texto);
      });
    }
  })
  .catch(erro => {
    alert("Erro na requisição: " + erro);
  });
});
