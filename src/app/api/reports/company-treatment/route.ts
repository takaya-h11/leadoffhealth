import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { createClient } from '@/utils/supabase/server'
import { CompanyTreatmentReportDocument } from '@/lib/pdf/company-treatment-report/CompanyTreatmentReportDocument'
import { fetchCompanyTreatmentData } from '@/app/(protected)/admin/reports/company-treatment/actions'
import {
  generateSymptomPieChart,
  generateBarChart,
  generateLineChart,
} from '@/lib/pdf/chart-renderer/generateChartImage'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!companyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'companyId, startDate, endDate が必要です' },
        { status: 400 }
      )
    }

    // データ取得
    let reportData
    try {
      reportData = await fetchCompanyTreatmentData(companyId, startDate, endDate)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'データ取得エラー'
      if (errorMessage.includes('施術データがありません')) {
        return NextResponse.json({ error: errorMessage }, { status: 404 })
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // グラフ画像生成（並列実行）
    const [symptomPie, improvementBar, satisfactionBar, monthlyTrends] = await Promise.all([
      generateSymptomPieChart(reportData.symptomDistribution),
      generateBarChart(reportData.improvementDistribution, '改善度分布'),
      generateBarChart(reportData.satisfactionDistribution, '満足度分布'),
      generateLineChart(reportData.monthlyTrends),
    ])

    const chartImages = {
      symptomPie,
      improvementBar,
      satisfactionBar,
      monthlyTrends,
    }

    // PDF生成
    const pdfDocument = CompanyTreatmentReportDocument({
      data: reportData,
      chartImages,
    })

    const stream = await renderToStream(pdfDocument)

    // ファイル名生成
    const fileName = `${reportData.companyName}_施術レポート_${startDate}_${endDate}.pdf`
      .replace(/\//g, '-')
      .replace(/\s/g, '_')

    // レスポンス返却
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error('PDF生成エラー:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF生成に失敗しました' },
      { status: 500 }
    )
  }
}
