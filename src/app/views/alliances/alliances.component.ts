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
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.allianceId = params['id'];

      // Vérifier si l'alliance existe toujours
      const exists = this.socketService
        .checkAllianceExists(this.allianceId)
        .then((value) => {
          if (!value) {
            console.warn(`⚠️ Alliance ${this.allianceId} supprimée !`);
            localStorage.removeItem('allianceId');
            this.router.navigate(['/']); // Redirection vers la page d'accueil
            return;
          }
        });

         // Récupération du pseudo depuis le storage
      this.pseudo = localStorage.getItem('player') || '';
      if (this.pseudo) {
        // Demander au serveur l'ID du joueur via son pseudo
        this.socketService.getPlayerByPseudo(this.pseudo, this.allianceId).then((value)=>{
          this.playerId = value!;
        });
      }

    //   // Si le joueur n'est pas trouvé, retour à l'accueil
    //   if (!this.playerId) {
    //     console.warn(`⚠️ Joueur "${this.pseudo}" introuvable, retour à l'accueil.`);
    //     localStorage.removeItem("player");
    //     this.router.navigate(['/']);
    //     return;
    //   }

     });

    this.attackList$.subscribe((attacks) => {
      console.log(attacks)
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
      this.allianceId
    );
  }

  deleteAttack(attackId: string) {
    this.socketService.deleteAttack(attackId, this.allianceId);
  }

  joinAttack(attackId: string) {
    this.socketService.joinAttack(attackId, this.allianceId);
  }

  leaveAttack() {
    this.socketService.leaveAttack(this.allianceId);
  }

  ngOnDestroy() {
    this.handleLeaveGame(); // S'assurer que le joueur quitte proprement en changeant de page
    window.removeEventListener('beforeunload', this.handleLeaveGame);
  }

  private handleLeaveGame = () => {
    if (this.playerId && this.allianceId) {
      this.socketService.leaveGame(this.playerId, this.allianceId);
    }
  };
}
