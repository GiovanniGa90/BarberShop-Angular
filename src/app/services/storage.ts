import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  salva<T>(chiave: string, valore: T): void {
    try {
      localStorage.setItem(
        chiave,
        JSON.stringify(valore)
      );
    } catch (errore) {
      console.error(
        `Errore durante il salvataggio di "${chiave}":`,
        errore
      );
    }
  }

  carica<T>(
    chiave: string,
    valorePredefinito: T
  ): T {
    const valoreSalvato =
      localStorage.getItem(chiave);

    if (
      valoreSalvato === null ||
      valoreSalvato === 'undefined' ||
      valoreSalvato === 'null'
    ) {
      return valorePredefinito;
    }

    try {
      return JSON.parse(valoreSalvato) as T;
    } catch (errore) {
      console.error(
        `Errore durante il caricamento di "${chiave}":`,
        errore
      );

      return valorePredefinito;
    }
  }

  elimina(chiave: string): void {
    try {
      localStorage.removeItem(chiave);
    } catch (errore) {
      console.error(
        `Errore durante l'eliminazione di "${chiave}":`,
        errore
      );
    }
  }

  esiste(chiave: string): boolean {
    return localStorage.getItem(chiave) !== null;
  }

  svuota(): void {
    try {
      localStorage.clear();
    } catch (errore) {
      console.error(
        'Errore durante la pulizia del localStorage:',
        errore
      );
    }
  }
}
