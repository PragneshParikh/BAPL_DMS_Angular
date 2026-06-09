import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDesignPrototype } from './new-design-prototype';

describe('NewDesignPrototype', () => {
  let component: NewDesignPrototype;
  let fixture: ComponentFixture<NewDesignPrototype>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewDesignPrototype]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewDesignPrototype);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
