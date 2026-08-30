import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'pokedex:favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
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
    const next = current.includes(id)
      ? current.filter((favoriteId) => favoriteId !== id)
      : [...current, id];

    this.favoritesSubject.next(next);
    this.saveToStorage(next);
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
