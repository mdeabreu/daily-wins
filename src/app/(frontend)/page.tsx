import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

import { DailyWinsForm } from './DailyWinsForm'
import { LoginForm } from './LoginForm'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { user } = await payload.auth({ headers })
  const wins = user
    ? await payload.find({
        collection: 'wins',
        depth: 0,
        limit: 200,
        sort: 'name',
      })
    : null

  return (
    <main className="daily-page">
      <header className="hero">
        <p className="hero__kicker">Daily Wins</p>
        <h1 className="hero__title">Build momentum one small win at a time.</h1>
        <p className="hero__subtitle">
          Pick a day, mark what you did, and leave a short note for future you.
        </p>
      </header>
      {user && wins ? (
        <DailyWinsForm wins={wins.docs} />
      ) : (
        <LoginForm />
      )}
    </main>
  )
}
