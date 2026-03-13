import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemmasterFG } from './itemmaster-fg';

describe('ItemmasterFG', () => {
  let component: ItemmasterFG;
  let fixture: ComponentFixture<ItemmasterFG>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemmasterFG]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemmasterFG);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
