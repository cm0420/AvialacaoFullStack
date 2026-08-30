# Arquitetura — Pokédex App

Ionic + Angular (standalone components), consumindo a [PokeAPI](https://pokeapi.co/).

## Navegação

```
Tabs (Pokémons | Favoritos) → Detalhes
```

- **Pokémons**: tela principal, lista paginada de Pokémon com cabeçalho temático.
- **Favoritos**: lista dos Pokémon marcados como favoritos.
- **Detalhes**: fora das tabs, aberta via `router.navigate` a partir de qualquer card.

## Estrutura de pastas

```
src/app/
├── core/
│   ├── models/          # interfaces TypeScript da PokeAPI
│   └── services/         # PokeApiService, FavoritesService, WebhookService
├── tabs/                 # shell das tabs (bottom bar + rotas filhas)
├── pokemon-list/         # tela de listagem + cabeçalho temático
├── favorites/            # tela de favoritos
├── pokemon-detail/       # tela de detalhes (fora das tabs)
├── app.routes.ts
└── app.component.ts
```

## Serviços

Todos injetáveis via `providedIn: 'root'`, usando `inject()`.

| Serviço | Responsabilidade |
|---|---|
| `PokeApiService` | Único ponto de acesso HTTP à PokeAPI (lista paginada, detalhe, espécie, busca por nome) |
| `FavoritesService` | Estado reativo dos favoritos (`favorites$`), persistência em `localStorage` |
| `WebhookService` | Notifica um endpoint externo (webhook.site) quando um Pokémon é favoritado/desfavoritado, de forma assíncrona e sem afetar o fluxo local em caso de falha |

## Decisões técnicas relevantes

- **Busca por nome**: a PokeAPI não tem endpoint de busca parcial. A solução é cachear em memória,
  no primeiro uso da busca, a lista completa de nomes (`GET /pokemon?limit=2000`, payload leve) e
  filtrar localmente a partir daí — evita 1 request por letra digitada.
- **Imagens na listagem**: montadas direto pela URL do repositório de sprites, sem precisar de uma
  requisição HTTP extra por item.
- **Responsividade**: layout se adapta via media queries de orientação (retrato/paisagem), tanto na
  listagem quanto nos detalhes.
- **Webhook (demonstração)**: o POST pro webhook.site é enviado com `Content-Type: text/plain`
  (corpo ainda é JSON) pra evitar o preflight de CORS, já que o serviço não devolve
  `Access-Control-Allow-Origin`. O navegador bloqueia a leitura da resposta pelo JS (aparece como
  erro de CORS no console), mas a requisição chega normalmente no destino — suficiente pra uma
  notificação fire-and-forget que nunca deve travar o favoritar local.

## Histórico de decisões

Consulte o histórico de commits e Pull Requests do repositório para o racional de cada etapa —
cada PR corresponde a uma unidade de trabalho isolada e testável.
