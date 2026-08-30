# Plano Técnico — Pokédex App (Ionic + Angular)

Desafio: Avaliação Analista Desenvolvedor Jr. — BSN
Objetivo deste documento: servir de especificação para o Claude Code implementar o projeto
de forma incremental, com commits pequenos e testáveis a cada etapa.

**Repositório remoto:** `https://github.com/cm0420/AvialacaoFullStack.git`

```bash
git remote add origin https://github.com/cm0420/AvialacaoFullStack.git
git push -u origin main
```

---

## 1. Decisão de navegação

- **Não há tela Home separada.** O visual de identidade (shell vermelho, LEDs, lente com glow,
  título retro) vira um **cabeçalho decorativo no topo da própria tela de lista** (Tab 1), pra
  que a "tela principal" já cumpra o item 1 do edital (nome + imagem do Pokémon) sem ambiguidade,
  mesmo assim carregando a identidade visual proposta.
- **Tabs**:
  - **Tab 1 — Pokémons**: lista paginada, com o cabeçalho estilo Pokédex no topo (era `tab1/`)
  - **Tab 2 — Favoritos**: lista de favoritos (era `tab2/`)
- ~~Tab 3~~: **remover** — não usamos
- **Tela de Detalhes**: fora das tabs, empilhada por cima via `router.navigate` (não é uma tab)

Fluxo: `Tabs (Pokémons com header temático | Favoritos) → Detalhes`

Justificativa: 2 tabs cobre o fluxo pedido (listar / favoritos) sem inventar uma terceira seção
artificial só pra preencher espaço. Abrir o app já mostra Pokémon (nome+imagem) — atende o item 1
literalmente — e o header decorativo entrega o "nos surpreenda" sem competir com o requisito.

---

## 2. Estrutura de pastas alvo

```
src/app/
├── core/
│   ├── models/
│   │   └── pokemon.model.ts        # interfaces da PokeAPI
│   └── services/
│       ├── pokeapi.service.ts      # HTTP + DI
│       ├── favorites.service.ts    # estado reativo + persistência
│       └── webhook.service.ts      # notifica evento externo ao favoritar
├── tabs/                            # já existe — só ajustar rótulos/ícones
│   ├── tabs.page.ts
│   ├── tabs.routes.ts
├── pokemon-list/                    # renomear tab1 → pokemon-list (inclui header temático)
├── favorites/                       # renomear tab2 → favorites
├── pokemon-detail/                  # nova página, fora das tabs
├── app.routes.ts
└── app.component.ts
```

Remover: `tab3/`, `explore-container/` (componente de exemplo do starter, sem uso aqui).

---

## 3. Modelos de dados (core/models/pokemon.model.ts)

- `PokemonListItem` / `PokemonListResponse` → resposta crua de `GET /pokemon`
- `PokemonCard` → forma simplificada `{ id, name, imageUrl }` usada nos cards da lista
- `PokemonDetail` → resposta de `GET /pokemon/{id}` (sprites, types, stats, abilities, height, weight)
- `PokemonSpecies` → resposta de `GET /pokemon-species/{id}` (usada só pra descrição/flavor text)

---

## 4. Serviços (injetáveis via `providedIn: 'root'`)

### PokeApiService
Responsável por **todo** acesso HTTP à PokeAPI. Nenhuma página deve chamar `HttpClient` direto.

| Método | Endpoint | Uso |
|---|---|---|
| `getPokemonList(offset, limit)` | `GET /pokemon?offset=&limit=` | lista paginada (item 7) |
| `getPokemonDetail(id)` | `GET /pokemon/{id}` | dados técnicos (item 3) |
| `getPokemonSpecies(id)` | `GET /pokemon-species/{id}` | descrição textual |
| `getPokemonFull(id)` | combina os dois acima com `forkJoin` | tela de detalhes |
| `searchPokemonByName(term)` | filtra sobre índice em cache (ver abaixo) | busca (extra) |

**Sobre a busca**: a PokeAPI não tem endpoint de busca parcial por nome — só match exato
(`/pokemon/{name}`). Solução: no primeiro uso da busca, buscar **uma vez** a lista completa
(`GET /pokemon?limit=2000`, só `name` + `url`, resposta leve) e cachear em memória no próprio
service. A partir daí, `searchPokemonByName` filtra esse cache localmente (`includes`), sem gerar
1 request por letra digitada. Debounce de ~300ms na searchbar evita filtrar a cada tecla.

Imagem: usar `sprites.other['official-artwork'].front_default` (detalhe) e, pra lista, montar a
URL direto do repositório de sprites (evita 1 request por item na listagem).

### FavoritesService
- Guarda `number[]` de ids favoritados
- Persiste em `localStorage` (não precisa de backend nem Capacitor Storage pra esse escopo)
- Expõe `favorites$: Observable<number[]>` — telas reagem a mudanças sem acoplamento direto
- Métodos: `toggle(id)`, `isFavorite(id)`, `getAll()`

### WebhookService (diferencial — item "WebHook" do edital)
A PokeAPI não expõe webhooks reais, então a interpretação é: **nossa própria app dispara um
webhook** ao favoritar, simulando integração com um sistema externo (ex: analytics, notificação
pra outro serviço).

- Usa `https://webhook.site` (gera uma URL única e gratuita, mostra os payloads recebidos em
  tempo real — bom pra demonstrar no vídeo/gif do diferencial "Apresentação")
- URL configurável em `environment.ts` (`webhookUrl`)
- `notifyFavoriteToggled(pokemonId, isFavorite)` faz um `POST` fire-and-forget com
  `{ pokemonId, isFavorite, timestamp }`
- Chamado de dentro do `FavoritesService.toggle()`, então nenhuma página precisa saber que o
  webhook existe — mantém a mesma filosofia de DI dos outros serviços
- Falha de rede no webhook nunca deve quebrar o favoritar local (usar `catchError` e ignorar)
- Documentar no README que é uma demonstração do conceito, já que a PokeAPI em si não suporta

---

## 5. Telas

### Tela 1 — Pokémons (lista + header temático)
- **Cabeçalho estilo Pokédex** (substitui a antiga Home): faixa vermelha fixa no topo com 2 LEDs
  decorativos, elemento "lente" central com leve glow/pulse em CSS, título em fonte
  monoespaçada estilo retro-handheld (ex: "Press Start 2P", só no título). Fica acima do grid,
  não em tela separada — some ao rolar ou fica compacto, à sua escolha de UX.
- Grid de cards abaixo do header: imagem + nome (item 1)
- `ion-infinite-scroll` carregando 20 por vez (item 7 — paginação)
- Botão de estrela em cada card pra favoritar sem entrar no detalhe (item 9)
- Clique no card → `router.navigate(['/pokemons', id])` (item 2)
- Grid muda de colunas em paisagem via `@media (orientation: landscape)` (item 10); o header
  também se adapta (fica mais compacto/horizontal em paisagem)
- **Busca (extra)**: ícone de lupa no `ion-toolbar` abre uma `ion-searchbar`. Com termo digitado,
  a lista passa a mostrar os resultados filtrados (via `searchPokemonByName`) em vez da lista
  paginada; campo vazio volta pro modo paginado normal. Cada resultado da busca também tem seu
  botão de favoritar, igual ao grid normal — mesma UX, fonte de dados diferente.

### Tela 2 — Detalhes
- Imagem grande + nome + número
- Lista com **no mínimo 6 informações** (item 3): altura, peso, exp. base, tipos, habilidades,
  + 6 estatísticas base (HP/Ataque/Defesa/Atq.Esp/Def.Esp/Velocidade) — já estoura o mínimo
- Botão de favoritar no header
- Em paisagem, imagem e informações lado a lado em vez de empilhado (item 10)

### Tela 3 — Favoritos
- Busca os detalhes de cada id favoritado (`forkJoin`)
- Estado vazio com mensagem quando não há favoritos
- Clique → mesma tela de detalhes

---

## 6. Checklist de conformidade com o edital

| # | Requisito | Onde |
|---|---|---|
| 1 | Nome + imagem na tela principal | pokemon-list (primeira tela do app) |
| 2 | Redirecionamento pra detalhes | pokemon-list → pokemon-detail |
| 3 | ≥6 descrições + imagem no detalhe | pokemon-detail |
| 4 | Boas práticas de commit | commits pequenos por camada (ver seção 7) |
| 5 | README com dissertação (≤10 frases) | README.md raiz |
| 6 | Libs de terceiros livres | Ionic/Angular ecosystem já resolve |
| 7 | Paginação | infinite-scroll na lista |
| 8 | Injeção de dependência | `inject()` nos três services (PokeApiService, FavoritesService, WebhookService) |
| 9 | Marcar favorito | estrela na lista + botão no detalhe |
| 10 | Adaptar à orientação | media queries em list (header + grid) e detail |

Diferenciais incluídos no escopo deste plano: testes unitários dos services (seção 7, passo 12),
webhook ao favoritar via webhook.site (seção 4), busca por nome na lista (seção 5), e o header
temático estilo Pokédex na tela principal conta como parte do "nos surpreenda" mencionado no
edital, sem abrir mão do requisito literal do item 1. Falta apenas prints/gif no README, que é
manual (você grava depois de rodar o app).

---

## 7. Ordem sugerida de implementação (commits)

1. `chore:` limpar starter — remover tab3 e explore-container, ajustar tabs.routes.ts
2. `feat:` models da PokeAPI
3. `feat:` PokeApiService
4. `feat:` FavoritesService
5. `feat:` tela pokemon-list (grid + infinite scroll)
6. `feat:` favoritar na lista
7. `feat:` busca por nome na lista (searchbar + cache local)
8. `feat:` header temático estilo Pokédex no topo da lista (shell + lente + botões removidos, viram só identidade visual)
9. `feat:` tela pokemon-detail
10. `feat:` tela favorites
11. `feat:` WebhookService + integração no FavoritesService
12. `style:` responsividade / orientação (list e detail)
13. `test:` unit tests de PokeApiService, FavoritesService e WebhookService
14. `docs:` README com dissertação

Cada item acima é um commit isolado e testável — isso é o que conta como "boas práticas de
commit" no item 4 do edital.

---

## 8. Pontos de atenção pro Claude Code

- Rodar `ionic serve` a cada 2-3 passos pra validar visualmente, não só confiar no build.
- `id` do Pokémon vem embutido na URL da listagem (`.../pokemon/25/`) — precisa extrair via
  split, a API não retorna o id direto no endpoint de lista.
- `flavor_text_entries` da species vem com `\n` e `\f` no meio do texto — precisa sanitizar antes
  de exibir.
- Testar em pelo menos 2 tamanhos de tela + alternar orientação no DevTools antes de considerar o
  item 10 concluído.
- Adicionar `src/environments/environment.ts` (e `.prod.ts`) com a chave `webhookUrl`, já que o
  WebhookService depende disso — não estava explícito na estrutura de pastas da seção 2.
