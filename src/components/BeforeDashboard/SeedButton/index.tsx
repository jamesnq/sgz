'use client'

import React from 'react'
import { ActionButton } from '../ActionButton'

import './index.scss'

const SuccessMessage: React.FC = () => (
  <div>
    Database seeded! You can now{' '}
    <a target="_blank" href="/">
      visit your website
    </a>
  </div>
)

export const SeedButton: React.FC = () => {
  return (
    <ActionButton
      label="Seed your database"
      endpoint="/next/seed"
      confirmMessage="Seeding the database may result in data loss. Are you sure you want to continue?"
      loadingMessage="Seeding with data...."
      successMessage={<SuccessMessage />}
      errorMessage="An error occurred while seeding."
      alreadyInProgressMessage="Seeding already in progress."
      className="seedButton"
    />
  )
}
