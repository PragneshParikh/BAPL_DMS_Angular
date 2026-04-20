import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsPoList } from './parts-po-list';

describe('PartsPoList', () => {
  let component: PartsPoList;
  let fixture: ComponentFixture<PartsPoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsPoList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsPoList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
