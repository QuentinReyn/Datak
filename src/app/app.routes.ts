import { Routes } from '@angular/router';
import { AlliancesComponent } from './views/alliances/alliances.component';
import { HomeComponent } from './views/home/home.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'alliance/:id', component: AlliancesComponent },
  ];