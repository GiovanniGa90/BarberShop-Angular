export type RuoloUtente = 'cliente' | 'admin';

export interface Utente {
  nome: string;
  email: string;
  password?: string;
  ruolo?: RuoloUtente;
  movimenti?: unknown[];
}
