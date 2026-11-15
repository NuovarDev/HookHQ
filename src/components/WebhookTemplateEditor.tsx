"use client";

import { useEffect, useRef } from "react";
import loader from "@monaco-editor/loader";
import { useTheme } from "next-themes";
import type * as Monaco from "monaco-editor";
import type { EventTypeVariable } from "@/lib/webhookApi";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  variables: EventTypeVariable[];
  height?: number;
};

const variablesByModel = new Map<string, EventTypeVariable[]>();
let providersRegistered = false;

const templateFilters = [
  ["append", "Append text or a value."],
  ["base64_decode", "Decode a Base64 value."],
  ["base64_encode", "Encode a value as Base64."],
  ["capitalize", "Capitalize the first character."],
  ["concat", "Concatenate arrays."],
  ["date", "Format a date or timestamp."],
  ["downcase", "Convert text to lowercase."],
  ["escape", "HTML-escape text."],
  ["first", "Return the first item."],
  ["join", "Join array values into text."],
  ["json", "Serialize a value for use in JSON."],
  ["last", "Return the last item."],
  ["lstrip", "Remove leading whitespace."],
  ["prepend", "Prepend text or a value."],
  ["replace", "Replace text."],
  ["rstrip", "Remove trailing whitespace."],
  ["size", "Return a string or array length."],
  ["slice", "Extract a substring or array slice."],
  ["split", "Split text into an array."],
  ["strip", "Remove leading and trailing whitespace."],
  ["strip_newlines", "Remove newline characters."],
  ["truncate", "Truncate text to a length."],
  ["truncatewords", "Truncate text to a word count."],
  ["upcase", "Convert text to uppercase."],
  ["url_decode", "Decode URL-encoded text."],
  ["url_encode", "URL-encode text."],
] as const;

const templateTags = [
  ["if", "Render content when a condition is true.", " if condition %}\n\t\n{% endif %}"],
  ["elsif", "Add another condition to an if or unless block.", " elsif condition %}"],
  ["else", "Render a fallback branch.", " else %}"],
  ["endif", "Close an if block.", " endif %}"],
  ["unless", "Render content when a condition is false.", " unless condition %}\n\t\n{% endunless %}"],
  ["endunless", "Close an unless block.", " endunless %}"],
  ["case", "Choose content using when clauses.", " case value %}\n\t{% when value %}\n\t\t\n{% endcase %}"],
  ["when", "Add a matching branch to a case block.", " when value %}"],
  ["endcase", "Close a case block.", " endcase %}"],
  ["for", "Loop through an array.", " for item in items %}\n\t\n{% endfor %}"],
  ["endfor", "Close a for loop.", " endfor %}"],
  ["comment", "Exclude content from output.", " comment %}\n\t${0}\n{% endcomment %}"],
  ["endcomment", "Close a comment block.", " endcomment %}"],
  ["break", "Exit the current for loop.", " break %}"],
  ["continue", "Continue to the next for loop item.", " continue %}"],
] as const;

function completionRange(
  monaco: typeof Monaco,
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
  length: number
) {
  const suffix = model.getLineContent(position.lineNumber).slice(position.column - 1);
  const closingLength = suffix.startsWith("}}") || suffix.startsWith("%}") ? 2 : suffix.startsWith("}") ? 1 : 0;
  return new monaco.Range(
    position.lineNumber,
    position.column - length,
    position.lineNumber,
    position.column + closingLength
  );
}

function getTemplateToken(model: Monaco.editor.ITextModel, position: Monaco.Position) {
  const word = model.getWordAtPosition(position);
  if (!word) return null;
  const before = model.getValueInRange({
    startLineNumber: position.lineNumber,
    startColumn: Math.max(1, word.startColumn - 2),
    endLineNumber: position.lineNumber,
    endColumn: word.startColumn,
  });
  const after = model.getValueInRange({
    startLineNumber: position.lineNumber,
    startColumn: word.endColumn,
    endLineNumber: position.lineNumber,
    endColumn: Math.min(model.getLineMaxColumn(position.lineNumber), word.endColumn + 2),
  });
  return before === "{{" && after === "}}" ? word : null;
}

function registerTemplateProviders(monaco: typeof Monaco) {
  if (providersRegistered) return;
  providersRegistered = true;

  monaco.languages.registerCompletionItemProvider("json", {
    triggerCharacters: ["{", "%", "|"],
    provideCompletionItems(model, position) {
      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const tagMatch = linePrefix.match(/{%([^%]*)$/);
      if (tagMatch) {
        const range = completionRange(monaco, model, position, tagMatch[1].length);
        return {
          suggestions: templateTags.map(([name, description, insertText]) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.Keyword,
            detail: description,
            documentation: { value: description },
            insertText,
            range,
          })),
        };
      }

      const outputMatch = linePrefix.match(/{{([^}]*)$/);
      if (!outputMatch) return { suggestions: [] };
      const variables = variablesByModel.get(model.uri.toString()) ?? [];
      const filterMatch = outputMatch[1].match(/\|\s*([^|\s]*)$/);
      if (filterMatch) {
        const range = new monaco.Range(
          position.lineNumber,
          position.column - filterMatch[1].length,
          position.lineNumber,
          position.column
        );
        return {
          suggestions: templateFilters.map(([name, description]) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.Function,
            detail: description,
            documentation: { value: description },
            insertText: name,
            range,
          })),
        };
      }

      const range = completionRange(monaco, model, position, outputMatch[1].length);
      return {
        suggestions: variables.map(variable => ({
          label: variable.name,
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: variable.description,
          documentation: { value: `${variable.description}\n\nExample: \`${variable.example}\`` },
          insertText: ` ${variable.name} }}`,
          sortText: `0-${variable.name}`,
          range,
        })),
      };
    },
  });

  monaco.languages.registerHoverProvider("json", {
    provideHover(model, position) {
      const token = getTemplateToken(model, position);
      const variable =
        token && (variablesByModel.get(model.uri.toString()) ?? []).find(item => item.name === token.word);
      if (!token || !variable) return null;
      return {
        range: new monaco.Range(position.lineNumber, token.startColumn - 2, position.lineNumber, token.endColumn + 2),
        contents: [{ value: `**${variable.name}**\n\n${variable.description}\n\nExample: \`${variable.example}\`` }],
      };
    },
  });
}

export default function WebhookTemplateEditor({ id, value, onChange, variables, height = 240 }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<Monaco.editor.ITextModel | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let disposed = false;
    let editor: Monaco.editor.IStandaloneCodeEditor | undefined;

    loader.init().then(monaco => {
      if (disposed || !elementRef.current) return;
      registerTemplateProviders(monaco);
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: false });
      const model = monaco.editor.createModel(value, "json", monaco.Uri.parse(`inmemory://hookhq/${id}.json`));
      variablesByModel.set(model.uri.toString(), variables);
      modelRef.current = model;
      editor = monaco.editor.create(elementRef.current, {
        model,
        theme: resolvedTheme === "dark" ? "vs-dark" : "vs",
        automaticLayout: true,
        minimap: { enabled: false },
        fixedOverflowWidgets: true,
        quickSuggestions: { other: true, comments: true, strings: true },
        suggestOnTriggerCharacters: true,
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        fontSize: 13,
      });
      editorRef.current = editor ?? null;
      model.onDidChangeContent(() => {
        onChange(model.getValue());
        const position = editor?.getPosition();
        if (!position) return;
        const prefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
        if (/{{[^}]*$/.test(prefix) || /{%[^%]*$/.test(prefix) || /{{[^}]*\|\s*[^|]*$/.test(prefix)) {
          requestAnimationFrame(() => editor?.trigger("hookhq-template", "editor.action.triggerSuggest", {}));
        }
      });
    });

    return () => {
      disposed = true;
      if (modelRef.current) variablesByModel.delete(modelRef.current.uri.toString());
      editor?.dispose();
      modelRef.current?.dispose();
      editorRef.current = null;
      modelRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    const model = modelRef.current;
    if (!model || model.getValue() === value) return;
    model.setValue(value);
  }, [value]);

  useEffect(() => {
    const model = modelRef.current;
    if (model) variablesByModel.set(model.uri.toString(), variables);
  }, [variables]);

  useEffect(() => {
    editorRef.current?.updateOptions({ theme: resolvedTheme === "dark" ? "vs-dark" : "vs" });
  }, [resolvedTheme]);

  return (
    <div
      ref={elementRef}
      className="relative z-0 rounded-md border bg-background [&_.monaco-editor_.monaco-hover]:z-[70] [&_.monaco-editor_.suggest-widget]:z-[70]"
      style={{ height }}
    />
  );
}
