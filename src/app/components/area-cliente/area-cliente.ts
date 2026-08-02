import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Calendario } from '../calendario/calendario';

import { Servizio } from '../../models/servizio.model';
import { Utente } from '../../models/utente.model';
import { Prenotazione } from '../../models/prenotazione.model';
import {
  PrenotazioniService
} from '../../services/prenotazioni';

@Component({
  selector: 'app-area-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Calendario
  ],
  templateUrl: './area-cliente.html',
  styleUrl: './area-cliente.css'
})

export class AreaCliente implements AfterViewInit {



  // =========================================================
  // DATI RICEVUTI DA APP.COMPONENT
  // =========================================================

  @Input()
  utenteLoggato: Utente | null = null;

  @Input()
  nomeCliente = '';

  @Input()
  listaPrenotazioni: Prenotazione[] = [];

  @Input()
  listaServizi: Servizio[] = [];

  @Input()
  orariDisponibili: string[] = [];

  @Input()
  dataMinima = '';

  // =========================================================
  // EVENTI INVIATI AD APP.COMPONENT
  // =========================================================

  @Output()
  logout = new EventEmitter<void>();

  @Output()
  vaiPrenotazioni = new EventEmitter<void>();

  @Output()
  listaPrenotazioniChange =
    new EventEmitter<Prenotazione[]>();

  // =========================================================
  // STATO DELLA PRENOTAZIONE
  // =========================================================

  giornoScelto = '';
  oraScelta = '';

  servizioSelezionato: Servizio | null = null;

  mostraFormPrenotazione = false;
  constructor(
    private prenotazioniService:
      PrenotazioniService
  ) { }
  // =========================================================
  // AVVIO COMPONENTE
  // =========================================================

  ngAfterViewInit(): void {
    this.attivaRadarScroll();
  }

  // =========================================================
  // NAVIGAZIONE
  // =========================================================

  effettuaLogout(): void {
    this.logout.emit();
  }

  apriLeMiePrenotazioni(): void {
    this.vaiPrenotazioni.emit();
  }

  // =========================================================
  // APERTURA E CHIUSURA PRENOTAZIONE
  // =========================================================

  apriFormPrenotazione(
    servizio: Servizio
  ): void {
    this.servizioSelezionato = servizio;

    this.giornoScelto = '';
    this.oraScelta = '';

    this.mostraFormPrenotazione = true;
  }

  chiudiFormPrenotazione(): void {
    this.mostraFormPrenotazione = false;

    this.giornoScelto = '';
    this.oraScelta = '';

    this.servizioSelezionato = null;
  }

  riceviData(data: string): void {
    this.giornoScelto = data;

    /*
     * Quando l'utente cambia giorno,
     * viene annullata l'eventuale selezione precedente.
     */
    this.oraScelta = '';
  }

  // =========================================================
  // CREAZIONE PRENOTAZIONE
  // =========================================================

  aggiungiPrenotazione(): void {
    if (!this.utenteLoggato) {
      alert(
        '⚠️ Devi effettuare il login.'
      );

      return;
    }

    if (
      !this.giornoScelto ||
      !this.oraScelta ||
      !this.servizioSelezionato
    ) {
      alert(
        '⚠️ Seleziona giorno, orario e servizio.'
      );

      return;
    }

    if (
      this.dataMinima &&
      this.giornoScelto < this.dataMinima
    ) {
      alert(
        '⚠️ Non puoi prenotare una data passata.'
      );

      return;
    }

    if (
      this.isGiornoChiusura(
        this.giornoScelto
      )
    ) {
      alert(
        '⚠️ Il salone è chiuso il lunedì e la domenica.'
      );

      return;
    }

    if (
      !this.orariDisponibili.includes(
        this.oraScelta
      )
    ) {
      alert(
        '⚠️ L’orario selezionato non è valido.'
      );

      this.oraScelta = '';
      return;
    }

    if (
      this.isOrarioPassato(
        this.oraScelta,
        this.giornoScelto
      )
    ) {
      alert(
        '⚠️ Non puoi prenotare un orario già trascorso.'
      );

      this.oraScelta = '';
      return;
    }

    if (
      !this.servizioRientraNegliOrari(
        this.oraScelta,
        this.servizioSelezionato.durata
      )
    ) {
      alert(
        '⚠️ Il servizio non può essere completato prima della pausa o della chiusura.'
      );

      this.oraScelta = '';
      return;
    }

    if (
      this.isOrarioOccupato(
        this.oraScelta,
        this.giornoScelto
      )
    ) {
      alert(
        '⚠️ Uno o più slot necessari per questo servizio sono già al completo.'
      );

      this.oraScelta = '';
      return;
    }

    const nuovaPrenotazione: Prenotazione = {
      id: this.generaId(),

      nome:
        this.nomeCliente.trim() ||
        this.utenteLoggato.nome,

      email:
        this.utenteLoggato.email
          .trim()
          .toLowerCase(),

      giorno: this.giornoScelto,

      ora: this.oraScelta,

      servizioCompleto:
        this.servizioSelezionato,

      stato: 'prenotato',

      dataCreazione:
        new Date().toISOString()
    };

    this.listaPrenotazioni = [
      ...this.listaPrenotazioni,
      nuovaPrenotazione
    ];

    this.listaPrenotazioniChange.emit(
      [...this.listaPrenotazioni]
    );

    alert(
      `🎉 Prenotazione confermata, ${nuovaPrenotazione.nome}!`
    );

    this.chiudiFormPrenotazione();
  }


private servizioRientraNegliOrari(
  orarioInizio: string,
  durataServizio: number
): boolean {
  return this.prenotazioniService
    .servizioRientraNegliOrari(
      orarioInizio,
      durataServizio
    );
}


  /**
   * Restituisce il numero massimo di clienti presenti
   * negli slot richiesti dal servizio selezionato.
   *
   * 0 = disponibile
   * 1 = un posto rimasto
   * 2 = completo
   */
  numeroPostiOccupati(
    orario: string,
    giorno: string = this.giornoScelto
  ): number {
    if (
      !giorno ||
      !orario ||
      !this.servizioSelezionato
    ) {
      return 0;
    }

    return this.prenotazioniService
      .numeroPostiOccupati(
        this.listaPrenotazioni,
        giorno,
        orario,
        this.servizioSelezionato.durata
      );
  }

  /**
   * Restituisce true quando uno degli slot
   * necessari è completo oppure il servizio
   * non rientra nella fascia di apertura.
   */
  isOrarioOccupato(
    orario: string,
    giorno: string = this.giornoScelto
  ): boolean {
    if (
      !giorno ||
      !orario ||
      !this.servizioSelezionato
    ) {
      return false;
    }

    return this.prenotazioniService
      .isOrarioOccupato(
        this.listaPrenotazioni,
        giorno,
        orario,
        this.servizioSelezionato.durata
      );
  }

  /**
   * Restituisce true quando negli slot necessari
   * rimane soltanto un posto disponibile.
   */
  isOrarioQuasiCompleto(
    orario: string,
    giorno: string = this.giornoScelto
  ): boolean {
    if (
      !giorno ||
      !orario ||
      !this.servizioSelezionato
    ) {
      return false;
    }

    return this.prenotazioniService
      .isOrarioQuasiCompleto(
        this.listaPrenotazioni,
        giorno,
        orario,
        this.servizioSelezionato.durata
      );
  }

  /**
   * Controlla se l'orario è già trascorso.
   *
   * Il controllo viene applicato soltanto quando
   * il giorno selezionato corrisponde a oggi.
   */
isOrarioPassato(
  orario: string,
  giorno: string = this.giornoScelto
): boolean {
  return this.prenotazioniService
    .isOrarioPassato(
      giorno,
      orario
    );
}

  /**
   * Testo mostrato sotto al pulsante dell'orario.
   */
  testoStatoOrario(
    orario: string
  ): string {
    if (
      this.isOrarioPassato(
        orario,
        this.giornoScelto
      )
    ) {
      return 'Trascorso';
    }

    if (
      this.servizioSelezionato &&
      !this.servizioRientraNegliOrari(
        orario,
        this.servizioSelezionato.durata
      )
    ) {
      return 'Non disponibile';
    }

    if (
      this.isOrarioOccupato(
        orario,
        this.giornoScelto
      )
    ) {
      return 'Occupato';
    }

    if (
      this.isOrarioQuasiCompleto(
        orario,
        this.giornoScelto
      )
    ) {
      return '1 posto rimasto';
    }

    return '';
  }

  /**
   * Decide se il pulsante dell'orario
   * deve essere disabilitato.
   */
  isOrarioDisabilitato(
    orario: string
  ): boolean {
    if (
      !this.giornoScelto ||
      !this.servizioSelezionato
    ) {
      return true;
    }

    return (
      this.isOrarioPassato(
        orario,
        this.giornoScelto
      ) ||
      this.isOrarioOccupato(
        orario,
        this.giornoScelto
      )
    );
  }

  /**
   * Seleziona l'orario soltanto se disponibile.
   */
  selezionaOrario(
    orario: string
  ): void {
    if (
      this.isOrarioDisabilitato(
        orario
      )
    ) {
      return;
    }

    this.oraScelta = orario;
  }

  // =========================================================
  // SUPPORTO DATE
  // =========================================================

 private isGiornoChiusura(
  data: string
): boolean {
  return this.prenotazioniService
    .isGiornoChiusura(data);
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

  private generaId(): number {
    return (
      Date.now() +
      Math.floor(
        Math.random() * 1000
      )
    );
  }

  // =========================================================
  // ANIMAZIONE CARD SERVIZI
  // =========================================================

  private attivaRadarScroll(): void {
    setTimeout(() => {
      const griglia =
        document.querySelector(
          '.griglia-servizi'
        );

      if (!griglia) {
        return;
      }

      const observer =
        new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (
                !entry.isIntersecting
              ) {
                return;
              }

              const cards =
                document.querySelectorAll(
                  '.card-servizio'
                );

              cards.forEach(card => {
                card.classList.add(
                  'attivati-dall-alto'
                );
              });

              observer.unobserve(
                entry.target
              );
            });
          },
          {
            threshold: 0.1
          }
        );

      observer.observe(griglia);
    }, 150);
  }
}
