'use client'

import React, { useMemo, useState } from 'react'

import ProgressTab from '@/components/ProgressTab'
import TodayTab, { type TodayTabData } from '@/components/TodayTab'
import WinsTab from '@/components/WinsTab'

const tabs = [
  { id: 'today', label: 'Today' },
  { id: 'wins', label: 'Wins' },
  { id: 'progress', label: 'Progress' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function Tabs({ todayData }: { todayData: TodayTabData | null }) {
  const [activeTab, setActiveTab] = useState<TabId>('today')

  const panelContent = useMemo(() => {
    switch (activeTab) {
      case 'wins':
        return <WinsTab />
      case 'progress':
        return <ProgressTab />
      case 'today':
      default:
        return <TodayTab data={todayData} />
    }
  }, [activeTab, todayData])

  return (
    <section className="tabs" aria-label="Daily wins sections">
      <div className="tab-list" role="tablist" aria-label="Daily wins views">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              className={`tab${isActive ? ' is-active' : ''}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
              id={`tab-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="tab-panels">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab

          return (
            <section
              key={tab.id}
              className={`tab-panel${isActive ? ' is-active' : ''}`}
              role="tabpanel"
              id={`tab-panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              aria-hidden={!isActive}
            >
              {isActive ? panelContent : null}
            </section>
          )
        })}
      </div>
    </section>
  )
}
