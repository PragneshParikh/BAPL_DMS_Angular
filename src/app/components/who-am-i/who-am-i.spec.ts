import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhoAmI } from './who-am-i';

describe('WhoAmI', () => {
  let component: WhoAmI;
  let fixture: ComponentFixture<WhoAmI>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhoAmI]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhoAmI);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
