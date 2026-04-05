import React from 'react'

import { SyncSearchButton } from './SyncSearchButton'

// TODO make it better like request init,...
const BeforeDashboard: React.FC = () => {
  return (
    <div className="before-dashboard" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <SyncSearchButton />
      </div>
    </div>
  )
}

export default BeforeDashboard
