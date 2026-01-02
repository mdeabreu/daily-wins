'use client'

import React, { useState } from 'react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed. Check your credentials and try again.')
      }

      window.location.reload()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Login failed.')
    }
  }

  return (
    <section className="panel panel--login">
      <h2 className="login__title">Log in to add today&#39;s wins</h2>
      <p className="login__subtitle">Use your credentials to continue.</p>
      <form className="login__form" onSubmit={handleSubmit}>
        <label className="login__field">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="login__field">
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="primary" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Signing in...' : 'Sign in'}
        </button>
        {status === 'error' && <p className="status status--error">{message}</p>}
      </form>
    </section>
  )
}
