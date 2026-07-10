import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelWiseCurrentStock } from './model-wise-current-stock';

describe('ModelWiseCurrentStock', () => {
  let component: ModelWiseCurrentStock;
  let fixture: ComponentFixture<ModelWiseCurrentStock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelWiseCurrentStock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelWiseCurrentStock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
