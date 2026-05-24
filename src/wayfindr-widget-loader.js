const SCRIPT_ID = 'wayfindr-widget-script';

export function resolveWayfindrConfig(env = {}) {
  const apiBaseUrl = normalizeUrl(env.VITE_WAYFINDR_API_BASE_URL);
  const sitePublicKey = trim(env.VITE_WAYFINDR_SITE_PUBLIC_KEY);

  if (!apiBaseUrl || !sitePublicKey) {
    return null;
  }

  return {
    apiBaseUrl,
    sitePublicKey,
    launcherLabel: trim(env.VITE_WAYFINDR_LAUNCHER_LABEL) || 'Chat with Wayfindr',
    title: trim(env.VITE_WAYFINDR_TITLE) || 'Wayfindr Support',
    reverbAppKey: trim(env.VITE_WAYFINDR_REVERB_APP_KEY),
    reverbHost: trim(env.VITE_WAYFINDR_REVERB_HOST),
    reverbPort: trim(env.VITE_WAYFINDR_REVERB_PORT),
    reverbScheme: trim(env.VITE_WAYFINDR_REVERB_SCHEME),
  };
}

export function installWayfindrWidget(options = {}) {
  const documentRef = options.document || globalThis.document;
  const windowRef = options.window || globalThis.window;
  const config = options.config;

  if (!documentRef || !documentRef.body) {
    return null;
  }

  const existing = documentRef.getElementById(SCRIPT_ID);

  if (existing) {
    return existing;
  }

  if (!config || !config.apiBaseUrl || !config.sitePublicKey) {
    return null;
  }

  const script = documentRef.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `${config.apiBaseUrl}/widget.js`;
  script.dataset.wayfindrApiBaseUrl = config.apiBaseUrl;
  script.dataset.wayfindrSiteKey = config.sitePublicKey;
  script.dataset.wayfindrLauncherLabel = config.launcherLabel;
  script.dataset.wayfindrTitle = config.title;
  script.onload = () => {
    initializeWayfindr(windowRef, config);
  };

  if (config.reverbAppKey) {
    script.dataset.wayfindrReverbAppKey = config.reverbAppKey;
  }

  if (config.reverbHost) {
    script.dataset.wayfindrReverbHost = config.reverbHost;
  }

  if (config.reverbPort) {
    script.dataset.wayfindrReverbPort = config.reverbPort;
  }

  if (config.reverbScheme) {
    script.dataset.wayfindrReverbScheme = config.reverbScheme;
  }

  documentRef.body.appendChild(script);

  return script;
}

function initializeWayfindr(windowRef, config) {
  if (!windowRef || !windowRef.Wayfindr || typeof windowRef.Wayfindr.init !== 'function') {
    return;
  }

  windowRef.Wayfindr.init({
    apiBaseUrl: config.apiBaseUrl,
    sitePublicKey: config.sitePublicKey,
    launcherLabel: config.launcherLabel,
    title: config.title,
    reverb: config.reverbAppKey
      ? {
          appKey: config.reverbAppKey,
          host: config.reverbHost || undefined,
          port: config.reverbPort ? Number(config.reverbPort) : undefined,
          scheme: config.reverbScheme || undefined,
        }
      : null,
  });
}

function normalizeUrl(value) {
  return trim(value).replace(/\/+$/, '');
}

function trim(value) {
  return String(value || '').trim();
}
