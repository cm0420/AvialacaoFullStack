import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PokeApiService } from './pokeapi.service';
import { PokemonDetail, PokemonListResponse } from '../models/pokemon.model';

function makeDetail(id: number, name: string, types: string[]): PokemonDetail {
  return {
    id,
    name,
    height: 7,
    weight: 69,
    base_experience: 64,
    sprites: { front_default: null },
    types: types.map((typeName, index) => ({
      slot: index + 1,
      type: { name: typeName, url: `https://pokeapi.co/api/v2/type/${typeName}/` },
    })),
    abilities: [],
    stats: [],
  };
}

describe('PokeApiService', () => {
  let service: PokeApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PokeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getPokemonList requests the correct offset/limit', () => {
    service.getPokemonList(20, 20).subscribe();

    const req = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?offset=20&limit=20');
    expect(req.request.method).toBe('GET');
    req.flush({ count: 0, next: null, previous: null, results: [] });
  });

  it('getPokemonDetail requests the correct id', () => {
    service.getPokemonDetail(25).subscribe();

    const req = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/25');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getPokemonSpecies requests the correct id', () => {
    service.getPokemonSpecies(25).subscribe();

    const req = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/25');
    req.flush({});
  });

  it('getPokemonFull combines detail and species via forkJoin', () => {
    let result: unknown;
    service.getPokemonFull(1).subscribe((full) => (result = full));

    const detailReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/1');
    const speciesReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon-species/1');
    detailReq.flush({ id: 1, name: 'bulbasaur' });
    speciesReq.flush({ id: 1, name: 'bulbasaur' });

    expect(result).toEqual({
      detail: { id: 1, name: 'bulbasaur' },
      species: { id: 1, name: 'bulbasaur' },
    });
  });

  it('getPokemonListWithTypes enriches each result with its type via one request per item', () => {
    const response: PokemonListResponse = {
      count: 2,
      next: 'https://pokeapi.co/api/v2/pokemon?offset=2&limit=2',
      previous: null,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
      ],
    };

    let result: unknown;
    service.getPokemonListWithTypes(0, 2).subscribe((page) => (result = page));

    httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?offset=0&limit=2').flush(response);
    httpMock
      .expectOne('https://pokeapi.co/api/v2/pokemon/1')
      .flush(makeDetail(1, 'bulbasaur', ['grass', 'poison']));
    httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/4').flush(makeDetail(4, 'charmander', ['fire']));

    expect(result).toEqual({
      next: response.next,
      cards: [
        {
          id: 1,
          name: 'bulbasaur',
          imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
          types: ['grass', 'poison'],
        },
        {
          id: 4,
          name: 'charmander',
          imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
          types: ['fire'],
        },
      ],
    });
  });

  it('getAllTypes fetches once and caches for subsequent calls', () => {
    service.getAllTypes().subscribe();
    httpMock
      .expectOne('https://pokeapi.co/api/v2/type')
      .flush({ results: [{ name: 'fire', url: 'x' }] });

    service.getAllTypes().subscribe();
    httpMock.expectNone('https://pokeapi.co/api/v2/type');
  });

  it('getPokemonsByType maps the type endpoint response into cards tagged with that type', () => {
    let result: unknown;
    service.getPokemonsByType('fire').subscribe((cards) => (result = cards));

    httpMock.expectOne('https://pokeapi.co/api/v2/type/fire').flush({
      pokemon: [
        { pokemon: { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' }, slot: 1 },
      ],
    });

    expect(result).toEqual([
      {
        id: 4,
        name: 'charmander',
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
        types: ['fire'],
      },
    ]);
  });

  it('searchPokemonByName returns an empty array without an HTTP call for a blank term', () => {
    let result: unknown;
    service.searchPokemonByName('   ').subscribe((results) => (result = results));

    expect(result).toEqual([]);
  });

  it('searchPokemonByName fetches the full list once, filters locally, then enriches matches with types', () => {
    const response: PokemonListResponse = {
      count: 2,
      next: null,
      previous: null,
      results: [
        { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
        { name: 'squirtle', url: 'https://pokeapi.co/api/v2/pokemon/7/' },
      ],
    };

    let result: unknown;
    service.searchPokemonByName('char').subscribe((results) => (result = results));

    httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?limit=2000').flush(response);
    httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/4').flush(makeDetail(4, 'charmander', ['fire']));

    expect(result).toEqual([
      {
        id: 4,
        name: 'charmander',
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
        types: ['fire'],
      },
    ]);

    // segunda busca reaproveita o cache da lista completa (sem novo GET ?limit=2000)
    service.searchPokemonByName('squirtle').subscribe();
    httpMock.expectNone('https://pokeapi.co/api/v2/pokemon?limit=2000');
    httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/7').flush(makeDetail(7, 'squirtle', ['water']));
  });
});
