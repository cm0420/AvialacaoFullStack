import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'pokemons/:id',
    loadComponent: () =>
      import('./pokemon-detail/pokemon-detail.page').then((m) => m.PokemonDetailPage),
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
];
