/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { memo } from 'react';
import { EuiText } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { WrapperPage } from '../../../../common/components/wrapper_page';

export const AdvancedPolicy = memo(() => {
  // text
  // inputfield
  // button that dispatches an action to change a part of policy config
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
    </WrapperPage>
  );
});

AdvancedPolicy.displayName = 'AdvancedPolicy';
