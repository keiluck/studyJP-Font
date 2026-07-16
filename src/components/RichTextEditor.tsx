"use client";

import "@wangeditor/editor/dist/css/style.css";
import { useEffect, useState } from "react";
import { Editor, Toolbar } from "@wangeditor/editor-for-react";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";

interface RichTextEditorProps {
  value: string; // リッチテキスト HTML
  onChange: (html: string) => void;
  placeholder?: string;
}

// エディタ内での画像/動画アップロードは提供しない（カバー画像と音声は専用のアップロードAPIを使用）
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ["group-image", "group-video", "fullScreen"],
};

/**
 * wangEditor 5 のラッパー（制御コンポーネント）。
 * クライアント側でのみ描画可能。利用側は本コンポーネントを `dynamic import` かつ `ssr: false` で読み込むこと。
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const [editor, setEditor] = useState<IDomEditor | null>(null);

  // コンポーネント破棄時にエディタインスタンスも同期的に破棄し、メモリリークを防ぐ
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: placeholder || "本文を入力してください…",
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 4 }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: "1px solid #ccc" }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        onChange={(e) => onChange(e.getHtml())}
        mode="default"
        style={{ height: 360, overflowY: "hidden" }}
      />
    </div>
  );
}
