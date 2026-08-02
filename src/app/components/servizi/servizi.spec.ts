import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Servizi } from './servizi';

describe('Servizi', () => {
  let component: Servizi;
  let fixture: ComponentFixture<Servizi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Servizi],
    }).compileComponents();

    fixture = TestBed.createComponent(Servizi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
