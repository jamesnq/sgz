import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function seedMorePosts() {
  console.log('Adding more posts...')

  const payload = await getPayload({ config: configPromise })

  // Get existing tags
  const tagsResult = await payload.find({ collection: 'post-tags', limit: 10 })
  const tags = tagsResult.docs

  if (tags.length === 0) {
    console.error('No tags found!')
    process.exit(1)
  }

  // Get a default image
  const media = await payload.find({ collection: 'media', limit: 1 })
  if (!media.docs[0]) {
    console.error('No media found!')
    process.exit(1)
  }
  const imageId = media.docs[0].id

  const topics = [
    'Genshin Impact',
    'Honkai Star Rail',
    'PUBG Mobile',
    'Valorant',
    'League of Legends',
    'Wuthering Waves',
    'Zenless Zone Zero',
    'Tower of Fantasy',
    'Blue Archive',
    'Arknights',
    'Path to Nowhere',
    'Reverse 1999',
    'Counter Side',
    'Nikke',
    'Limbus Company',
    'Elden Ring',
    'Final Fantasy',
    'Steam',
    'Epic Games',
    'PlayStation',
  ]

  const types = [
    'Hướng dẫn chi tiết',
    'Mẹo và thủ thuật',
    'Cập nhật mới nhất',
    'Review đánh giá',
    'Các sự kiện hot',
    'Tier list tháng này',
    'Build nhân vật meta',
    'Farm tài nguyên',
  ]

  // Create 70 more posts for 10 pages total (90 posts needed, we have ~20)
  for (let i = 0; i < 70; i++) {
    const topic = topics[i % topics.length]!
    const type = types[i % types.length]!
    const tag = tags[i % tags.length]!
    const slug = `post-extra-${i + 1}-${Date.now()}`

    try {
      await payload.create({
        collection: 'posts',
        draft: false,
        data: {
          title: `${type} ${topic} - Phần ${i + 1}`,
          slug,
          excerpt: `Bài viết về ${topic.toLowerCase()} với các thông tin hữu ích cho game thủ.`,
          image: imageId,
          tags: [tag.id],
          publishedAt: new Date(Date.now() - i * 1800000).toISOString(), // 30 min apart
        } as any,
      })
      console.log(`✓ Created ${i + 1}/70`)
    } catch (err: any) {
      console.error(`✗ Failed ${i + 1}:`, err?.message || err)
    }
  }

  console.log('Done!')
  process.exit(0)
}

seedMorePosts()
