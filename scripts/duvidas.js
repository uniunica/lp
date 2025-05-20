// Evento para pesquisa de dúvidas
function faqSearch() {
  return {
    search: "",
    selected: null,
    visibleCount: 5,
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
          "Para alterar o valor das mensalidades é preciso preencher o formulário de alteração de valores: <a href='https://docs.google.com/forms/d/e/1FAIpQLSfteNS6wFAu9yr9y4ZJ-eAT6o9r7OLFmn6B_uhPm4efeXmyJA/viewform' class='text-purple-600 underline'>Formulário de Alteração de Valores</a>.",
      },
      {
        pergunta: "Como solicitar a Pós gratuita?",
        resposta:
          "Para solicitar a Pós gratuita, você deverá preencher o formulário de solicitação de Pós gratuita, solicite com seu consultor",
      },
      {
        pergunta: "Como solicitar o aproveitamento para alunos de Graduação e Segunda Graduação?",
        resposta:
          "Para solicitação de aproveitamento acesse o link do <a href='https://faculdadeunica.pincelatomico.net.br/externos/fale_conosco/2'> Fale Conosco </a>. Preencher TODOS os campos solicitados, anexando o arquivo a ser analisado (histórico de notas), sem esquecer e-mail para receber o retorno com a análise (ATENÇÃO! Se o e-mail for informado incorretamente, o retorno não será enviado).",
      },
      {
        pergunta: "Como solicitar o repasse dos produtos do Pincel?",
        resposta:
          "É enviado até o 5° dia útil do mês um e-mail com o valor que o parceiro tem a receber junto às informações para o recebimento do mesmo. Solicitar diretamente no e-mail: financeiro@unicaead.com.br",
      },
      {
        pergunta: "Como cadastrar CNPJ no portal do parceiro?",
        resposta:
          "No campo “Administrativo”, o parceiro deverá clicar na opção “Dados empresariais” e em seguida “Cadastrar nova empresa”.",
      },
      {
        pergunta: "Onde encontro as matrizes curriculares?",
        resposta:
          "No drive geral na pasta de Matrizes e Modalidades.",
      },
      {
        pergunta: "Quando e como o aluno receberá o acesso ao portal?",
        resposta:
          "O aluno recebe acesso ao portal assim que ele realiza o pagamento da taxa de matrícula, será enviado um e-mail com todas as orientações de passo a passo para acesso.",
      },
      {
        pergunta: "Como solicitar a baixa da matrícula quando o valor é pago em mãos?",
        resposta:
          "Ao receber em mãos o valor da  taxa de matrícula, o parceiro deve preencher um recibo onde conste os dados do aluno, encaminhar ao setor “baixas polo” via e-mail: baixaspolo@grupoprominas.com.br e assim é feita a baixa da matrícula do aluno. O exemplo do recibo está disponível na seção de links úteis acima.",
      },
      {
        pergunta: "Dúvidas sobre estágio (para alunos que questionam antes de efetivar a matrícula)",
        resposta:
          "Temos o documento de informativo com todas as informações de carga horário e período encontrado acima na seção de Links úteis e temos o setor NESE (Núcleo de Empregabilidade e Estágio) que está à disposição para orientar o aluno durante todo o período de estágio.",
      },
      {
        pergunta: "Os cursos de Graduação são feitos de forma 100% presencial?",
        resposta:
          "Os cursos de Graduação são a distância, caso o curso tenha estágio obrigatório, ou o aluno tenha alguma atividade presencial será devidamente orientado no portal.",
      },
      {
        pergunta: "Como solicitar a placa?",
        resposta:
          "Todo o passo a passo está no documento abaixo: <a href='https://drive.google.com/file/d/1DSYXQVAC7rtqhMSa_08aYudnQKAHl4gO/view?usp=sharing' class='text-purple-600 underline'>Passo a Passo para solicitar a placa</a>.",
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
      // Retornoa as perguntas e respostas que contêm a palavra-chave
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
    get limitedFaqs() {
      return this.filteredFaqs.slice(0, this.visibleCount);
    },
    // Método para exibir mais perguntas
    showMore() {
      this.visibleCount += 5;
    },
    // Método para ocultar perguntas
    resetVisible() {
      this.visibleCount = 5;
    }
  };
}
