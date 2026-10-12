import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideMoon, LucideSun } from '@lucide/angular';
import { ThemeService } from '../theme/theme.service';
import { BrandMark } from './brand-mark';

/** App frame (spec 004, FR-404; spec 003, US4): header with brand, navigation and theme switch; footer. */
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, LucideSun, LucideMoon, BrandMark],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly theme = inject(ThemeService);
  protected readonly year = new Date().getFullYear();
}
