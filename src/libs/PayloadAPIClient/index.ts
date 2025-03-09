import { Config } from '@/payload-types'
import type { BulkOperationResult, CollectionSlug, PaginatedDocs, Where } from 'payload'
import queryString from 'qs'
import type { DeepPartial } from 'ts-essentials'

type MakeOptional<T, K extends string> = Omit<T, K> & Partial<Pick<T, K & keyof T>>

export type PayloadApiClientOptions = {
  apiURL: string
  fetcher?: typeof fetch
}

export class PayloadApiClient<C extends Config> {
  private apiURL: string
  private fetcher: typeof fetch

  constructor({ apiURL, fetcher = fetch }: PayloadApiClientOptions) {
    this.fetcher = fetcher
    this.apiURL = apiURL
  }

  private createRequest(path: string, init?: RequestInit) {
    return new Request(`${this.apiURL}${path}`, init)
  }

  async create<T extends keyof C['collections']>({
    collection,
    data,
    file,
    ...toQs
  }: {
    collection: T
    data: MakeOptional<C['collections'][T], 'id'>
    depth?: number
    draft?: boolean
    fallbackLocale?: C['locale'] | null
    file?: File
    locale?: C['locale'] | null
  }): Promise<C['collections'][T]> {
    const qs = buildQueryString(toQs)

    const requestInit: RequestInit = { method: 'POST' }

    if (file) {
      const formData = new FormData()

      formData.set('file', file)
      formData.set('_payload', JSON.stringify(data))

      requestInit.body = formData
    } else {
      requestInit.body = JSON.stringify(data)
      requestInit.headers = {
        'Content-Type': 'application/json',
      }
    }

    const response = await this.fetcher(`${this.apiURL}/${collection.toString()}${qs}`, requestInit)

    return response.json()
  }

  async delete<T extends keyof C['collections']>({
    collection,
    ...toQs
  }: {
    collection: T
    depth?: number
    draft?: boolean
    fallbackLocale?: C['locale'] | null
    locale?: C['locale'] | null
    where: Where
  }): Promise<BulkOperationResult<T & CollectionSlug, any>> {
    const qs = buildQueryString(toQs)

    const response = await this.fetcher(`${this.apiURL}/${collection.toString()}${qs}`, {
      method: 'DELETE',
    })

    return response.json()
  }

  async deleteById<T extends keyof C['collections']>({
    collection,
    id,
    ...toQs
  }: {
    collection: T
    depth?: number
    draft?: boolean
    fallbackLocale?: C['locale'] | null
    id: string | number
    locale?: C['locale'] | null
  }): Promise<C['collections'][T]> {
    const qs = buildQueryString(toQs)

    const response = await this.fetcher(`${this.apiURL}/${collection.toString()}/${id}${qs}`, {
      method: 'DELETE',
    })

    return response.json()
  }

  async find<T extends keyof C['collections'], K extends keyof C['collections'][T] = never>({
    collection,
    ...toQs
  }: {
    collection: T
    depth?: number
    draft?: boolean
    fallbackLocale?: C['locale'] | null
    limit?: number
    locale?: 'all' | C['locale'] | null
    page?: number
    select?: K[]
    sort?: `-${Exclude<keyof C['collections'][T], symbol>}` | keyof C['collections'][T]
    where?: Where
  }): Promise<PaginatedDocs<K extends never ? C['collections'][T] : Pick<C['collections'][T], K>>> {
    const qs = buildQueryString(toQs)

    const response = await this.fetcher(`${this.apiURL}/${collection.toString()}${qs}`)

    return response.json()
  }

  async findById<T extends keyof C['collections'], K extends keyof C['collections'][T] = never>({
    collection,
    id,
    ...toQs
  }: {
    collection: T
    depth?: number
    draft?: boolean
    fallbackLocale?: C['locale'] | null
    id: string | number
    locale?: 'all' | C['locale'] | null
    select?: K[]
  }): Promise<K extends never ? C['collections'][T] : Pick<C['collections'][T], K>> {
    const qs = buildQueryString(toQs)

    const response = await this.fetcher(`${this.apiURL}/${collection.toString()}/${id}${qs}`)

    return response.json()
  }

  async findGlobal<T extends keyof C['globals'], K extends keyof C['globals'][T] = never>({
    slug,
    ...toQs
  }: {
    depth?: number
    fallbackLocale?: C['locale'] | null
    locale?: 'all' | C['locale'] | null
    select?: K[]
    slug: T
  }): Promise<K extends never ? C['globals'][T] : Pick<C['globals'][T], K>> {
    const qs = buildQueryString(toQs)

    const response = await this.fetcher(`${this.apiURL}/globals/${slug.toString()}${qs}`)

    return response.json()
  }

  getApiURL() {
    return this.apiURL
  }

  getFetcher() {
    return this.fetcher
  }

  async update<T extends keyof C['collections']>({
    collection,
    data,
    ...toQs
  }: {
    collection: T
    data: DeepPartial<C['collections'][T]>
    depth?: number
    draft?: boolean
    fallbackLocale?: C['locale'] | null
    id: string | number
    locale?: C['locale'] | null
    where: Where
  }): Promise<BulkOperationResult<T & CollectionSlug, any>> {
    const qs = buildQueryString(toQs)

    const response = await this.fetcher(`${this.apiURL}/${collection.toString()}${qs}`, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    })

    return response.json()
  }

  async updateById<T extends keyof C['collections']>({
    collection,
    data,
    id,
    depth = 0,
    fallbackLocale = null,
  }: {
    collection: T
    data: DeepPartial<C['collections'][T]>
    depth?: number
    fallbackLocale?: C['locale'] | null
    id: string | number
  }): Promise<C['collections'][T]> {
    const qs = buildQueryString({
      depth,
      'fallback-locale': fallbackLocale,
    })

    const response = await this.fetcher(
      `${this.apiURL}/${collection.toString()}/${id.toString()}${qs}`,
      {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      },
    )

    return response.json()
  }

  async updateGlobal<T extends keyof C['globals']>({
    data,
    slug,
    ...toQs
  }: {
    data: DeepPartial<C['globals'][T]>
    depth?: number
    fallbackLocale?: C['locale'] | null
    locale?: C['locale'] | null
    slug: T
  }): Promise<C['globals'][T]> {
    const qs = buildQueryString(toQs)

    const response = await this.fetcher(`${this.apiURL}/globals/${slug.toString()}${qs}`, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    })

    return response.json()
  }
}

export function buildQueryString(args: Record<string, unknown> | undefined) {
  if (!args) return ''

  if (args['fallbackLocale']) {
    args['fallback-locale'] = args['fallbackLocale']
    delete args['fallbackLocale']
  }

  return queryString.stringify(args, { addQueryPrefix: true })
}
