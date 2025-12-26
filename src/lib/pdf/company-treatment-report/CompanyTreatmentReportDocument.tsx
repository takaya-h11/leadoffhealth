import React from 'react'
import { Document } from '@react-pdf/renderer'
import { SummaryPage } from './SummaryPage'
import { TreatmentDetailsPages } from './TreatmentDetailsPages'
import type { CompanyTreatmentReportData, ChartImages } from '@/types/report'

interface CompanyTreatmentReportDocumentProps {
  data: CompanyTreatmentReportData
  chartImages: ChartImages
}

export function CompanyTreatmentReportDocument({
  data,
  chartImages,
}: CompanyTreatmentReportDocumentProps) {
  return (
    <Document
      title={`${data.companyName} 施術レポート ${data.startDate}〜${data.endDate}`}
      author="Lead off Health"
      subject={`${data.companyName}の施術レポート`}
      creator="Lead off Health 予約管理システム"
    >
      <SummaryPage data={data} chartImages={chartImages} />
      <TreatmentDetailsPages treatmentsByUser={data.treatmentsByUser} />
    </Document>
  )
}
