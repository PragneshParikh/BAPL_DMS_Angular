import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsPo } from './parts-po';

describe('PartsPo', () => {
  let component: PartsPo;
  let fixture: ComponentFixture<PartsPo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsPo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsPo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
