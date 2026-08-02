export interface FasciaOraria {
  apertura: string;
  chiusura: string;
}

export const CALENDARIO_CONFIG = {
  durataSlotMinuti: 30,

  fasceOrarie: [
    {
      apertura: '09:00',
      chiusura: '13:00'
    },
    {
      apertura: '15:00',
      chiusura: '19:00'
    }
  ] as FasciaOraria[],

  giorniChiusura: [
    0, // Domenica
    1  // Lunedì
  ],

  maxPrenotazioniPerSlot: 2
};
