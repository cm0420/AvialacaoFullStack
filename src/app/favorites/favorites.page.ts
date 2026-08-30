import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { IonHeader, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star } from 'ionicons/icons';
import { PokeApiService } from '../core/services/pokeapi.service';
import { FavoritesService } from '../core/services/favorites.service';
import { PokemonDetail } from '../core/models/pokemon.model';
import { getTypeStyle } from '../core/constants/pokemon-type-colors';

@Component({
  selector: 'app-favorites',
  templateUrl: 'favorites.page.html',
  styleUrls: ['favorites.page.scss'],
  imports: [IonHeader, IonContent, IonIcon],
})
export class FavoritesPage {
  private pokeApiService = inject(PokeApiService);
  private favoritesService = inject(FavoritesService);
  private router = inject(Router);

  constructor() {
    addIcons({ star });
  }

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

  removeFavorite(id: number, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggle(id);
  }

  typesList(detail: PokemonDetail): string[] {
    return detail.types.map((t) => t.type.name);
  }

  typeLabel(typeName: string): string {
    return getTypeStyle(typeName).label;
  }

  typeAccent(typeName: string): string {
    return getTypeStyle(typeName).accent;
  }

  formatNumber(id: number): string {
    return String(id).padStart(3, '0');
  }
}
