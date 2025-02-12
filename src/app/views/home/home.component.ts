import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.service';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="container mx-auto p-4 text-center">
      <h1 class="text-2xl font-bold">Bienvenue sur Datak</h1>

      <div class="container mx-auto p-4">
        <h1 class="text-2xl font-bold">Créer une Alliance</h1>

        <input
          [(ngModel)]="allianceName"
          placeholder="Nom de l'alliance"
          class="border p-2"
        />
        <input
          [(ngModel)]="pseudo"
          placeholder="Votre pseudo"
          class="border p-2"
        />

        <button
          (click)="createAlliance()"
          class="bg-blue-500 text-white px-4 py-2"
        >
          Créer et Rejoindre
        </button>

        <h2 class="text-xl mt-4">Alliance créée</h2>
        <p *ngIf="alliance$ | async as alliance">
          🎉 Alliance <strong>{{ alliance.name }}</strong> créée avec ID:
          <strong>{{ alliance.id }}</strong>
        </p>
      </div>

      <div class="mt-6">
        <h2 class="text-xl">Rejoindre une Alliance</h2>
        <input
          [(ngModel)]="allianceId"
          placeholder="ID de l'alliance"
          class="border p-2"
        />
        <input
          [(ngModel)]="pseudo"
          placeholder="Votre pseudo"
          class="border p-2"
        />
        <button
          (click)="joinAlliance()"
          class="bg-green-500 text-white px-4 py-2"
        >
          Rejoindre
        </button>
      </div>
    </div>
  `,
  styleUrl: './home.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  allianceName = '';
  allianceId = '';
  pseudo = '';
  alliance$ = new BehaviorSubject<any>(null);
  constructor(private socketService: SocketService, private router: Router) {
    this.alliance$ = this.socketService.alliance$; // ✅ Observer l'alliance créée
  }

  ngOnInit() {
    const storedAllianceId = localStorage.getItem('allianceId');
    if (storedAllianceId) {
      const exists = this.socketService
        .checkAllianceExists(this.allianceId)
        .then((value) => {
          if (!value) {
            console.warn(`⚠️ Alliance ${this.allianceId} supprimée !`);
            localStorage.removeItem('allianceId');
            this.router.navigate(['/']); // Redirection vers la page d'accueil
            return;
          } else {
            this.router.navigate(['/alliance', storedAllianceId]);
          }
        });
    }
  }

  createAlliance() {
    if (this.allianceName.trim() && this.pseudo.trim()) {
      this.socketService
        .createAlliance(this.allianceName, this.pseudo)
        .then((allianceId) => {
          this.router.navigate(['/alliance', allianceId]);
        });
    }
  }

  joinAlliance() {
    this.socketService.joinAlliance(this.allianceId, this.pseudo).then((value)=>{
      this.router.navigate(['/alliance', this.allianceId]);
    });
  }

  ngOnDestroy() {}
}
