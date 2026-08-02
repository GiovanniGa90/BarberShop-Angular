import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaTitolare } from './area-titolare';

describe('AreaTitolare', () => {
  let component: AreaTitolare;
  let fixture: ComponentFixture<AreaTitolare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreaTitolare],
    }).compileComponents();

    fixture = TestBed.createComponent(AreaTitolare);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
