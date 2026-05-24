import assert from 'node:assert/strict';
import test from 'node:test';

import {
  installWayfindrWidget,
  resolveWayfindrConfig,
} from './wayfindr-widget-loader.js';

test('resolves Wayfindr widget config from Vite environment values', () => {
  const config = resolveWayfindrConfig({
    VITE_WAYFINDR_API_BASE_URL: 'https://wayfindr.on-forge.com/',
    VITE_WAYFINDR_SITE_PUBLIC_KEY: 'site_wayfindr_cc',
    VITE_WAYFINDR_REVERB_APP_KEY: 'reverb-key',
    VITE_WAYFINDR_REVERB_HOST: 'wayfindr.on-forge.com',
    VITE_WAYFINDR_REVERB_PORT: '443',
    VITE_WAYFINDR_REVERB_SCHEME: 'https',
  });

  assert.deepEqual(config, {
    apiBaseUrl: 'https://wayfindr.on-forge.com',
    sitePublicKey: 'site_wayfindr_cc',
    launcherLabel: 'Chat with Wayfindr',
    title: 'Wayfindr Support',
    reverbAppKey: 'reverb-key',
    reverbHost: 'wayfindr.on-forge.com',
    reverbPort: '443',
    reverbScheme: 'https',
  });
});

test('skips the widget when the public site key is not configured', () => {
  const document = fakeDocument();

  const script = installWayfindrWidget({
    document,
    config: resolveWayfindrConfig({
      VITE_WAYFINDR_API_BASE_URL: 'https://wayfindr.on-forge.com',
    }),
  });

  assert.equal(script, null);
  assert.equal(document.appended.length, 0);
});

test('installs the production Wayfindr widget script once configured', () => {
  const document = fakeDocument();

  const script = installWayfindrWidget({
    document,
    config: {
      apiBaseUrl: 'https://wayfindr.on-forge.com',
      sitePublicKey: 'site_wayfindr_cc',
      launcherLabel: 'Chat with Wayfindr',
      title: 'Wayfindr Support',
      reverbAppKey: 'reverb-key',
      reverbHost: 'wayfindr.on-forge.com',
      reverbPort: '443',
      reverbScheme: 'https',
    },
  });

  assert.equal(script.id, 'wayfindr-widget-script');
  assert.equal(script.src, 'https://wayfindr.on-forge.com/widget.js');
  assert.equal(script.async, true);
  assert.equal(script.dataset.wayfindrApiBaseUrl, 'https://wayfindr.on-forge.com');
  assert.equal(script.dataset.wayfindrSiteKey, 'site_wayfindr_cc');
  assert.equal(script.dataset.wayfindrLauncherLabel, 'Chat with Wayfindr');
  assert.equal(script.dataset.wayfindrTitle, 'Wayfindr Support');
  assert.equal(script.dataset.wayfindrReverbAppKey, 'reverb-key');
  assert.equal(script.dataset.wayfindrReverbHost, 'wayfindr.on-forge.com');
  assert.equal(script.dataset.wayfindrReverbPort, '443');
  assert.equal(script.dataset.wayfindrReverbScheme, 'https');
  assert.deepEqual(document.appended, [script]);

  assert.equal(installWayfindrWidget({ document, config: { sitePublicKey: 'site_wayfindr_cc' } }), script);
  assert.equal(document.appended.length, 1);
});

test('initializes Wayfindr when the widget script loads', () => {
  const document = fakeDocument();
  const initCalls = [];
  const window = {
    Wayfindr: {
      init(config) {
        initCalls.push(config);
      },
    },
  };

  const script = installWayfindrWidget({
    document,
    window,
    config: {
      apiBaseUrl: 'https://wayfindr.on-forge.com',
      sitePublicKey: 'site_wayfindr_cc',
      launcherLabel: 'Chat with Wayfindr',
      title: 'Wayfindr Support',
      reverbAppKey: 'reverb-key',
      reverbHost: 'wayfindr.on-forge.com',
      reverbPort: '443',
      reverbScheme: 'https',
    },
  });

  script.onload();

  assert.deepEqual(initCalls, [{
    apiBaseUrl: 'https://wayfindr.on-forge.com',
    sitePublicKey: 'site_wayfindr_cc',
    launcherLabel: 'Chat with Wayfindr',
    title: 'Wayfindr Support',
    reverb: {
      appKey: 'reverb-key',
      host: 'wayfindr.on-forge.com',
      port: 443,
      scheme: 'https',
    },
  }]);
});

function fakeDocument() {
  const byId = new Map();
  const appended = [];

  return {
    appended,
    body: {
      appendChild(script) {
        appended.push(script);
        byId.set(script.id, script);
      },
    },
    createElement(tagName) {
      return {
        async: false,
        dataset: {},
        tagName,
      };
    },
    getElementById(id) {
      return byId.get(id) || null;
    },
  };
}
