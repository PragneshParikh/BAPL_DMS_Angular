import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdiChecklistmaster } from './pdi-checklistmaster';

describe('PdiChecklistmaster', () => {
  let component: PdiChecklistmaster;
  let fixture: ComponentFixture<PdiChecklistmaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdiChecklistmaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdiChecklistmaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
