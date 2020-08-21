/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as t from 'io-ts';

import { filter, sort_field, sort_order } from '../common/schemas';
import { RequiredKeepUndefined } from '../../types';
import { StringToPositiveNumber } from '../types/string_to_positive_number';

export const findEndpointListItemSchema = t.exact(
  t.partial({
    filter, // defaults to undefined if not set during decode
    page: StringToPositiveNumber, // defaults to undefined if not set during decode
    per_page: StringToPositiveNumber, // defaults to undefined if not set during decode
    sort_field, // defaults to undefined if not set during decode
    sort_order, // defaults to undefined if not set during decode
  })
);

export type FindEndpointListItemSchema = t.OutputOf<typeof findEndpointListItemSchema>;

// This type is used after a decode since some things are defaults after a decode.
export type FindEndpointListItemSchemaDecoded = RequiredKeepUndefined<
  t.TypeOf<typeof findEndpointListItemSchema>
>;
