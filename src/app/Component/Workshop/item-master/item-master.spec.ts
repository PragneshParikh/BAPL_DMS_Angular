import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemMaster } from './item-master';

describe('ItemMaster', () => {
  let component: ItemMaster;
  let fixture: ComponentFixture<ItemMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
