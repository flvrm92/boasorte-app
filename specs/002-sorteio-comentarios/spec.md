# 002 — Sorteio de comentários em redes sociais

**Status:** Clarified — pronto para Plan (após 001) · **Plano:** Free no MVP · **Criado:** 2026-10-11

## Contexto
Criadores e marcas fazem promoções do tipo "comente e marque um amigo". Eles precisam sortear um comentário de forma justa, aplicando as regras da promoção, e mostrar o resultado ao público.

## Estratégia de obtenção dos comentários (decidida)
Usamos **apenas APIs oficiais via OAuth**. O usuário conecta a própria conta e sorteia comentários dos **próprios posts**.

| Rede | MVP | Como |
|------|-----|------|
| Instagram | ✅ | Login via Meta (Instagram API com conta Business ou Creator). Lê comentários de mídias da conta conectada. |
| Facebook | ✅ | Login via Meta, permissão de Páginas. Lê comentários de posts de Páginas que o usuário administra. |
| TikTok | ❌ | Fora do MVP. Não há API oficial que retorne comentários para este caso de uso. A UI mostra "em breve". |

Consequência: o fluxo "colar o link de qualquer post" da ideia original vira "conectar a conta → escolher o post (ou colar o link de um post seu)". Um link de post que não pertence à conta conectada mostra uma mensagem explicativa.

**Conexão ≠ conta BoaSorte:** não existe cadastro no app. A conexão com a rede vale só durante a sessão do navegador. O token fica no servidor, preso à sessão, e é descartado quando ela termina.

## Workflow
1. O usuário escolhe a rede e conecta a conta (OAuth).
2. Escolhe um post da lista de posts recentes ou cola o link de um post próprio.
3. O sistema busca os comentários e mostra o total e o número de autores únicos.
4. O usuário configura as regras; a contagem de elegíveis é atualizada em tempo real.
5. O usuário inicia o sorteio e o servidor sorteia entre os elegíveis.
6. Aparecem os ganhadores com o comentário sorteado.
7. Opcional: salvar e compartilhar o link do resultado.

## Histórias de usuário

### US1 — Conectar conta e carregar comentários (P1)
**Aceite**
1. Ao escolher Instagram ou Facebook, sou levado ao login da Meta e volto ao app conectado, vendo meu @ ou o nome da Página.
2. Vejo meus posts recentes (miniatura, legenda resumida, nº de comentários) e posso escolher um.
3. Posso colar o link de um post meu; se ele não pertencer à conta conectada, vejo "esse post não pertence à conta conectada".
4. Se a conta do Instagram for pessoal (não Business/Creator), vejo instruções para convertê-la.
5. A busca mostra progresso e, ao terminar, o total de comentários e de autores únicos.
6. Só comentários de primeiro nível contam; respostas (replies) são ignoradas.
7. Posso desconectar a conta a qualquer momento.

### US2 — Configurar o sorteio (P1)
Todas as regras são **filtros prévios**: só entram no sorteio comentários que as cumprem.

**Aceite**
1. Posso definir o número de ganhadores (≥1 e ≤ autores elegíveis).
2. **Filtrar duplicados:** cada autor tem no máximo uma chance, independente de quantos comentários fez.
3. **Exigir marcação de amigos:** o comentário precisa ter pelo menos N menções (`@usuario`) distintas, com N entre 1 e 10 (padrão 1). Menções ao próprio autor ou à conta dona do post não contam.
4. **Palavra-chave:** o comentário precisa conter o termo informado, sem diferenciar maiúsculas/minúsculas nem acentos ("Sorteio" casa com "sortêio" e "SORTEIO").
5. **Excluir a conta dona do post:** comentários do próprio organizador nunca participam (sempre ativo).
6. A cada mudança de regra vejo "X comentários de Y autores elegíveis".
7. Se não houver elegíveis suficientes, o botão de sortear fica desabilitado com explicação.

### US3 — Sortear e ver o resultado (P1)
**Aceite**
1. Para cada ganhador, em ordem, vejo: @usuário, texto do comentário, data e link para o comentário.
2. Ganhadores são sempre autores distintos.
3. Posso "sortear novamente" enquanto não salvei. Cada novo sorteio é independente e usa os mesmos elegíveis.

### US4 — Salvar e compartilhar (P2)
**Aceite**
1. Mesmo comportamento da 001/US5: link público imutável.
2. O link mostra: rede, link do post, data/hora, regras aplicadas, total de comentários, total de elegíveis e ganhadores com o comentário.
3. A lista completa de comentários elegíveis **não** é exibida no link (dados de terceiros); só as contagens.

## Requisitos funcionais
- **FR-101** OAuth com a Meta (Instagram API com login do Instagram ou do Facebook, e Facebook Pages), com o token guardado só no servidor e vinculado à sessão.
- **FR-102** Listar posts recentes da conta conectada e aceitar o link de um post próprio (`/p/`, `/reel/`, posts de Página), validando a posse.
- **FR-103** Buscar todos os comentários de primeiro nível com paginação, até 20.000 por post. Acima disso, avisar e usar os primeiros 20.000.
- **FR-104** A busca é assíncrona com progresso: o navegador não fica esperando uma única requisição longa.
- **FR-105** Filtro de duplicados por autor.
- **FR-106** Filtro de menções (N mínimo, excluindo autor e dono do post).
- **FR-107** Filtro de palavra-chave (sem diferenciar caixa nem acento, por "contém").
- **FR-108** Exclusão automática dos comentários do dono do post.
- **FR-109** Seleção de ganhadores no servidor, com aleatoriedade criptograficamente segura.
- **FR-110** Comentários buscados ficam em cache por 30 minutos por sessão e post.
- **FR-111** Rate limit por sessão/IP nas buscas.
- **FR-112** Comentários de terceiros não são persistidos, exceto os comentários vencedores de um sorteio salvo.
- **FR-113** TikTok aparece como "em breve" na UI.

## Fora de escopo
- TikTok; posts de terceiros (contas não conectadas).
- Exigir que o participante siga a conta, curta o post ou compartilhe.
- Combinar vários posts num único sorteio; respostas a comentários.
- Várias palavras-chave (regra "todas/qualquer uma") — candidata para a v2.

## Dependências externas e riscos
- **App Review da Meta:** permissões como `instagram_business_manage_comments` / `pages_read_engagement` exigem um app aprovado, empresa verificada, política de privacidade publicada e um vídeo de demonstração. Isso leva semanas, então deve começar cedo, em paralelo com a 001.
- O modo de desenvolvimento da Meta só funciona com contas de teste cadastradas no app.

## Entidades
- **SocialConnection** (efêmera, por sessão): rede, id da conta, nome/@, token (só no servidor), expira em.
- **SocialPost:** rede, id externo, URL, legenda resumida, nº de comentários.
- **Comment** (em cache): id externo, autor, texto, menções extraídas, data, permalink.
- **CommentDraw** (persistido ao salvar): id público, rede, URL do post, regras, totais, ganhadores (autor + texto + data + permalink), criado em.

## Critérios de sucesso
- Post com 5.000 comentários carregado em menos de 30 s.
- Nenhum ganhador viola um filtro ativo (garantido por testes de propriedade).

## Clarificações
### 2026-10-11
- **Obtenção dos comentários:** só OAuth oficial; apenas posts da conta conectada; TikTok fora do MVP. *(decisão do usuário)*
- **Regras:** filtro prévio, não validação posterior; o "sortear novamente" da ideia original passa a ser só um novo sorteio entre elegíveis. *(decisão do usuário)*
- **Login:** sem conta BoaSorte; a conexão OAuth é efêmera, por sessão. *(decisão do usuário)*
- **Replies:** ignoradas. **Menções:** autor e dono do post não contam. **Palavra-chave:** um termo, por "contém", sem diferenciar caixa nem acento. **Limite:** 20.000 comentários. **Cache:** 30 min. *(padrões propostos)*
- **Plano:** free no MVP, monetização reavaliada depois. *(padrão proposto)*
