import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// This site describes a project that ships often, and the same fact is written
// down in several places: the release timeline, the prose in the status
// section, and the state chips in the feature list. Those are what rot. The
// page went two releases stale once while staying internally consistent, so
// these tests do not check that the site is current — nothing offline can know
// that — they check that its claims still agree with each other, which is the
// half of the failure a half-finished update leaves behind.

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

const collapse = (value) => value.replace(/\s+/g, ' ').trim();

function section(className) {
  const found = html.match(new RegExp(`<section class="${className}"[\\s\\S]*?</section>`));
  assert.ok(found, `expected a <section class="${className}"> in index.html`);
  return found[0];
}

function releases() {
  const list = html.match(/<ol class="release-list"[\s\S]*?<\/ol>/);
  assert.ok(list, 'expected the release timeline <ol class="release-list">');

  const entries = [...list[0].matchAll(
    /<a class="release-version" href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<time datetime="([^"]+)">/g,
  )].map(([, href, version, date]) => ({ href, version, date }));

  assert.ok(entries.length > 0, 'expected at least one release in the timeline');
  return entries;
}

function chips(scope) {
  return [...scope.matchAll(/<span class="chip (\w+)">([^<]+)<\/span>/g)].map(
    ([, state, label]) => ({ state, label }),
  );
}

const CARDINALS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

const ORDINALS = [
  'zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh',
  'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth',
  'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth',
  'twentieth',
];

// The chip's colour carries no meaning to a screen reader, so its text is the
// state. A teal chip reading "In development" is the drift this catches.
const CHIP_LABELS = {
  shipped: 'Shipped',
  building: 'In development',
  planned: 'Planned',
  deferred: 'Deferred',
};

test('the status copy counts the same releases the timeline lists', () => {
  const count = releases().length;
  assert.ok(count < CARDINALS.length, `add cardinals past ${CARDINALS.length - 1}`);

  assert.match(
    collapse(section('status')),
    new RegExp(`\\b${CARDINALS[count]} releases since August\\b`),
    `the timeline lists ${count} releases, so the status copy should say "${CARDINALS[count]} releases since August"`,
  );
});

test('the status copy names the newest release in the timeline', () => {
  const [newest] = releases();
  const named = collapse(section('status')).match(
    /<a class="text-link" href="([^"]*\/releases\/tag\/v([\d.]+))"[^>]*> ?([\d.]+) ?<\/a>/,
  );

  assert.ok(named, 'expected the status copy to link the release you can install today');
  assert.equal(named[2], named[3], 'the status link points at one version and names another');
  assert.equal(
    named[3],
    newest.version,
    `the timeline's newest release is ${newest.version}, so the status copy should offer that one`,
  );
});

test('the status copy names the next release by ordinal', () => {
  const next = releases().length + 1;
  assert.ok(next < ORDINALS.length, `add ordinals past ${ORDINALS.length - 1}`);

  assert.match(
    collapse(section('status')),
    new RegExp(`\\b${ORDINALS[next]} in preparation\\b`),
    `with ${next - 1} releases listed, the one being prepared is the ${ORDINALS[next]}`,
  );
});

test('every release links to the tag it names', () => {
  for (const { href, version } of releases()) {
    assert.ok(
      href.endsWith(`/releases/tag/v${version}`),
      `the ${version} entry links to ${href}, which is a different tag`,
    );
  }
});

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);

  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

test('the release timeline runs newest first', () => {
  const entries = releases();

  for (let i = 1; i < entries.length; i += 1) {
    const newer = entries[i - 1];
    const older = entries[i];

    assert.ok(
      compareVersions(newer.version, older.version) > 0,
      `${older.version} is listed above ${newer.version}, so the timeline is out of order`,
    );
    assert.ok(
      older.date < newer.date,
      `${older.version} (${older.date}) is dated on or after ${newer.version} (${newer.date})`,
    );
  }
});

test('every feature chip reads as the state it is coloured', () => {
  const found = chips(section('features'));
  assert.ok(found.length > 0, 'expected state chips in the feature list');

  for (const { state, label } of found) {
    assert.ok(
      Object.hasOwn(CHIP_LABELS, state),
      `"${label}" uses an unknown chip state "${state}"`,
    );
    assert.equal(
      label,
      CHIP_LABELS[state],
      `a "${state}" chip reads "${label}", so its colour and its wording disagree`,
    );
  }
});

test('the legend documents exactly the states the feature list uses', () => {
  const features = section('features');
  const legend = features.match(/<ul class="feature-legend"[\s\S]*?<\/ul>/);
  assert.ok(legend, 'expected the <ul class="feature-legend"> status key');

  const documented = [...new Set(chips(legend[0]).map(({ state }) => state))].sort();
  const groups = features.match(/<div class="feature-groups"[\s\S]*<\/div>/);
  assert.ok(groups, 'expected the <div class="feature-groups"> inventory');

  const used = [...new Set(chips(groups[0]).map(({ state }) => state))].sort();

  assert.deepEqual(
    documented,
    used,
    'the status key and the feature list disagree about which states exist',
  );
});

test('the roadmap only points at in-development items while there are some', () => {
  const roadmap = section('roadmap');

  if (/marked <em>in development<\/em> above/.test(collapse(roadmap))) {
    assert.ok(
      chips(section('features')).some(({ state }) => state === 'building'),
      'the roadmap sends the reader to in-development items the feature list no longer has',
    );
  }
});

test('every in-page link points at a section that exists', () => {
  const anchors = [...new Set(
    [...html.matchAll(/href="#([\w-]+)"/g)].map(([, id]) => id),
  )];
  assert.ok(anchors.length > 0, 'expected in-page navigation links');

  for (const id of anchors) {
    assert.ok(
      html.includes(`id="${id}"`),
      `a link points at #${id}, which nothing on the page declares`,
    );
  }
});
