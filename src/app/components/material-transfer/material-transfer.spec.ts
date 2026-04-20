import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialTransfer } from './material-transfer';

describe('MaterialTransfer', () => {
  let component: MaterialTransfer;
  let fixture: ComponentFixture<MaterialTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialTransfer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaterialTransfer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
