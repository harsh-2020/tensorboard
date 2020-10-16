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
import * as errorActions from '../actions';
import * as errorReducers from './error_reducers';
import {buildErrorState} from './testing';

describe('error_reducers', () => {
  it('saves errors with a timestamp', () => {
    spyOn(Date, 'now').and.returnValues(123, 234);
    const action1 = errorActions.errorReported({details: 'Foo1 failed'});
    const action2 = errorActions.errorReported({details: 'Foo2 failed'});
    const state1 = buildErrorState({latestError: null});

    const state2 = errorReducers.reducers(state1, action1);
    expect(state2.latestError!).toEqual({
      details: 'Foo1 failed',
      created: 123,
    });

    const state3 = errorReducers.reducers(state2, action2);
    expect(state3.latestError!).toEqual({
      details: 'Foo2 failed',
      created: 234,
    });
  });

  it('updates state with a different error if the report is the same', () => {
    const action1 = errorActions.errorReported({details: 'Foo failed again'});
    const action2 = errorActions.errorReported({details: 'Foo failed again'});
    const state1 = buildErrorState({latestError: null});

    const state2 = errorReducers.reducers(state1, action1);
    const state2LatestError = state2.latestError;

    const state3 = errorReducers.reducers(state2, action2);
    const state3LatestError = state3.latestError;

    expect(state2LatestError).not.toBe(state3LatestError);
  });
});
