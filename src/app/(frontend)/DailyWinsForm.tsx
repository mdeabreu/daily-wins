'use client'

import type { Win } from '@/payload-types'
import React, { useEffect, useMemo, useState } from 'react'

type WinState = Record<
  string,
  {
    completed: boolean
    note: string
  }
>

type JournalResponse = {
  docs?: Array<{
    id: number | string
    date?: string
    rating?: number | null
    journal?: string
    wins?: Array<{
      win: string | number | { id?: string | number } | null
      note?: string | null
      completed?: boolean | null
    }>
  }>
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toLocalNoonISO(dateValue: string) {
  return new Date(`${dateValue}T12:00:00`).toISOString()
}

function getLocalDateBoundsISO(dateValue: string) {
  const start = new Date(`${dateValue}T00:00:00`)
  const end = new Date(`${dateValue}T23:59:59.999`)
  return { start: start.toISOString(), end: end.toISOString() }
}

function formatFriendlyDate(value: string) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DailyWinsForm({ wins }: { wins: Win[] }) {
  const [date, setDate] = useState(() => formatLocalDate(new Date()))
  const [rating, setRating] = useState<number | null>(null)
  const [journal, setJournal] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const [statusMessage, setStatusMessage] = useState('')
  const [currentJournalId, setCurrentJournalId] = useState<string | number | null>(null)

  const defaultWinState = useMemo<WinState>(() => {
    return wins.reduce<WinState>((acc, win) => {
      acc[String(win.id)] = { completed: false, note: '' }
      return acc
    }, {})
  }, [wins])

  const [winState, setWinState] = useState<WinState>(defaultWinState)

  useEffect(() => {
    setWinState(defaultWinState)
  }, [defaultWinState])

  useEffect(() => {
    let isMounted = true

    async function loadJournalForDate() {
      setStatus('loading')
      setStatusMessage('')
      setCurrentJournalId(null)
      setRating(null)
      setJournal('')
      setWinState(defaultWinState)

      try {
        const { start, end } = getLocalDateBoundsISO(date)
        const response = await fetch(
          `/api/journals?where[date][greater_than_equal]=${encodeURIComponent(
            start,
          )}&where[date][less_than_equal]=${encodeURIComponent(
            end,
          )}&limit=1&depth=0`,
          { cache: 'no-store' },
        )

        if (!response.ok) {
          throw new Error('Unable to load entries for that date.')
        }

        const data: JournalResponse = await response.json()
        const journalDoc = data.docs?.[0]

        if (journalDoc && isMounted) {
          setCurrentJournalId(journalDoc.id)
          setRating(typeof journalDoc.rating === 'number' ? journalDoc.rating : null)
          setJournal(journalDoc.journal ?? '')

          if (journalDoc.wins && journalDoc.wins.length > 0) {
            const nextState = { ...defaultWinState }
            journalDoc.wins.forEach((entry) => {
              const rawValue = entry.win
              const winId =
                typeof rawValue === 'object' && rawValue !== null ? rawValue.id : rawValue

              if (winId && nextState[String(winId)]) {
                nextState[String(winId)] = {
                  completed: Boolean(entry.completed),
                  note: entry.note ?? '',
                }
              }
            })
            setWinState(nextState)
          }
        }

        if (isMounted) {
          setStatus('idle')
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error')
          setStatusMessage(
            error instanceof Error ? error.message : 'Something went wrong loading that date.',
          )
        }
      }
    }

    loadJournalForDate()

    return () => {
      isMounted = false
    }
  }, [date, defaultWinState])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('saving')
    setStatusMessage('')

    const winsPayload = wins.reduce<
      Array<{ win: string | number; completed?: boolean; note?: string }>
    >((acc, win) => {
      const state = winState[String(win.id)]
      if (!state) return acc
      if (!state.completed && !state.note.trim()) return acc
      acc.push({
        win: win.id,
        completed: state.completed || undefined,
        note: state.note.trim() || undefined,
      })
      return acc
    }, [])

    const payload = {
      date: toLocalNoonISO(date),
      rating: rating ?? null,
      journal,
      wins: winsPayload,
    }

    try {
      const response = await fetch(
        currentJournalId ? `/api/journals/${currentJournalId}` : '/api/journals',
        {
          method: currentJournalId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        throw new Error('Saving failed. Try again in a moment.')
      }

      const data = await response.json()
      setCurrentJournalId(data?.doc?.id ?? data?.id ?? currentJournalId)
      setStatus('saved')
      setStatusMessage('Saved. Nice work.')
    } catch (error) {
      setStatus('error')
      setStatusMessage(
        error instanceof Error ? error.message : 'Unable to save the journal entry.',
      )
    }
  }

  return (
    <section className="journal">
      <form className="journal__form" onSubmit={handleSubmit}>
        <div className="panel panel--date">
          <div>
            <p className="panel__label">Day</p>
            <p className="panel__value">{formatFriendlyDate(date)}</p>
          </div>
          <div className="panel__field">
            <label className="sr-only" htmlFor="journal-date">
              Select day
            </label>
            <input
              id="journal-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>

        <div className="panel panel--rating">
          <p className="panel__label">How did today feel?</p>
          <div className="rating" role="radiogroup" aria-label="Daily rating">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1
              return (
                <label
                  className={`rating__star ${rating && rating >= value ? 'is-active' : ''}`}
                  key={value}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                  />
                  <span aria-hidden="true">★</span>
                  <span className="sr-only">{value} stars</span>
                </label>
              )
            })}
            <button
              className="rating__clear"
              type="button"
              onClick={() => setRating(null)}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="panel panel--notes">
          <label className="panel__label" htmlFor="journal-notes">
            Day notes
          </label>
          <textarea
            id="journal-notes"
            placeholder="What stood out today?"
            value={journal}
            onChange={(event) => setJournal(event.target.value)}
            rows={4}
          />
        </div>

        <div className="panel panel--wins">
          <div className="panel__header">
            <p className="panel__label">Wins checklist</p>
            <p className="panel__hint">Check what you did, add a note if needed.</p>
          </div>
          {wins.length === 0 ? (
            <p className="panel__empty">Add wins in the admin panel to see them here.</p>
          ) : (
            <div className="wins">
              {wins.map((win) => {
                const state = winState[String(win.id)] ?? { completed: false, note: '' }
                return (
                  <div className="win" key={win.id}>
                    <label className="win__title">
                      <input
                        type="checkbox"
                        checked={state.completed}
                        onChange={(event) =>
                          setWinState((prev) => ({
                            ...prev,
                            [String(win.id)]: {
                              ...prev[String(win.id)],
                              completed: event.target.checked,
                            },
                          }))
                        }
                      />
                      <span>
                        {win.name}
                        {win.description ? (
                          <span className="win__description">{win.description}</span>
                        ) : null}
                      </span>
                    </label>
                    <textarea
                      className="win__note"
                      placeholder="Optional note for this win"
                      value={state.note}
                      onChange={(event) =>
                        setWinState((prev) => ({
                          ...prev,
                          [String(win.id)]: {
                            ...prev[String(win.id)],
                            note: event.target.value,
                          },
                        }))
                      }
                      rows={2}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="panel panel--actions">
          <button className="primary" type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : 'Save journal'}
          </button>
          {status === 'loading' && <p className="status">Loading entry…</p>}
          {status === 'saved' && <p className="status status--success">{statusMessage}</p>}
          {status === 'error' && <p className="status status--error">{statusMessage}</p>}
        </div>
      </form>
    </section>
  )
}
