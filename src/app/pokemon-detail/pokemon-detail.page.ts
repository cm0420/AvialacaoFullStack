import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star, starOutline } from 'ionicons/icons';
import { PokeApiService } from '../core/services/pokeapi.service';
import { FavoritesService } from '../core/services/favorites.service';
import { PokemonDetail, PokemonSpecies } from '../core/models/pokemon.model';

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'Atq. Especial',
  'special-defense': 'Def. Especial',
  speed: 'Velocidade',
};

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: 'pokemon-detail.page.html',
  styleUrls: ['pokemon-detail.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonSpinner,
  ],
})
export class PokemonDetailPage {
  private pokeApiService = inject(PokeApiService);
  private favoritesService = inject(FavoritesService);

  id = input.required<string>();

  private pokemonId = computed(() => Number(this.id()));

  full = toSignal(
    toObservable(this.pokemonId).pipe(
      switchMap((id) => this.pokeApiService.getPokemonFull(id))
    )
  );

  private favoriteIds = toSignal(this.favoritesService.favorites$, {
    initialValue: this.favoritesService.getAll(),
  });

  isFavorite = computed(() => this.favoriteIds().includes(this.pokemonId()));

  constructor() {
    addIcons({ star, 'star-outline': starOutline });
  }

  toggleFavorite(): void {
    this.favoritesService.toggle(this.pokemonId());
  }

  artworkUrl(detail: PokemonDetail): string {
    return this.pokeApiService.getArtworkUrl(detail);
  }

  flavorText(species: PokemonSpecies): string {
    const entry =
      species.flavor_text_entries.find((e) => e.language.name === 'en') ??
      species.flavor_text_entries[0];
    return entry ? entry.flavor_text.replace(/[\n\f]/g, ' ') : '';
  }

  typesLabel(detail: PokemonDetail): string {
    return detail.types.map((t) => t.type.name).join(', ');
  }

  abilitiesLabel(detail: PokemonDetail): string {
    return detail.abilities.map((a) => a.ability.name).join(', ');
  }

  statLabel(name: string): string {
    return STAT_LABELS[name] ?? name;
  }
}
