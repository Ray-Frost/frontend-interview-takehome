import React, {
  createContext,
  useContext,
  ReactNode,
} from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
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
  tickets: Ticket[]
  hasLoadedTickets: boolean
  unreadCount: number
}

const MessagesContext = createContext<MessagesContextValue | null>(null)

function fetchTickets(url: string) {
  return fetch(url).then(response => response.json() as Promise<Ticket[]>)
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { data } = useSWR<Ticket[]>('/api/tickets', fetchTickets)
  const tickets = data ?? []
  const hasLoadedTickets = data !== undefined
  const activeTicketId = typeof router.query.ticketId === 'string'
    ? router.query.ticketId
    : null
  const currentHouseId = typeof router.query.houseId === 'string'
    ? router.query.houseId
    : null
  const currentHouse = HOUSES.find(house => house.id === currentHouseId) ?? null
  const unreadCount = tickets.filter(ticket => ticket.unread).length

  return (
    <MessagesContext.Provider
      value={{
        currentHouse,
        activeTicketId,
        tickets,
        hasLoadedTickets,
        unreadCount,
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
