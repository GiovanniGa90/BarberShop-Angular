import { Injectable } from '@angular/core';

import {
  Prenotazione,
  StatoPrenotazione
} from '../models/prenotazione.model';

import {
  CALENDARIO_CONFIG
} from '../config/calendario.config';

import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {

  private readonly chiaveStorage =
    'agendaBarberShop';

  constructor(
    private storageService: StorageService
  ) {}

  // =========================================================
  // CARICAMENTO E SALVATAGGIO
  // =========================================================

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

    this.salvaPrenotazioni(
      prenotazioniCorrette
    );

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

  // =========================================================
  // CREAZIONE, ELIMINAZIONE E STATO
  // =========================================================

  aggiungiPrenotazione(
    prenotazioni: Prenotazione[],
    nuovaPrenotazione: Prenotazione
  ): Prenotazione[] {
    const listaAggiornata = [
      ...prenotazioni,
      nuovaPrenotazione
    ];

    this.salvaPrenotazioni(
      listaAggiornata
    );

    return listaAggiornata;
  }

  eliminaPrenotazione(
    prenotazioni: Prenotazione[],
    idPrenotazione: number
  ): Prenotazione[] {
    const listaAggiornata =
      prenotazioni.filter(
        prenotazione =>
          prenotazione.id !==
          idPrenotazione
      );

    this.salvaPrenotazioni(
      listaAggiornata
    );

    return listaAggiornata;
  }

  cambiaStato(
    prenotazioni: Prenotazione[],
    idPrenotazione: number,
    nuovoStato: StatoPrenotazione
  ): Prenotazione[] {
    const listaAggiornata =
      prenotazioni.map(
        prenotazione => {
          if (
            prenotazione.id !==
            idPrenotazione
          ) {
            return prenotazione;
          }

          return {
            ...prenotazione,
            stato: nuovoStato
          };
        }
      );

    this.salvaPrenotazioni(
      listaAggiornata
    );

    return listaAggiornata;
  }

  // =========================================================
  // RICERCA PRENOTAZIONI
  // =========================================================

  prenotazioniCliente(
    prenotazioni: Prenotazione[],
    emailCliente: string
  ): Prenotazione[] {
    const emailNormalizzata =
      emailCliente
        .trim()
        .toLowerCase();

    return prenotazioni
      .filter(
        prenotazione =>
          prenotazione.email
            .trim()
            .toLowerCase() ===
          emailNormalizzata
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

  // =========================================================
  // MOTORE SLOT
  // =========================================================

  /**
   * Calcola quanti slot sono necessari
   * per la durata di un servizio.
   *
   * 15 minuti = 1 slot
   * 30 minuti = 1 slot
   * 45 minuti = 2 slot
   * 50 minuti = 2 slot
   * 60 minuti = 2 slot
   */
  calcolaNumeroSlot(
    durataServizio: number
  ): number {
    if (
      !durataServizio ||
      durataServizio <= 0
    ) {
      return 1;
    }

    return Math.max(
      1,
      Math.ceil(
        durataServizio /
        CALENDARIO_CONFIG
          .durataSlotMinuti
      )
    );
  }

  /**
   * Genera tutti gli slot occupati
   * da un servizio.
   *
   * Esempio:
   * 10:00 + servizio da 60 minuti
   *
   * Risultato:
   * ['10:00', '10:30']
   */
  generaSlotOccupati(
    orarioInizio: string,
    durataServizio: number
  ): string[] {
    const minutiInizio =
      this.convertiOrarioInMinuti(
        orarioInizio
      );

    if (minutiInizio < 0) {
      return [];
    }

    const numeroSlot =
      this.calcolaNumeroSlot(
        durataServizio
      );

    const slotOccupati: string[] = [];

    for (
      let indice = 0;
      indice < numeroSlot;
      indice++
    ) {
      const minutiSlot =
        minutiInizio +
        indice *
          CALENDARIO_CONFIG
            .durataSlotMinuti;

      slotOccupati.push(
        this.convertiMinutiInOrario(
          minutiSlot
        )
      );
    }

    return slotOccupati;
  }

  /**
   * Verifica che il servizio rientri
   * completamente dentro una fascia
   * di apertura.
   *
   * Impedisce di attraversare la pausa
   * o terminare dopo la chiusura.
   */
  servizioRientraNegliOrari(
    orarioInizio: string,
    durataServizio: number
  ): boolean {
    const minutiInizio =
      this.convertiOrarioInMinuti(
        orarioInizio
      );

    if (minutiInizio < 0) {
      return false;
    }

    const numeroSlot =
      this.calcolaNumeroSlot(
        durataServizio
      );

    const durataAgenda =
      numeroSlot *
      CALENDARIO_CONFIG
        .durataSlotMinuti;

    const minutiFine =
      minutiInizio +
      durataAgenda;

    return CALENDARIO_CONFIG
      .fasceOrarie
      .some(fascia => {
        const inizioFascia =
          this.convertiOrarioInMinuti(
            fascia.apertura
          );

        const fineFascia =
          this.convertiOrarioInMinuti(
            fascia.chiusura
          );

        return (
          minutiInizio >=
            inizioFascia &&
          minutiFine <=
            fineFascia
        );
      });
  }

  /**
   * Controlla se una prenotazione
   * esistente occupa uno specifico slot.
   */
  prenotazioneOccupaSlot(
    prenotazione: Prenotazione,
    slotDaControllare: string
  ): boolean {
    if (
      prenotazione.stato ===
      'annullato'
    ) {
      return false;
    }

    const durataPrenotazione =
      prenotazione
        .servizioCompleto
        ?.durata ?? 30;

    const slotPrenotazione =
      this.generaSlotOccupati(
        prenotazione.ora,
        durataPrenotazione
      );

    return slotPrenotazione.includes(
      slotDaControllare
    );
  }

  /**
   * Conta quante prenotazioni attive
   * occupano uno slot preciso.
   */
  contaPrenotazioniNelloSlot(
    prenotazioni: Prenotazione[],
    giorno: string,
    slot: string
  ): number {
    return prenotazioni.filter(
      prenotazione =>
        prenotazione.giorno ===
          giorno &&
        this.prenotazioneOccupaSlot(
          prenotazione,
          slot
        )
    ).length;
  }

  /**
   * Manteniamo questo metodo perché
   * potrebbe essere già utilizzato altrove.
   *
   * Adesso considera anche gli slot
   * occupati dalla durata del servizio.
   */
  contaPrenotazioniAttive(
    prenotazioni: Prenotazione[],
    giorno: string,
    orario: string
  ): number {
    return this.contaPrenotazioniNelloSlot(
      prenotazioni,
      giorno,
      orario
    );
  }

  /**
   * Restituisce il numero massimo
   * di clienti presenti negli slot
   * richiesti dal servizio.
   *
   * 0 = libero
   * 1 = un posto occupato
   * 2 = completo
   */
  numeroPostiOccupati(
    prenotazioni: Prenotazione[],
    giorno: string,
    orario: string,
    durataServizio: number
  ): number {
    if (
      !giorno ||
      !orario
    ) {
      return 0;
    }

    const slotRichiesti =
      this.generaSlotOccupati(
        orario,
        durataServizio
      );

    if (
      slotRichiesti.length === 0
    ) {
      return 0;
    }

    const occupazioni =
      slotRichiesti.map(
        slot =>
          this.contaPrenotazioniNelloSlot(
            prenotazioni,
            giorno,
            slot
          )
      );

    return Math.max(
      ...occupazioni
    );
  }

  /**
   * Restituisce true quando uno
   * degli slot richiesti è completo
   * oppure il servizio non rientra
   * negli orari di apertura.
   */
  isOrarioOccupato(
    prenotazioni: Prenotazione[],
    giorno: string,
    orario: string,
    durataServizio: number
  ): boolean {
    if (
      !giorno ||
      !orario
    ) {
      return false;
    }

    if (
      !this.servizioRientraNegliOrari(
        orario,
        durataServizio
      )
    ) {
      return true;
    }

    return (
      this.numeroPostiOccupati(
        prenotazioni,
        giorno,
        orario,
        durataServizio
      ) >=
      CALENDARIO_CONFIG
        .maxPrenotazioniPerSlot
    );
  }

  /**
   * Restituisce true quando rimane
   * un solo posto disponibile.
   */
  isOrarioQuasiCompleto(
    prenotazioni: Prenotazione[],
    giorno: string,
    orario: string,
    durataServizio: number
  ): boolean {
    if (
      !giorno ||
      !orario
    ) {
      return false;
    }

    if (
      !this.servizioRientraNegliOrari(
        orario,
        durataServizio
      )
    ) {
      return false;
    }

    return (
      this.numeroPostiOccupati(
        prenotazioni,
        giorno,
        orario,
        durataServizio
      ) ===
      CALENDARIO_CONFIG
        .maxPrenotazioniPerSlot - 1
    );
  }

  // =========================================================
  // CONTROLLO DATE E ORARI
  // =========================================================

  isOrarioPassato(
    giorno: string,
    orario: string
  ): boolean {
    if (
      !giorno ||
      !orario
    ) {
      return false;
    }

    const oggi =
      this.formattaDataLocale(
        new Date()
      );

    if (giorno !== oggi) {
      return false;
    }

    const minutiOrario =
      this.convertiOrarioInMinuti(
        orario
      );

    if (minutiOrario < 0) {
      return false;
    }

    const adesso = new Date();

    const dataOrario =
      new Date(
        adesso.getFullYear(),
        adesso.getMonth(),
        adesso.getDate(),
        Math.floor(
          minutiOrario / 60
        ),
        minutiOrario % 60,
        0,
        0
      );

    return dataOrario <= adesso;
  }

  isGiornoChiusura(
    data: string
  ): boolean {
    const parti =
      data.split('-').map(Number);

    if (
      parti.length !== 3 ||
      parti.some(
        valore =>
          Number.isNaN(valore)
      )
    ) {
      return false;
    }

    const [anno, mese, giorno] =
      parti;

    const dataLocale =
      new Date(
        anno,
        mese - 1,
        giorno
      );

    return CALENDARIO_CONFIG
      .giorniChiusura
      .includes(
        dataLocale.getDay()
      );
  }

  // =========================================================
  // FUNZIONI PRIVATE DI SUPPORTO
  // =========================================================

  private convertiOrarioInMinuti(
    orario: string
  ): number {
    const parti =
      orario.split(':').map(Number);

    if (
      parti.length !== 2 ||
      parti.some(
        valore =>
          Number.isNaN(valore)
      )
    ) {
      return -1;
    }

    const [ore, minuti] =
      parti;

    return (
      ore * 60 +
      minuti
    );
  }

  private convertiMinutiInOrario(
    minutiTotali: number
  ): string {
    const ore =
      Math.floor(
        minutiTotali / 60
      );

    const minuti =
      minutiTotali % 60;

    return (
      `${String(ore).padStart(2, '0')}:` +
      `${String(minuti).padStart(2, '0')}`
    );
  }

  private formattaDataLocale(
    data: Date
  ): string {
    const anno =
      data.getFullYear();

    const mese =
      String(
        data.getMonth() + 1
      ).padStart(2, '0');

    const giorno =
      String(
        data.getDate()
      ).padStart(2, '0');

    return `${anno}-${mese}-${giorno}`;
  }
}
