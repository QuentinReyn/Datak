import { Player } from "./player.model";

export interface Attack {
    id: string;
    name: string;
    location: string;
    creationDate: Date;
    duration: number;
    status: string;
    allianceId: string;
    players:Player[];
    ownerId:string;
  }