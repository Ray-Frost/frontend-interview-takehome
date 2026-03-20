import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
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
  const [readSnapshotsByTicketId, setReadSnapshotsByTicketId] = useState<Record<string, string>>({})
  const hasLoadedTickets = data !== undefined
  const activeTicketId = typeof router.query.ticketId === 'string'
    ? router.query.ticketId
    : null
  const currentHouseId = typeof router.query.houseId === 'string'
    ? router.query.houseId
    : null
  const currentHouse = HOUSES.find(house => house.id === currentHouseId) ?? null
  const rawTickets = data ?? []
  const tickets = rawTickets.map(ticket => {
    const hasReadCurrentSnapshot =
      readSnapshotsByTicketId[ticket.id] === ticket.updatedAt

    if (!hasReadCurrentSnapshot) {
      return ticket
    }

    return {
      ...ticket,
      unread: false,
    }
  })
  const unreadCount = tickets.filter(ticket => ticket.unread).length

  useEffect(() => {
    if (!activeTicketId) return

    const activeTicket = data?.find(ticket => ticket.id === activeTicketId)
    if (!activeTicket?.unread) return

    setReadSnapshotsByTicketId(previousReadSnapshotsByTicketId => {
      const currentReadSnapshot =
        previousReadSnapshotsByTicketId[activeTicketId]

      if (currentReadSnapshot === activeTicket.updatedAt) {
        return previousReadSnapshotsByTicketId
      }

      return {
        ...previousReadSnapshotsByTicketId,
        [activeTicketId]: activeTicket.updatedAt,
      }
    })
  }, [activeTicketId, data])

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
