import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Player } from '../../models/player.model';
import { Attack } from '../../models/attack.model';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-alliances',
  imports: [FormsModule, CommonModule],
  standalone: true,
  templateUrl: './alliances.component.html',
  styleUrl: './alliances.component.css',
})
export class AlliancesComponent implements OnInit {
  allianceId: string = '';
  attackList$ = new BehaviorSubject<Attack[]>([]);
  alliance$ = new BehaviorSubject<any>(null);
  attackName = '';
  attackLocation = '';
  player$: any;
  playerId!: string;
  timers: { [key: string]: number } = {}; // Stocker les timers par attaque
  intervalRefs: { [key: string]: any } = {}; // Stocker les références des intervals
  pseudo!: string;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService
  ) {
    this.player$ = this.socketService.player$;
    this.attackList$ = this.socketService.attackList$;
    this.alliance$ = this.socketService.alliance$; // ✅ Observer l'alliance créée
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.allianceId = params['id'];

      // Vérifier si l'alliance existe toujours
      const exists = this.socketService
        .checkAllianceExists(this.allianceId)
        .then((data) => {
          if (!data.exists) {
            console.warn(`⚠️ Alliance ${this.allianceId} supprimée !`);
            localStorage.removeItem('allianceId');
            this.router.navigate(['/']); // Redirection vers la page d'accueil
            return;
          }
          this.alliance$.next(data.alliance);
        });

      // 2. Reprendre la session utilisateur : récupération de playerId et pseudo depuis le stockage
      this.playerId = localStorage.getItem('playerId') || '';
      this.pseudo = localStorage.getItem('player') || '';

      // Si le playerId n'existe pas, on le demande au serveur via le pseudo
      if (!this.playerId && this.pseudo) {
        this.socketService
          .getPlayerByPseudo(this.pseudo, this.allianceId)
          .then((value) => {
            this.playerId = value!;
            if (this.playerId) {
              localStorage.setItem('playerId', this.playerId);
            }
          });
      }

      // Si le playerId est toujours introuvable, on redirige vers l'accueil
      if (!this.playerId) {
        console.warn(
          `⚠️ Joueur "${this.pseudo}" introuvable, retour à l'accueil.`
        );
        localStorage.removeItem('playerId');
        localStorage.removeItem('player');
        this.router.navigate(['/']);
        return;
      }

      this.socketService.joinAlliance(this.allianceId, this.pseudo)
      .then((response) => {
        // Si c'est la première connexion, le serveur renverra le player créé,
        // vous pouvez alors stocker le nouveau playerId pour les prochains refresh.
        if (!this.playerId && response.player && response.player.id) {
          this.playerId = response.player.id;
          localStorage.setItem('playerId', this.playerId);
        }
        // Suite de la logique d'initialisation...
      })
      .catch((error) => {
        console.error("Erreur lors de la reconnexion :", error);
        // En cas d'erreur, redirigez vers l'accueil par exemple.
      });

    });

    this.attackList$.subscribe((attacks) => {
      attacks.forEach((attack) => {
        if (attack.status === 'ongoing' && !this.timers[attack.id]) {
          this.startTimer(attack);
        }
      });
    });

    // Détection de la fermeture de l'onglet
    window.addEventListener('beforeunload', this.handleLeaveGame);
  }

  startAttack(attackId: string) {
    this.socketService.startAttack(attackId, this.allianceId);
  }

  endAttack(attackId: string) {
    this.socketService.endAttack(attackId, this.allianceId);
    clearInterval(this.intervalRefs[attackId]); // Stop le timer
    delete this.timers[attackId]; // Supprime l'affichage du chronomètre
  }

  private startTimer(attack: any) {
    if (attack.startTime) {
      const startTime = new Date(attack.startTime).getTime();
      this.timers[attack.id] = Math.floor((Date.now() - startTime) / 1000);

      this.intervalRefs[attack.id] = setInterval(() => {
        this.timers[attack.id]++;
      }, 1000);
    }
  }

  createAttack() {
    this.socketService.createAttack(
      this.attackName,
      this.attackLocation,
      this.allianceId,
      localStorage.getItem('playerId')!
    );
  }

  deleteAttack(attackId: string) {
    this.socketService.deleteAttack(attackId, this.allianceId);
  }

  joinAttack(attackId: string) {
    console.log(localStorage.getItem('playerId'))
    this.socketService.joinAttack(attackId, this.allianceId, localStorage.getItem('playerId')!);
  }

  leaveAttack() {
    this.socketService.leaveAttack(this.allianceId, localStorage.getItem('playerId')!);
  }

  ngOnDestroy() {
    this.handleLeaveGame(); // S'assurer que le joueur quitte proprement en changeant de page
    window.removeEventListener('beforeunload', this.handleLeaveGame);
  }

  private handleLeaveGame = () => {
    if (this.playerId && this.allianceId) {
      this.socketService.leaveGame(localStorage.getItem('playerId')!, this.allianceId);
    }
  };
}
