import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerCreationManagerList } from './dealer-creation-manager-list';

describe('DealerCreationManagerList', () => {
  let component: DealerCreationManagerList;
  let fixture: ComponentFixture<DealerCreationManagerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealerCreationManagerList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DealerCreationManagerList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
