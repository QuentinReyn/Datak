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
    <div
      class="container h-screen flex flex-col items-center justify-center mx-auto p-4 text-center"
    >
      <div class="container mx-auto">
        <h1 class="text-2xl text-white mb-5">Rejoignez votre équipe !</h1>
        <input
          [(ngModel)]="pseudo"
          placeholder="Nom d'utilisateur"
          class="w-[300px] border px-3 py-2 rounded-md bg-transparent placeholder-white text-white focus:outline-none focus:ring-1 focus:ring-white transition duration-300 ease-in-out"
        />

        <hr class="w-[125px] mx-auto my-5" />

        <!-- <h2 class="text-xl mt-4">Alliance créée</h2>
        <p *ngIf="alliance$ | async as alliance">
          🎉 Alliance <strong>{{ alliance.name }}</strong> créée avec ID:
          <strong>{{ alliance.id }}</strong>
        </p> -->
      </div>

      <div class="flex flex-col">
        <!-- <h2 class="text-xl">Rejoindre une Alliance</h2> -->
        <input
          [(ngModel)]="allianceName"
          placeholder="Créer votre alliance"
          class="w-[300px] border px-3 py-2 rounded-md bg-transparent placeholder-white text-white focus:outline-none focus:ring-1 focus:ring-white transition duration-300 ease-in-out"
        />
        <input
          [(ngModel)]="allianceId"
          placeholder="Rejoindre une alliance"
          class="w-[300px] border px-3 py-2 my-3 rounded-md bg-transparent placeholder-white text-white focus:outline-none focus:ring-1 focus:ring-white transition duration-300 ease-in-out"
        />
        <button
          (click)="joinAlliance()"
          class="bg-[#FCC124] text-white w-[143px] px-4 py-2 mx-auto rounded-md mt-3 transition duration-300 ease-in-out hover:scale-105"
        >
          Se connecter
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
    this.socketService
      .joinAlliance(this.allianceId, this.pseudo)
      .then((value) => {
        this.router.navigate(['/alliance', this.allianceId]);
      });
  }

  ngOnDestroy() {}
}
