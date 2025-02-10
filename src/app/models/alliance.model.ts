import { Attack } from "./attack.model";

export interface Alliance {
    id: string;
    name: string;
    attacks: Attack[];
  }