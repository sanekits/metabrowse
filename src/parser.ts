/** Parser module: Parse markdown content, identify sections/groups/links, extract metadata. */

export interface Link {
  url: string;
  text: string | null;
  target: string | null; // Explicit target from {target="..."}
  rawHtml: string | null; // If this is a pass-through HTML link
  indentLevel: number;
  comment: string | null; // Comment after # on the same line
  type: 'link';
}

export interface Group {
  name: string;
  links: Link[];
  indentLevel: number;
  comment: string | null;
  type: 'group';
}

export interface Section {
  name: string;
  items: Array<Link | Group>;
  indentLevel: number;
  comment: string | null;
  type: 'section';
}

export interface ParsedDocument {
  items: Array<Link | Group | Section>;
}

// Regex patterns for different link formats
const PATTERN_HTML_LINK = /<a\s+href="([^"]+)"[^>]*>.*?<\/a>/i;
const PATTERN_MD_LINK_WITH_TARGET = /\[([^\]]+)\]\(([^)]+)\)\{target="([^"]+)"\}/;
const PATTERN_MD_LINK = /\[([^\]]+)\]\(([^)]+)\)/;
// Match URLs with :// (http, https, ftp, chrome, edge, vscode, ssh, etc.)
// and specific schemes without :// (mailto:, tel:, about:)
const PATTERN_BARE_URL = /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]+|(?:mailto|tel|about):[^\s]+/;

function makeLink(opts: Partial<Link> & { url: string }): Link {
  return {
    text: null,
    target: null,
    rawHtml: null,
    indentLevel: 0,
    comment: null,
    type: 'link',
    ...opts,
  };
}

/**
 * Extract comment from a line (everything after # that is preceded by whitespace).
 * Handles # inside URL fragments correctly.
 */
export function extractComment(text: string): [string, string | null] {
  if (!text.includes('#')) {
    return [text.trim(), null];
  }

  // Find the first # that's preceded by whitespace (or at position 0)
  let commentPos = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '#' && (i === 0 || /\s/.test(text[i - 1]))) {
      commentPos = i;
      break;
    }
  }

  if (commentPos === -1) {
    return [text.trim(), null];
  }

  const content = text.slice(0, commentPos).trim();
  const comment = text.slice(commentPos + 1).trim();

  return [content, comment || null];
}

/**
 * Parse a single line and extract link information.
 * Returns null if the line doesn't contain a recognized link.
 */
function parseLinkLine(line: string, indent: number): Link | null {
  let stripped = line.trim();

  // Remove leading "- " if present
  if (stripped.startsWith('- ')) {
    stripped = stripped.slice(2).trim();
  }

  // Extract comment from the line (before parsing link formats)
  const [withoutComment, comment] = extractComment(stripped);
  stripped = withoutComment;

  // 1. Check for HTML pass-through
  const htmlMatch = PATTERN_HTML_LINK.exec(stripped);
  if (htmlMatch) {
    return makeLink({
      url: htmlMatch[1],
      rawHtml: htmlMatch[0],
      indentLevel: indent,
      comment,
    });
  }

  // 2. Check for markdown link with explicit target
  const mdTargetMatch = PATTERN_MD_LINK_WITH_TARGET.exec(stripped);
  if (mdTargetMatch) {
    return makeLink({
      url: mdTargetMatch[2],
      text: mdTargetMatch[1],
      target: mdTargetMatch[3],
      indentLevel: indent,
      comment,
    });
  }

  // 3. Check for regular markdown link
  const mdMatch = PATTERN_MD_LINK.exec(stripped);
  if (mdMatch) {
    return makeLink({
      url: mdMatch[2],
      text: mdMatch[1],
      indentLevel: indent,
      comment,
    });
  }

  // 4. Check for bare URL or "Title text URL" format
  const urlMatch = PATTERN_BARE_URL.exec(stripped);
  if (urlMatch) {
    const url = urlMatch[0];
    const textBefore = stripped.slice(0, urlMatch.index).trim();
    const title = textBefore || null;

    return makeLink({
      url,
      text: title,
      indentLevel: indent,
      comment,
    });
  }

  return null;
}

/**
 * Parse markdown content string and return structured data.
 * This is the main entry point — takes content as a string, not a file path.
 */
export function parseContent(content: string): ParsedDocument {
  const lines = content.split('\n');
  const topLevelItems: Array<Link | Group | Section> = [];

  let currentSection: Section | null = null;
  let currentGroup: Group | null = null;
  let currentGroupIndent = -1;

  function flushGroup() {
    if (currentGroup === null) return;
    if (currentSection !== null) {
      currentSection.items.push(currentGroup);
    } else {
      topLevelItems.push(currentGroup);
    }
    currentGroup = null;
    currentGroupIndent = -1;
  }

  function flushSection() {
    if (currentSection === null) return;
    topLevelItems.push(currentSection);
    currentSection = null;
  }

  function addItem(item: Link | Group) {
    if (currentSection !== null) {
      currentSection.items.push(item);
    } else {
      topLevelItems.push(item);
    }
  }

  for (const line of lines) {
    // Measure indentation
    const indent = line.length - line.trimStart().length;
    const stripped = line.trim();

    if (!stripped) continue;

    // Check for ## section header
    if (stripped.startsWith('## ')) {
      flushGroup();
      flushSection();
      const sectionText = stripped.slice(3).trim();
      const [sectionName, sectionComment] = extractComment(sectionText);
      currentSection = {
        name: sectionName,
        items: [],
        indentLevel: 0,
        comment: sectionComment,
        type: 'section',
      };
      continue;
    }

    // Try to parse the line as a link
    const link = parseLinkLine(line, indent);

    if (link) {
      // Check if this link belongs to current group
      if (currentGroup && indent > currentGroupIndent) {
        currentGroup.links.push(link);
      } else {
        // Exited the group
        flushGroup();
        addItem(link);
      }
    } else if (stripped.startsWith('- ')) {
      // Not a link, but starts with "- " -> it's a group header
      flushGroup();

      const groupText = stripped.slice(2).trim();
      const [groupName, groupComment] = extractComment(groupText);
      currentGroup = {
        name: groupName,
        links: [],
        indentLevel: indent,
        comment: groupComment,
        type: 'group',
      };
      currentGroupIndent = indent;
    }
  }

  // Flush remaining group and section
  flushGroup();
  flushSection();

  return { items: topLevelItems };
}
