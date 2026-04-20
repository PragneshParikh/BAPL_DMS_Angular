import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KitCreation } from './kit-creation';

describe('KitCreation', () => {
  let component: KitCreation;
  let fixture: ComponentFixture<KitCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitCreation]
    })
      .compileComponents();

    fixture = TestBed.createComponent(KitCreation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
