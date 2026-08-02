import {
  Component,
  EventEmitter,
  Output,
  Input
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  CALENDARIO_CONFIG,
  FasciaOraria
} from '../../config/calendario.config';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css',
})
export class Calendario {

  @Output()
  dataSelezionata = new EventEmitter<string>();

  @Input()
  prenotazioni: any[] = [];

  meseCorrente = new Date();

  orariDisponibili: string[] = [];

  readonly configurazioneCalendario =
    CALENDARIO_CONFIG;

  giorniSettimana = [
    'L',
    'M',
    'M',
    'G',
    'V',
    'S',
    'D'
  ];

  giorniMese: any[] = [];

  giornoSelezionato: number | null = null;

  orarioSelezionato: string | null = null;

  constructor() {
    this.creaCalendario();
  }

  ngOnInit(): void {
    this.generaOrariDisponibili();
  }

  /**
   * Nome del mese visualizzato.
   * Esempio: luglio 2026
   */
  get nomeMeseCorrente(): string {
    return this.meseCorrente.toLocaleDateString(
      'it-IT',
      {
        month: 'long',
        year: 'numeric'
      }
    );
  }

  /**
   * Impedisce di andare a un mese precedente
   * rispetto al mese attuale.
   */
  get mesePrecedenteDisabilitato(): boolean {

    const oggi = new Date();

    const primoGiornoMeseAttuale =
      new Date(
        oggi.getFullYear(),
        oggi.getMonth(),
        1
      );

    const primoGiornoMeseVisualizzato =
      new Date(
        this.meseCorrente.getFullYear(),
        this.meseCorrente.getMonth(),
        1
      );

    return (
      primoGiornoMeseVisualizzato <=
      primoGiornoMeseAttuale
    );
  }

  /**
   * Passa al mese precedente.
   */
  vaiAlMesePrecedente(): void {

    if (this.mesePrecedenteDisabilitato) {
      return;
    }

    this.meseCorrente = new Date(
      this.meseCorrente.getFullYear(),
      this.meseCorrente.getMonth() - 1,
      1
    );

    this.azzeraSelezione();
    this.creaCalendario();
  }

  /**
   * Passa al mese successivo.
   */
  vaiAlMeseSuccessivo(): void {

    this.meseCorrente = new Date(
      this.meseCorrente.getFullYear(),
      this.meseCorrente.getMonth() + 1,
      1
    );

    this.azzeraSelezione();
    this.creaCalendario();
  }

  /**
   * Azzera giorno e orario quando
   * l'utente cambia mese.
   */
  private azzeraSelezione(): void {
    this.giornoSelezionato = null;
    this.orarioSelezionato = null;
  }

  creaCalendario(): void {

    this.giorniMese = [];

    const anno =
      this.meseCorrente.getFullYear();

    const mese =
      this.meseCorrente.getMonth();

    // Primo giorno del mese
    let primoGiorno =
      new Date(
        anno,
        mese,
        1
      ).getDay();

    // Trasformiamo domenica da 0 a 7
    if (primoGiorno === 0) {
      primoGiorno = 7;
    }

    // Celle vuote prima del primo giorno
    for (
      let i = 1;
      i < primoGiorno;
      i++
    ) {
      this.giorniMese.push({
        numero: '',
        disponibile: false
      });
    }

    // Numero totale dei giorni del mese
    const totaleGiorni =
      new Date(
        anno,
        mese + 1,
        0
      ).getDate();

    for (
      let giorno = 1;
      giorno <= totaleGiorni;
      giorno++
    ) {

      const data =
        new Date(
          anno,
          mese,
          giorno
        );

      const oggi =
        new Date();

      // Azzeriamo gli orari per confrontare
      // soltanto le date.
      oggi.setHours(0, 0, 0, 0);
      data.setHours(0, 0, 0, 0);

      const settimana =
        data.getDay();

      const chiuso =
        CALENDARIO_CONFIG
          .giorniChiusura
          .includes(settimana);

      const passato =
        data < oggi;

      this.giorniMese.push({
        numero: giorno,
        disponibile:
          !chiuso &&
          !passato,
        chiuso,
        passato
      });
    }
  }

  selezionaGiorno(giorno: any): void {

    if (
      giorno.numero === '' ||
      giorno.chiuso ||
      giorno.passato ||
      !giorno.disponibile
    ) {
      return;
    }

    this.giornoSelezionato =
      giorno.numero;

    // Cambiando giorno azzeriamo
    // l'orario selezionato precedentemente.
    this.orarioSelezionato = null;

    const anno =
      this.meseCorrente.getFullYear();

    const mese =
      String(
        this.meseCorrente.getMonth() + 1
      ).padStart(2, '0');

    const numero =
      String(
        giorno.numero
      ).padStart(2, '0');

    const data =
      `${anno}-${mese}-${numero}`;

    this.dataSelezionata.emit(data);
  }

  selezionaOrario(orario: string): void {
    this.orarioSelezionato = orario;
  }

  generaOrariDisponibili(): void {

    const orariGenerati: string[] = [];

    for (
      const fascia of
      CALENDARIO_CONFIG.fasceOrarie
    ) {
      const orariFascia =
        this.generaSlotFascia(fascia);

      orariGenerati.push(
        ...orariFascia
      );
    }

    this.orariDisponibili =
      orariGenerati;
  }

  private generaSlotFascia(
    fascia: FasciaOraria
  ): string[] {

    const slot: string[] = [];

    let minutiCorrenti =
      this.convertiOrarioInMinuti(
        fascia.apertura
      );

    const minutiChiusura =
      this.convertiOrarioInMinuti(
        fascia.chiusura
      );

    while (
      minutiCorrenti <
      minutiChiusura
    ) {
      slot.push(
        this.convertiMinutiInOrario(
          minutiCorrenti
        )
      );

      minutiCorrenti +=
        CALENDARIO_CONFIG
          .durataSlotMinuti;
    }

    return slot;
  }

  private convertiOrarioInMinuti(
    orario: string
  ): number {

    const [ore, minuti] =
      orario
        .split(':')
        .map(Number);

    return ore * 60 + minuti;
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

    return `${ore
      .toString()
      .padStart(2, '0')}:${minuti
      .toString()
      .padStart(2, '0')}`;
  }
}
