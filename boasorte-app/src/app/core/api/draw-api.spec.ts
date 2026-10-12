import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DrawApi } from './draw-api';
import { CreateDrawRequest, DrawApiError, DrawResponse } from './draw.models';

const draw: DrawResponse = {
  publicId: 'aZ3k9QpL0xYt',
  title: 'Rifa',
  kind: 'list',
  createdAt: '2026-10-12T18:22:05Z',
  expiresAt: '2027-10-12T18:22:05Z',
  settings: { removeDuplicates: true, winnersCount: 1, showParticipants: true, range: null },
  submittedCount: 4,
  eligibleCount: 2,
  winners: [{ position: 1, value: 'Bruno' }],
  participants: ['Ana', 'Bruno'],
};

const request: CreateDrawRequest = {
  title: 'Rifa',
  kind: 'list',
  participants: ['Ana', 'Bruno'],
  removeDuplicates: true,
  winnersCount: 1,
  showParticipants: true,
};

describe('DrawApi', () => {
  let api: DrawApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(DrawApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function failure(call: Promise<unknown>): Promise<DrawApiError> {
    try {
      await call;
    } catch (error) {
      return error as DrawApiError;
    }
    throw new Error('expected the call to fail');
  }

  it('creates an official draw', async () => {
    const result = firstValueFrom(api.create(request));

    const req = http.expectOne('/api/v1/draws');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(draw, { status: 201, statusText: 'Created' });

    expect(await result).toEqual(draw);
  });

  it('gets a draw by its public id', async () => {
    const result = firstValueFrom(api.get('aZ3k9QpL0xYt'));

    http.expectOne({ method: 'GET', url: '/api/v1/draws/aZ3k9QpL0xYt' }).flush(draw);

    expect(await result).toEqual(draw);
  });

  it('maps 400 to field errors', async () => {
    const result = failure(firstValueFrom(api.create(request)));

    http.expectOne('/api/v1/draws').flush(
      { status: 400, errors: { winnersCount: ['Há apenas 2 participantes elegíveis.'] } },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(await result).toEqual({ kind: 'validation', fieldErrors: { winnersCount: ['Há apenas 2 participantes elegíveis.'] } });
  });

  it.each([
    [404, { kind: 'not-found' }],
    [410, { kind: 'expired' }],
    [413, { kind: 'too-large' }],
    [500, { kind: 'unavailable' }],
  ] as const)('maps %i', async (status, expected) => {
    const result = failure(firstValueFrom(api.get('aZ3k9QpL0xYt')));

    http.expectOne('/api/v1/draws/aZ3k9QpL0xYt').flush({ status }, { status, statusText: 'x' });

    expect(await result).toEqual(expected);
  });

  it('maps 429 with the server message', async () => {
    const result = failure(firstValueFrom(api.create(request)));

    http.expectOne('/api/v1/draws').flush(
      { status: 429, title: 'Muitos sorteios em pouco tempo. Aguarde um minuto e tente de novo.' },
      { status: 429, statusText: 'Too Many Requests' },
    );

    expect(await result).toEqual({
      kind: 'rate-limited',
      message: 'Muitos sorteios em pouco tempo. Aguarde um minuto e tente de novo.',
    });
  });

  it('maps network failures to unavailable', async () => {
    const result = failure(firstValueFrom(api.get('aZ3k9QpL0xYt')));

    http.expectOne('/api/v1/draws/aZ3k9QpL0xYt').error(new ProgressEvent('error'));

    expect(await result).toEqual({ kind: 'unavailable' });
  });

  it('escapes the public id in the url', async () => {
    const result = failure(firstValueFrom(api.get('a/b')));

    http.expectOne('/api/v1/draws/a%2Fb').flush({ status: 404 }, { status: 404, statusText: 'Not Found' });

    expect(await result).toEqual({ kind: 'not-found' });
  });
});
