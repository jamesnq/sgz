/**
 * Get where clause to exclude blacklisted products
 */
export const getProductWhereClause = (additionalConditions?: any) => {
  const blacklistedSlugs = ['youtube-premium-1-thang-family']
  
  const baseConditions = [
    {
      slug: {
        not_in: blacklistedSlugs,
      },
    },
    {
      status: {
        not_equals: 'PRIVATE',
      },
    },
  ]

  if (additionalConditions) {
    return {
      and: [...baseConditions, additionalConditions],
    }
  }

  return {
    and: baseConditions,
  }
}
