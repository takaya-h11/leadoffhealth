'use client'

import { BodyDiagram } from '@/components/body-diagram'
import type { BodyDiagramData } from '@/types/body-diagram'

interface TreatmentReportViewProps {
  record: {
    treatment_content: string;
    patient_condition: string;
    improvement_level: number;
    satisfaction_level: number;
    actual_duration_minutes: number;
    next_recommendation: string;
    body_diagram_data: BodyDiagramData | null;
    created_at: string;
  };
  treatmentSymptoms: string[]
}

export function TreatmentReportView({ record, treatmentSymptoms }: TreatmentReportViewProps) {
  console.log('🔍 Treatment record data:', record)
  console.log('🎨 Body diagram data:', record.body_diagram_data)
  console.log('🎨 Body diagram data type:', typeof record.body_diagram_data)
  console.log('🎨 Body diagram data is null?:', record.body_diagram_data === null)
  console.log('🎨 Body diagram data is undefined?:', record.body_diagram_data === undefined)

  const bodyDiagramData = record.body_diagram_data as BodyDiagramData | null

  console.log('🎨 Parsed bodyDiagramData:', bodyDiagramData)
  console.log('🎨 Will render diagram?:', !!bodyDiagramData)

  return (
    <div className="space-y-6">
      {/* Body Diagram Section */}
      {bodyDiagramData ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">人体図記録</h3>
          <p className="text-sm text-gray-600 mb-4">
            施術箇所や痛みの部位が視覚的に記録されています。
          </p>
          <BodyDiagram data={bodyDiagramData} readonly />
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">人体図記録</h3>
          <p className="text-sm text-gray-500">
            この施術では人体図記録が保存されていません。
          </p>
        </div>
      )}

      {/* レポート内容 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">施術レポート</h3>

        {/* 施術内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">施術内容</label>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-900 whitespace-pre-wrap">
            {record.treatment_content}
          </div>
        </div>

        {/* 顧客の状態 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">顧客の状態</label>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-900 whitespace-pre-wrap">
            {record.patient_condition}
          </div>
        </div>

        {/* 施術した症状 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">施術した症状</label>
          <div className="flex flex-wrap gap-2">
            {treatmentSymptoms.map((symptom, index) => (
              <span
                key={index}
                className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>

        {/* 改善度と満足度 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">改善度</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-8">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ width: `${(record.improvement_level / 5) * 100}%` }}
                >
                  {record.improvement_level}/5
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {record.improvement_level === 1 ? '改善なし' :
                 record.improvement_level === 2 ? 'わずかに改善' :
                 record.improvement_level === 3 ? 'やや改善' :
                 record.improvement_level === 4 ? '改善' : '大幅改善'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">満足度</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-8">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ width: `${(record.satisfaction_level / 5) * 100}%` }}
                >
                  {record.satisfaction_level}/5
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {record.satisfaction_level === 1 ? '不満' :
                 record.satisfaction_level === 2 ? 'やや不満' :
                 record.satisfaction_level === 3 ? '普通' :
                 record.satisfaction_level === 4 ? '満足' : '非常に満足'}
              </span>
            </div>
          </div>
        </div>

        {/* 実際の施術時間 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">実際の施術時間</label>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-900">
            {record.actual_duration_minutes}分
          </div>
        </div>

        {/* 次回の提案 */}
        {record.next_recommendation && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">次回の提案</label>
            <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-900 whitespace-pre-wrap">
              {record.next_recommendation}
            </div>
          </div>
        )}

        {/* 記録日時 */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            記録日時: {new Date(record.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>
    </div>
  )
}
