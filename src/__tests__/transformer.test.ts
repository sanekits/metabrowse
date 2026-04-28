import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseContent } from '../parser.ts';
import { transform, generateTarget } from '../transformer.ts';
import type { HTMLSection, HTMLGroup, HTMLSublevel, HTMLLinkGroup } from '../transformer.ts';

const fixturesDir = join(import.meta.dirname, 'fixtures');

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

// ── generateTarget ──────────────────────────────────────────────────

describe('generateTarget', () => {
  it('returns an 8-character hex string', () => {
    const target = generateTarget('https://example.com');
    expect(target).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is deterministic (same URL → same target)', () => {
    const a = generateTarget('https://example.com/page');
    const b = generateTarget('https://example.com/page');
    expect(a).toBe(b);
  });

  it('produces different targets for different URLs', () => {
    const a = generateTarget('https://example.com/a');
    const b = generateTarget('https://example.com/b');
    expect(a).not.toBe(b);
  });
});

// ── transform – target assignment ───────────────────────────────────

describe('transform – target assignment', () => {
  it('assigns hash target to external URLs', () => {
    const parsed = parseContent('- https://example.com');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    expect(linkGroup.type).toBe('link_group');
    const link = linkGroup.links[0];
    expect(link.target).toMatch(/^[0-9a-f]{8}$/);
  });

  it('assigns _self target to relative URLs', () => {
    const parsed = parseContent('- [Home](../index.html)');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    const link = linkGroup.links[0];
    expect(link.target).toBe('_self');
  });

  it('respects explicit target override', () => {
    const parsed = parseContent('- [Link](https://example.com){target="_blank"}');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    const link = linkGroup.links[0];
    expect(link.target).toBe('_blank');
  });

  it('assigns hash target to mailto: links', () => {
    const parsed = parseContent('- mailto:user@example.com');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    const link = linkGroup.links[0];
    expect(link.target).toMatch(/^[0-9a-f]{8}$/);
  });

  it('assigns hash target to chrome:// links', () => {
    const parsed = parseContent('- chrome://settings');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    const link = linkGroup.links[0];
    expect(link.target).toMatch(/^[0-9a-f]{8}$/);
  });
});

// ── transform – urlHash ─────────────────────────────────────────────

describe('transform – urlHash', () => {
  it('sets urlHash for http URLs', () => {
    const parsed = parseContent('- https://example.com');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    const link = linkGroup.links[0];
    expect(link.urlHash).toBe(link.target); // same hash reused
  });

  it('sets urlHash null for non-http scheme URLs', () => {
    const parsed = parseContent('- chrome://settings');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    const link = linkGroup.links[0];
    expect(link.urlHash).toBeNull();
  });

  it('sets urlHash null for relative URLs', () => {
    const parsed = parseContent('- [Home](./index.html)');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    const link = linkGroup.links[0];
    expect(link.urlHash).toBeNull();
  });
});

// ── transform – link text defaults ──────────────────────────────────

describe('transform – text defaults', () => {
  it('uses link text when provided', () => {
    const parsed = parseContent('- [My Link](https://example.com)');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    expect(linkGroup.links[0].text).toBe('My Link');
  });

  it('falls back to URL when no text provided', () => {
    const parsed = parseContent('- https://example.com');
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    expect(linkGroup.links[0].text).toBe('https://example.com');
  });
});

// ── transform – link coalescing ─────────────────────────────────────

describe('transform – link coalescing', () => {
  it('wraps consecutive links in HTMLLinkGroup', () => {
    const content = `- https://a.com
- https://b.com
- https://c.com`;
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Test');
    expect(doc.items).toHaveLength(1);
    expect(doc.items[0].type).toBe('link_group');
    expect((doc.items[0] as HTMLLinkGroup).links).toHaveLength(3);
  });

  it('does not merge links separated by a group', () => {
    const content = `- https://a.com
- My Group
    - https://b.com
- https://c.com`;
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Test');
    expect(doc.items).toHaveLength(3);
    expect(doc.items[0].type).toBe('link_group');
    expect(doc.items[1].type).toBe('group');
    expect(doc.items[2].type).toBe('link_group');
  });
});

// ── transform – sections and groups ─────────────────────────────────

describe('transform – sections and groups', () => {
  it('transforms sections with nested items', () => {
    const content = `## My Section
- https://example.com
- Tools
    - https://github.com`;
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Test');
    expect(doc.items).toHaveLength(1);
    const section = doc.items[0] as HTMLSection;
    expect(section.type).toBe('section');
    expect(section.name).toBe('My Section');
    expect(section.items).toHaveLength(2); // link_group + group
  });

  it('transforms groups with links', () => {
    const content = `- Resources # Important
    - https://a.com
    - https://b.com`;
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Test');
    const group = doc.items[0] as HTMLGroup;
    expect(group.type).toBe('group');
    expect(group.name).toBe('Resources');
    expect(group.comment).toBe('Important');
    expect(group.children).toHaveLength(2);
  });

  it('preserves comments through transform', () => {
    const content = `- https://example.com # Check this out`;
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Test');
    const linkGroup = doc.items[0] as HTMLLinkGroup;
    expect(linkGroup.links[0].comment).toBe('Check this out');
  });
});

// ── transform – real fixtures ───────────────────────────────────────

describe('transform – real fixtures', () => {
  it('transforms root.md end-to-end', () => {
    const content = readFixture('root.md');
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Home');
    expect(doc.title).toBe('Home');
    expect(doc.items.length).toBeGreaterThanOrEqual(4);
    for (const item of doc.items) {
      expect(item.type).toBe('section');
    }
  });

  it('transforms many-groups.md end-to-end', () => {
    const content = readFixture('many-groups.md');
    const parsed = parseContent(content);
    const doc = transform(parsed, 'BB Data Courses');
    expect(doc.items.length).toBeGreaterThan(0);
    const hasGroups = doc.items.some(i => i.type === 'group');
    expect(hasGroups).toBe(true);
  });

  it('transforms sublevels.md end-to-end', () => {
    const content = readFixture('sublevels.md');
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Sublevels');
    expect(doc.title).toBe('Sublevels');
    expect(doc.items.length).toBeGreaterThan(0);
  });
});

// ── transform – sublevels ──────────────────────────────────────────

describe('transform – sublevels', () => {
  it('transforms sublevel links with targets', () => {
    const content = `- My Group
    * Sub
        - https://example.com`;
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Test');
    const group = doc.items[0] as HTMLGroup;
    const sublevel = group.children[0] as HTMLSublevel;
    expect(sublevel.type).toBe('sublevel');
    expect(sublevel.links).toHaveLength(1);
    expect(sublevel.links[0].target).toMatch(/^[0-9a-f]{8}$/);
    expect(sublevel.links[0].urlHash).toBe(sublevel.links[0].target);
  });

  it('preserves mixed children ordering through transform', () => {
    const content = `- Group
    * Sub A
        - https://a.com
    - https://direct.com
    * Sub B
        - https://b.com`;
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Test');
    const group = doc.items[0] as HTMLGroup;
    expect(group.children).toHaveLength(3);
    expect(group.children[0].type).toBe('sublevel');
    expect(group.children[1].type).toBe('link');
    expect(group.children[2].type).toBe('sublevel');
  });

  it('preserves sublevel comment through transform', () => {
    const content = `- Group
    * Docs # important
        - https://docs.example.com`;
    const parsed = parseContent(content);
    const doc = transform(parsed, 'Test');
    const group = doc.items[0] as HTMLGroup;
    const sublevel = group.children[0] as HTMLSublevel;
    expect(sublevel.comment).toBe('important');
  });
});
