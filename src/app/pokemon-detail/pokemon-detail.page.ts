import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import {
  IonHeader,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonContent,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star, starOutline, chevronBack } from 'ionicons/icons';
import { PokeApiService } from '../core/services/pokeapi.service';
import { FavoritesService } from '../core/services/favorites.service';
import { PokemonDetail, PokemonSpecies } from '../core/models/pokemon.model';
import { getTypeStyle } from '../core/constants/pokemon-type-colors';

const STAT_MAX_REFERENCE = 180;

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
  imports: [IonHeader, IonButtons, IonBackButton, IonButton, IonIcon, IonContent, IonSpinner],
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
    addIcons({ star, 'star-outline': starOutline, 'chevron-back': chevronBack });
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

  typesList(detail: PokemonDetail): string[] {
    return detail.types.map((t) => t.type.name);
  }

  abilitiesList(detail: PokemonDetail): string[] {
    return detail.abilities.map((a) => a.ability.name);
  }

  statLabel(name: string): string {
    return STAT_LABELS[name] ?? name;
  }

  statPercent(baseStat: number): number {
    return Math.min(100, Math.round((baseStat / STAT_MAX_REFERENCE) * 100));
  }

  totalStats(detail: PokemonDetail): number {
    return detail.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
  }

  formatNumber(id: number): string {
    return String(id).padStart(3, '0');
  }

  typeLabel(typeName: string): string {
    return getTypeStyle(typeName).label;
  }

  typeAccent(typeName: string): string {
    return getTypeStyle(typeName).accent;
  }

  headerGradient(detail: PokemonDetail): string {
    const accent = this.typeAccent(this.typesList(detail)[0] ?? '');
    return `linear-gradient(180deg, ${accent}33 0%, var(--pk-bg) 75%)`;
  }

  auraGlow(detail: PokemonDetail): string {
    return getTypeStyle(this.typesList(detail)[0] ?? '').glow;
  }
}
