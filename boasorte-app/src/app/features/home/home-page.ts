import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { LucideLock, LucideServer, LucideShieldCheck, LucideShuffle } from '@lucide/angular';
import { LotteryBall } from '../../shared/ui/lottery-ball/lottery-ball';
import { FAQ } from './faq';

const FAQ_JSONLD_ID = 'faq-jsonld';

/** Landing page (spec 003). Prerendered at build time. */
@Component({
  selector: 'app-home-page',
  imports: [MatButtonModule, RouterLink, LotteryBall, LucideShuffle, LucideShieldCheck, LucideServer, LucideLock],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly faq = FAQ;
  protected readonly exampleWinners = ['Carla', 'Bruno', 'Eduarda'];

  constructor() {
    publishFaqStructuredData(inject(DOCUMENT));
  }
}

/** schema.org FAQPage in <head>, so it is part of the prerendered HTML. Added once (prerender + hydration). */
function publishFaqStructuredData(document: Document): void {
  if (document.getElementById(FAQ_JSONLD_ID)) return;

  const script = document.createElement('script');
  script.id = FAQ_JSONLD_ID;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  });
  document.head.appendChild(script);
}
