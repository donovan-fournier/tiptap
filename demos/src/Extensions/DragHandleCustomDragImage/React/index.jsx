import './styles.scss'

import DragHandle from '@tiptap/extension-drag-handle-react'
import { TableKit } from '@tiptap/extension-table'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'

const ROWS = 400
const COLUMNS = 12

const createTable = () => {
  const header = `<tr>${Array.from({ length: COLUMNS }, (_, index) => `<th>Day ${index + 1}</th>`).join('')}</tr>`
  const rows = Array.from(
    { length: ROWS },
    (_, row) =>
      `<tr>${Array.from({ length: COLUMNS }, (_, column) => `<td>R${row + 1} C${column + 1}</td>`).join('')}</tr>`,
  )

  return `<table>${header}${rows.join('')}</table>`
}

const content = `
  <p>Hover the table and drag it by its handle. The default preview copies the computed styles of every element in the block, so it gets slow on big blocks like this one.</p>
  ${createTable()}
  <p>A paragraph after the table.</p>
`

const DRAG_IMAGE_PROPERTIES = ['color', 'background-color', 'font-size', 'font-family']

// A small fixed preview skips the costly clone of large blocks
const createDragImage = ({ node }) => {
  const element = document.createElement('div')

  element.className = 'custom-drag-image'
  element.textContent = `Moving ${node.type.name}`

  return element
}

const MODES = [
  { name: 'default', label: 'Default preview', props: {} },
  {
    name: 'properties',
    label: 'Copy a few styles',
    props: { dragImageProperties: DRAG_IMAGE_PROPERTIES },
  },
  { name: 'custom', label: 'Custom drag image', props: { dragImage: createDragImage } },
  { name: 'hidden', label: 'No drag image', props: { dragImage: () => null } },
]

const formatDuration = duration =>
  duration === null ? 'Not dragged yet' : `${Math.round(duration)} ms`

export default () => {
  const [mode, setMode] = useState(MODES[2])
  const [dragStartDuration, setDragStartDuration] = useState(null)

  const editor = useEditor({
    extensions: [StarterKit, TableKit],
    content,
  })

  useEffect(() => {
    let startedAt = 0

    const onDragStartCapture = () => {
      startedAt = performance.now()
    }
    const onDragStart = () => {
      requestAnimationFrame(() => setDragStartDuration(performance.now() - startedAt))
    }

    window.addEventListener('dragstart', onDragStartCapture, true)
    window.addEventListener('dragstart', onDragStart)

    return () => {
      window.removeEventListener('dragstart', onDragStartCapture, true)
      window.removeEventListener('dragstart', onDragStart)
    }
  }, [])

  return (
    <>
      <div className="control-group">
        <div className="button-group">
          {MODES.map(item => (
            <button
              key={item.name}
              className={item === mode ? 'is-active' : ''}
              onClick={() => setMode(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <DragHandle editor={editor} {...mode.props}>
        <div className="custom-drag-handle" />
      </DragHandle>
      <EditorContent editor={editor} />
      <div className="output-group">
        <label>Last drag start</label>
        <span data-testid="drag-start-duration">{formatDuration(dragStartDuration)}</span>
      </div>
    </>
  )
}
