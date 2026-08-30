import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebhookService } from './webhook.service';

const STORAGE_KEY = 'pokedex:favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private webhookService = inject(WebhookService);

  private favoritesSubject = new BehaviorSubject<number[]>(this.loadFromStorage());

  favorites$ = this.favoritesSubject.asObservable();

  getAll(): number[] {
    return this.favoritesSubject.value;
  }

  isFavorite(id: number): boolean {
    return this.favoritesSubject.value.includes(id);
  }

  toggle(id: number): void {
    const current = this.favoritesSubject.value;
    const willBeFavorite = !current.includes(id);
    const next = willBeFavorite ? [...current, id] : current.filter((favoriteId) => favoriteId !== id);

    this.favoritesSubject.next(next);
    this.saveToStorage(next);
    this.webhookService.notifyFavoriteToggled(id, willBeFavorite);
  }

  private loadFromStorage(): number[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(ids: number[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}
