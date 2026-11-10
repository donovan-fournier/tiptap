import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

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

  it('forwards dragImageProperties to the plugin', async () => {
    const editor = createEditor()

    createApp({
      render: () => h(DragHandle, { editor: editor as never, dragImageProperties: ['color'] }),
    }).mount(container)
    await flush()

    expect(dragHandlePluginMock).toHaveBeenCalledTimes(1)
    expect(dragHandlePluginMock.mock.calls[0][0].dragImageProperties).toEqual(['color'])
  })

  it('re-registers the plugin only when dragImageProperties change by value', async () => {
    const editor = createEditor()
    const properties = ref(['color'])

    createApp({
      render: () =>
        h(DragHandle, { editor: editor as never, dragImageProperties: [...properties.value] }),
    }).mount(container)
    await flush()

    properties.value = ['color']
    await flush()
    expect(editor.registerPlugin).toHaveBeenCalledTimes(1)

    properties.value = ['background-color']
    await flush()
    expect(editor.registerPlugin).toHaveBeenCalledTimes(2)
    expect(dragHandlePluginMock.mock.calls.at(-1)?.[0].dragImageProperties).toEqual([
      'background-color',
    ])
  })
})
