import { Injectable } from '@angular/core';

import {
  Prenotazione,
  StatoPrenotazione
} from '../models/prenotazione.model';

import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {
  private readonly chiaveStorage = 'agendaBarberShop';

  constructor(
    private storageService: StorageService
  ) {}

  caricaPrenotazioni(): Prenotazione[] {
    const prenotazioni =
      this.storageService.carica<Prenotazione[]>(
        this.chiaveStorage,
        []
      );

    const prenotazioniCorrette =
      prenotazioni.map(
        (prenotazione, indice) => ({
          ...prenotazione,

          id:
            prenotazione.id ??
            Date.now() + indice,

          stato:
            prenotazione.stato ??
            'prenotato',

          dataCreazione:
            prenotazione.dataCreazione ??
            new Date().toISOString()
        })
      );

    this.salvaPrenotazioni(prenotazioniCorrette);

    return prenotazioniCorrette;
  }

  salvaPrenotazioni(
    prenotazioni: Prenotazione[]
  ): void {
    this.storageService.salva(
      this.chiaveStorage,
      prenotazioni
    );
  }

  aggiungiPrenotazione(
    prenotazioni: Prenotazione[],
    nuovaPrenotazione: Prenotazione
  ): Prenotazione[] {
    const listaAggiornata = [
      ...prenotazioni,
      nuovaPrenotazione
    ];

    this.salvaPrenotazioni(listaAggiornata);

    return listaAggiornata;
  }

  eliminaPrenotazione(
    prenotazioni: Prenotazione[],
    idPrenotazione: number
  ): Prenotazione[] {
    const listaAggiornata =
      prenotazioni.filter(
        prenotazione =>
          prenotazione.id !== idPrenotazione
      );

    this.salvaPrenotazioni(listaAggiornata);

    return listaAggiornata;
  }

  cambiaStato(
    prenotazioni: Prenotazione[],
    idPrenotazione: number,
    nuovoStato: StatoPrenotazione
  ): Prenotazione[] {
    const listaAggiornata =
      prenotazioni.map(prenotazione => {
        if (prenotazione.id !== idPrenotazione) {
          return prenotazione;
        }

        return {
          ...prenotazione,
          stato: nuovoStato
        };
      });

    this.salvaPrenotazioni(listaAggiornata);

    return listaAggiornata;
  }

  prenotazioniCliente(
    prenotazioni: Prenotazione[],
    emailCliente: string
  ): Prenotazione[] {
    const emailNormalizzata =
      emailCliente.trim().toLowerCase();

    return prenotazioni
      .filter(
        prenotazione =>
          prenotazione.email
            .trim()
            .toLowerCase() === emailNormalizzata
      )
      .sort(
        (a, b) =>
          `${a.giorno} ${a.ora}`.localeCompare(
            `${b.giorno} ${b.ora}`
          )
      );
  }

  prenotazioniGiorno(
    prenotazioni: Prenotazione[],
    giorno: string
  ): Prenotazione[] {
    return prenotazioni
      .filter(
        prenotazione =>
          prenotazione.giorno === giorno
      )
      .sort(
        (a, b) =>
          a.ora.localeCompare(b.ora)
      );
  }

  contaPrenotazioniAttive(
    prenotazioni: Prenotazione[],
    giorno: string,
    orario: string
  ): number {
    return prenotazioni.filter(
      prenotazione =>
        prenotazione.giorno === giorno &&
        prenotazione.ora === orario &&
        prenotazione.stato !== 'annullato'
    ).length;
  }
}
