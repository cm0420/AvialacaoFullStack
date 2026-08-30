import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
} from '@ionic/angular';
import { PokeApiService } from '../core/services/pokeapi.service';
import { FavoritesService } from '../core/services/favorites.service';
import { PokemonDetail } from '../core/models/pokemon.model';

@Component({
  selector: 'app-favorites',
  templateUrl: 'favorites.page.html',
  styleUrls: ['favorites.page.scss'],
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
  ],
})
export class FavoritesPage {
  private pokeApiService = inject(PokeApiService);
  private favoritesService = inject(FavoritesService);
  private router = inject(Router);

  pokemons = toSignal(
    this.favoritesService.favorites$.pipe(
      switchMap((ids) =>
        ids.length
          ? forkJoin(ids.map((id) => this.pokeApiService.getPokemonDetail(id)))
          : of([])
      )
    ),
    { initialValue: [] as PokemonDetail[] }
  );

  artworkUrl(detail: PokemonDetail): string {
    return this.pokeApiService.getArtworkUrl(detail);
  }

  openDetail(id: number): void {
    this.router.navigate(['/pokemons', id]);
  }
}
