import React, { createContext, useContext, useMemo, useState } from 'react'

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'

export type Player = {
  id: string | number
  name: string
  club: string
  position: Position
  price: number   // millions, e.g. 9.6
  form?: number
}

type AppState = {
  fullName: string
  budget: number
  team: Player[]
  formation: '4-4-2' | '4-3-3' | '3-4-3' | '3-5-2' | '5-3-2'
  setFormation: (f: AppState['formation']) => void

  // returns true if added/removed, false if blocked
  addPlayer: (p: Player) => boolean
  removePlayer: (id: Player['id']) => boolean
  resetTeam: () => void
}

const MAX_SQUAD = 15
const START_BUDGET = 100 // £100m

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [fullName] = useState('Manager')
  const [budget, setBudget] = useState<number>(START_BUDGET)
  const [team, setTeam] = useState<Player[]>([])
  const [formation, setFormation] = useState<AppState['formation']>('4-4-2')

  const idEq = (a: Player['id'], b: Player['id']) => String(a) === String(b)

  const addPlayer: AppState['addPlayer'] = (p) => {
    // prevent duplicates
    if (team.some(tp => idEq(tp.id, p.id))) return false
    // squad cap
    if (team.length >= MAX_SQUAD) return false
    // budget check
    if (budget < p.price) return false

    const normalizedId = typeof team[0]?.id === 'number' ? Number(p.id) : String(p.id)
    setTeam(prev => [...prev, { ...p, id: normalizedId }])
    setBudget(prev => Number((prev - p.price).toFixed(1)))
    return true
  }

  const removePlayer: AppState['removePlayer'] = (id) => {
    const idx = team.findIndex(tp => idEq(tp.id, id))
    if (idx === -1) return false
    const player = team[idx]
    setTeam(prev => prev.filter((_, i) => i !== idx))
    setBudget(prev => Number((prev + (player?.price || 0)).toFixed(1)))
    return true
  }

  const resetTeam = () => {
    setTeam([])
    setBudget(START_BUDGET)
    setFormation('4-4-2')
  }

  const value = useMemo<AppState>(() => ({
    fullName,
    budget,
    team,
    formation,
    setFormation,
    addPlayer,
    removePlayer,
    resetTeam,
  }), [fullName, budget, team, formation])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within <AppProvider>')
  return v
}
