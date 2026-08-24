import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerMenuAccessPage } from './dealer-menu-access-page';

describe('DealerMenuAccessPage', () => {
  let component: DealerMenuAccessPage;
  let fixture: ComponentFixture<DealerMenuAccessPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealerMenuAccessPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DealerMenuAccessPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
