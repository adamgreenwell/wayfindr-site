import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('renders Umami and Google Analytics tracking in the document head', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';

  assert.match(
    head,
    /<script defer src="https:\/\/umami\.faustdesignkompanie\.com\/script\.js" data-website-id="d0a66958-1958-4f09-afcf-4ba8b35c4815"><\/script>/,
  );
  assert.match(
    head,
    /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-13LM05K5FH"><\/script>/,
  );
  assert.match(head, /gtag\('config', 'G-13LM05K5FH'\);/);
});
