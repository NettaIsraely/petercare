export type HorseColor = 'white' | 'brown' | 'black' | 'baby';

export interface Horse {
  id: string;
  name: string;
  color: HorseColor;
  last_shoeing_date?: string | null;
  is_active: boolean;
}

export interface CreateHorsePayload {
  name: string;
  color: HorseColor;
}

export interface UpdateHorsePayload {
  name?: string;
  color?: HorseColor;
  last_shoeing_date?: string | null;
}
