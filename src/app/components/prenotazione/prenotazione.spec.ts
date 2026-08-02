import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Prenotazione } from './prenotazione';

describe('Prenotazione', () => {
  let component: Prenotazione;
  let fixture: ComponentFixture<Prenotazione>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prenotazione],
    }).compileComponents();

    fixture = TestBed.createComponent(Prenotazione);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
