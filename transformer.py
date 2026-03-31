"""Transformer module: Convert parsed structure to HTML-ready data."""

import hashlib
from dataclasses import dataclass, field
from typing import List, Optional
from parser import ParsedDocument, Link, Group, Section


@dataclass
class HTMLLink:
    """Link prepared for HTML rendering."""
    url: str
    text: str
    target: str
    raw_html: Optional[str] = None
    comment: Optional[str] = None
    url_hash: Optional[str] = None  # SHA256 hash for localStorage key
    type: str = "link"


@dataclass
class HTMLGroup:
    """Non-collapsible sub-group prepared for HTML rendering."""
    name: str
    links: List[HTMLLink]
    comment: Optional[str] = None
    type: str = "group"


@dataclass
class HTMLLinkGroup:
    """A group of consecutive standalone links, for clean <ul> wrapping."""
    links: List[HTMLLink]
    type: str = "link_group"


@dataclass
class HTMLSection:
    """Collapsible section prepared for HTML rendering."""
    name: str
    items: list = field(default_factory=list)  # Ordered HTMLLink, HTMLGroup, HTMLLinkGroup
    comment: Optional[str] = None
    type: str = "section"


@dataclass
class HTMLDocument:
    """Document structure ready for template rendering."""
    title: str
    items: list  # Ordered list of HTMLSection, HTMLGroup, HTMLLinkGroup


class Transformer:
    """Transform parsed data into HTML-ready structures."""

    @staticmethod
    def generate_target(url: str) -> str:
        """Generate a deterministic hash-based target name for a URL."""
        # Use SHA256 and take first 8 characters for readability
        hash_obj = hashlib.sha256(url.encode('utf-8'))
        return hash_obj.hexdigest()[:8]

    def transform(self, parsed_doc: ParsedDocument, title: str) -> HTMLDocument:
        """Transform a parsed document into HTML-ready structure."""
        items = self._transform_items(parsed_doc.items)

        return HTMLDocument(
            title=title,
            items=items
        )

    def _transform_items(self, items: list) -> list:
        """Transform a list of parsed items and coalesce consecutive links."""
        transformed = []
        for item in items:
            if isinstance(item, Section):
                transformed.append(self._transform_section(item))
            elif isinstance(item, Group):
                transformed.append(self._transform_group(item))
            elif isinstance(item, Link):
                transformed.append(self._transform_link(item))
        return self._coalesce_links(transformed)

    def _transform_section(self, section: Section) -> HTMLSection:
        """Transform a Section to HTMLSection."""
        items = self._transform_items(section.items)
        return HTMLSection(
            name=section.name,
            items=items,
            comment=section.comment
        )

    @staticmethod
    def _coalesce_links(items: list) -> list:
        """Group consecutive HTMLLink items into HTMLLinkGroup objects."""
        result = []
        pending_links = []

        def flush():
            if pending_links:
                result.append(HTMLLinkGroup(links=list(pending_links)))
                pending_links.clear()

        for item in items:
            if isinstance(item, HTMLLink):
                pending_links.append(item)
            else:
                flush()
                result.append(item)

        flush()
        return result

    # URL schemes that don't use :// authority syntax
    _SCHEMES_WITHOUT_AUTHORITY = ('mailto:', 'tel:', 'about:')

    @staticmethod
    def _has_scheme(url: str) -> bool:
        """Check if a URL has a scheme (e.g., http://, chrome://, mailto:)."""
        return '://' in url or url.startswith(Transformer._SCHEMES_WITHOUT_AUTHORITY)

    def _transform_link(self, link: Link) -> HTMLLink:
        """Transform a Link to HTMLLink with target generation."""
        # Determine if this is an external (payload) or internal (navigation) link
        # Any URL with a scheme is external; relative paths are internal
        is_external = self._has_scheme(link.url)

        # Use explicit target if provided
        if link.target:
            target = link.target
        elif is_external:
            # External links get hash-based targets for tab reuse
            target = self.generate_target(link.url)
        else:
            # Internal navigation links stay in the same tab
            target = "_self"

        # Use provided text or default to URL
        text = link.text if link.text else link.url

        # Generate hash for external http(s) links (for localStorage key)
        url_hash = None
        if is_external and link.url.startswith(('http://', 'https://')):
            url_hash = self.generate_target(link.url)  # Reuse existing hash

        return HTMLLink(
            url=link.url,
            text=text,
            target=target,
            raw_html=link.raw_html,
            comment=link.comment,
            url_hash=url_hash
        )

    def _transform_group(self, group: Group) -> HTMLGroup:
        """Transform a Group to HTMLGroup."""
        html_links = [self._transform_link(link) for link in group.links]

        return HTMLGroup(
            name=group.name,
            links=html_links,
            comment=group.comment
        )
