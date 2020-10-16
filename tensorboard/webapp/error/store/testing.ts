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
import {ERROR_FEATURE_KEY, ErrorState, State} from './error_types';

export function buildErrorState(override: Partial<ErrorState>): ErrorState {
  return {
    latestError: null,
    ...override,
  };
}

export function buildStateFromErrorState(runsState: ErrorState): State {
  return {[ERROR_FEATURE_KEY]: runsState};
}
