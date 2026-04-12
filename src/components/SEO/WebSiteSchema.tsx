import { config } from '@/config'
import { getServerSideURL } from '@/utilities/getURL'
import React from 'react'

export const WebSiteSchema = () => {
  const serverUrl = getServerSideURL()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.NEXT_PUBLIC_SITE_NAME,
    url: serverUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${serverUrl}/products?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.NEXT_PUBLIC_SITE_NAME,
    url: serverUrl,
    logo: `${serverUrl}/logo-full.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Vietnamese',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c') }}
      />
    </>
  )
}
