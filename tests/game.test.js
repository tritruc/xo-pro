import { describe, it, expect } from 'vitest'
import { GameEngine } from '../src/game.js'

describe('GameEngine', () => {
  it('starts with empty board and X turn', () => {
    const g = new GameEngine()
    expect(g.board.size).toBe(0)
    expect(g.turn).toBe('X')
    expect(g.winner).toBe(null)
  })

  it('places move and toggles turn', () => {
    const g = new GameEngine()
    expect(g.place(0, 0, 'X')).toBe(true)
    expect(g.get(0, 0)).toBe('X')
    expect(g.turn).toBe('O')
  })

  it('rejects placing on occupied cell', () => {
    const g = new GameEngine()
    g.place(1, 1, 'X')
    expect(g.place(1, 1, 'O')).toBe(false)
  })

  it('detects horizontal 5-in-row win', () => {
    const g = new GameEngine()
    for (let i = 0; i < 4; i++) g.place(i, 0, 'X')
    expect(g.winner).toBe(null)
    g.place(4, 0, 'X')
    expect(g.winner).toBe('X')
  })

  it('detects diagonal 5-in-row win', () => {
    const g = new GameEngine()
    for (let i = 0; i < 5; i++) g.place(i, i, 'O')
    expect(g.winner).toBe('O')
  })

  it('ai returns valid candidate move', () => {
    const g = new GameEngine()
    g.place(0, 0, 'X')
    g.place(1, 0, 'O')
    const [x, y] = g.ai()
    expect(Number.isInteger(x)).toBe(true)
    expect(Number.isInteger(y)).toBe(true)
    expect(g.get(x, y)).toBe(undefined)
  })
})
