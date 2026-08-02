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
  // CONFIGURAZIONE PRENOTAZIONI
  // =========================================================

  /**
   * Ogni pulsante della griglia rappresenta uno slot
   * della durata di 30 minuti.
   */
  private readonly durataSlotMinuti = 30;

  /**
   * Ogni slot può contenere al massimo 2 clienti.
   */
  private readonly capienzaMassimaPerSlot = 2;

  /**
   * Fasce orarie effettive del salone.
   *
   * La prima fascia termina alle 13:00.
   * La seconda fascia termina alle 19:00.
   *
   * In questo modo un servizio non può attraversare
   * la pausa o terminare dopo la chiusura.
   */
  private readonly fasceApertura = [
    {
      inizio: '09:00',
      fine: '13:00'
    },
    {
      inizio: '15:30',
      fine: '19:00'
    }
  ];

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

  // =========================================================
  // CONTROLLO DISPONIBILITÀ
  // =========================================================

  /**
   * Calcola il numero di slot da 30 minuti
   * richiesti dalla durata del servizio.
   *
   * 15 minuti -> 1 slot
   * 20 minuti -> 1 slot
   * 30 minuti -> 1 slot
   * 45 minuti -> 2 slot
   * 50 minuti -> 2 slot
   * 60 minuti -> 2 slot
   */
  private calcolaNumeroSlot(
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
        this.durataSlotMinuti
      )
    );
  }

  /**
   * Converte un orario HH:mm nel numero totale
   * di minuti trascorsi dalla mezzanotte.
   *
   * Esempio:
   * 10:30 -> 630
   */
  private convertiOrarioInMinuti(
    orario: string
  ): number {
    const parti =
      orario.split(':').map(Number);

    if (
      parti.length !== 2 ||
      parti.some(
        valore => Number.isNaN(valore)
      )
    ) {
      return -1;
    }

    const [ore, minuti] = parti;

    return (
      ore * 60 +
      minuti
    );
  }

  /**
   * Converte un totale di minuti nel formato HH:mm.
   *
   * Esempio:
   * 630 -> 10:30
   */
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

  /**
   * Genera gli slot occupati da un servizio.
   *
   * Esempio:
   * servizio da 50 minuti alle 10:00
   *
   * Risultato:
   * ['10:00', '10:30']
   */
  private generaSlotOccupati(
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
        this.durataSlotMinuti;

      slotOccupati.push(
        this.convertiMinutiInOrario(
          minutiSlot
        )
      );
    }

    return slotOccupati;
  }

  /**
   * Verifica che il servizio inizi e termini
   * completamente dentro la stessa fascia di apertura.
   *
   * Evita, per esempio:
   *
   * - servizio da 60 minuti alle 12:30;
   * - servizio da 60 minuti alle 18:30;
   * - servizio che attraversa la pausa;
   * - servizio che termina dopo le 19:00.
   */
  private servizioRientraNegliOrari(
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

    /*
     * La durata viene arrotondata allo slot superiore.
     *
     * Un servizio da 50 minuti occupa quindi
     * due slot, cioè 60 minuti di agenda.
     */
    const numeroSlot =
      this.calcolaNumeroSlot(
        durataServizio
      );

    const durataAgenda =
      numeroSlot *
      this.durataSlotMinuti;

    const minutiFine =
      minutiInizio +
      durataAgenda;

    return this.fasceApertura.some(
      fascia => {
        const inizioFascia =
          this.convertiOrarioInMinuti(
            fascia.inizio
          );

        const fineFascia =
          this.convertiOrarioInMinuti(
            fascia.fine
          );

        return (
          minutiInizio >= inizioFascia &&
          minutiFine <= fineFascia
        );
      }
    );
  }

  /**
   * Controlla se una prenotazione già esistente
   * occupa lo slot indicato.
   */
  private prenotazioneOccupaSlot(
    prenotazione: Prenotazione,
    slotDaControllare: string
  ): boolean {
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
   * occupano uno specifico slot.
   */
  private contaPrenotazioniNelloSlot(
    giorno: string,
    slot: string
  ): number {
    return this.listaPrenotazioni.filter(
      prenotazione =>
        prenotazione.giorno === giorno &&
        prenotazione.stato !== 'annullato' &&
        this.prenotazioneOccupaSlot(
          prenotazione,
          slot
        )
    ).length;
  }

  /**
 * Restituisce il numero massimo di clienti presenti
 * negli slot richiesti dal servizio selezionato.
 *
 * Risultati possibili:
 * 0 = completamente disponibile
 * 1 = rimane un solo posto
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

  const slotRichiesti =
    this.generaSlotOccupati(
      orario,
      this.servizioSelezionato.durata
    );

  if (slotRichiesti.length === 0) {
    return 0;
  }

  const occupazioniSlot =
    slotRichiesti.map(
      slot =>
        this.contaPrenotazioniNelloSlot(
          giorno,
          slot
        )
    );

  return Math.max(
    ...occupazioniSlot
  );
}

  /**
   * Restituisce true quando il servizio selezionato
   * non può essere inserito nell'orario richiesto.
   *
   * Vengono controllati tutti gli slot necessari.
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

  if (
    !this.servizioRientraNegliOrari(
      orario,
      this.servizioSelezionato.durata
    )
  ) {
    return true;
  }

  return (
    this.numeroPostiOccupati(
      orario,
      giorno
    ) >=
    this.capienzaMassimaPerSlot
  );
}

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

  if (
    !this.servizioRientraNegliOrari(
      orario,
      this.servizioSelezionato.durata
    )
  ) {
    return false;
  }

  return (
    this.numeroPostiOccupati(
      orario,
      giorno
    ) === 1
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
    if (!giorno || !orario) {
      return false;
    }

    const oggi =
      this.formattaDataLocale(
        new Date()
      );

    if (giorno !== oggi) {
      return false;
    }

    const partiOrario =
      orario.split(':').map(Number);

    if (
      partiOrario.length !== 2 ||
      partiOrario.some(
        valore => Number.isNaN(valore)
      )
    ) {
      return false;
    }

    const [ore, minuti] =
      partiOrario;

    const adesso = new Date();

    const dataOrarioPrenotazione =
      new Date(
        adesso.getFullYear(),
        adesso.getMonth(),
        adesso.getDate(),
        ore,
        minuti,
        0,
        0
      );

    return (
      dataOrarioPrenotazione <= adesso
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
    const parti =
      data.split('-').map(Number);

    if (
      parti.length !== 3 ||
      parti.some(
        valore => Number.isNaN(valore)
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

    const giornoSettimana =
      dataLocale.getDay();

    /*
     * 0 = domenica
     * 1 = lunedì
     */
    return (
      giornoSettimana === 0 ||
      giornoSettimana === 1
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
