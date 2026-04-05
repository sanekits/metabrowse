import { EditorView } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { vim, Vim } from '@replit/codemirror-vim';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';

export interface EditorCallbacks {
  onSave: () => Promise<void>;
  onQuit: (force: boolean) => void;
}

const WRAP_KEY = 'metabrowse_line_wrap';

function getWrapPref(): boolean {
  return localStorage.getItem(WRAP_KEY) !== 'false'; // default on
}

function setWrapPref(on: boolean): void {
  localStorage.setItem(WRAP_KEY, String(on));
}

let editorView: EditorView | null = null;
const wrapCompartment = new Compartment();

export function createEditor(
  parent: HTMLElement,
  content: string,
  callbacks: EditorCallbacks,
): EditorView {
  destroyEditor();

  Vim.defineEx('w', 'w', () => {
    callbacks.onSave();
  });

  Vim.defineEx('q', 'q', (_cm: unknown, params: { argString?: string; bang?: boolean }) => {
    const force = params?.bang ?? false;
    callbacks.onQuit(force);
  });

  Vim.defineEx('wq', 'wq', async () => {
    await callbacks.onSave();
    callbacks.onQuit(false);
  });

  Vim.defineEx('wrap', 'wrap', () => {
    if (!editorView) return;
    const nowOn = !getWrapPref();
    setWrapPref(nowOn);
    editorView.dispatch({
      effects: wrapCompartment.reconfigure(nowOn ? EditorView.lineWrapping : []),
    });
  });

  Vim.map('jk', '<Esc>', 'insert');

  // Sync vim registers with the system clipboard so yank/paste work across
  // the browser boundary without needing the "+ register prefix.
  const rc = (Vim as any).getRegisterController();
  const origPush = rc.pushText.bind(rc);
  rc.pushText = (
    regName: string | null | undefined,
    op: string,
    text: string,
    linewise?: boolean,
    blockwise?: boolean,
  ) => {
    origPush(regName, op, text, linewise, blockwise);
    if (regName !== '_') {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const state = EditorState.create({
    doc: content,
    extensions: [
      vim(),
      basicSetup,
      markdown({ codeLanguages: languages }),
      oneDark,
      wrapCompartment.of(getWrapPref() ? EditorView.lineWrapping : []),
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-vim-panel': {
          background: '#45475a',
          color: '#cdd6f4',
          padding: '2px 6px',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontSize: '14px',
        },
        '.cm-vim-panel input': {
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#cdd6f4',
          fontFamily: 'inherit',
          fontSize: 'inherit',
        },
      }),
    ],
  });

  editorView = new EditorView({ state, parent });

  // Pull system clipboard into unnamed register on focus so `p` pastes
  // content copied from outside the editor.
  editorView.contentDOM.addEventListener('focus', () => {
    navigator.clipboard.readText().then((text) => {
      if (text) {
        rc.unnamedRegister.setText(text);
      }
    }).catch(() => {});
  });

  editorView.focus();
  return editorView;
}

export function getEditorContent(): string {
  if (!editorView) return '';
  return editorView.state.doc.toString();
}

export function isEditorDirty(original: string): boolean {
  return getEditorContent() !== original;
}

export function destroyEditor(): void {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
}
