'use client'

import React from 'react'
import { ActionButton } from '../ActionButton'

const SuccessMessage: React.FC = () => (
  <div>Product and variant metadata generated successfully.</div>
)

export const GenerateProductMetadataButton: React.FC = () => {
  return (
    <ActionButton
      label="Generate Product Metadata"
      endpoint="/api/admin/products/generate-metadata"
      confirmMessage="Generate SEO title, description and image for all products and variants? Existing metadata will be overwritten."
      loadingMessage="Generating product metadata..."
      successMessage={<SuccessMessage />}
      errorMessage="An error occurred while generating product metadata."
      alreadyInProgressMessage="Metadata generation already in progress."
      className="syncSearchButton"
    />
  )
}
