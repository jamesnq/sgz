import React from 'react'

import { EmailTools } from './EmailTools'
import { SyncSearchButton } from './SyncSearchButton'

const BeforeDashboard: React.FC = () => {
  return (
    <div className="before-dashboard" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <SyncSearchButton />
      </div>
      <EmailTools />
    </div>
  )
}

export default BeforeDashboard
