/** Tree management modal panel with keyboard navigation. */

import type { TreeEntry } from './github.ts';
import { createNode, deleteNode, confirmDeleteNodes, renameNode } from './tree-ops.ts';
import { logInfo } from './logging-client.ts';

interface TreeNode {
  name: string;
  dirPath: string;
  depth: number;
  children: TreeNode[];
  expanded: boolean;
}

interface AppState {
  token: string;
  host: string;
  owner: string;
  repo: string;
  contentPaths: string[];
  tree: TreeEntry[];
}

/**
 * Build a hierarchical tree from flat contentPaths.
 * E.g., ["teach", "teach/CPP", "teach/Python", "research"]
 * → root with children teach, research; teach with children CPP, Python.
 */
/**
 * Collect dirPaths of all expanded nodes in a tree.
 */
function getExpandedPaths(nodes: TreeNode[]): Set<string> {
  const expanded = new Set<string>();
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      if (node.expanded) expanded.add(node.dirPath);
      walk(node.children);
    }
  };
  walk(nodes);
  return expanded;
}

function buildTreeNodes(contentPaths: string[], expandedPaths?: Set<string>): TreeNode[] {
  const root: TreeNode[] = [];
  const pathMap: Record<string, TreeNode> = {};

  // Sort so parents always appear before children
  const sorted = contentPaths.filter(p => p !== '').sort();

  for (const dirPath of sorted) {
    const parts = dirPath.split('/');
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');

    const node: TreeNode = {
      name,
      dirPath,
      depth: parts.length - 1,
      children: [],
      expanded: expandedPaths ? expandedPaths.has(dirPath) : false,
    };

    pathMap[dirPath] = node;

    if (parentPath === '') {
      root.push(node);
    } else if (pathMap[parentPath]) {
      pathMap[parentPath].children.push(node);
    }
  }

  // Sort at each level
  const sortRecursive = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) {
      sortRecursive(node.children);
    }
  };
  sortRecursive(root);

  return root;
}


/**
 * Flatten tree into visible nodes (respecting expand state).
 */
function getVisibleNodes(nodes: TreeNode[]): TreeNode[] {
  const visible: TreeNode[] = [];
  const traverse = (list: TreeNode[]) => {
    for (const node of list) {
      visible.push(node);
      if (node.expanded && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };
  traverse(nodes);
  return visible;
}

/**
 * Show the tree management panel.
 */
export async function showTreePanel(
  state: AppState,
  refreshTree: () => Promise<string[]>,
): Promise<void> {
  logInfo(`TreePanel: showTreePanel called, contentPaths=${state.contentPaths.length}`);

  const overlay = document.createElement('div');
  overlay.className = 'tree-panel-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  const panel = document.createElement('div');
  panel.className = 'tree-panel';
  panel.style.cssText = `
    background: #1e1e1e;
    color: #e0e0e0;
    border: 1px solid #444;
    border-radius: 4px;
    width: 400px;
    height: 70vh;
    display: flex;
    flex-direction: column;
    font-family: monospace;
    font-size: 13px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 10px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  `;
  header.innerHTML = '<div>Tree Manager</div>';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: #e0e0e0;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
  `;
  closeBtn.addEventListener('click', () => overlay.remove());
  header.appendChild(closeBtn);

  panel.appendChild(header);

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = `
    padding: 8px 10px;
    border-bottom: 1px solid #444;
    font-size: 11px;
    color: #888;
    line-height: 1.4;
  `;
  toolbar.innerHTML = `
    <div>↑↓ Nav | → Expand | ← Collapse | Enter Go</div>
    <div>Ins New | Del Delete | F2 Rename | Esc Close</div>
  `;
  panel.appendChild(toolbar);

  // Tree list (scrollable)
  const listContainer = document.createElement('div');
  listContainer.className = 'tree-list';
  listContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    border-bottom: 1px solid #444;
  `;
  panel.appendChild(listContainer);

  // Status bar
  const status = document.createElement('div');
  status.className = 'tree-status';
  status.style.cssText = `
    padding: 8px 10px;
    border-bottom: 1px solid #444;
    min-height: 20px;
    font-size: 11px;
    color: #888;
  `;
  status.textContent = ''; // Hidden unless showing feedback
  panel.appendChild(status);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'tree-footer';
  footer.style.cssText = `
    padding: 8px 10px;
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  `;

  const closeFooterBtn = document.createElement('button');
  closeFooterBtn.textContent = 'Close';
  closeFooterBtn.style.cssText = `
    padding: 4px 8px;
    background: #333;
    color: #e0e0e0;
    border: 1px solid #555;
    border-radius: 2px;
    cursor: pointer;
    font-size: 12px;
  `;
  closeFooterBtn.addEventListener('click', () => overlay.remove());
  footer.appendChild(closeFooterBtn);

  panel.appendChild(footer);

  overlay.appendChild(panel);

  // State
  let treeRoot = buildTreeNodes(state.contentPaths);
  let selectedIndex = 0;
  let inputMode: 'new' | 'rename' | null = null;
  let inputNode: TreeNode | null = null;
  let pendingDelete: { paths: string[] } | null = null;
  let pendingFocusInput: HTMLInputElement | null = null;

  // Render function
  function render() {
    listContainer.innerHTML = '';
    const visible = getVisibleNodes(treeRoot);

    for (let i = 0; i < visible.length; i++) {
      const node = visible[i];
      const nodeEl = document.createElement('div');
      nodeEl.className = `tree-node${i === selectedIndex ? ' tree-node-selected' : ''}`;
      nodeEl.setAttribute('data-path', node.dirPath);
      nodeEl.style.cssText = `
        padding: 4px 8px;
        margin-left: ${node.depth * 16}px;
        cursor: pointer;
        border-left: 2px solid transparent;
        display: flex;
        align-items: center;
        gap: 4px;
        ${i === selectedIndex ? 'background: #333; border-left-color: #0ea5e9;' : 'border-left-color: transparent;'}
      `;

      // Expand icon
      const iconSpan = document.createElement('span');
      iconSpan.className = 'tree-expand-icon';
      iconSpan.textContent = node.children.length === 0 ? '·' : node.expanded ? '▼' : '▶';
      iconSpan.style.cssText = 'width: 12px; text-align: center; color: #888; flex-shrink: 0;';
      nodeEl.appendChild(iconSpan);

      // Name (or input for edit mode)
      const nameSpan = document.createElement('span');
      nameSpan.className = 'tree-node-name';
      nameSpan.textContent = node.name;
      nameSpan.style.cssText = 'flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
      nodeEl.appendChild(nameSpan);

      // Input field (if editing this node)
      if (inputMode && inputNode === node) {
        nameSpan.style.display = 'none';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = inputMode === 'rename' ? node.name : '';
        input.placeholder = inputMode === 'new' ? 'Name' : 'Rename';
        input.style.cssText = `
          flex: 1;
          background: #2a2a2a;
          color: #e0e0e0;
          border: 1px solid #0ea5e9;
          border-radius: 2px;
          padding: 2px 4px;
          font-family: monospace;
          font-size: 13px;
        `;

        const handleSubmit = async (value: string) => {
          if (!value.trim()) {
            inputMode = null;
            inputNode = null;
            render();
            return;
          }

          try {
            const wasNew = inputMode === 'new';
            const parentDirPath = node.dirPath;
            status.textContent = wasNew ? 'Creating...' : 'Renaming...';
            status.style.color = '#888';

            if (wasNew) {
              await createNode(state.host, state.token, state.owner, state.repo, node.dirPath, value.trim(), state.contentPaths);
            } else {
              await renameNode(state.host, state.token, state.owner, state.repo, node.dirPath, value.trim(), state.contentPaths);
            }

            inputMode = null;
            inputNode = null;
            const newPaths = await refreshTree();
            state.contentPaths = newPaths;
            // Preserve expand states, and auto-expand parent after Insert
            const expanded = getExpandedPaths(treeRoot);
            if (wasNew) expanded.add(parentDirPath);
            treeRoot = buildTreeNodes(newPaths, expanded);
            selectedIndex = Math.min(selectedIndex, getVisibleNodes(treeRoot).length - 1);
            status.textContent = '';
            render();
          } catch (err) {
            status.textContent = err instanceof Error ? err.message : String(err);
            status.style.color = '#f87171';
          }
        };

        input.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            handleSubmit(input.value);
          } else if (e.key === 'Escape') {
            inputMode = null;
            inputNode = null;
            render();
          }
        });

        nodeEl.appendChild(input);
        // Defer focus — element must be in the DOM first
        pendingFocusInput = input;
      }

      nodeEl.addEventListener('click', () => {
        selectedIndex = visible.indexOf(node);
        render();
      });

      listContainer.appendChild(nodeEl);
    }

    // Focus the input after all elements are in the DOM
    if (pendingFocusInput) {
      pendingFocusInput.focus();
      pendingFocusInput.select();
      pendingFocusInput = null;
    }
  }

  // Keyboard handler
  function handleKeydown(e: KeyboardEvent) {
    const visible = getVisibleNodes(treeRoot);
    const selectedNode = visible[selectedIndex];

    // If in input mode, only handle Escape (fallback if input didn't get focus)
    if (inputMode) {
      if (e.key === 'Escape') {
        e.preventDefault();
        inputMode = null;
        inputNode = null;
        render();
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(0, selectedIndex - 1);
      render();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(visible.length - 1, selectedIndex + 1);
      render();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (selectedNode && selectedNode.children.length > 0) {
        selectedNode.expanded = true;
        render();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (selectedNode) {
        if (selectedNode.expanded) {
          selectedNode.expanded = false;
          render();
        } else if (selectedNode.depth > 0) {
          // Jump to parent
          const parentPath = selectedNode.dirPath.slice(0, selectedNode.dirPath.lastIndexOf('/'));
          const parentNode = visible.find(n => n.dirPath === parentPath);
          if (parentNode) {
            selectedIndex = visible.indexOf(parentNode);
            render();
          }
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedNode) {
        location.hash = `#/${selectedNode.dirPath}`;
        overlay.remove();
      }
    } else if (e.key === 'Insert') {
      e.preventDefault();
      if (selectedNode && !pendingDelete) {
        inputMode = 'new';
        inputNode = selectedNode;
        render();
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      if (selectedNode && selectedNode.dirPath !== '' && !inputMode) {
        handleDelete(selectedNode);
      }
    } else if (e.key === 'F2') {
      e.preventDefault();
      if (selectedNode && !pendingDelete && !inputMode) {
        inputMode = 'rename';
        inputNode = selectedNode;
        render();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (inputMode) {
        inputMode = null;
        inputNode = null;
        render();
      } else if (pendingDelete) {
        pendingDelete = null;
        renderConfirmation();
      } else {
        overlay.remove();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      selectedIndex = 0;
      render();
    } else if (e.key === 'End') {
      e.preventDefault();
      selectedIndex = visible.length - 1;
      render();
    }
  }

  async function handleDelete(node: TreeNode) {
    try {
      status.textContent = 'Checking...';
      status.style.color = '#888';

      const result = await deleteNode(state.host, state.token, state.owner, state.repo, node.dirPath, state.contentPaths);

      if (result.needsConfirm) {
        pendingDelete = { paths: result.paths };
        renderConfirmation();
      } else {
        // Deleted single file, refresh
        const newPaths = await refreshTree();
        state.contentPaths = newPaths;
        const expanded = getExpandedPaths(treeRoot);
        treeRoot = buildTreeNodes(newPaths, expanded);
        selectedIndex = Math.min(selectedIndex, getVisibleNodes(treeRoot).length - 1);
        status.textContent = '';
        render();
        logInfo(`TreePanel: Deleted ${node.dirPath}`);
      }
    } catch (err) {
      status.textContent = err instanceof Error ? err.message : String(err);
      status.style.color = '#f87171';
    }
  }

  function renderConfirmation() {
    if (!pendingDelete) {
      footer.innerHTML = '';
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = `
        padding: 4px 8px;
        background: #333;
        color: #e0e0e0;
        border: 1px solid #555;
        border-radius: 2px;
        cursor: pointer;
        font-size: 12px;
      `;
      closeBtn.addEventListener('click', () => overlay.remove());
      footer.appendChild(closeBtn);
      return;
    }

    footer.innerHTML = '';
    status.textContent = `Delete ${pendingDelete.paths.length} node(s)?`;
    status.style.color = '#fbbf24';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 4px 8px;
      background: #333;
      color: #e0e0e0;
      border: 1px solid #555;
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
    `;
    cancelBtn.addEventListener('click', () => {
      pendingDelete = null;
      renderConfirmation();
      render();
    });
    footer.appendChild(cancelBtn);

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = `Confirm Delete ${pendingDelete.paths.length}`;
    confirmBtn.style.cssText = `
      padding: 4px 8px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
    `;
    confirmBtn.addEventListener('click', async () => {
      try {
        status.textContent = 'Deleting...';
        status.style.color = '#888';
        await confirmDeleteNodes(state.host, state.token, state.owner, state.repo, pendingDelete!.paths);
        const newPaths = await refreshTree();
        state.contentPaths = newPaths;
        const expanded = getExpandedPaths(treeRoot);
        treeRoot = buildTreeNodes(newPaths, expanded);
        selectedIndex = Math.min(selectedIndex, getVisibleNodes(treeRoot).length - 1);
        pendingDelete = null;
        status.textContent = '';
        renderConfirmation();
        render();
      } catch (err) {
        status.textContent = err instanceof Error ? err.message : String(err);
        status.style.color = '#f87171';
      }
    });
    footer.appendChild(confirmBtn);
  }

  // Wire events
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // Attach keyboard handler to document (panel is just a div, won't get focus)
  const keyListener = (e: KeyboardEvent) => {
    if (overlay.parentElement) {
      handleKeydown(e);
    }
  };
  document.addEventListener('keydown', keyListener);

  // Clean up listener when overlay is removed
  const originalRemove = overlay.remove.bind(overlay);
  overlay.remove = function() {
    document.removeEventListener('keydown', keyListener);
    originalRemove();
  };

  // Initial render
  render();
  renderConfirmation();
  document.body.appendChild(overlay);
}
