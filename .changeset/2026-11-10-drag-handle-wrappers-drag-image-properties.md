---
'@tiptap/extension-drag-handle-react': patch
'@tiptap/extension-drag-handle-vue': patch
---

The React and Vue `DragHandle` components now apply the `dragImageProperties` prop. Before, the prop was ignored and the drag preview always copied every computed style.
