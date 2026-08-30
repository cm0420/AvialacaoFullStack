# Pokédex App

Aplicativo mobile-first construído com Ionic + Angular, consumindo a [PokeAPI](https://pokeapi.co/)
para listar, buscar, favoritar e detalhar Pokémon.

## Como rodar

```bash
npm install
npm start        # abre em http://localhost:4200
```

Ou via Ionic CLI, pra testar em emulador/dispositivo:

```bash
npx ionic serve
```

Rodar os testes e o lint:

```bash
npm test
npm run lint
```

## Funcionalidades

- Listagem paginada de Pokémon (nome + imagem), com scroll infinito
- Busca por nome, com cache local (a PokeAPI não tem busca parcial por nome)
- Favoritar direto na lista ou na tela de detalhes, persistido em `localStorage`
- Tela de detalhes com imagem, descrição, altura, peso, exp. base, tipos, habilidades e estatísticas base
- Tela de Favoritos
- Layout adaptado à orientação do dispositivo (retrato/paisagem)
- Notificação via webhook (webhook.site) sempre que um Pokémon é favoritado/desfavoritado

## Stack

Ionic 8 + Angular 22 (standalone components, zoneless), RxJS, Vitest para testes unitários.

Mais detalhes de arquitetura em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) e o histórico de
entregas em [`docs/PROGRESSO.md`](docs/PROGRESSO.md).

## Sobre as decisões do projeto

Optei por duas abas (Pokémons e Favoritos) mais uma tela de detalhes empilhada por cima, evitando
criar uma terceira seção artificial só para preencher espaço. A tela de listagem já abre mostrando
nome e imagem de cada Pokémon, com um cabeçalho decorativo que remete ao visual de uma Pokédex sem
virar uma tela separada. Toda comunicação com a PokeAPI passa por um único serviço injetável, então
nenhuma tela conversa direto com HTTP. A busca por nome usa um cache local da lista completa,
carregado uma única vez, porque a API não oferece busca parcial e uma requisição a cada tecla
digitada seria desnecessário. Os favoritos vivem em um serviço reativo com persistência em
`localStorage`, e cada alteração dispara uma notificação para um endpoint externo via
[webhook.site](https://webhook.site) — a PokeAPI não tem webhooks reais, então essa é uma
demonstração do conceito. Layout e grid se adaptam à orientação do dispositivo tanto na listagem
quanto no detalhe. Os três serviços centrais têm testes unitários cobrindo o comportamento
principal e casos de erro. O histórico de commits foi mantido pequeno e sequencial, cada um
isolado e testável, com um Pull Request correspondente no GitHub para cada entrega.

## Prints / demonstração

_(a completar com screenshots ou um gif do app rodando)_
