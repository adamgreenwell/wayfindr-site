import './styles.css';

import {
  installWayfindrWidget,
  resolveWayfindrConfig,
} from './wayfindr-widget-loader.js';

installWayfindrWidget({
  config: resolveWayfindrConfig(import.meta.env),
});
