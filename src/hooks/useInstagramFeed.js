import { useState, useEffect } from 'react'

const FEED_ID = import.meta.env.VITE_BEHOLD_FEED_ID

function normalise(post) {
  const sizeUrl =
    post.sizes?.medium?.mediaUrl ||
    post.sizes?.large?.mediaUrl ||
    post.sizes?.small?.mediaUrl ||
    null
  const imageUrl =
    post.mediaType === 'VIDEO'
      ? post.thumbnailUrl || sizeUrl || post.mediaUrl
      : sizeUrl || post.mediaUrl

  return {
    id: post.id,
    imageUrl,
    permalink: post.permalink,
    caption: post.prunedCaption || post.caption || '',
    mediaType: post.mediaType,
  }
}

export function useInstagramFeed({ limit } = {}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!FEED_ID) {
      setError('missing-feed-id')
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchFeed() {
      try {
        const res = await fetch(`https://feeds.behold.so/${FEED_ID}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        const normalised = (data.posts || []).map(normalise).filter(p => p.imageUrl)
        setPosts(limit ? normalised.slice(0, limit) : normalised)
      } catch (err) {
        if (!cancelled) setError(err.message || 'fetch-failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchFeed()
    return () => { cancelled = true }
  }, [limit])

  return { posts, loading, error }
}
