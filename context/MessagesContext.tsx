import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react'
import { useRouter } from 'next/router'
import { Ticket } from '@/types'

interface House {
  id: string
  name: string
}

const HOUSES: House[] = [
  { id: 'h1', name: 'Orchard House' },
  { id: 'h2', name: 'Marina Suite' },
  { id: 'h3', name: 'Sentosa Villa' },
]

interface MessagesContextValue {
  currentHouse: House | null
  activeTicketId: string | null
  unreadCount: number
  setUnreadCount: (n: number) => void
}

const MessagesContext = createContext<MessagesContextValue | null>(null)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const activeTicketId = typeof router.query.ticketId === 'string'
    ? router.query.ticketId
    : null
  const currentHouseId = typeof router.query.houseId === 'string'
    ? router.query.houseId
    : null
  const currentHouse = HOUSES.find(house => house.id === currentHouseId) ?? null

  return (
    <MessagesContext.Provider
      value={{
        currentHouse,
        activeTicketId,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessagesContext() {
  const ctx = useContext(MessagesContext)
  if (!ctx) throw new Error('useMessagesContext must be used within MessagesProvider')
  return ctx
}

export { HOUSES }
export type { House, Ticket }
