/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent, AgentOptions } from 'https';
import HttpProxyAgent from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Logger } from '../../../../../../src/core/server';
import { ActionsConfigurationUtilities } from '../../actions_config';
import { getNodeTLSOptions, getTLSSettingsFromConfig } from './get_node_tls_options';

interface GetCustomAgentsResponse {
  httpAgent: HttpAgent | undefined;
  httpsAgent: HttpsAgent | undefined;
}

export function getCustomAgents(
  configurationUtilities: ActionsConfigurationUtilities,
  logger: Logger,
  url: string
): GetCustomAgentsResponse {
  const generalTLSSettings = configurationUtilities.getTLSSettings();
  const agentTLSOptions = getNodeTLSOptions(logger, generalTLSSettings.verificationMode);
  // the default for rejectUnauthorized is the global setting, which can
  // be overridden (below) with a custom host setting
  const defaultAgents = {
    httpAgent: undefined,
    httpsAgent: new HttpsAgent({
      ...agentTLSOptions,
    }),
  };

  // Get the current proxy settings, and custom host settings for this URL.
  // If there are neither of these, return the default agents
  const proxySettings = configurationUtilities.getProxySettings();
  const customHostSettings = configurationUtilities.getCustomHostSettings(url);
  if (!proxySettings && !customHostSettings) {
    return defaultAgents;
  }

  // update the defaultAgents.httpsAgent if configured
  const tlsSettings = customHostSettings?.tls;
  let agentOptions: AgentOptions | undefined;
  if (tlsSettings) {
    logger.debug(`Creating customized connection settings for: ${url}`);
    agentOptions = defaultAgents.httpsAgent.options;

    if (tlsSettings.certificateAuthoritiesData) {
      agentOptions.ca = tlsSettings.certificateAuthoritiesData;
    }

    const tlsSettingsFromConfig = getTLSSettingsFromConfig(
      tlsSettings.verificationMode,
      tlsSettings.rejectUnauthorized
    );
    // see: src/core/server/elasticsearch/legacy/elasticsearch_client_config.ts
    // This is where the global rejectUnauthorized is overridden by a custom host
    const customHostNodeTLSOptions = getNodeTLSOptions(
      logger,
      tlsSettingsFromConfig.verificationMode
    );
    if (customHostNodeTLSOptions.rejectUnauthorized !== undefined) {
      agentOptions.rejectUnauthorized = customHostNodeTLSOptions.rejectUnauthorized;
    }
  }

  // if there weren't any proxy settings, return the currently calculated agents
  if (!proxySettings) {
    return defaultAgents;
  }

  // there is a proxy in use, but it's possible we won't use it via custom host
  // proxyOnlyHosts and proxyBypassHosts
  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch (err) {
    logger.warn(`error determining proxy state for invalid url "${url}", using default agents`);
    return defaultAgents;
  }

  // filter out hostnames in the proxy bypass or only lists
  const { hostname } = targetUrl;

  if (proxySettings.proxyBypassHosts) {
    if (proxySettings.proxyBypassHosts.has(hostname)) {
      return defaultAgents;
    }
  }

  if (proxySettings.proxyOnlyHosts) {
    if (!proxySettings.proxyOnlyHosts.has(hostname)) {
      return defaultAgents;
    }
  }

  logger.debug(`Creating proxy agents for proxy: ${proxySettings.proxyUrl}`);
  let proxyUrl: URL;
  try {
    proxyUrl = new URL(proxySettings.proxyUrl);
  } catch (err) {
    logger.warn(`invalid proxy URL "${proxySettings.proxyUrl}" ignored`);
    return defaultAgents;
  }

  const proxyNodeTLSOptions = getNodeTLSOptions(
    logger,
    proxySettings.proxyTLSSettings.verificationMode
  );
  // At this point, we are going to use a proxy, so we need new agents.
  // We will though, copy over the calculated tls options from above, into
  // the https agent.
  const httpAgent = new HttpProxyAgent(proxySettings.proxyUrl);
  const httpsAgent = (new HttpsProxyAgent({
    host: proxyUrl.hostname,
    port: Number(proxyUrl.port),
    protocol: proxyUrl.protocol,
    headers: proxySettings.proxyHeaders,
    // do not fail on invalid certs if value is false
    ...proxyNodeTLSOptions,
  }) as unknown) as HttpsAgent;
  // vsCode wasn't convinced HttpsProxyAgent is an https.Agent, so we convinced it

  if (agentOptions) {
    httpsAgent.options = {
      ...httpsAgent.options,
      ...agentOptions,
    };
  }

  return { httpAgent, httpsAgent };
}
