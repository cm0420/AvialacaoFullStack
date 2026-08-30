import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WebhookService } from './webhook.service';
import { environment } from '../../../environments/environment';

describe('WebhookService', () => {
  let service: WebhookService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WebhookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts pokemonId, isFavorite and a timestamp to the webhook URL', () => {
    service.notifyFavoriteToggled(25, true);

    const req = httpMock.expectOne(environment.webhookUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('text/plain');

    const body = JSON.parse(req.request.body as string);
    expect(body.pokemonId).toBe(25);
    expect(body.isFavorite).toBe(true);
    expect(typeof body.timestamp).toBe('string');

    req.flush(null);
  });

  it('does not throw when the webhook request fails', () => {
    expect(() => service.notifyFavoriteToggled(1, false)).not.toThrow();

    const req = httpMock.expectOne(environment.webhookUrl);
    req.error(new ProgressEvent('network error'));
  });
});
