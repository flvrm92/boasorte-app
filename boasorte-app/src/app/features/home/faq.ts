export interface FaqItem {
  question: string;
  answer: string;
  /** Optional link shown after the answer (not part of the structured data text). */
  link?: { label: string; path: string };
}

/** Landing FAQ (spec 003, US2.3). Also published as schema.org FAQPage structured data. */
export const FAQ: readonly FaqItem[] = [
  {
    question: 'É grátis?',
    answer: 'Sim. O sorteio por lista é gratuito e não precisa de cadastro.',
  },
  {
    question: 'Preciso criar uma conta?',
    answer: 'Não. Você sorteia e salva o resultado sem fazer login.',
  },
  {
    question: 'Quais redes sociais posso usar?',
    answer:
      'O sorteio de comentários do Instagram e do Facebook está chegando. Ele vai funcionar com posts da sua própria conta Business ou Creator do Instagram e de Páginas do Facebook que você administra, conectadas pelo login oficial da Meta.',
  },
  {
    question: 'Posso sortear comentários de um post de outra pessoa?',
    answer: 'Não. As redes sociais só permitem ler os comentários de posts da conta que você conectar.',
  },
  {
    question: 'Quantos participantes posso colocar?',
    answer:
      'Até 10.000 nomes por lista, ou um intervalo de números entre -1.000.000.000 e 1.000.000.000. Cada sorteio pode ter até 1.000 ganhadores.',
  },
  {
    question: 'Por quanto tempo o link do resultado fica no ar?',
    answer: 'Por 12 meses a partir da data do sorteio.',
  },
  {
    question: 'Posso refazer um sorteio salvo?',
    answer:
      'Não, e esse é o ponto: depois de salvo, o resultado não muda. Antes de salvar, você pode repetir o sorteio rápido quantas vezes quiser.',
  },
  {
    question: 'Quem consegue ver o resultado?',
    answer:
      'Qualquer pessoa com o link. Se preferir, desmarque “Mostrar participantes no link”: aí aparecem só os ganhadores e as contagens.',
  },
  {
    question: 'O que vocês fazem com os nomes que eu coloco?',
    answer:
      'No sorteio rápido, os nomes nem saem do seu navegador. Quando você salva um sorteio, guardamos a lista só para mostrar o resultado no link e apagamos tudo depois de 12 meses.',
    link: { label: 'Ler a política de privacidade', path: '/privacidade' },
  },
];
