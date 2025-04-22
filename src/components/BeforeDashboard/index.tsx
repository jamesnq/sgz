import React from 'react'

import { SeedButton } from './SeedButton'
import { SyncSearchButton } from './SyncSearchButton'
import './index.scss'

const baseClass = 'before-dashboard'
// TODO make it better like request init,...
const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__button-container`}>
        <SeedButton />
        <span className={`${baseClass}__divider`}>|</span>
        <SyncSearchButton />
      </div>
    </div>
  )
}

export default BeforeDashboard
