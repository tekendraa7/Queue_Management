'use strict';
document.querySelector('#print-ticket')?.addEventListener('click', () => window.print());
// Keep submit controls enabled: retries are handled by idempotency/version checks.
// No patient state is cached or queued in the browser while offline.
