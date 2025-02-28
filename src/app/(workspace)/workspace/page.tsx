'use client'
import { motion } from 'framer-motion'
import { Flame, Plus, Trash } from 'lucide-react'
import { useState, createContext, ReactNode, useContext } from 'react'

export type DraggableItem = {
  id: string
  title: string
  status: string
}

interface DraggableContextType {
  items: DraggableItem[]
  createItem: (title: string, status: string) => void
  moveItem: (itemId: string, targetStatus: string) => void
  deleteItem: (itemId: string) => void
  getItemsByStatus: (status: string) => DraggableItem[]
}

const DraggableContext = createContext<DraggableContextType | undefined>(undefined)

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

export function DraggableProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DraggableItem[]>(DEFAULT_ITEMS)

  const createItem = (title: string, status: string) => {
    const newItem: DraggableItem = {
      id: Math.random().toString(),
      title: title.trim(),
      status,
    }
    // Add new items to the beginning of the list
    setItems((prev) => [newItem, ...prev])
  }

  const moveItem = (itemId: string, targetStatus: string) => {
    setItems((items) => {
      let copy = [...items]
      let itemToMove = copy.find((item) => item.id === itemId)
      if (!itemToMove) return items

      itemToMove = { ...itemToMove, status: targetStatus }
      copy = copy.filter((item) => item.id !== itemId)

      // Always add moved items to the beginning of the list
      return [itemToMove, ...copy]
    })
  }

  const deleteItem = (itemId: string) => {
    setItems((items) => items.filter((item) => item.id !== itemId))
  }

  const getItemsByStatus = (status: string) => {
    return items.filter((item) => item.status === status)
  }

  return (
    <DraggableContext.Provider
      value={{
        items,
        createItem,
        moveItem,
        deleteItem,
        getItemsByStatus,
      }}
    >
      {children}
    </DraggableContext.Provider>
  )
}

export function useDraggable() {
  const context = useContext(DraggableContext)
  if (context === undefined) {
    throw new Error('useDraggable must be used within a DraggableProvider')
  }
  return context
}

type BoardColumnProps = {
  title: string
  status: string
  headingColor: string
}

type ItemProps = {
  title: string
  id: string
  status: string
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, item: DraggableItem) => void
}

type DropIndicatorProps = {
  status: string
  isActive?: boolean
}

const DraggableBoard = () => {
  return (
    <div className="h-screen w-full bg-neutral-900 text-neutral-50">
      <DraggableProvider>
        <Board />
      </DraggableProvider>
    </div>
  )
}

export default DraggableBoard

const Board = () => {
  return (
    <div className="flex h-full w-full gap-3 overflow-scroll p-12">
      <BoardColumn title="Backlog" status="backlog" headingColor="text-neutral-500" />
      <BoardColumn title="TODO" status="todo" headingColor="text-yellow-200" />
      <BoardColumn title="In progress" status="in_progress" headingColor="text-blue-200" />
      <BoardColumn title="Complete" status="completed" headingColor="text-emerald-200" />
      <DeleteZone />
    </div>
  )
}

const BoardColumn = ({ title, headingColor, status }: BoardColumnProps) => {
  const { getItemsByStatus, moveItem } = useDraggable()
  const [active, setActive] = useState(false)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: DraggableItem) => {
    e.dataTransfer.setData('itemId', item.id)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const itemId = e.dataTransfer.getData('itemId')
    setActive(false)
    moveItem(itemId, status)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setActive(true)
  }

  const handleDragLeave = () => {
    setActive(false)
  }

  const filteredItems = getItemsByStatus(status)

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
        <DropIndicator status={status} isActive={active} />
        {filteredItems.map((item) => (
          <DraggableItem key={item.id} {...item} handleDragStart={handleDragStart} />
        ))}
        <AddItem status={status} />
      </div>
    </div>
  )
}

const DraggableItem = ({ title, id, status, handleDragStart }: ItemProps) => {
  return (
    <motion.div
      layout
      layoutId={id}
      draggable
      // @ts-expect-error ignore
      onDragStart={(e) => handleDragStart(e, { title, id, status })}
      className="mb-2 cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing"
    >
      <p className="text-sm text-neutral-100">{title}</p>
    </motion.div>
  )
}

const DeleteZone = () => {
  const { deleteItem } = useDraggable()
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
    deleteItem(itemId)
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

const AddItem = ({ status }: { status: string }) => {
  const { createItem } = useDraggable()
  const [text, setText] = useState('')
  const [adding, setAdding] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!text.trim().length) return

    createItem(text, status)
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

const DropIndicator = ({ status, isActive }: DropIndicatorProps) => {
  return (
    <div
      data-status={status}
      className={`mb-3 h-0.5 w-full bg-violet-400 transition-opacity ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
