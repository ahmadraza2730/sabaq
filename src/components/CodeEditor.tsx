"use client";

import { indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.modifier, t.operatorKeyword, t.definitionKeyword], color: "var(--code-keyword)" },
  { tag: [t.typeName, t.className, t.standard(t.typeName)], color: "var(--code-type)" },
  { tag: [t.string, t.special(t.string), t.character], color: "var(--code-string)" },
  { tag: [t.number, t.bool, t.null], color: "var(--code-number)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--code-comment)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--code-function)" },
  { tag: [t.processingInstruction, t.meta], color: "var(--code-keyword)" },
]);

const theme = EditorView.theme({
  "&": {
    backgroundColor: "var(--code-bg)",
    color: "var(--color-ink)",
    fontSize: "14px",
    height: "100%",
  },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    lineHeight: "1.55",
  },
  ".cm-content": { caretColor: "var(--color-ink)" },
  ".cm-cursor": { borderLeftColor: "var(--color-ink)" },
  ".cm-gutters": {
    backgroundColor: "var(--code-gutter)",
    color: "var(--color-ink-soft)",
    borderRight: "2px solid var(--color-margin)",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--color-rule) 25%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--color-ink)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--code-select) !important",
  },
  ".cm-matchingBracket": { outline: "1px solid var(--color-ink-soft)", backgroundColor: "transparent" },
  ".cm-tooltip": { backgroundColor: "var(--color-sheet)", border: "1px solid var(--color-rule)" },
  ".cm-panels": { backgroundColor: "var(--color-sheet)", color: "var(--color-ink)" },
});

export function CodeEditor({
  value,
  language,
  onChange,
  onRun,
  label,
}: {
  value: string;
  language: "cpp" | "java";
  onChange: (code: string) => void;
  onRun?: () => void;
  label: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const langSlot = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                onRunRef.current?.();
                return true;
              },
            },
            indentWithTab,
          ]),
          indentUnit.of("    "),
          EditorState.tabSize.of(4),
          langSlot.current.of(language === "java" ? java() : cpp()),
          syntaxHighlighting(highlight),
          theme,
          EditorView.contentAttributes.of({ "aria-label": label }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => editor.destroy();
    // The editor is created once; value and language changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    view.current?.dispatch({
      effects: langSlot.current.reconfigure(language === "java" ? java() : cpp()),
    });
  }, [language]);

  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />;
}
