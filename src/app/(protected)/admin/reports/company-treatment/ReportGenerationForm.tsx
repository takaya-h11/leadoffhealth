'use client'

import { useState } from 'react'

interface Company {
  id: string
  name: string
}

interface ReportGenerationFormProps {
  companies: Company[]
}

export function ReportGenerationForm({ companies }: ReportGenerationFormProps) {
  const [companyId, setCompanyId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!companyId || !startDate || !endDate) {
      setError('すべての項目を入力してください')
      return
    }

    // 日付検証
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start > end) {
      setError('開始日は終了日より前にしてください')
      return
    }

    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        companyId,
        startDate,
        endDate,
      })

      const response = await fetch(`/api/reports/company-treatment?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'レポート生成に失敗しました')
      }

      // PDFダウンロード
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `施術レポート_${startDate}_${endDate}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // フォームリセット
      setCompanyId('')
      setStartDate('')
      setEndDate('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'レポート生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">レポート生成フォーム</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">
            法人 <span className="text-red-500">*</span>
          </label>
          <select
            id="companyId"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">選択してください</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              開始日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              終了日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="mr-2 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              生成中...
            </span>
          ) : (
            '📄 レポート生成・ダウンロード'
          )}
        </button>
      </form>

      <div className="mt-6 rounded-md bg-blue-50 p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">レポート内容</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>施術実施回数、利用社員数、総施術時間などの統計サマリー</li>
          <li>症状分布（円グラフ）</li>
          <li>改善度分布（棒グラフ）</li>
          <li>満足度分布（棒グラフ）</li>
          <li>月次推移（折れ線グラフ）</li>
          <li>利用者別の詳細施術記録（日時、整体師、症状、改善度、満足度、施術内容、患者状態、身体図、次回推奨）</li>
        </ul>
      </div>
    </div>
  )
}
