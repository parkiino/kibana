/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useCallback, memo } from 'react';
import { useDispatch } from 'react-redux';
import { EuiText, EuiFieldText } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { WrapperPage } from '../../../../common/components/wrapper_page';
import { policyConfig } from '../store/policy_details/selectors';
import { Immutable } from '../../../../../common/endpoint/types';
import { usePolicyDetailsSelector } from './policy_hooks';
import { clone } from '../models/policy_details_config';
import { OS, AdvancedOSes } from '../types';

export const AdvancedPolicy = memo(() => {
  const dispatch = useDispatch();
  // grabs a copy of the policy details configuration we will be modifying
  const policyDetailsConfig = usePolicyDetailsSelector(policyConfig);
  const value =
    policyDetailsConfig && policyDetailsConfig.windows.advanced.elasticsearch.tls.verify_hostname;
  const OSes: Immutable<AdvancedOSes[]> = [OS.windows, OS.mac, OS.linux];

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (policyDetailsConfig) {
        const newPayload = clone(policyDetailsConfig);
        for (const os of OSes) {
          newPayload[os].advanced.elasticsearch.tls.verify_hostname = event.target.value;
        }
        dispatch({
          type: 'userChangedPolicyConfig',
          payload: { policyConfig: newPayload },
        });
      }
    },
    [dispatch, policyDetailsConfig, OSes]
  );

  return (
    <WrapperPage>
      <EuiText size="xs">
        <h4>
          <FormattedMessage
            id="xpack.securitySolution.policyAdvanced.hi"
            defaultMessage="Hi there"
          />
        </h4>
      </EuiText>
      <EuiFieldText placeholder="true or false" value={value} onChange={handleInputChange} />
    </WrapperPage>
  );
});

AdvancedPolicy.displayName = 'AdvancedPolicy';
