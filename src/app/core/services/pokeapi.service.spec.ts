import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PokeApiService } from './pokeapi.service';
import { PokemonListResponse } from '../models/pokemon.model';

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

  it('toCard extracts the id from the URL and builds the sprite URL', () => {
    const card = service.toCard({ name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' });

    expect(card).toEqual({
      id: 6,
      name: 'charizard',
      imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
    });
  });

  it('searchPokemonByName returns an empty array without an HTTP call for a blank term', () => {
    let result: unknown;
    service.searchPokemonByName('   ').subscribe((results) => (result = results));

    expect(result).toEqual([]);
  });

  it('searchPokemonByName fetches and caches the full list, filtering locally', () => {
    const response: PokemonListResponse = {
      count: 3,
      next: null,
      previous: null,
      results: [
        { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
        { name: 'charmeleon', url: 'https://pokeapi.co/api/v2/pokemon/5/' },
        { name: 'squirtle', url: 'https://pokeapi.co/api/v2/pokemon/7/' },
      ],
    };

    let firstResult: unknown;
    service.searchPokemonByName('char').subscribe((results) => (firstResult = results));
    httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?limit=2000').flush(response);

    expect(firstResult).toEqual([
      {
        id: 4,
        name: 'charmander',
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
      },
      {
        id: 5,
        name: 'charmeleon',
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png',
      },
    ]);

    let secondResult: unknown;
    service.searchPokemonByName('squirtle').subscribe((results) => (secondResult = results));
    httpMock.expectNone('https://pokeapi.co/api/v2/pokemon?limit=2000');

    expect(secondResult).toEqual([
      {
        id: 7,
        name: 'squirtle',
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
      },
    ]);
  });
});
