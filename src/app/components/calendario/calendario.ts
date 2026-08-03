import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  CALENDARIO_CONFIG,
  FasciaOraria
} from '../../config/calendario.config';

interface GiornoCalendario {
  numero: number | null;
  disponibile: boolean;
  chiuso: boolean;
  passato: boolean;
  oggi: boolean;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario implements OnInit {

  @Output()
  dataSelezionata = new EventEmitter<string>();

  /*
   * Rimane disponibile per le prossime funzioni:
   * giorni pieni, disponibilità e collaboratori.
   */
  @Input()
  prenotazioni: any[] = [];

  meseCorrente = new Date();

  orariDisponibili: string[] = [];

  readonly configurazioneCalendario =
    CALENDARIO_CONFIG;

  readonly giorniSettimana = [
    'L',
    'M',
    'M',
    'G',
    'V',
    'S',
    'D'
  ];

  giorniMese: GiornoCalendario[] = [];

  giornoSelezionato: number | null = null;

  orarioSelezionato: string | null = null;

  constructor() {
    this.meseCorrente = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    this.creaCalendario();
  }

  ngOnInit(): void {
    this.generaOrariDisponibili();
  }

  get nomeMeseCorrente(): string {
    return this.meseCorrente.toLocaleDateString(
      'it-IT',
      {
        month: 'long',
        year: 'numeric'
      }
    );
  }

  get mesePrecedenteDisabilitato(): boolean {
    const oggi = new Date();

    const meseAttuale = new Date(
      oggi.getFullYear(),
      oggi.getMonth(),
      1
    );

    const meseVisualizzato = new Date(
      this.meseCorrente.getFullYear(),
      this.meseCorrente.getMonth(),
      1
    );

    return meseVisualizzato <= meseAttuale;
  }

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

  vaiAlMeseSuccessivo(): void {
    this.meseCorrente = new Date(
      this.meseCorrente.getFullYear(),
      this.meseCorrente.getMonth() + 1,
      1
    );

    this.azzeraSelezione();
    this.creaCalendario();
  }

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

    const oggi = new Date();

    oggi.setHours(0, 0, 0, 0);

    let primoGiorno =
      new Date(
        anno,
        mese,
        1
      ).getDay();

    /*
     * JavaScript:
     * domenica = 0
     *
     * Calendario:
     * lunedì = prima colonna
     */
    if (primoGiorno === 0) {
      primoGiorno = 7;
    }

    for (
      let indice = 1;
      indice < primoGiorno;
      indice++
    ) {
      this.giorniMese.push({
        numero: null,
        disponibile: false,
        chiuso: false,
        passato: false,
        oggi: false
      });
    }

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
      const data = new Date(
        anno,
        mese,
        giorno
      );

      data.setHours(0, 0, 0, 0);

      const giornoSettimana =
        data.getDay();

      const chiuso =
        CALENDARIO_CONFIG
          .giorniChiusura
          .includes(giornoSettimana);

      const passato =
        data < oggi;

      const giornoOggi =
        data.getTime() === oggi.getTime();

      this.giorniMese.push({
        numero: giorno,
        disponibile:
          !chiuso &&
          !passato,
        chiuso,
        passato,
        oggi: giornoOggi
      });
    }
  }

  selezionaGiorno(
    giorno: GiornoCalendario
  ): void {
    if (
      giorno.numero === null ||
      giorno.chiuso ||
      giorno.passato ||
      !giorno.disponibile
    ) {
      return;
    }

    this.giornoSelezionato =
      giorno.numero;

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
      orariGenerati.push(
        ...this.generaSlotFascia(fascia)
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
