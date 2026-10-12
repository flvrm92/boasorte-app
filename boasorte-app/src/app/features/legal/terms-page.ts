import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EFFECTIVE_DATE_LABEL, LEGAL_ENTITY } from './legal-entity';

/** Terms of use (spec 003, FR-203). Draft: to be reviewed by a lawyer before publishing. */
@Component({
  selector: 'app-terms-page',
  imports: [RouterLink],
  templateUrl: './terms-page.html',
})
export class TermsPage {
  protected readonly entity = LEGAL_ENTITY;
  protected readonly effectiveDate = EFFECTIVE_DATE_LABEL;
}
