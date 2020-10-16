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
import {createSelector, createFeatureSelector} from '@ngrx/store';
import {ErrorInfo} from '../types';
import {ErrorState, State, ERROR_FEATURE_KEY} from './error_types';

/** @typehack */ import * as _typeHackSelector from '@ngrx/store/src/selector';
/** @typehack */ import * as _typeHackStore from '@ngrx/store/store';

const selectErrorState = createFeatureSelector<State, ErrorState>(
  ERROR_FEATURE_KEY
);

export const getLatestError = createSelector(
  selectErrorState,
  (state: ErrorState): ErrorInfo | null => {
    return state.latestError;
  }
);
