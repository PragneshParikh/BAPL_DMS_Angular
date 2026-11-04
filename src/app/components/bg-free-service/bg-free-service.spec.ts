import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BgFreeService } from './bg-free-service';

describe('BgFreeService', () => {
  let component: BgFreeService;
  let fixture: ComponentFixture<BgFreeService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BgFreeService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BgFreeService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
