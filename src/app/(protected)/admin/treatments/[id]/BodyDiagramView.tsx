'use client'

import { BodyDiagram } from '@/components/body-diagram'
import type { BodyDiagramData } from '@/types/body-diagram'

interface BodyDiagramViewProps {
  data: BodyDiagramData | null
}

export function BodyDiagramView({ data }: BodyDiagramViewProps) {
  if (!data) {
    return (
      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">人体図記録</h2>
        <p className="text-sm text-gray-500">
          この施術では人体図記録が保存されていません。
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">人体図記録</h2>
      <p className="text-sm text-gray-600 mb-4">
        施術箇所や痛みの部位が視覚的に記録されています。
      </p>
      <BodyDiagram data={data} readonly />
    </div>
  )
}
