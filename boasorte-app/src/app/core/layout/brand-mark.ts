import { Component } from '@angular/core';

/** Logo: a lottery ball seen from the front. Decorative; the link around it carries the name. */
@Component({
  selector: 'app-brand-mark',
  template: `
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="brand-ball" cx="38%" cy="34%" r="70%">
          <stop offset="0" stop-color="var(--color-ball)" />
          <stop offset="1" stop-color="var(--color-ball-shade)" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#brand-ball)" />
      <circle cx="16" cy="16" r="8.5" fill="#fff" />
      <text x="16" y="20" text-anchor="middle" font-family="var(--font-display)" font-weight="800" font-size="11" fill="#12153a">b</text>
      <circle cx="11" cy="9.5" r="2" fill="#fff" opacity=".55" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    svg {
      width: 28px;
      height: 28px;
    }
  `,
})
export class BrandMark {}
