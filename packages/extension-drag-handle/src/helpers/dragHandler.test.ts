import { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import { NodeRangeSelection } from '@tiptap/extension-node-range'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import { cloneElement } from './cloneElement.js'
import { dragHandler, getDragImageOffset, shouldResetMargin } from './dragHandler.js'
import { normalizeNestedOptions } from './normalizeOptions.js'

vi.mock('./cloneElement.js', async importOriginal => {
  const actual = await importOriginal<typeof import('./cloneElement.js')>()

  return { cloneElement: vi.fn(actual.cloneElement) }
})

describe('getDragImageOffset', () => {
  it('anchors ltr previews to the left edge', () => {
    expect(getDragImageOffset('ltr', 180)).toBe(0)
  })

  it('anchors rtl previews to the right edge', () => {
    expect(getDragImageOffset('rtl', 180)).toBe(180)
  })
})

describe('shouldResetMargin', () => {
  it('resets the margin when no properties are provided', () => {
    expect(shouldResetMargin(undefined)).toBe(true)
  })

  it('resets the margin when the properties do not include a margin', () => {
    expect(shouldResetMargin(['color', 'font-size'])).toBe(true)
  })

  it('keeps the margin when the shorthand margin is requested', () => {
    expect(shouldResetMargin(['margin'])).toBe(false)
  })

  it('keeps the margin for longhand and logical margin properties', () => {
    expect(shouldResetMargin(['margin-bottom'])).toBe(false)
    expect(shouldResetMargin(['margin-inline-start'])).toBe(false)
  })

  it('ignores surrounding whitespace in property names', () => {
    expect(shouldResetMargin([' margin-top '])).toBe(false)
  })
})

describe('dragHandler drag image', () => {
  let editor: Editor

  beforeEach(() => {
    editor = new Editor({
      element: document.createElement('div'),
      extensions: [Document, Paragraph, Text],
      content: '<p>First</p><p>Second</p>',
    })
    document.body.append(editor.view.dom)
    vi.mocked(cloneElement).mockClear()
  })

  afterEach(() => {
    editor.destroy()
    document.body.innerHTML = ''
  })

  // Nested mode uses the hovered node directly, so no layout is needed to find it.
  function startDrag(options: { dragImage?: Parameters<typeof dragHandler>[5] } = {}) {
    const dataTransfer = new DataTransfer()
    const setDragImage = vi.spyOn(dataTransfer, 'setDragImage').mockImplementation(() => {})
    const event = new DragEvent('dragstart')

    // happy-dom ignores `dataTransfer` in the DragEvent constructor
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })

    dragHandler(
      event,
      editor,
      normalizeNestedOptions(true),
      { node: editor.state.doc.child(0), pos: 0 },
      undefined,
      options.dragImage,
    )

    const wrapper = setDragImage.mock.calls[0]?.[0] as HTMLElement | undefined

    return { setDragImage, wrapper }
  }

  it('clones the dragged block when dragImage is not set', () => {
    const { wrapper } = startDrag()

    expect(cloneElement).toHaveBeenCalledTimes(1)
    expect(wrapper?.firstElementChild?.tagName).toBe('P')
    expect(wrapper?.firstElementChild).not.toBe(editor.view.nodeDOM(0))
  })

  it('uses the returned element as the drag image without cloning', () => {
    const dragImageElement = document.createElement('div')
    const { setDragImage, wrapper } = startDrag({ dragImage: () => dragImageElement })

    expect(cloneElement).not.toHaveBeenCalled()
    expect(setDragImage).toHaveBeenCalledTimes(1)
    expect(wrapper?.firstElementChild).toBe(dragImageElement)
    expect(dragImageElement.isConnected).toBe(true)
  })

  it('passes the dragged node, position and element to dragImage', () => {
    const dragImage = vi.fn(() => document.createElement('div'))

    startDrag({ dragImage })

    expect(dragImage).toHaveBeenCalledTimes(1)
    expect(dragImage).toHaveBeenCalledWith({
      editor,
      node: editor.state.doc.child(0),
      pos: 0,
      element: editor.view.nodeDOM(0),
    })
  })

  it('uses a transparent 1px drag image when dragImage returns null', () => {
    const { wrapper } = startDrag({ dragImage: () => null })
    const emptyImage = wrapper?.firstElementChild as HTMLElement

    expect(cloneElement).not.toHaveBeenCalled()
    expect(wrapper?.children).toHaveLength(1)
    expect(emptyImage.style.width).toBe('1px')
    expect(emptyImage.style.height).toBe('1px')
    expect(emptyImage.style.opacity).toBe('0')
  })

  it.each(['dragend', 'drop'])('removes the custom drag image on %s', eventName => {
    const dragImageElement = document.createElement('div')

    startDrag({ dragImage: () => dragImageElement })
    expect(dragImageElement.isConnected).toBe(true)

    document.dispatchEvent(new Event(eventName))

    expect(dragImageElement.isConnected).toBe(false)
  })

  it('calls dragImage once with the first block for multi-block drags', () => {
    const { doc } = editor.state
    const dragImage = vi.fn(() => document.createElement('div'))

    editor.view.dispatch(
      editor.state.tr.setSelection(NodeRangeSelection.create(doc, 0, doc.content.size)),
    )
    startDrag({ dragImage })

    expect(editor.view.dragging?.slice.content.childCount).toBe(2)
    expect(dragImage).toHaveBeenCalledTimes(1)
    expect(dragImage).toHaveBeenCalledWith(expect.objectContaining({ node: doc.child(0), pos: 0 }))
  })
})
