import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EFFECTIVE_DATE_LABEL, LEGAL_ENTITY } from './legal-entity';

/**
 * Privacy policy (spec 003, FR-203; LGPD). Must describe what the system really does — keep it in sync with
 * specs 001/002 when data handling changes. Draft: to be reviewed by a lawyer before the Meta App Review.
 */
@Component({
  selector: 'app-privacy-page',
  imports: [RouterLink],
  templateUrl: './privacy-page.html',
})
export class PrivacyPage {
  protected readonly entity = LEGAL_ENTITY;
  protected readonly effectiveDate = EFFECTIVE_DATE_LABEL;
}
