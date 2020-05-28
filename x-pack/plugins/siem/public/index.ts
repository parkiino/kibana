/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { PluginInitializerContext } from '../../../../src/core/public';
import { Plugin } from './plugin';
import { PluginSetup, PluginStart } from './types';

export const plugin = (context: PluginInitializerContext): Plugin => new Plugin(context);

export { Plugin, PluginSetup, PluginStart };

export { ConfigureEndpointDatasource } from './endpoint_policy/view/ingest_manager_integration';
