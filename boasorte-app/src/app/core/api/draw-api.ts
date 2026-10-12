import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { CreateDrawRequest, DrawApiError, DrawResponse } from './draw.models';

const BASE_URL = '/api/v1/draws';

/** Client for the draws API. Errors are emitted as {@link DrawApiError}. */
@Injectable({ providedIn: 'root' })
export class DrawApi {
  private readonly http = inject(HttpClient);

  /** Official draw: the server draws and stores the result (spec 001, FR-012). */
  create(request: CreateDrawRequest): Observable<DrawResponse> {
    return this.http.post<DrawResponse>(BASE_URL, request).pipe(catchError(toDrawApiError));
  }

  get(publicId: string): Observable<DrawResponse> {
    return this.http.get<DrawResponse>(`${BASE_URL}/${encodeURIComponent(publicId)}`).pipe(catchError(toDrawApiError));
  }
}

function toDrawApiError(response: HttpErrorResponse): Observable<never> {
  return throwError(() => mapError(response));
}

function mapError(response: HttpErrorResponse): DrawApiError {
  switch (response.status) {
    case 400:
      return { kind: 'validation', fieldErrors: response.error?.errors ?? {} };
    case 404:
      return { kind: 'not-found' };
    case 410:
      return { kind: 'expired' };
    case 413:
      return { kind: 'too-large' };
    case 429:
      return {
        kind: 'rate-limited',
        message: response.error?.title ?? 'Muitos sorteios em pouco tempo. Aguarde um minuto e tente de novo.',
      };
    default:
      return { kind: 'unavailable' };
  }
}
