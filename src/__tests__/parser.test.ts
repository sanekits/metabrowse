import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseContent, extractComment } from '../parser.ts';
import type { Link, Group, Section } from '../parser.ts';

const fixturesDir = join(import.meta.dirname, 'fixtures');

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf-8');
}

// ── extractComment ──────────────────────────────────────────────────

describe('extractComment', () => {
  it('returns null comment when no # present', () => {
    expect(extractComment('hello world')).toEqual(['hello world', null]);
  });

  it('extracts comment after space-#', () => {
    expect(extractComment('link text # my comment')).toEqual(['link text', 'my comment']);
  });

  it('does not split on # inside URL fragments', () => {
    expect(extractComment('https://example.com/page#section')).toEqual([
      'https://example.com/page#section',
      null,
    ]);
  });

  it('extracts comment after URL with fragment', () => {
    expect(extractComment('https://example.com/page#section # this is a comment')).toEqual([
      'https://example.com/page#section',
      'this is a comment',
    ]);
  });

  it('returns null comment for empty comment text', () => {
    expect(extractComment('text #')).toEqual(['text', null]);
  });

  it('handles # at start of line', () => {
    expect(extractComment('# heading')).toEqual(['', 'heading']);
  });
});

// ── Link format recognition ─────────────────────────────────────────

describe('parseContent – link formats', () => {
  it('parses bare URLs', () => {
    const doc = parseContent('- https://example.com');
    expect(doc.items).toHaveLength(1);
    const link = doc.items[0] as Link;
    expect(link.type).toBe('link');
    expect(link.url).toBe('https://example.com');
    expect(link.text).toBeNull();
  });

  it('parses "Title URL" format', () => {
    const doc = parseContent('- My Title https://example.com');
    const link = doc.items[0] as Link;
    expect(link.text).toBe('My Title');
    expect(link.url).toBe('https://example.com');
  });

  it('parses markdown links', () => {
    const doc = parseContent('- [Link Text](https://example.com)');
    const link = doc.items[0] as Link;
    expect(link.text).toBe('Link Text');
    expect(link.url).toBe('https://example.com');
  });

  it('parses markdown links with explicit target', () => {
    const doc = parseContent('- [Link](https://example.com){target="_blank"}');
    const link = doc.items[0] as Link;
    expect(link.text).toBe('Link');
    expect(link.url).toBe('https://example.com');
    expect(link.target).toBe('_blank');
  });

  it('parses HTML pass-through links', () => {
    const doc = parseContent('- <a href="https://example.com">Text</a>');
    const link = doc.items[0] as Link;
    expect(link.url).toBe('https://example.com');
    expect(link.rawHtml).toBe('<a href="https://example.com">Text</a>');
  });

  it('parses mailto: links', () => {
    const doc = parseContent('- mailto:user@example.com');
    const link = doc.items[0] as Link;
    expect(link.url).toBe('mailto:user@example.com');
  });

  it('parses chrome:// links', () => {
    const doc = parseContent('- chrome://settings');
    const link = doc.items[0] as Link;
    expect(link.url).toBe('chrome://settings');
  });

  it('parses edge:// links', () => {
    const doc = parseContent('- edge://newtab/');
    const link = doc.items[0] as Link;
    expect(link.url).toBe('edge://newtab/');
  });

  it('extracts comments from links', () => {
    const doc = parseContent('- https://example.com # Great site');
    const link = doc.items[0] as Link;
    expect(link.url).toBe('https://example.com');
    expect(link.comment).toBe('Great site');
  });

  it('preserves URL fragments (# in URL)', () => {
    const doc = parseContent('- https://example.com/page#section');
    const link = doc.items[0] as Link;
    expect(link.url).toBe('https://example.com/page#section');
    expect(link.comment).toBeNull();
  });

  it('handles URL with fragment AND comment', () => {
    const doc = parseContent('- https://example.com/page#section # A comment');
    const link = doc.items[0] as Link;
    expect(link.url).toBe('https://example.com/page#section');
    expect(link.comment).toBe('A comment');
  });
});

// ── Groups ──────────────────────────────────────────────────────────

describe('parseContent – groups', () => {
  it('recognizes group headers (- without URL)', () => {
    const content = `- My Group
    - https://example.com
    - https://other.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(1);
    const group = doc.items[0] as Group;
    expect(group.type).toBe('group');
    expect(group.name).toBe('My Group');
    expect(group.links).toHaveLength(2);
  });

  it('extracts group comments', () => {
    const content = `- Resources # Important stuff
    - https://example.com`;
    const doc = parseContent(content);
    const group = doc.items[0] as Group;
    expect(group.name).toBe('Resources');
    expect(group.comment).toBe('Important stuff');
  });

  it('ends group when indentation returns to group level', () => {
    const content = `- Group A
    - https://a.com
- https://standalone.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(2);
    expect((doc.items[0] as Group).type).toBe('group');
    expect((doc.items[0] as Group).links).toHaveLength(1);
    expect((doc.items[1] as Link).type).toBe('link');
    expect((doc.items[1] as Link).url).toBe('https://standalone.com');
  });

  it('handles multiple consecutive groups', () => {
    const content = `- Group 1
    - https://a.com
- Group 2
    - https://b.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(2);
    expect((doc.items[0] as Group).name).toBe('Group 1');
    expect((doc.items[1] as Group).name).toBe('Group 2');
  });
});

// ── Sections ────────────────────────────────────────────────────────

describe('parseContent – sections', () => {
  it('recognizes ## section headers', () => {
    const content = `## My Section
- https://example.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(1);
    const section = doc.items[0] as Section;
    expect(section.type).toBe('section');
    expect(section.name).toBe('My Section');
    expect(section.items).toHaveLength(1);
  });

  it('extracts section comments', () => {
    const content = `## Section # Comment here
- https://example.com`;
    const doc = parseContent(content);
    const section = doc.items[0] as Section;
    expect(section.name).toBe('Section');
    expect(section.comment).toBe('Comment here');
  });

  it('groups within sections work', () => {
    const content = `## Resources
- Dev Tools
    - https://github.com
    - https://gitlab.com
- https://standalone.com`;
    const doc = parseContent(content);
    const section = doc.items[0] as Section;
    expect(section.items).toHaveLength(2);
    expect(section.items[0].type).toBe('group');
    expect(section.items[1].type).toBe('link');
  });

  it('multiple sections are parsed independently', () => {
    const content = `## Section 1
- https://a.com
## Section 2
- https://b.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(2);
    expect((doc.items[0] as Section).name).toBe('Section 1');
    expect((doc.items[1] as Section).name).toBe('Section 2');
  });
});

// ── Blank lines and edge cases ──────────────────────────────────────

describe('parseContent – edge cases', () => {
  it('skips blank lines', () => {
    const content = `- https://a.com

- https://b.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(2);
  });

  it('handles empty content', () => {
    const doc = parseContent('');
    expect(doc.items).toHaveLength(0);
  });

  it('ignores # title lines (H1)', () => {
    const content = `# Title
- https://example.com`;
    const doc = parseContent(content);
    // The # title line is not a section (## is), and not a link,
    // so it's ignored. Only the link is parsed.
    expect(doc.items).toHaveLength(1);
    expect((doc.items[0] as Link).url).toBe('https://example.com');
  });

  it('handles lines without - prefix that contain URLs', () => {
    // Lines without "- " prefix but containing URLs should still be ignored
    // because metabrowse content always uses "- " prefix
    const content = `https://example.com`;
    const doc = parseContent(content);
    // The parser does try to parse any line as a link, not just "- " prefixed ones
    // This matches the Python behavior
    expect(doc.items).toHaveLength(1);
  });
});

// ── Real fixture files ──────────────────────────────────────────────

describe('parseContent – real fixtures', () => {
  it('parses root.md without errors', () => {
    const content = readFixture('root.md');
    const doc = parseContent(content);
    // Should have sections: "Home base", "Metabrowse + Notehub", "?", "News", "UNSORTED"
    expect(doc.items.length).toBeGreaterThanOrEqual(4);
    // All items should be sections (all start with ##)
    for (const item of doc.items) {
      expect(item.type).toBe('section');
    }
  });

  it('parses many-groups.md (BB-Data-Courses) without errors', () => {
    const content = readFixture('many-groups.md');
    const doc = parseContent(content);
    // Should have a mix of groups and standalone links
    expect(doc.items.length).toBeGreaterThan(0);
    // Check that groups contain links
    const groups = doc.items.filter(i => i.type === 'group') as Group[];
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.links.length).toBeGreaterThan(0);
    }
  });

  it('parses nested-groups.md (tdoc) without errors', () => {
    const content = readFixture('nested-groups.md');
    const doc = parseContent(content);
    expect(doc.items.length).toBeGreaterThan(0);
  });

  it('parses emoji-prefixed link text correctly', () => {
    // From root.md: "- ➡️ T o d a y https://..."
    const content = readFixture('root.md');
    const doc = parseContent(content);
    const section = doc.items[0] as Section;
    const firstLink = section.items[0] as Link;
    expect(firstLink.type).toBe('link');
    expect(firstLink.url).toContain('ghes');
  });

  it('preserves URL fragments in real content', () => {
    // From root.md: URLs with #gid= query fragments
    const content = readFixture('root.md');
    const doc = parseContent(content);
    // Find the UNSORTED section with the Google Sheets URL
    const unsorted = doc.items.find(
      i => i.type === 'section' && (i as Section).name === 'UNSORTED'
    ) as Section;
    expect(unsorted).toBeDefined();
    const link = unsorted.items[0] as Link;
    expect(link.url).toContain('#gid=');
    expect(link.comment).toBe('Lots of tasks and notes, archive');
  });
});
