'use strict';
(() => {
  const root = document.querySelector('[data-display-url]');
  if (!root) return;
  const calls = document.getElementById('display-calls');
  const status = document.getElementById('display-status');
  const waiting = document.getElementById('display-waiting');
  const updated = document.getElementById('display-updated');
  let lastSuccess = 0;
  function stale() {
    calls.replaceChildren();
    waiting.textContent = '—';
    status.textContent = 'Live updates unavailable. Please ask staff for your turn.';
    updated.textContent = 'Display paused — old calls are hidden';
  }
  async function poll() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(root.dataset.displayUrl, {cache: 'no-store', signal: controller.signal});
      if (!response.ok) throw new Error('Queue unavailable');
      const data = await response.json();
      if (!Array.isArray(data.calls) || typeof data.waiting !== 'number' || typeof data.open !== 'boolean') throw new Error('Invalid queue response');
      const fragment = document.createDocumentFragment();
      for (const call of data.calls) {
        const card = document.createElement('article');
        card.className = 'display-call';
        for (const [tag, text] of [['small', call.status], ['strong', call.token], ['span', call.counter]]) {
          const element = document.createElement(tag);
          element.textContent = text;
          card.append(element);
        }
        fragment.append(card);
      }
      if (!data.calls.length) {
        const message = document.createElement('p');
        message.className = 'display-empty';
        message.textContent = data.open ? 'Please take a seat. Your token will appear here when called.' : 'This department is closed. Please ask reception for assistance.';
        fragment.append(message);
      }
      calls.replaceChildren(fragment);
      waiting.textContent = String(data.waiting);
      status.textContent = data.open ? 'Called tokens and consultations in progress' : 'Calling is paused';
      updated.textContent = 'Updated ' + new Date(data.updated_at).toLocaleTimeString('en-GB', {timeZone: 'Asia/Kathmandu'});
      lastSuccess = Date.now();
    } catch (_) { stale(); }
    finally { clearTimeout(timeout); setTimeout(poll, 3000); }
  }
  setInterval(() => { if (lastSuccess && Date.now() - lastSuccess > 15000) stale(); }, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastSuccess > 15000) stale(); });
  poll();
})();
