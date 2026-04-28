import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseContent, extractComment } from '../parser.ts';
import type { Link, Group, Sublevel, Section } from '../parser.ts';

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
    expect(group.children).toHaveLength(2);
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
    expect((doc.items[0] as Group).children).toHaveLength(1);
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

// ── Sublevels ──────────────────────────────────────────────────────

describe('parseContent – sublevels', () => {
  it('recognizes * sublevel marker inside a group', () => {
    const content = `- My Group
    * Sub Title
        - https://example.com
        - https://other.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(1);
    const group = doc.items[0] as Group;
    expect(group.children).toHaveLength(1);
    const sublevel = group.children[0] as Sublevel;
    expect(sublevel.type).toBe('sublevel');
    expect(sublevel.name).toBe('Sub Title');
    expect(sublevel.links).toHaveLength(2);
  });

  it('handles multiple sublevels in one group', () => {
    const content = `- Links
    * Video
        - https://youtube.com
    * News
        - https://cnn.com
        - https://bbc.com`;
    const doc = parseContent(content);
    const group = doc.items[0] as Group;
    expect(group.children).toHaveLength(2);
    expect((group.children[0] as Sublevel).name).toBe('Video');
    expect((group.children[0] as Sublevel).links).toHaveLength(1);
    expect((group.children[1] as Sublevel).name).toBe('News');
    expect((group.children[1] as Sublevel).links).toHaveLength(2);
  });

  it('preserves mixed children ordering (sublevels + direct links)', () => {
    const content = `- My Group
    * Sub A
        - https://a.com
    - https://direct.com
    * Sub B
        - https://b.com`;
    const doc = parseContent(content);
    const group = doc.items[0] as Group;
    expect(group.children).toHaveLength(3);
    expect(group.children[0].type).toBe('sublevel');
    expect(group.children[1].type).toBe('link');
    expect(group.children[2].type).toBe('sublevel');
  });

  it('extracts sublevel comments', () => {
    const content = `- Resources
    * Docs # the good stuff
        - https://docs.python.org`;
    const doc = parseContent(content);
    const group = doc.items[0] as Group;
    const sublevel = group.children[0] as Sublevel;
    expect(sublevel.name).toBe('Docs');
    expect(sublevel.comment).toBe('the good stuff');
  });

  it('renders orphan sublevel as code (no parent group)', () => {
    const content = `* No parent group
- https://example.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(2);
    const orphan = doc.items[0] as Link;
    expect(orphan.type).toBe('link');
    expect(orphan.rawHtml).toBe('<code>* No parent group</code>');
  });

  it('closes sublevel on indentation violation', () => {
    const content = `- Tools
    * Editors
        - https://code.visualstudio.com
            - https://misindented.com
        - https://vim.org`;
    const doc = parseContent(content);
    const group = doc.items[0] as Group;
    // Sublevel "Editors" should contain only VS Code (first child at indent 8)
    // The misindented line (indent 12) triggers close; it becomes a direct group child
    // vim.org (indent 8) is no longer in a sublevel, so it's also a direct group child
    const sublevel = group.children[0] as Sublevel;
    expect(sublevel.type).toBe('sublevel');
    expect(sublevel.links).toHaveLength(1);
    expect(sublevel.links[0].url).toBe('https://code.visualstudio.com');
    // misindented + vim.org become direct group children
    expect(group.children).toHaveLength(3);
    expect((group.children[1] as Link).url).toBe('https://misindented.com');
    expect((group.children[2] as Link).url).toBe('https://vim.org');
  });

  it('closes sublevel when new group starts', () => {
    const content = `- Group A
    * Sub
        - https://a.com
- Group B
    - https://b.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(2);
    const groupA = doc.items[0] as Group;
    expect(groupA.children).toHaveLength(1);
    expect((groupA.children[0] as Sublevel).links).toHaveLength(1);
    const groupB = doc.items[1] as Group;
    expect(groupB.children).toHaveLength(1);
  });

  it('closes sublevel when new section starts', () => {
    const content = `## Section 1
- My Group
    * Sub
        - https://a.com
## Section 2
- https://b.com`;
    const doc = parseContent(content);
    expect(doc.items).toHaveLength(2);
    const section1 = doc.items[0] as Section;
    const group = section1.items[0] as Group;
    expect((group.children[0] as Sublevel).links).toHaveLength(1);
  });

  it('flushes sublevel at EOF', () => {
    const content = `- Dev Tools
    * Editors
        - https://code.visualstudio.com`;
    const doc = parseContent(content);
    const group = doc.items[0] as Group;
    expect(group.children).toHaveLength(1);
    const sublevel = group.children[0] as Sublevel;
    expect(sublevel.name).toBe('Editors');
    expect(sublevel.links).toHaveLength(1);
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
      expect(group.children.length).toBeGreaterThan(0);
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

  it('parses sublevels.md with sublevels and orphan', () => {
    const content = readFixture('sublevels.md');
    const doc = parseContent(content);
    // 1 section ("Development") — orphan * line is inside the section (sections span to next ## or EOF)
    expect(doc.items).toHaveLength(1);
    const section = doc.items[0] as Section;
    expect(section.type).toBe('section');
    // Section has: Frontend group, Backend group, orphan link
    expect(section.items).toHaveLength(3);
    const frontend = section.items[0] as Group;
    expect(frontend.name).toBe('Frontend');
    // Frontend has: sublevel "Frameworks", sublevel "Build Tools", direct link
    expect(frontend.children).toHaveLength(3);
    expect(frontend.children[0].type).toBe('sublevel');
    expect((frontend.children[0] as Sublevel).name).toBe('Frameworks');
    expect((frontend.children[0] as Sublevel).links).toHaveLength(2);
    expect(frontend.children[1].type).toBe('sublevel');
    expect((frontend.children[1] as Sublevel).name).toBe('Build Tools');
    expect(frontend.children[2].type).toBe('link');
    // Orphan sublevel is the 3rd item in the section
    const orphan = section.items[2] as Link;
    expect(orphan.type).toBe('link');
    expect(orphan.rawHtml).toContain('<code>');
  });
});
