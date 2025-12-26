'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function ScrollToTop() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // ページ遷移時（特にmessageパラメータがある場合）に上部にスクロール
    if (searchParams.get('message')) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [searchParams])

  return null
}
