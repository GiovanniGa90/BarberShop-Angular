import { Servizio } from './servizio.model';

export type StatoPrenotazione =
  | 'prenotato'
  | 'confermato'
  | 'arrivato'
  | 'completato'
  | 'annullato';

export interface Prenotazione {
  id: number;
  nome: string;
  email: string;
  giorno: string;
  ora: string;
  servizioCompleto: Servizio;
  stato: StatoPrenotazione;
  dataCreazione: string;
}
