import { TestBed } from '@angular/core/testing';

import { AppLogicService } from './app-logic.service';

describe('AppLogicService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AppLogicService = TestBed.get(AppLogicService);
    expect(service).toBeTruthy();
  });
});
