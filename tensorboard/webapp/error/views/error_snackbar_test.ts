/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {TestBed} from '@angular/core/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Store} from '@ngrx/store';
import {provideMockStore, MockStore} from '@ngrx/store/testing';
import {ErrorSnackbarContainer} from './error_snackbar_container';
import {State} from '../store';
import * as selectors from '../../selectors';
import {buildStateFromErrorState, buildErrorState} from '../store/testing';

describe('error snackbar', () => {
  let store: MockStore<State>;
  let snackBarOpenSpy: jasmine.Spy;

  beforeEach(async () => {
    snackBarOpenSpy = jasmine.createSpy();
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        provideMockStore({
          initialState: buildStateFromErrorState(buildErrorState({})),
        }),
        {
          provide: MatSnackBar,
          useValue: {
            open: snackBarOpenSpy,
          },
        },
      ],
      declarations: [ErrorSnackbarContainer],
    }).compileComponents();
    store = TestBed.inject<Store<State>>(Store) as MockStore<State>;
  });

  it('should open the snackbar on each error', () => {
    const fixture = TestBed.createComponent(ErrorSnackbarContainer);
    fixture.detectChanges();
    expect(snackBarOpenSpy).not.toHaveBeenCalled();

    store.overrideSelector(selectors.getLatestError, {
      details: 'Foo failed',
      created: 0,
    });
    store.refreshState();

    expect(snackBarOpenSpy.calls.count()).toBe(1);
    expect(snackBarOpenSpy.calls.mostRecent().args[0]).toBe('Foo failed');

    store.overrideSelector(selectors.getLatestError, {
      details: 'Foo2 failed',
      created: 1,
    });
    store.refreshState();

    expect(snackBarOpenSpy.calls.count()).toBe(2);
    expect(snackBarOpenSpy.calls.mostRecent().args[0]).toBe('Foo2 failed');
  });

  it('should open the snackbar again on receiving the same error', () => {
    const fixture = TestBed.createComponent(ErrorSnackbarContainer);
    fixture.detectChanges();
    expect(snackBarOpenSpy).not.toHaveBeenCalled();

    store.overrideSelector(selectors.getLatestError, {
      details: 'Foo failed again',
      created: 0,
    });
    store.refreshState();

    expect(snackBarOpenSpy.calls.count()).toBe(1);
    expect(snackBarOpenSpy.calls.mostRecent().args[0]).toBe('Foo failed again');

    store.overrideSelector(selectors.getLatestError, {
      details: 'Foo failed again',
      created: 1,
    });
    store.refreshState();

    expect(snackBarOpenSpy.calls.count()).toBe(2);
    expect(snackBarOpenSpy.calls.mostRecent().args[0]).toBe('Foo failed again');
  });
});
