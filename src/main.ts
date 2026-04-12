import './style.css';
import { init } from './app.ts';
import { APP_VERSION } from './version.ts';

const badge = document.createElement('span');
badge.className = 'version-badge';
badge.id = 'version-badge';
badge.textContent = `v${APP_VERSION}`;
document.body.appendChild(badge);

init();
