import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
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
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star, starOutline } from 'ionicons/icons';
import { PokeApiService } from '../core/services/pokeapi.service';
import { FavoritesService } from '../core/services/favorites.service';
import { PokemonCard } from '../core/models/pokemon.model';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-pokemon-list',
  templateUrl: 'pokemon-list.page.html',
  styleUrls: ['pokemon-list.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
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

  private offset = 0;
  private hasMore = true;

  constructor() {
    addIcons({ star, 'star-outline': starOutline });
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

  isFavorite(id: number): boolean {
    return this.favoriteIds().includes(id);
  }

  toggleFavorite(id: number, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggle(id);
  }
}
