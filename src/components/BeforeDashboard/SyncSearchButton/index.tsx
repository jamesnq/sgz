'use client'

import React from 'react'
import { ActionButton } from '../ActionButton'

import './index.scss'

const SuccessMessage: React.FC = () => (
  <div>
    Search data synchronized! You can now{' '}
    <a target="_blank" href="/">
      visit your website
    </a>
  </div>
)

export const SyncSearchButton: React.FC = () => {
  return (
    <ActionButton
      label="Sync Search Data"
      endpoint="/next/sync-search"
      confirmMessage="Are you sure you want to synchronize the search data?"
      loadingMessage="Synchronizing search data..."
      successMessage={<SuccessMessage />}
      errorMessage="An error occurred while synchronizing search data."
      alreadyInProgressMessage="Synchronization already in progress."
      className="syncSearchButton"
    />
  )
}
