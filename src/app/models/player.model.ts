export interface Player {
    id: string;
    pseudo: string;
    attackId?: string; // Peut être null si le joueur n'est pas dans une attaque
  }