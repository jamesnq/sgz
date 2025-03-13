import React from 'react'

import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'
// TODO make it better like request init,...
const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <SeedButton />
    </div>
  )
}

export default BeforeDashboard
