import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Calendario } from '../calendario/calendario';

import { Servizio } from '../../models/servizio.model';

import {
  Prenotazione,
  StatoPrenotazione
} from '../../models/prenotazione.model';
import { PrenotazioniService } from '../../services/prenotazioni';

@Component({
  selector: 'app-dashboard-titolare',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Calendario
  ],
  templateUrl: './area-titolare.html',
  styleUrl: './area-titolare.css'
})
export class DashboardTitolare {

  // =========================================================
  // DATI RICEVUTI DA APP.COMPONENT
  // =========================================================

  @Input() listaPrenotazioni: Prenotazione[] = [];

  @Input() listaServizi: Servizio[] = [];

  @Input() orariDisponibili: string[] = [];

  @Input() dataMinima = '';

  constructor(
  private prenotazioniService: PrenotazioniService
) {}

  // =========================================================
  // EVENTI INVIATI AD APP.COMPONENT
  // =========================================================

  @Output() logout = new EventEmitter<void>();

  @Output()
  listaPrenotazioniChange =
    new EventEmitter<Prenotazione[]>();

  // =========================================================
  // STATO DELLA DASHBOARD
  // =========================================================

  dataPlancia: Date = new Date();

  mostraNuovoAppuntamento = false;

  nuovoClienteNome = '';
  nuovoClienteEmail = '';

  nuovoGiorno = '';
  nuovaOra = '';

  nuovoServizio: Servizio | null = null;

  // =========================================================
  // NUOVO APPUNTAMENTO
  // =========================================================

  aggiungiAppuntamentoTitolare(): void {
    const nome =
      this.nuovoClienteNome.trim();

    const email =
      this.nuovoClienteEmail
        .trim()
        .toLowerCase();

    if (
      !nome ||
      !this.nuovoGiorno ||
      !this.nuovaOra ||
      !this.nuovoServizio
    ) {
      alert(
        '⚠️ Compila tutti i campi obbligatori.'
      );

      return;
    }

    if (
      this.dataMinima &&
      this.nuovoGiorno < this.dataMinima
    ) {
      alert(
        '⚠️ Non puoi inserire un appuntamento in una data passata.'
      );

      return;
    }

    if (
      this.isGiornoChiusura(
        this.nuovoGiorno
      )
    ) {
      alert(
        '⚠️ Il salone è chiuso il lunedì e la domenica.'
      );

      return;
    }

    if (
      !this.orariDisponibili.includes(
        this.nuovaOra
      )
    ) {
      alert(
        '⚠️ Seleziona un orario valido.'
      );

      return;
    }
    if (
  this.isOrarioPassato(
    this.nuovaOra,
    this.nuovoGiorno
  )
) {
  alert(
    '⚠️ Non puoi inserire un appuntamento in un orario già trascorso.'
  );

  this.nuovaOra = '';
  return;
}

    if (
      this.isOrarioOccupato(
        this.nuovaOra,
        this.nuovoGiorno
      )
    ) {
      alert(
        '⚠️ Questo orario ha già raggiunto il limite di 2 clienti.'
      );

      return;

    }


    const nuovaPrenotazione: Prenotazione = {
      id: this.generaId(),

      nome,

      email,

      giorno: this.nuovoGiorno,

      ora: this.nuovaOra,

      servizioCompleto:
        this.nuovoServizio,

      stato: 'confermato',

      dataCreazione:
        new Date().toISOString()
    };

    this.listaPrenotazioni = [
      ...this.listaPrenotazioni,
      nuovaPrenotazione
    ];

    this.comunicaModifiche();

    alert(
      'Appuntamento aggiunto correttamente 💈'
    );

    this.pulisciForm();
  }

  chiudiNuovoAppuntamento(): void {
    this.pulisciForm();
  }

  private pulisciForm(): void {
    this.nuovoClienteNome = '';
    this.nuovoClienteEmail = '';

    this.nuovoGiorno = '';
    this.nuovaOra = '';

    this.nuovoServizio = null;

    this.mostraNuovoAppuntamento = false;
  }

  // =========================================================
  // GESTIONE PRENOTAZIONI
  // =========================================================

  cambiaStatoPrenotazione(
    prenotazione: Prenotazione,
    nuovoStato: StatoPrenotazione
  ): void {
    this.listaPrenotazioni =
      this.listaPrenotazioni.map(
        elemento =>
          elemento.id === prenotazione.id
            ? {
                ...elemento,
                stato: nuovoStato
              }
            : elemento
      );

    this.comunicaModifiche();
  }

  eliminaPrenotazione(
    prenotazione: Prenotazione
  ): void {
    const conferma = confirm(
      `Vuoi cancellare la prenotazione di ${prenotazione.nome}?`
    );

    if (!conferma) {
      return;
    }

    this.listaPrenotazioni =
      this.listaPrenotazioni.filter(
        elemento =>
          elemento.id !== prenotazione.id
      );

    this.comunicaModifiche();
  }

  prenotazioniDelGiorno(): Prenotazione[] {
    const giorno =
      this.getDataPlancia();

    return this.listaPrenotazioni
      .filter(
        prenotazione =>
          prenotazione.giorno === giorno
      )
      .sort(
        (a, b) =>
          a.ora.localeCompare(b.ora)
      );
  }

isOrarioOccupato(
  orario: string,
  giorno: string
): boolean {

  if (
    !giorno ||
    !orario ||
    !this.nuovoServizio
  ) {
    return false;
  }

  return this.prenotazioniService
    .isOrarioOccupato(
      this.listaPrenotazioni,
      giorno,
      orario,
      this.nuovoServizio.durata
    );
}
isOrarioPassato(
  orario: string,
  giorno: string = this.nuovoGiorno
): boolean {

  return this.prenotazioniService
    .isOrarioPassato(
      giorno,
      orario
    );
}

  // =========================================================
  // NAVIGAZIONE GIORNALIERA
  // =========================================================

  getDataPlancia(): string {
    return this.formattaDataLocale(
      this.dataPlancia
    );
  }

  giornoPrecedente(): void {
    const nuovaData = new Date(
      this.dataPlancia
    );

    nuovaData.setDate(
      nuovaData.getDate() - 1
    );

    this.dataPlancia = nuovaData;
  }

  giornoSuccessivo(): void {
    const nuovaData = new Date(
      this.dataPlancia
    );

    nuovaData.setDate(
      nuovaData.getDate() + 1
    );

    this.dataPlancia = nuovaData;
  }

  vaiOggi(): void {
    this.dataPlancia = new Date();
  }

  // =========================================================
  // STATISTICHE
  // =========================================================

  numeroPrenotazioniGiorno(): number {
    return this.prenotazioniDelGiorno()
      .length;
  }

  numeroPrenotazioniCompletate(): number {
    return this.prenotazioniDelGiorno()
      .filter(
        prenotazione =>
          prenotazione.stato ===
          'completato'
      )
      .length;
  }

  numeroPrenotazioniAnnullate(): number {
    return this.prenotazioniDelGiorno()
      .filter(
        prenotazione =>
          prenotazione.stato ===
          'annullato'
      )
      .length;
  }

  calcolaIncassoGiorno(): number {
    return this.prenotazioniDelGiorno()
      .filter(
        prenotazione =>
          prenotazione.stato !==
          'annullato'
      )
      .reduce(
        (totale, prenotazione) =>
          totale +
          (
            prenotazione
              .servizioCompleto
              ?.prezzo ?? 0
          ),
        0
      );
  }

  // =========================================================
  // EVENTI
  // =========================================================

  effettuaLogout(): void {
    this.logout.emit();
  }

  private comunicaModifiche(): void {
    this.listaPrenotazioniChange.emit(
      [...this.listaPrenotazioni]
    );
  }

  // =========================================================
  // FUNZIONI DI SUPPORTO
  // =========================================================

private isGiornoChiusura(
  data: string
): boolean {
  return this.prenotazioniService
    .isGiornoChiusura(data);
}

  private generaId(): number {
    return (
      Date.now() +
      Math.floor(Math.random() * 1000)
    );
  }

  private formattaDataLocale(
    data: Date
  ): string {
    const anno =
      data.getFullYear();

    const mese = String(
      data.getMonth() + 1
    ).padStart(2, '0');

    const giorno = String(
      data.getDate()
    ).padStart(2, '0');

    return `${anno}-${mese}-${giorno}`;
  }
}
