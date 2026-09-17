"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return (
      <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center gap-1">
        <div className="text-xs text-slate-400">Loading editor toolbar…</div>
      </div>
    );
  }

  const preventFocusLoss = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const getButtonClass = (isActive: boolean, isDisabled: boolean = false) => {
    const base =
      "w-8 h-8 flex items-center justify-center rounded transition-colors text-slate-600 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1";
    if (isDisabled) {
      return `${base} opacity-30 pointer-events-none cursor-not-allowed text-slate-400`;
    }
    if (isActive) {
      return `${base} bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-2xs`;
    }
    return `${base} hover:bg-slate-100 hover:text-slate-900 border border-transparent active:bg-slate-200`;
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting options"
      className="bg-white border-b border-slate-200/80 px-3 sm:px-4 py-1 flex items-center gap-1 sticky top-14 z-20 overflow-x-auto no-scrollbar shadow-2xs select-none"
    >
      {/* Undo / Redo Group */}
      <div className="flex items-center gap-0.5 pr-1.5 sm:pr-2 border-r border-slate-200/80">
        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={getButtonClass(false, !editor.can().undo())}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={getButtonClass(false, !editor.can().redo())}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Paragraph & Headings Group */}
      <div className="flex items-center gap-0.5 px-1.5 sm:px-2 border-r border-slate-200/80">
        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={getButtonClass(editor.isActive("paragraph"))}
          title="Paragraph"
        >
          <Pilcrow className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={getButtonClass(editor.isActive("heading", { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={getButtonClass(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`${getButtonClass(editor.isActive("heading", { level: 3 }))} hidden sm:flex`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Formatting: Bold, Italic, Underline */}
      <div className="flex items-center gap-0.5 px-1.5 sm:px-2 border-r border-slate-200/80">
        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={getButtonClass(editor.isActive("bold"))}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={getButtonClass(editor.isActive("italic"))}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={getButtonClass(editor.isActive("underline"))}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Lists: Bullet List, Numbered List */}
      <div className="flex items-center gap-0.5 pl-1.5 sm:pl-2">
        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={getButtonClass(editor.isActive("bulletList"))}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={preventFocusLoss}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={getButtonClass(editor.isActive("orderedList"))}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
