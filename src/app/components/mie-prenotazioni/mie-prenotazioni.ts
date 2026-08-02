import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Prenotazione } from '../../models/prenotazione.model';

@Component({
  selector: 'app-mie-prenotazioni',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './mie-prenotazioni.html',
  styleUrl: './mie-prenotazioni.css'
})
export class MiePrenotazioni {

  @Input()
  prenotazioni: Prenotazione[] = [];

  @Output()
  tornaAlSalone = new EventEmitter<void>();

  @Output()
  eliminaPrenotazione =
    new EventEmitter<Prenotazione>();

  tornaCliente(): void {
    this.tornaAlSalone.emit();
  }

  richiediEliminazione(
    prenotazione: Prenotazione
  ): void {
    this.eliminaPrenotazione.emit(
      prenotazione
    );
  }

  classeStato(
    prenotazione: Prenotazione
  ): string {
    return `stato-${prenotazione.stato}`;
  }
}
