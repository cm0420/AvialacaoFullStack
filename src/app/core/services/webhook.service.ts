import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebhookService {
  private http = inject(HttpClient);

  notifyFavoriteToggled(pokemonId: number, isFavorite: boolean): void {
    if (!environment.webhookUrl) {
      return;
    }

    const payload = {
      pokemonId,
      isFavorite,
      timestamp: new Date().toISOString(),
    };

    // Content-Type text/plain evita o preflight de CORS (webhook.site não
    // devolve Access-Control-Allow-Origin) — o corpo continua sendo JSON.
    this.http
      .post(environment.webhookUrl, JSON.stringify(payload), {
        headers: new HttpHeaders({ 'Content-Type': 'text/plain' }),
      })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }
}
