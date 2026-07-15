"use client";

import "@wangeditor/editor/dist/css/style.css";
import { useEffect, useState } from "react";
import { Editor, Toolbar } from "@wangeditor/editor-for-react";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";

interface RichTextEditorProps {
  value: string; // 富文本 HTML
  onChange: (html: string) => void;
  placeholder?: string;
}

// 不提供编辑器内图片/视频上传（封面与音频走独立上传接口）
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ["group-image", "group-video", "fullScreen"],
};

/**
 * wangEditor 5 封装（受控）。
 * 只能在客户端渲染，使用方必须 `dynamic import` 且 `ssr: false` 加载本组件。
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const [editor, setEditor] = useState<IDomEditor | null>(null);

  // 组件销毁时同步销毁编辑器实例，防内存泄漏
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: placeholder || "请输入正文…",
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
