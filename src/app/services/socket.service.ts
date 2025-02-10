import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { Alliance } from '../models/alliance.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket = io('http://localhost:3000');

  public attackList$ = new BehaviorSubject<any[]>([]);
  public player$ = new BehaviorSubject<any>(null);
  public alliance$ = new BehaviorSubject<any | null>(null);
  constructor() {
    this.checkForStoredAlliance();
    this.listenForJoinedAlliance();
    this.listenForAllianceCreated();
    this.listenForUpdates();
  }

  // ✅ Récupérer l'alliance stockée dans le localStorage (si existante)
  private checkForStoredAlliance() {
    const storedAllianceId = localStorage.getItem('allianceId');
    const storedPlayer = localStorage.getItem('player');
    
    if (storedAllianceId && storedPlayer) {
      // Si des données sont présentes, on les charge
      this.joinAlliance(storedAllianceId, storedPlayer);
    }
  }

  createAlliance(name: string, pseudo: string): Promise<string> {
    return new Promise((resolve) => {
      this.socket.emit('createAlliance', { name });

      this.socket.once('allianceCreated', (alliance) => {
        this.alliance$.next(alliance);
        console.log("Alliance créée:", alliance);
        this.joinAlliance(alliance.id, pseudo);
        resolve(alliance.id); // ✅ On retourne l'ID pour la redirection
      });
    });
  }

  private listenForAllianceCreated() {
    this.socket.on('allianceCreated', (alliance) => {
      this.alliance$.next(alliance); // ✅ Mise à jour du BehaviorSubject
      console.log('Alliance créée et reçue:', alliance);
    });
  }

  joinAlliance(allianceId: string, pseudo: string) {
    this.socket.emit('joinAlliance', { allianceId, pseudo });
    
    // Enregistrer l'alliance et le joueur dans localStorage
    localStorage.setItem('allianceId', allianceId);
    localStorage.setItem('player', pseudo);
  }


  getPlayerByPseudo(pseudo: string, allianceId: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.socket.emit("getPlayerByPseudo", { pseudo, allianceId }, (playerId: string | null) => {
        resolve(playerId);
      });
    });
  }

  
  createAttack(name: string, location: string, allianceId: string) {
    this.socket.emit('createAttack', { name, location, allianceId });
  }

  deleteAttack(attackId: string, allianceId: string) {
    this.socket.emit('deleteAttack', { attackId, allianceId });
  }

  joinAttack(attackId: string, allianceId: string) {
    this.socket.emit('joinAttack', { attackId, allianceId });
  }

  leaveAttack(allianceId: string) {
    this.socket.emit('leaveAttack', { allianceId });
  }

  startAttack(attackId: string, allianceId: string) {
    this.socket.emit("startAttack", { attackId, allianceId });
  }
  
  endAttack(attackId: string, allianceId: string) {
    this.socket.emit("endAttack", { attackId, allianceId });
  }

  private listenForUpdates() {
    this.socket.on('attackListUpdated', (attacks) => {
      this.attackList$.next(attacks);
    });
  }

  private listenForJoinedAlliance() {
    this.socket.on('joinedAlliance', (data) => {
      this.attackList$.next(data.attacks);
      this.player$.next(data.player);
      console.log("Rejoint l'alliance:", data);
    });
  }

  checkAllianceExists(allianceId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket.emit("checkAlliance", allianceId, (exists: boolean) => {
        resolve(exists);
      });
    });
  }
  

  leaveGame(playerId: string, allianceId: string) {
    this.socket.emit("leaveGame", { playerId, allianceId });
  }  

  checkServerStatus(): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 3000); // Timeout après 3 sec
  
      this.socket.emit("pingServer", (response: boolean) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }
  
}
