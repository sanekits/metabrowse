import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { vim, Vim } from '@replit/codemirror-vim';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';

export interface EditorCallbacks {
  onSave: () => Promise<void>;
  onQuit: (force: boolean) => void;
}

let editorView: EditorView | null = null;

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
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
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
