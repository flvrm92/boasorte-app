import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Shell } from './core/layout/shell';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Shell],
  template: `
    <app-shell>
      <router-outlet />
    </app-shell>
  `,
})
export class App {}
