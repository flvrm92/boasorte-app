# 001 — Sorteio por lista (nomes e números)

**Status:** Planned — ver [plan.md](plan.md) e [tasks.md](tasks.md) · **Plano:** Free · **Criado:** 2026-10-11

## Contexto
Usuários querem sortear rapidamente entre nomes ou números sem depender de redes sociais. É a porta de entrada gratuita do produto e a forma mais simples de entregar valor.

## Histórias de usuário

### US1 — Sortear a partir de uma lista digitada (P1)
Como organizador, quero colar ou digitar uma lista de nomes e sortear N ganhadores, para fazer um sorteio rápido.

**Aceite**
1. Dado uma lista com 10 nomes (um por linha) e 1 ganhador, quando eu sorteio, então vejo 1 nome que pertence à lista.
2. Dado 3 ganhadores, então vejo 3 nomes distintos, em ordem (1º, 2º, 3º).
3. Dado linhas em branco ou só com espaços, então elas são ignoradas.
4. Dado número de ganhadores maior que o total de participantes válidos, então o sorteio é bloqueado com mensagem clara.

### US2 — Sortear por intervalo numérico (P1)
Como organizador, quero informar um intervalo (ex.: 1 a 500) e sortear números, sem precisar listar todos.

**Aceite**
1. Dado o intervalo 1–500 e 2 ganhadores, então vejo 2 números distintos dentro do intervalo, inclusive nas bordas.
2. Dado início maior que o fim, então o formulário mostra erro.

### US3 — Importar CSV ou TXT (P2)
Como organizador, quero importar um arquivo com os participantes, para não digitar listas grandes.

**Aceite**
1. Dado um `.txt` com um participante por linha, então a lista é preenchida com cada linha.
2. Dado um `.csv` (separador `,` ou `;`), então a primeira coluna é usada; se houver mais de uma coluna, posso escolher qual usar e indicar se a primeira linha é cabeçalho.
3. Dado arquivo com outra extensão ou maior que o limite, então vejo erro e a lista não muda.
4. Após importar, posso editar a lista antes de sortear.

### US4 — Remover duplicados (P2)
Como organizador, quero opcionalmente remover participantes repetidos para que cada um tenha uma única chance.

**Aceite**
1. Com a opção ativa, "Ana", "ana " e "ANA" contam como um participante.
2. Com a opção inativa, repetições aumentam as chances (cada linha é uma entrada).
3. A tela mostra quantos participantes são elegíveis após a remoção.

### US5 — Salvar e compartilhar o resultado (P1)
Como organizador, quero salvar o sorteio e receber um link público, para provar aos participantes que o resultado foi justo.

**Aceite**
1. Ao salvar, recebo um link único e não adivinhável e um botão "copiar link".
2. Quem abre o link vê: título (opcional), data/hora, total de participantes, configuração usada, ganhadores em ordem e a lista completa de participantes, a menos que o organizador tenha desmarcado "exibir participantes no link" (marcada por padrão). Nesse caso, só a contagem aparece.
3. Abrir o link várias vezes mostra sempre o mesmo resultado.
4. Um sorteio salvo não pode ser editado nem resorteado.

## Requisitos funcionais
- **FR-001** Aceitar participantes por texto (um por linha, até 10.000 entradas de até 200 caracteres cada) ou por intervalo numérico (inteiros entre -1.000.000.000 e 1.000.000.000).
- **FR-002** Importar arquivos `.txt` e `.csv` (UTF-8) de até 1 MB e 10.000 linhas. A leitura é feita no navegador.
- **FR-003** Normalizar entradas: trim; ignorar linhas vazias.
- **FR-004** Opção "remover duplicados", comparando sem diferenciar maiúsculas/minúsculas nem espaços nas pontas.
- **FR-005** Configurar número de ganhadores (≥1 e ≤ participantes elegíveis, com máximo de 1.000).
- **FR-006** Selecionar ganhadores distintos com aleatoriedade criptograficamente segura (constituição §1).
- **FR-007** Exibir o resultado com uma animação curta de sorteio, sem atrasar mais que ~3 s.
- **FR-008** Permitir "sortear novamente" enquanto o sorteio **não** foi salvo.
- **FR-009** Salvar o sorteio e gerar link público imutável, com a opção "exibir participantes no link" (padrão: marcada).
- **FR-010** Tudo funciona sem cadastro/login, inclusive salvar.
- **FR-011** Sorteios salvos ficam disponíveis por 12 meses; depois disso o link mostra "sorteio expirado".
- **FR-012** Há dois modos de sorteio:
  - **Sorteio rápido:** feito no navegador, não é salvo e pode ser repetido à vontade.
  - **Sorteio oficial:** feito no servidor quando o usuário escolhe "Sortear e salvar". O servidor recebe os participantes e a configuração, sorteia, grava e devolve o link.

  A UI deixa claro que só o sorteio oficial tem link de comprovação. O cliente nunca envia um resultado pronto, porque o servidor não teria como provar que não foi manipulado.
- **FR-013** Limitar a criação de sorteios salvos por IP (10 por minuto), com mensagem amigável quando o limite for atingido.

## Fora de escopo
- Pesos/chances diferentes por participante.
- Contas de usuário e histórico de sorteios (a menos que decidido no Clarify).
- Sorteio ao vivo sincronizado entre vários espectadores.

## Entidades
- **Draw (Sorteio):** id público, título, tipo (lista | intervalo), configuração, participantes elegíveis, ganhadores ordenados, criado em (UTC).

## Critérios de sucesso
- Um usuário novo completa um sorteio de lista em menos de 30 s, sem instruções.
- Um sorteio com 10.000 participantes é resolvido em menos de 1 s.

## Clarificações
### 2026-10-11
- **Login:** não há contas no MVP. Salvar e compartilhar é anônimo. *(decisão do usuário)*
- **Privacidade do link:** lista de participantes exibida por padrão, mas o organizador pode ocultar. *(decisão do usuário)*
- **CSV:** primeira coluna por padrão, com seletor de coluna e cabeçalho quando houver mais colunas. *(padrão proposto)*
- **Limites de importação:** 1 MB / 10.000 linhas, leitura no navegador. *(padrão proposto)*
- **Retenção:** 12 meses. *(padrão proposto)*
- **Onde o sorteio acontece:** sorteio rápido no navegador; sorteio oficial (salvo) no servidor. *(padrão proposto, segue a constituição §1)*
- **Limites (vindos do Plan):** 200 caracteres por entrada, 10.000 entradas, 1.000 ganhadores, intervalo de ±1 bilhão, 10 salvamentos/min por IP. *(padrão proposto)*
- **Duplicados:** acentos **não** são ignorados ("José" ≠ "Jose"), só caixa e espaços nas pontas. Fica a primeira grafia. *(padrão proposto)*
