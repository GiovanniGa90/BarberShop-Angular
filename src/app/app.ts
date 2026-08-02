import {Component,OnInit} from '@angular/core';

import {CommonModule} from '@angular/common';

import {FormsModule} from '@angular/forms';

import {Login} from './components/login/login';

import {AreaCliente} from './components/area-cliente/area-cliente';

import {DashboardTitolare} from './components/area-titolare/area-titolare';

import {MiePrenotazioni} from './components/mie-prenotazioni/mie-prenotazioni';

import {Servizio} from './models/servizio.model';

import {Utente} from './models/utente.model';

import {Prenotazione} from './models/prenotazione.model';

import {PrenotazioniService} from './services/prenotazioni';

import {CALENDARIO_CONFIG,FasciaOraria} from './config/calendario.config';

interface EventoLogin {
  tipo: 'cliente' | 'titolare';
  utente?: Utente;
}

type PaginaApplicazione =
  | 'login'
  | 'registrazione'
  | 'cliente'
  | 'prenotazioni'
  | 'titolare';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [
    CommonModule,
    FormsModule,
    Login,
    AreaCliente,
    DashboardTitolare,
    MiePrenotazioni
  ]
})
export class AppComponent implements OnInit {

  constructor(
    private prenotazioniService:
      PrenotazioniService
  ) {}

  // =========================================================
  // STATO GENERALE
  // =========================================================

  paginaAttuale: PaginaApplicazione =
    'login';

  registrazioneAttiva = false;

  utenteLoggato: Utente | null = null;

  nomeCliente = '';

  nuovaEmail = '';
  nuovaPassword = '';

  dataMinima = '';

  // =========================================================
  // PRENOTAZIONI
  // =========================================================

  listaPrenotazioni: Prenotazione[] = [];

  miePrenotazioni: Prenotazione[] = [];

  // =========================================================
  // ORARI
  // =========================================================

  /*
   * Questa lista verrà centralizzata nella fase
   * successiva usando CALENDARIO_CONFIG.
   *
   * Per ora la manteniamo per non cambiare
   * il comportamento dell'applicazione.
   */
 orariDisponibili: string[] = [];

  // =========================================================
  // SERVIZI
  // =========================================================

  listaServizi: Servizio[] = [
    {
      id: 1,
      nome: 'TAGLIO',
      prezzo: 13,
      durata: 30,
      descrizione:
        'Taglio classico o moderno eseguito a forbice o macchinetta, personalizzato in base al volto.'
    },
    {
      id: 2,
      nome: 'TAGLIO E SHAMPOO',
      prezzo: 19,
      durata: 45,
      descrizione:
        'Il servizio di taglio completo di lavaggio con shampoo specifico e trattamento cute.'
    },
    {
      id: 3,
      nome: 'TAGLIO E BARBA',
      prezzo: 19,
      durata: 50,
      descrizione:
        'La combo perfetta per un restyling totale di capelli e barba in un unico appuntamento.'
    },
    {
      id: 4,
      nome: 'SHAMPOO E PIEGA',
      prezzo: 9,
      durata: 20,
      descrizione:
        'Lavaggio profondo rigenerante e asciugatura con finitura modellante professionale.'
    },
    {
      id: 5,
      nome: 'BARBA',
      prezzo: 6,
      durata: 15,
      descrizione:
        'Rasatura o rifinitura classica della barba con prodotti protettivi emollienti.'
    },
    {
      id: 6,
      nome: 'MOD. BARBA',
      prezzo: 7,
      durata: 20,
      descrizione:
        'Modellatura e design della barba a forbice o rasoio per definire le linee geometriche.'
    },
    {
      id: 7,
      nome: 'BARBA LUNGA',
      prezzo: 10,
      durata: 30,
      descrizione:
        'Trattamento dedicato alle barbe lunghe: accorciatura, cura dei dettagli e olio idratante.'
    },
    {
      id: 8,
      nome: 'ACCONCIATURA',
      prezzo: 5,
      durata: 15,
      descrizione:
        'Fissaggio e styling con gel, cera o lozioni premium per eventi o serate speciali.'
    },
    {
      id: 9,
      nome: 'SERVIZIO COMPLETO',
      prezzo: 25,
      durata: 60,
      descrizione:
        'Il trattamento VIP definitivo: la cura massima di capelli, shampoo, piega e barba.'
    }
  ];

  // =========================================================
  // UTENTI
  // =========================================================

  listaUtenti: Utente[] = [
    {
      nome: 'Giovanni',
      email: 'giovanni@mail.com',
      password: '123',
      ruolo: 'cliente',
      movimenti: []
    },
    {
      nome: 'Mario',
      email: 'mario@mail.com',
      password: '456',
      ruolo: 'cliente',
      movimenti: []
    }
  ];

  // =========================================================
  // AVVIO
  // =========================================================

ngOnInit(): void {
  this.dataMinima =
    this.formattaDataLocale(
      new Date()
    );

  this.orariDisponibili =
    this.generaOrariDisponibili();

  this.caricaUtenti();
  this.caricaPrenotazioni();
  this.recuperaSessione();
}

  private caricaUtenti(): void {
    const utentiSalvati =
      localStorage.getItem(
        'databaseUtentiBarber'
      );

    if (!utentiSalvati) {
      return;
    }

    try {
      const utentiRecuperati: Utente[] =
        JSON.parse(utentiSalvati);

      this.listaUtenti =
        utentiRecuperati;
    } catch (errore) {
      console.error(
        'Errore nel caricamento degli utenti:',
        errore
      );
    }
  }

  private caricaPrenotazioni(): void {
    this.listaPrenotazioni =
      this.prenotazioniService
        .caricaPrenotazioni();
  }

  private recuperaSessione(): void {
    const sessioneSalvata =
      localStorage.getItem(
        'utenteAttivoBarber'
      );

    if (
      !sessioneSalvata ||
      sessioneSalvata === 'undefined' ||
      sessioneSalvata === 'null'
    ) {
      this.paginaAttuale = 'login';
      return;
    }

    try {
      const utenteRecuperato: Utente =
        JSON.parse(sessioneSalvata);

      this.utenteLoggato =
        utenteRecuperato;

      this.nomeCliente =
        utenteRecuperato.nome;

      if (
        this.isTitolare(
          utenteRecuperato
        )
      ) {
        this.paginaAttuale =
          'titolare';

        return;
      }

      this.paginaAttuale =
        'cliente';

      this.caricaMiePrenotazioni();
    } catch (errore) {
      console.error(
        'Errore nel recupero della sessione:',
        errore
      );

      localStorage.removeItem(
        'utenteAttivoBarber'
      );

      this.utenteLoggato = null;
      this.nomeCliente = '';
      this.paginaAttuale = 'login';
    }
  }

  // =========================================================
  // LOGIN E LOGOUT
  // =========================================================

  gestisciLogin(
    evento: EventoLogin
  ): void {
    if (
      evento.tipo === 'titolare'
    ) {
      const titolare: Utente =
        evento.utente ?? {
          nome: 'Giovanni',
          email:
            'giovanniTitolare@salone.it',
          ruolo: 'admin'
        };

      this.utenteLoggato =
        titolare;

      this.nomeCliente =
        titolare.nome;

      this.paginaAttuale =
        'titolare';

      this.salvaSessione(
        titolare
      );

      return;
    }

    if (
      evento.tipo === 'cliente' &&
      evento.utente
    ) {
      this.utenteLoggato =
        evento.utente;

      this.nomeCliente =
        evento.utente.nome;

      this.paginaAttuale =
        'cliente';

      this.salvaSessione(
        evento.utente
      );

      this.caricaMiePrenotazioni();
    }
  }

  /*
   * Manteniamo questo metodo perché app.html
   * lo utilizza nell'evento del componente Login.
   */
  effettuaLoginDaFiglio(
    evento: EventoLogin
  ): void {
    this.gestisciLogin(
      evento
    );
  }

  effettuaLogout(): void {
    localStorage.removeItem(
      'utenteAttivoBarber'
    );

    this.utenteLoggato = null;
    this.nomeCliente = '';

    this.miePrenotazioni = [];

    this.registrazioneAttiva =
      false;

    this.paginaAttuale =
      'login';
  }

  private salvaSessione(
    utente: Utente
  ): void {
    localStorage.setItem(
      'utenteAttivoBarber',
      JSON.stringify(utente)
    );
  }

  private isTitolare(
    utente: Utente
  ): boolean {
    return (
      utente.email ===
        'giovanniTitolare@salone.it' ||
      utente.ruolo === 'admin'
    );
  }

  // =========================================================
  // REGISTRAZIONE
  // =========================================================

  registraNuovoUtente(): void {
    const nome =
      this.nomeCliente.trim();

    const email =
      this.nuovaEmail
        .trim()
        .toLowerCase();

    const password =
      this.nuovaPassword.trim();

    if (
      !nome ||
      !email ||
      !password
    ) {
      alert(
        '⚠️ Compila nome, email e password.'
      );

      return;
    }

    const emailGiaEsistente =
      this.listaUtenti.some(
        utente =>
          utente.email
            .trim()
            .toLowerCase() ===
          email
      );

    if (emailGiaEsistente) {
      alert(
        '⚠️ Questa email è già registrata! Vai al login 💈'
      );

      this.nuovaEmail = '';

      return;
    }

    const nuovoUtente: Utente = {
      nome,
      email,
      password,
      ruolo: 'cliente',
      movimenti: []
    };

    this.listaUtenti = [
      ...this.listaUtenti,
      nuovoUtente
    ];

    localStorage.setItem(
      'databaseUtentiBarber',
      JSON.stringify(
        this.listaUtenti
      )
    );

    alert(
      'Account creato con successo! Ora fai il login 💈'
    );

    this.pulisciRegistrazione();

    this.paginaAttuale =
      'login';
  }

  private pulisciRegistrazione(): void {
    this.nomeCliente = '';
    this.nuovaEmail = '';
    this.nuovaPassword = '';

    this.registrazioneAttiva =
      false;
  }

  // =========================================================
  // PRENOTAZIONI CLIENTE
  // =========================================================

  caricaMiePrenotazioni(): void {
    if (!this.utenteLoggato) {
      this.miePrenotazioni = [];
      return;
    }

    this.miePrenotazioni =
      this.prenotazioniService
        .prenotazioniCliente(
          this.listaPrenotazioni,
          this.utenteLoggato.email
        );
  }

  vaiAllePrenotazioni(): void {
    this.caricaMiePrenotazioni();

    this.paginaAttuale =
      'prenotazioni';
  }

  tornaCliente(): void {
    this.paginaAttuale =
      'cliente';
  }

  eliminaPrenotazione(
    prenotazione: Prenotazione
  ): void {
    const conferma = confirm(
      'Vuoi eliminare questa prenotazione?'
    );

    if (!conferma) {
      return;
    }

    this.listaPrenotazioni =
      this.prenotazioniService
        .eliminaPrenotazione(
          this.listaPrenotazioni,
          prenotazione.id
        );

    this.caricaMiePrenotazioni();
  }

  // =========================================================
  // AGGIORNAMENTO PRENOTAZIONI
  // =========================================================

  aggiornaPrenotazioni(
    prenotazioni: Prenotazione[]
  ): void {
    this.listaPrenotazioni = [
      ...prenotazioni
    ];

    this.prenotazioniService
      .salvaPrenotazioni(
        this.listaPrenotazioni
      );

    this.caricaMiePrenotazioni();
  }
  private generaOrariDisponibili(): string[] {
  const orari: string[] = [];

  CALENDARIO_CONFIG
    .fasceOrarie
    .forEach(fascia => {
      orari.push(
        ...this.generaOrariFascia(
          fascia
        )
      );
    });

  return orari;
}

private generaOrariFascia(
  fascia: FasciaOraria
): string[] {
  const orari: string[] = [];

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
    orari.push(
      this.convertiMinutiInOrario(
        minutiCorrenti
      )
    );

    minutiCorrenti +=
      CALENDARIO_CONFIG
        .durataSlotMinuti;
  }

  return orari;
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

  return (
    `${String(ore).padStart(2, '0')}:` +
    `${String(minuti).padStart(2, '0')}`
  );
}
  // =========================================================
  // SUPPORTO DATE
  // =========================================================

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
