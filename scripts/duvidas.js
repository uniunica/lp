// Evento para pesquisa de dúvidas
function faqSearch() {
  return {
    search: "",
    selected: null,
    faqs: [
      {
        pergunta: "Onde encontro os preços atuais dos nossos produtos?",
        resposta:
          'Temos um drive contendo as informações referentes ao regulamento, clique no <a href="https://drive.google.com/file/d/1FT2CSUpwZtIdP71-wCZPEHAfDGy2xRrN/view?usp=sharing" class="text-purple-600 underline">regulamento</a>.',
      },
      {
        pergunta: "Onde eu localizo os criativos para postagem?",
        resposta:
          'Temos um drive contendo os criativos, clique no <a href="https://drive.google.com/drive/folders/1jTLe430HrxvxpZWBFxRV4AqsgLZOMS8u" class="text-purple-600 underline">criativos</a>.',
      },
      // Adicione mais dúvidas aqui
    ],
    get filteredFaqs() {
      if (!this.search.trim()) return this.faqs;
      const keyword = this.search.toLowerCase();
      return this.faqs.filter(
        (f) =>
          f.pergunta.toLowerCase().includes(keyword) ||
          f.resposta.toLowerCase().includes(keyword)
      );
    },
  };
}
