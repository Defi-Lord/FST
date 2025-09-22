import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'
export type Player = {
  id: string
  name: string
  club: string
  position: Position
  price: number // £m
  form?: number // higher = top form
}
export type Selected = Player & { bench?: boolean }
type Formation = '4-4-2' | '4-3-3' | '3-4-3' | '3-5-2' | '5-3-2'

type AppState = {
  fullName: string
  budget: number
  team: Selected[] // max 15
  formation: Formation
  setBudget: (n: number) => void
  addPlayer: (p: Player) => string | null
  removePlayer: (id: string) => void
  setFormation: (f: Formation) => void
  myPoints: number
  recomputePoints: () => void
}

function getTgName(): string {
  const tg = (window as any)?.Telegram?.WebApp
  const u = tg?.initDataUnsafe?.user
  if (!u) return 'Manager'
  const parts = [u.first_name, u.last_name].filter(Boolean).join(' ')
  if (parts) return parts
  if (u.username) return u.username
  return 'Manager'
}

// Small fallback list (you’ll load the real list via players_loader.ts)
export const SAMPLE_PLAYERS: Player[] = [
  { id:'m1', name:'Mohamed Salah', club:'Liverpool', position:'MID', price: 12.5, form: 8.8 },
  { id:'m4', name:'Bukayo Saka', club:'Arsenal', position:'MID', price: 9.6, form: 8.4 },
  { id:'m3', name:'Phil Foden', club:'Man City', position:'MID', price: 8.6, form: 8.2 },
  { id:'f1', name:'Erling Haaland', club:'Man City', position:'FWD', price: 14.0, form: 9.2 },
  { id:'f2', name:'Darwin Núñez', club:'Liverpool', position:'FWD', price: 7.6, form: 7.7 },
  { id:'d2', name:'William Saliba', club:'Arsenal', position:'DEF', price: 6.2, form: 7.3 },
  { id:'d4', name:'Kieran Trippier', club:'Newcastle', position:'DEF', price: 6.3, form: 6.8 },
  { id:'gk2', name:'Ederson', club:'Man City', position:'GK', price: 5.6, form: 6.8 }
].sort((a,b)=>(b.form??0)-(a.form??0))

const AppCtx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [fullName, setFullName] = useState('Manager')
  const [budget, setBudget] = useState(0)          // £m
  const [team, setTeam] = useState<Selected[]>([])
  const [formation, setFormation] = useState<Formation>('4-4-2')
  const [myPoints, setMyPoints] = useState(0)

  useEffect(() => { setFullName(getTgName()) }, [])

  const addPlayer: AppState['addPlayer'] = (p) => {
    let error: string | null = null
    setTeam(prev => {
      // Prevent duplicates even on rapid double click
      if (prev.find(t => t.id === p.id)) {
        error = 'Player already in your squad.'
        return prev
      }
      // Squad size
      if (prev.length >= 15) {
        error = 'You already have 15 players.'
        return prev
      }
      // Budget
      if (budget < p.price) {
        error = 'Insufficient budget.'
        return prev
      }
      // Position limits (computed from current prev)
      const counts = prev.reduce((acc: Record<Position, number>, t) => {
        acc[t.position] = (acc[t.position] || 0) + 1
        return acc
      }, { GK:0, DEF:0, MID:0, FWD:0 })
      const limits: Record<Position, number> = { GK:2, DEF:5, MID:5, FWD:3 }
      if ((counts[p.position] || 0) >= limits[p.position]) {
        error = `You cannot add more ${p.position}s.`
        return prev
      }

      // Passed all checks: commit budget + team atomically relative to prev
      setBudget(b => +(b - p.price).toFixed(1))
      return [...prev, p]
    })
    return error
  }

  const removePlayer = (id: string) => {
    setTeam(prev => {
      const target = prev.find(p => p.id === id)
      if (!target) return prev
      setBudget(b => +(b + target.price).toFixed(1))
      return prev.filter(p => p.id !== id)
    })
  }

  const recomputePoints = () => {
    const pts = Math.round(team.reduce((sum, p) => sum + (p.form ?? 6), 0))
    setMyPoints(pts)
  }

  const value: AppState = useMemo(() => ({
    fullName, budget, team, formation,
    setBudget, addPlayer, removePlayer, setFormation,
    myPoints, recomputePoints
  }), [fullName, budget, team, formation, myPoints])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
