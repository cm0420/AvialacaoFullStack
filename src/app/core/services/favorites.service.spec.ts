import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FavoritesService } from './favorites.service';
import { WebhookService } from './webhook.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let notifyFavoriteToggled: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    notifyFavoriteToggled = vi.fn();

    TestBed.configureTestingModule({
      providers: [{ provide: WebhookService, useValue: { notifyFavoriteToggled } }],
    });
    service = TestBed.inject(FavoritesService);
  });

  it('starts empty when localStorage has nothing stored', () => {
    expect(service.getAll()).toEqual([]);
  });

  it('toggle adds an id and marks it as favorite', () => {
    service.toggle(25);

    expect(service.getAll()).toEqual([25]);
    expect(service.isFavorite(25)).toBe(true);
  });

  it('toggle removes an id that is already favorited', () => {
    service.toggle(25);
    service.toggle(25);

    expect(service.getAll()).toEqual([]);
    expect(service.isFavorite(25)).toBe(false);
  });

  it('persists changes to localStorage', () => {
    service.toggle(1);
    service.toggle(4);

    const stored = JSON.parse(localStorage.getItem('pokedex:favorites') ?? '[]');
    expect(stored).toEqual([1, 4]);
  });

  it('emits the updated list on favorites$', () => {
    const emitted: number[][] = [];
    service.favorites$.subscribe((ids) => emitted.push(ids));

    service.toggle(1);

    expect(emitted).toEqual([[], [1]]);
  });

  it('notifies the WebhookService with the new favorite state', () => {
    service.toggle(1);
    expect(notifyFavoriteToggled).toHaveBeenCalledWith(1, true);

    service.toggle(1);
    expect(notifyFavoriteToggled).toHaveBeenCalledWith(1, false);
  });
});
