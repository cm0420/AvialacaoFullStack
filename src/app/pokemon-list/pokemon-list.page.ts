import { Component, OnInit, inject, signal } from '@angular/core';
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
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
} from '@ionic/angular';
import { PokeApiService } from '../core/services/pokeapi.service';
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
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
})
export class PokemonListPage implements OnInit {
  private pokeApiService = inject(PokeApiService);

  pokemons = signal<PokemonCard[]>([]);
  private offset = 0;
  private hasMore = true;

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
}
