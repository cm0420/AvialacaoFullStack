import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  PokemonCard,
  PokemonDetail,
  PokemonFull,
  PokemonListItem,
  PokemonListResponse,
  PokemonSpecies,
} from '../models/pokemon.model';

const BASE_URL = 'https://pokeapi.co/api/v2';
const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

@Injectable({ providedIn: 'root' })
export class PokeApiService {
  private http = inject(HttpClient);

  private allPokemonCache$: Observable<PokemonListItem[]> | null = null;

  getPokemonList(offset: number, limit: number): Observable<PokemonListResponse> {
    return this.http.get<PokemonListResponse>(
      `${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`
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

  searchPokemonByName(term: string): Observable<PokemonCard[]> {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return of([]);
    }
    return this.getAllPokemonCached().pipe(
      map((list) =>
        list.filter((item) => item.name.includes(normalized)).map((item) => this.toCard(item))
      )
    );
  }

  getArtworkUrl(detail: PokemonDetail): string {
    return (
      detail.sprites.other?.['official-artwork']?.front_default ??
      detail.sprites.front_default ??
      ''
    );
  }

  toCard(item: PokemonListItem): PokemonCard {
    const id = this.extractIdFromUrl(item.url);
    return {
      id,
      name: item.name,
      imageUrl: `${SPRITE_BASE_URL}/${id}.png`,
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

