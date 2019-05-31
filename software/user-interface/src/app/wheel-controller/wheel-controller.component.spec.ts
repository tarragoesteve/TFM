import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WheelControllerComponent } from './wheel-controller.component';

describe('WheelControllerComponent', () => {
  let component: WheelControllerComponent;
  let fixture: ComponentFixture<WheelControllerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WheelControllerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WheelControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
