import React from 'react'
import { Page, Text, View, Image } from '@react-pdf/renderer'
import { styles } from './styles'
import type { CompanyTreatmentReportData, ChartImages } from '@/types/report'

interface SummaryPageProps {
  data: CompanyTreatmentReportData
  chartImages: ChartImages
}

export function SummaryPage({ data, chartImages }: SummaryPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>施術レポート</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={{ width: '50%' }}>
            <Text style={styles.label}>法人名</Text>
            <Text style={styles.value}>{data.companyName}</Text>
          </View>
          <View style={{ width: '50%' }}>
            <Text style={styles.label}>対象期間</Text>
            <Text style={styles.value}>
              {data.startDate} 〜 {data.endDate}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.subHeader}>統計サマリー</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBoxSmall}>
          <Text style={styles.statLabel}>施術実施回数</Text>
          <Text style={styles.statValue}>{data.totalAppointments}件</Text>
        </View>

        <View style={styles.statBoxSmall}>
          <Text style={styles.statLabel}>利用社員数（実人数）</Text>
          <Text style={styles.statValue}>{data.uniqueEmployees}名</Text>
        </View>

        <View style={styles.statBoxSmall}>
          <Text style={styles.statLabel}>総施術時間</Text>
          <Text style={styles.statValue}>
            {Math.floor(data.totalDurationMinutes / 60)}時間{data.totalDurationMinutes % 60}分
          </Text>
        </View>

        <View style={styles.statBoxSmall}>
          <Text style={styles.statLabel}>平均施術時間</Text>
          <Text style={styles.statValue}>
            {data.totalAppointments > 0
              ? Math.round(data.totalDurationMinutes / data.totalAppointments)
              : 0}
            分
          </Text>
        </View>

        <View style={styles.statBoxSmall}>
          <Text style={styles.statLabel}>平均改善度</Text>
          <Text style={styles.statValue}>{data.averageImprovement.toFixed(2)} / 5.0</Text>
        </View>

        <View style={styles.statBoxSmall}>
          <Text style={styles.statLabel}>平均満足度</Text>
          <Text style={styles.statValue}>{data.averageSatisfaction.toFixed(2)} / 5.0</Text>
        </View>
      </View>

      <Text style={styles.subHeader}>統計グラフ</Text>

      <View style={styles.chartsGrid}>
        <View style={styles.chartContainer}>
          <Image src={chartImages.symptomPie} style={styles.chartImage} />
        </View>

        <View style={styles.chartContainer}>
          <Image src={chartImages.improvementBar} style={styles.chartImage} />
        </View>

        <View style={styles.chartContainer}>
          <Image src={chartImages.satisfactionBar} style={styles.chartImage} />
        </View>

        <View style={styles.chartContainer}>
          <Image src={chartImages.monthlyTrends} style={styles.chartImage} />
        </View>
      </View>

      <Text style={styles.footer}>Lead off Health 施術レポート</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  )
}
