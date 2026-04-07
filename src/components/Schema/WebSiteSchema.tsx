import { config } from '@/config'
import { getServerSideURL } from '@/utilities/getURL'
import React from 'react'

export const WebSiteSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.NEXT_PUBLIC_SITE_NAME,
    url: getServerSideURL(),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getServerSideURL()}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.NEXT_PUBLIC_SITE_NAME,
    url: getServerSideURL(),
    logo: `${getServerSideURL()}/logo.png`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  )
}
