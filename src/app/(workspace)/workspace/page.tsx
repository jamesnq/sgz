'use client'
import { motion } from 'framer-motion'
import { Flame, Plus, Trash } from 'lucide-react'
import { useState } from 'react'

type DraggableItem = {
  id: string
  title: string
  status: string
}

type BoardColumnProps = {
  title: string
  status: string
  headingColor: string
  items: DraggableItem[]
  setItems: React.Dispatch<React.SetStateAction<DraggableItem[]>>
}

type ItemProps = {
  title: string
  id: string
  status: string
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, item: DraggableItem) => void
}

type DropIndicatorProps = {
  beforeId?: string
  status: string
}

type DeleteZoneProps = {
  setItems: React.Dispatch<React.SetStateAction<DraggableItem[]>>
}

type AddItemProps = {
  status: string
  setItems: React.Dispatch<React.SetStateAction<DraggableItem[]>>
}

const createItem = (title: string, status: string): DraggableItem => {
  return {
    id: Math.random().toString(),
    title: title.trim(),
    status,
  }
}

const moveItem = (
  itemId: string,
  targetStatus: string,
  beforeItemId: string | undefined,
  items: DraggableItem[],
): DraggableItem[] => {
  let copy = [...items]
  let itemToMove = copy.find((item) => item.id === itemId)
  if (!itemToMove) return items

  itemToMove = { ...itemToMove, status: targetStatus }
  copy = copy.filter((item) => item.id !== itemId)

  if (!beforeItemId || beforeItemId === '-1') {
    return [...copy, itemToMove]
  }

  const insertAtIndex = copy.findIndex((item) => item.id === beforeItemId)
  if (insertAtIndex === -1) return [...copy, itemToMove]

  copy.splice(insertAtIndex, 0, itemToMove)
  return copy
}

const deleteItem = (itemId: string, items: DraggableItem[]): DraggableItem[] => {
  return items.filter((item) => item.id !== itemId)
}

const getItemsByStatus = (status: string, items: DraggableItem[]): DraggableItem[] => {
  return items.filter((item) => item.status === status)
}

const DraggableBoard = () => {
  return (
    <div className="h-screen w-full bg-neutral-900 text-neutral-50">
      <Board />
    </div>
  )
}

export default DraggableBoard

const Board = () => {
  const [items, setItems] = useState<DraggableItem[]>(DEFAULT_ITEMS)

  return (
    <div className="flex h-full w-full gap-3 overflow-scroll p-12">
      <BoardColumn
        title="Backlog"
        status="backlog"
        headingColor="text-neutral-500"
        items={items}
        setItems={setItems}
      />
      <BoardColumn
        title="TODO"
        status="todo"
        headingColor="text-yellow-200"
        items={items}
        setItems={setItems}
      />
      <BoardColumn
        title="In progress"
        status="in_progress"
        headingColor="text-blue-200"
        items={items}
        setItems={setItems}
      />
      <BoardColumn
        title="Complete"
        status="completed"
        headingColor="text-emerald-200"
        items={items}
        setItems={setItems}
      />
      <DeleteZone setItems={setItems} />
    </div>
  )
}

const BoardColumn = ({ title, headingColor, items, status, setItems }: BoardColumnProps) => {
  const [active, setActive] = useState(false)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: DraggableItem) => {
    e.dataTransfer.setData('itemId', item.id)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const itemId = e.dataTransfer.getData('itemId')
    setActive(false)
    clearHighlights()

    const indicators = getIndicators()
    const { element } = getNearestIndicator(e, indicators)
    const beforeId = element?.dataset.before || '-1'

    if (beforeId !== itemId) {
      setItems((items) => moveItem(itemId, status, beforeId, items))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    highlightIndicator(e)
    setActive(true)
  }

  const clearHighlights = (els?: HTMLDivElement[]) => {
    const indicators = els || getIndicators()

    indicators.forEach((i) => {
      i.style.opacity = '0'
    })
  }

  const highlightIndicator = (e: React.DragEvent<HTMLDivElement>) => {
    const indicators = getIndicators()

    clearHighlights(indicators)

    const el = getNearestIndicator(e, indicators)

    if (el?.element) {
      el.element.style.opacity = '1'
    }
  }

  const getNearestIndicator = (
    e: React.DragEvent<HTMLDivElement>,
    indicators: HTMLDivElement[],
  ) => {
    const DISTANCE_OFFSET = 50

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect()

        const offset = e.clientY - (box.top + DISTANCE_OFFSET)

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child }
        } else {
          return closest
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      },
    )

    return el
  }

  const getIndicators = (): HTMLDivElement[] => {
    return Array.from(document.querySelectorAll(`[data-status="${status}"]`))
  }

  const handleDragLeave = () => {
    clearHighlights()
    setActive(false)
  }

  const filteredItems = getItemsByStatus(status, items)

  return (
    <div className="w-56 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-sm text-neutral-400">{filteredItems.length}</span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-full w-full transition-colors ${
          active ? 'bg-neutral-800/50' : 'bg-neutral-800/0'
        }`}
      >
        {filteredItems.map((item) => (
          <DraggableItem key={item.id} {...item} handleDragStart={handleDragStart} />
        ))}
        <DropIndicator status={status} />
        <AddItem status={status} setItems={setItems} />
      </div>
    </div>
  )
}

const DraggableItem = ({ title, id, status, handleDragStart }: ItemProps) => {
  return (
    <>
      <DropIndicator beforeId={id} status={status} />
      <motion.div
        layout
        layoutId={id}
        draggable
        // @ts-expect-error ignore
        onDragStart={(e) => handleDragStart(e, { title, id, status })}
        className="cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing"
      >
        <p className="text-sm text-neutral-100">{title}</p>
      </motion.div>
    </>
  )
}

const DropIndicator = ({ beforeId, status }: DropIndicatorProps) => {
  return (
    <div
      data-before={beforeId || '-1'}
      data-status={status}
      className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
    />
  )
}

const DeleteZone = ({ setItems }: DeleteZoneProps) => {
  const [active, setActive] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setActive(true)
  }

  const handleDragLeave = () => {
    setActive(false)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const itemId = e.dataTransfer.getData('itemId')
    setItems((items) => deleteItem(itemId, items))
    setActive(false)
  }

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl ${
        active
          ? 'border-red-800 bg-red-800/20 text-red-500'
          : 'border-neutral-700 bg-neutral-800/50 text-neutral-500'
      }`}
    >
      {active ? <Trash className="animate-bounce" /> : <Flame />}
    </div>
  )
}

const AddItem = ({ status, setItems }: AddItemProps) => {
  const [text, setText] = useState('')
  const [adding, setAdding] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!text.trim().length) return

    const newItem = createItem(text, status)
    setItems((prev) => [...prev, newItem])
    setText('')
    setAdding(false)
  }

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            autoFocus
            placeholder="Add new item..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-sm text-neutral-950 transition-colors hover:bg-neutral-300"
            >
              Add
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-50"
        >
          <Plus className="h-4 w-4" /> Add item
        </motion.button>
      )}
    </>
  )
}

const DEFAULT_ITEMS: DraggableItem[] = [
  { title: 'Item 1', id: '1', status: 'backlog' },
  { title: 'Item 2', id: '2', status: 'backlog' },
  { title: 'Item 3', id: '3', status: 'todo' },
  { title: 'Item 4', id: '4', status: 'todo' },
  { title: 'Item 5', id: '5', status: 'in_progress' },
  { title: 'Item 6', id: '6', status: 'in_progress' },
  { title: 'Item 7', id: '7', status: 'completed' },
  { title: 'Item 8', id: '8', status: 'completed' },
]
