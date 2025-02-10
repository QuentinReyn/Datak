import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent  implements OnInit {
  constructor(private router: Router, private socketService: SocketService) {}

  async ngOnInit() {
    const serverAlive = await this.socketService.checkServerStatus();

    if (!serverAlive) {
      console.error("❌ Serveur injoignable !");
      localStorage.removeItem("allianceId");
      localStorage.removeItem("player");
      this.router.navigate(['/']); // Redirection vers l'accueil
    }
  }
}