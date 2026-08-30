import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import {
  NamedApiResource,
  PokemonCard,
  PokemonDetail,
  PokemonFull,
  PokemonListItem,
  PokemonListResponse,
  PokemonSpecies,
  PokemonTypeListResponse,
} from '../models/pokemon.model';

const BASE_URL = 'https://pokeapi.co/api/v2';
const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export interface PokemonListPage {
  cards: PokemonCard[];
  next: string | null;
}

@Injectable({ providedIn: 'root' })
export class PokeApiService {
  private http = inject(HttpClient);

  private allPokemonCache$: Observable<PokemonListItem[]> | null = null;
  private allTypesCache$: Observable<NamedApiResource[]> | null = null;

  getPokemonList(offset: number, limit: number): Observable<PokemonListResponse> {
    return this.http.get<PokemonListResponse>(
      `${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`
    );
  }

  /** Lista paginada já enriquecida com o tipo de cada Pokémon (N requests em paralelo por página). */
  getPokemonListWithTypes(offset: number, limit: number): Observable<PokemonListPage> {
    return this.getPokemonList(offset, limit).pipe(
      switchMap((response) =>
        this.enrichWithTypes(response.results).pipe(
          map((cards) => ({ cards, next: response.next }))
        )
      )
    );
  }

  getPokemonDetail(id: number): Observable<PokemonDetail> {
    return this.http.get<PokemonDetail>(`${BASE_URL}/pokemon/${id}`);
  }

  getPokemonSpecies(id: number): Observable<PokemonSpecies> {
    return this.http.get<PokemonSpecies>(`${BASE_URL}/pokemon-species/${id}`);
  }

  getPokemonFull(id: number): Observable<PokemonFull> {
    return forkJoin({
      detail: this.getPokemonDetail(id),
      species: this.getPokemonSpecies(id),
    });
  }

  /** Todos os tipos existentes na PokeAPI, pra popular os chips de filtro. */
  getAllTypes(): Observable<NamedApiResource[]> {
    if (!this.allTypesCache$) {
      this.allTypesCache$ = this.http
        .get<{ results: NamedApiResource[] }>(`${BASE_URL}/type`)
        .pipe(
          map((res) => res.results),
          shareReplay(1)
        );
    }
    return this.allTypesCache$;
  }

  /** Pokémon de um tipo específico — endpoint já filtra no servidor, bem mais barato que no client. */
  getPokemonsByType(typeName: string): Observable<PokemonCard[]> {
    return this.http.get<PokemonTypeListResponse>(`${BASE_URL}/type/${typeName}`).pipe(
      map((response) =>
        response.pokemon.map(({ pokemon }) => {
          const id = this.extractIdFromUrl(pokemon.url);
          return {
            id,
            name: pokemon.name,
            imageUrl: `${SPRITE_BASE_URL}/${id}.png`,
            types: [typeName],
          };
        })
      )
    );
  }

  searchPokemonByName(term: string): Observable<PokemonCard[]> {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return of([]);
    }
    return this.getAllPokemonCached().pipe(
      switchMap((list) => this.enrichWithTypes(list.filter((item) => item.name.includes(normalized))))
    );
  }

  getArtworkUrl(detail: PokemonDetail): string {
    return (
      detail.sprites.other?.['official-artwork']?.front_default ??
      detail.sprites.front_default ??
      ''
    );
  }

  private enrichWithTypes(items: PokemonListItem[]): Observable<PokemonCard[]> {
    if (items.length === 0) {
      return of([]);
    }
    return forkJoin(
      items.map((item) => this.getPokemonDetail(this.extractIdFromUrl(item.url)))
    ).pipe(map((details) => details.map((detail) => this.detailToCard(detail))));
  }

  private detailToCard(detail: PokemonDetail): PokemonCard {
    return {
      id: detail.id,
      name: detail.name,
      imageUrl: `${SPRITE_BASE_URL}/${detail.id}.png`,
      types: detail.types.map((t) => t.type.name),
    };
  }

  private extractIdFromUrl(url: string): number {
    const segments = url.split('/').filter(Boolean);
    return Number(segments[segments.length - 1]);
  }

  private getAllPokemonCached(): Observable<PokemonListItem[]> {
    if (!this.allPokemonCache$) {
      this.allPokemonCache$ = this.http
        .get<PokemonListResponse>(`${BASE_URL}/pokemon?limit=2000`)
        .pipe(
          map((res) => res.results),
          shareReplay(1)
        );
    }
    return this.allPokemonCache$;
  }
}
