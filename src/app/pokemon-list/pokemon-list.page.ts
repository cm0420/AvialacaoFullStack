import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import {
  IonHeader,
  IonContent,
  IonSearchbar,
  IonIcon,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  SearchbarCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star, starOutline, search } from 'ionicons/icons';
import { PokeApiService } from '../core/services/pokeapi.service';
import { FavoritesService } from '../core/services/favorites.service';
import { PokemonCard, NamedApiResource } from '../core/models/pokemon.model';
import { getTypeStyle, POKEMON_TYPE_STYLES } from '../core/constants/pokemon-type-colors';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-pokemon-list',
  templateUrl: 'pokemon-list.page.html',
  styleUrls: ['pokemon-list.page.scss'],
  imports: [
    IonHeader,
    IonContent,
    IonSearchbar,
    IonIcon,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
})
export class PokemonListPage implements OnInit {
  private pokeApiService = inject(PokeApiService);
  private favoritesService = inject(FavoritesService);
  private router = inject(Router);

  @ViewChild(IonContent) private content?: IonContent;

  pokemons = signal<PokemonCard[]>([]);
  totalCount = signal<number | null>(null);
  initialLoading = signal(true);
  searchLoading = signal(false);
  filterLoading = signal(false);

  favoriteIds = toSignal(this.favoritesService.favorites$, {
    initialValue: this.favoritesService.getAll(),
  });

  typeChips = toSignal(this.pokeApiService.getAllTypes(), { initialValue: [] as NamedApiResource[] });
  knownTypeChips = computed(() => this.typeChips().filter((t) => t.name in POKEMON_TYPE_STYLES));

  searchTerm = signal('');
  private searchTerm$ = new Subject<string>();
  searchResults = toSignal(
    this.searchTerm$.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      tap((term) => this.searchLoading.set(term.trim().length > 0)),
      switchMap((term) =>
        this.pokeApiService.searchPokemonByName(term).pipe(tap(() => this.searchLoading.set(false)))
      )
    ),
    { initialValue: [] as PokemonCard[] }
  );

  selectedType = signal<string | null>(null);
  private selectedType$ = new Subject<string | null>();
  typeFilterResults = toSignal(
    this.selectedType$.pipe(
      tap((type) => this.filterLoading.set(!!type)),
      switchMap((type) =>
        type
          ? this.pokeApiService.getPokemonsByType(type).pipe(tap(() => this.filterLoading.set(false)))
          : of([])
      )
    ),
    { initialValue: [] as PokemonCard[] }
  );

  isSearching = computed(() => this.searchTerm().trim().length > 0);
  isFiltering = computed(() => this.selectedType() !== null);
  isBusy = computed(
    () =>
      this.initialLoading() ||
      (this.isSearching() && this.searchLoading()) ||
      (this.isFiltering() && this.filterLoading())
  );
  displayedPokemons = computed(() => {
    if (this.isSearching()) return this.searchResults();
    if (this.isFiltering()) return this.typeFilterResults();
    return this.pokemons();
  });

  private offset = 0;
  private hasMore = true;

  constructor() {
    addIcons({ star, 'star-outline': starOutline, search });
  }

  ngOnInit(): void {
    this.loadMore();
  }

  loadMore(event?: InfiniteScrollCustomEvent): void {
    this.pokeApiService.getPokemonListWithTypes(this.offset, PAGE_SIZE).subscribe((page) => {
      this.pokemons.update((current) => [...current, ...page.cards]);
      this.offset += PAGE_SIZE;
      this.hasMore = !!page.next;
      this.initialLoading.set(false);

      event?.target.complete();
      if (event && !this.hasMore) {
        event.target.disabled = true;
      }

      if (!event) {
        this.loadMoreIfNotScrollable();
      }
    });

    if (this.totalCount() === null) {
      this.pokeApiService.getPokemonList(0, 1).subscribe((res) => this.totalCount.set(res.count));
    }
  }

  /**
   * Em telas largas e curtas (notebook), 1 página pode não ser alta o
   * suficiente pra criar scroll — sem scroll, o ion-infinite-scroll nunca
   * dispara. Continua carregando páginas até o conteúdo precisar de scroll
   * ou a API acabar.
   */
  private loadMoreIfNotScrollable(): void {
    if (!this.hasMore) {
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.content?.getScrollElement().then((el) => {
          if (el.scrollHeight <= el.clientHeight + 2) {
            this.loadMore();
          }
        });
      });
    });
  }

  onSearchInput(event: SearchbarCustomEvent): void {
    const term = event.detail.value ?? '';
    this.searchTerm.set(term);
    this.searchTerm$.next(term);
  }

  selectType(typeName: string | null): void {
    this.selectedType.set(typeName);
    this.selectedType$.next(typeName);
  }

  isFavorite(id: number): boolean {
    return this.favoriteIds().includes(id);
  }

  toggleFavorite(id: number, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggle(id);
  }

  openDetail(id: number): void {
    this.router.navigate(['/pokemons', id]);
  }

  formatNumber(id: number): string {
    return String(id).padStart(3, '0');
  }

  typeLabel(typeName: string): string {
    return getTypeStyle(typeName).label;
  }

  glowFor(pokemon: PokemonCard): string {
    return getTypeStyle(pokemon.types[0] ?? '').glow;
  }

  chipAccent(typeName: string): string {
    return getTypeStyle(typeName).accent;
  }
}
