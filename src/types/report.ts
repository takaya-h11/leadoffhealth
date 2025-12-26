// 法人別施術レポート関連の型定義

export interface TreatmentDetail {
  id: string
  date: Date
  therapistName: string
  symptoms: string[]
  improvementLevel: number
  satisfactionLevel: number
  treatmentContent: string
  patientCondition: string
  actualDurationMinutes: number | null
  nextRecommendation: string | null
  bodyDiagramImageUrl: string | null
  employeeName: string
  employeeId: string
}

export interface SymptomDistribution {
  name: string
  count: number
}

export interface ImprovementDistribution {
  label: string
  value: number
}

export interface SatisfactionDistribution {
  label: string
  value: number
}

export interface MonthlyTrend {
  month: string
  appointments: number
  avgImprovement: number
  avgSatisfaction: number
}

export interface TreatmentsByUser {
  employeeName: string
  employeeId: string
  treatments: TreatmentDetail[]
}

export interface CompanyTreatmentReportData {
  companyName: string
  startDate: string
  endDate: string
  totalAppointments: number
  totalEmployees: number
  uniqueEmployees: number
  totalDurationMinutes: number
  averageImprovement: number
  averageSatisfaction: number
  symptomDistribution: SymptomDistribution[]
  improvementDistribution: ImprovementDistribution[]
  satisfactionDistribution: SatisfactionDistribution[]
  monthlyTrends: MonthlyTrend[]
  treatmentsByUser: TreatmentsByUser[]
}

export interface ChartImages {
  symptomPie: string
  improvementBar: string
  satisfactionBar: string
  monthlyTrends: string
}
