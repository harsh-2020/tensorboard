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
export enum ErrorText {
  CREATE_PIN_MAX_EXCEEDED = `Max pin limit exceeded. Remove existing pins before adding more. See https://github.com/tensorflow/tensorboard/issues/4242`,
}

/**
 * An error structure used when creating newly reported errors.
 */
export interface ErrorReport {
  details: string;
}

/**
 * An error exposed by the feature's selectors.
 */
export type ErrorInfo = ErrorReport & {created: number};
