/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import expect from '@kbn/expect';

export default function ({ getService, getPageObjects }) {
  const kibanaServer = getService('kibanaServer');
  const browser = getService('browser');
  const PageObjects = getPageObjects(['settings', 'common', 'dashboard', 'timePicker', 'header']);

  describe('kibana settings', function describeIndexTests() {
    before(async function () {
      // delete .kibana index and then wait for Kibana to re-create it
      await kibanaServer.uiSettings.replace({});
      await PageObjects.settings.createIndexPattern('logstash-*');
      await PageObjects.settings.navigateTo();
    });

    after(async function afterAll() {
      await PageObjects.settings.navigateTo();
      await PageObjects.settings.clickKibanaIndexPatterns();
      await PageObjects.settings.removeLogstashIndexPatternIfExist();
    });

    it('should allow setting advanced settings', async function () {
      await PageObjects.settings.clickKibanaSettings();
      await PageObjects.settings.setAdvancedSettingsSelect('dateFormat:tz', 'America/Phoenix');
      const advancedSetting = await PageObjects.settings.getAdvancedSettings('dateFormat:tz');
      expect(advancedSetting).to.be('America/Phoenix');
    });

    describe('state:storeInSessionStorage', () => {
      async function getStateFromUrl() {
        const currentUrl = await browser.getCurrentUrl();
        let match = currentUrl.match(/(.*)?_g=(.*)&_a=(.*)/);
        if (match) return [match[2], match[3]];
        match = currentUrl.match(/(.*)?_a=(.*)&_g=(.*)/);
        if (match) return [match[3], match[2]];

        if (!match) {
          throw new Error('State in url is missing or malformed: ' + currentUrl);
        }
      }

      it('defaults to null', async () => {
        await PageObjects.settings.clickKibanaSettings();
        const storeInSessionStorage = await PageObjects.settings.getAdvancedSettingCheckbox(
          'state:storeInSessionStorage'
        );
        expect(storeInSessionStorage).to.be(null);
      });

      it('when false, dashboard state is unhashed', async function () {
        await PageObjects.common.navigateToApp('dashboard');
        await PageObjects.dashboard.clickNewDashboard();
        await PageObjects.timePicker.setDefaultAbsoluteRange();
        const [globalState, appState] = await getStateFromUrl();

        // We don't have to be exact, just need to ensure it's greater than when the hashed variation is being used,
        // which is less than 20 characters.
        expect(globalState.length).to.be.greaterThan(20);
        expect(appState.length).to.be.greaterThan(20);
      });

      it('setting to true change is preserved', async function () {
        await PageObjects.settings.navigateTo();
        await PageObjects.settings.clickKibanaSettings();
        await PageObjects.settings.toggleAdvancedSettingCheckbox('state:storeInSessionStorage');
        const storeInSessionStorage = await PageObjects.settings.getAdvancedSettingCheckbox(
          'state:storeInSessionStorage'
        );
        expect(storeInSessionStorage).to.be('true');
      });

      it('when true, dashboard state is hashed', async function () {
        await PageObjects.common.navigateToApp('dashboard');
        await PageObjects.dashboard.clickNewDashboard();
        await PageObjects.timePicker.setDefaultAbsoluteRange();
        const [globalState, appState] = await getStateFromUrl();

        // We don't have to be exact, just need to ensure it's less than the unhashed version, which will be
        // greater than 20 characters with the default state plus a time.
        expect(globalState.length).to.be.lessThan(20);
        expect(appState.length).to.be.lessThan(20);
      });

      it("changing 'state:storeInSessionStorage' also takes effect without full page reload", async () => {
        await PageObjects.dashboard.preserveCrossAppState();
        await PageObjects.header.clickStackManagement();
        await PageObjects.settings.clickKibanaSettings();
        await PageObjects.settings.toggleAdvancedSettingCheckbox('state:storeInSessionStorage');
        await PageObjects.header.clickDashboard();
        const [globalState, appState] = await getStateFromUrl();
        // We don't have to be exact, just need to ensure it's greater than when the hashed variation is being used,
        // which is less than 20 characters.
        expect(globalState.length).to.be.greaterThan(20);
        expect(appState.length).to.be.greaterThan(20);
      });
    });

    after(async function () {
      await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });
      await browser.refresh();
    });
  });
}
