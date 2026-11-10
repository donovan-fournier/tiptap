import type { Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'

export interface DragImageContext {
  /**
   * The editor the drag started in.
   */
  editor: Editor
  /**
   * The dragged node. For multi-block drags, the first dragged node.
   */
  node: PMNode
  /**
   * The document position of `node`.
   */
  pos: number
  /**
   * The DOM element of `node`.
   */
  element: Element
}

/**
 * Returns the element to show as the drag image, or `null` for no visible drag image.
 */
export type DragImageRenderer = (context: DragImageContext) => HTMLElement | null
