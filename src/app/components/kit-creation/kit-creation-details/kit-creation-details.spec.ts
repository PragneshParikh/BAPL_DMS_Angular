import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KitCreationDetails } from './kit-creation-details';

describe('KitCreationDetails', () => {
  let component: KitCreationDetails;
  let fixture: ComponentFixture<KitCreationDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitCreationDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KitCreationDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
