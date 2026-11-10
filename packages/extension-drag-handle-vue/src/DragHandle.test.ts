import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, shallowRef } from 'vue'

import { DragHandle } from './DragHandle.js'

const { dragHandlePluginMock } = vi.hoisted(() => ({
  dragHandlePluginMock: vi.fn((_options: Record<string, any>) => ({
    plugin: { spec: { key: 'dragHandle' } },
    unbind: vi.fn(),
  })),
}))

vi.mock('@tiptap/extension-drag-handle', () => ({
  DragHandlePlugin: dragHandlePluginMock,
  dragHandlePluginDefaultKey: 'dragHandle',
  defaultComputePositionConfig: {},
  normalizeNestedOptions: (value: unknown) => value,
}))

function createEditor() {
  return {
    isDestroyed: false,
    registerPlugin: vi.fn(),
    unregisterPlugin: vi.fn(),
  }
}

async function flush() {
  await nextTick()
  await nextTick()
}

describe('DragHandle', () => {
  let container: HTMLElement

  beforeEach(() => {
    dragHandlePluginMock.mockClear()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('calls the latest dragImage without re-registering the plugin', async () => {
    const editor = createEditor()
    const firstElement = document.createElement('div')
    const latestElement = document.createElement('div')
    const dragImage = shallowRef<(() => HTMLElement) | undefined>(() => firstElement)

    createApp({
      render: () => h(DragHandle, { editor: editor as never, dragImage: dragImage.value }),
    }).mount(container)
    await flush()

    dragImage.value = () => latestElement
    await flush()

    const pluginDragImage = dragHandlePluginMock.mock.calls[0][0].dragImage

    expect(editor.registerPlugin).toHaveBeenCalledTimes(1)
    expect(pluginDragImage({})).toBe(latestElement)

    dragImage.value = undefined
    await flush()

    expect(editor.registerPlugin).toHaveBeenCalledTimes(2)
    expect(dragHandlePluginMock.mock.calls.at(-1)?.[0].dragImage).toBeUndefined()
  })
})
