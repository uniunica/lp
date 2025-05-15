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
      {
        pergunta: "Dúvidas sobre os valores vigentes referentes as promoções?",
        resposta:
          "As promoções são encaminhadas no nosso grupo do Whatsapp. Gentileza verificar o grupo. Caso você não esteja inserido, entre em contato para adicionarmos. Se houver alguma promoção vigente no momento, que você não tenha recebido, iremos te encaminhar dentro de alguns instantes. ",
      },
      {
        pergunta: "Como alterar a taxa de matrícula?",
        resposta:
          "Para alterar a taxa de matrícula no pincel, preciso que você nos envie o nome completo do aluno(a), o CPF do aluno com o valor acordado com o aluno e data de vencimento. Gentileza informar a forma de pagamento que o aluno irá realizar o pagamento.",
      },
      {
        pergunta: "Como cobrir  uma oferta?",
        resposta:
          "Para realizar um cobrimento de oferta, o parceiro deverá encaminhar um print da tratativa que o aluno teve com a outra instituição que comprove que ele recebeu esta oferta. O print é analisado e é informado o valor para cobrimento de oferta. ",
      },
      {
        pergunta: "Como alterar as mensalidades e taxa de matrículas?",
        resposta:
          "Para alterar o valor das mensalidades é preciso preencher o formulário de alteração de valores: <a href='https://docs.google.com/forms/d/e/1FAIpQLSfqX0g2v3x4q5j7b8k6f9z5e4g5e4g5e4g5e4g5e4g5e4g5e4g/viewform' class='text-purple-600 underline'>Formulário de Alteração de Valores</a>. Após o preenchimento, a alteração será realizada em até 48 horas úteis.",
      },
      {
        pergunta: "Como solicitar a Pós gratuita?",
        resposta:
          "Para solicitar a Pós gratuita, você deverá preencher o formulário de solicitação de Pós gratuita, solicite com seu consultor",
      },
      // Adicione mais dúvidas aqui
    ],
    get filteredFaqs() {
      const keyword = this.search
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!keyword) return this.faqs;

      return this.faqs.filter(
        (f) =>
          f.pergunta
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(keyword) ||
          f.resposta
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(keyword)
      );
    },
  };
}
