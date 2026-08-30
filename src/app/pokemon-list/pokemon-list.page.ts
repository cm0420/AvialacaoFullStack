import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonSearchbar,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  SearchbarCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star, starOutline, search } from 'ionicons/icons';
import { PokeApiService } from '../core/services/pokeapi.service';
import { FavoritesService } from '../core/services/favorites.service';
import { PokemonCard } from '../core/models/pokemon.model';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-pokemon-list',
  templateUrl: 'pokemon-list.page.html',
  styleUrls: ['pokemon-list.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
})
export class PokemonListPage implements OnInit {
  private pokeApiService = inject(PokeApiService);
  private favoritesService = inject(FavoritesService);

  pokemons = signal<PokemonCard[]>([]);
  favoriteIds = toSignal(this.favoritesService.favorites$, {
    initialValue: this.favoritesService.getAll(),
  });

  showSearch = signal(false);
  searchTerm = signal('');
  private searchTerm$ = new Subject<string>();
  searchResults = toSignal(
    this.searchTerm$.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      switchMap((term) => this.pokeApiService.searchPokemonByName(term))
    ),
    { initialValue: [] as PokemonCard[] }
  );

  isSearching = computed(() => this.searchTerm().trim().length > 0);
  displayedPokemons = computed(() =>
    this.isSearching() ? this.searchResults() : this.pokemons()
  );

  private offset = 0;
  private hasMore = true;

  constructor() {
    addIcons({ star, 'star-outline': starOutline, search });
  }

  ngOnInit(): void {
    this.loadMore();
  }

  loadMore(event?: InfiniteScrollCustomEvent): void {
    this.pokeApiService.getPokemonList(this.offset, PAGE_SIZE).subscribe((response) => {
      const cards = response.results.map((item) => this.pokeApiService.toCard(item));
      this.pokemons.update((current) => [...current, ...cards]);
      this.offset += PAGE_SIZE;
      this.hasMore = !!response.next;

      event?.target.complete();
      if (event && !this.hasMore) {
        event.target.disabled = true;
      }
    });
  }

  toggleSearch(): void {
    this.showSearch.update((value) => !value);
    if (!this.showSearch()) {
      this.searchTerm.set('');
      this.searchTerm$.next('');
    }
  }

  onSearchInput(event: SearchbarCustomEvent): void {
    const term = event.detail.value ?? '';
    this.searchTerm.set(term);
    this.searchTerm$.next(term);
  }

  isFavorite(id: number): boolean {
    return this.favoriteIds().includes(id);
  }

  toggleFavorite(id: number, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggle(id);
  }
}
