import { createCanvas } from 'canvas'
import type {
  SymptomDistribution,
  ImprovementDistribution,
  SatisfactionDistribution,
  MonthlyTrend,
} from '@/types/report'

const CHART_WIDTH = 800
const CHART_HEIGHT = 600
const PADDING = 60
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  purple: '#8B5CF6',
  pink: '#EC4899',
  cyan: '#06B6D4',
  red: '#EF4444',
  green: '#22C55E',
  background: '#FFFFFF',
  text: '#1F2937',
  grid: '#E5E7EB',
}

/**
 * 症状分布の円グラフを生成
 */
export async function generateSymptomPieChart(
  data: SymptomDistribution[]
): Promise<string> {
  const canvas = createCanvas(CHART_WIDTH, CHART_HEIGHT)
  const ctx = canvas.getContext('2d')

  // 背景
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT)

  // タイトル
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('症状分布', CHART_WIDTH / 2, 40)

  if (data.length === 0) {
    ctx.font = '20px sans-serif'
    ctx.fillStyle = '#9CA3AF'
    ctx.fillText('データなし', CHART_WIDTH / 2, CHART_HEIGHT / 2)
    return canvas.toDataURL()
  }

  // 円グラフ描画
  const centerX = CHART_WIDTH / 2 - 100
  const centerY = CHART_HEIGHT / 2 + 20
  const radius = Math.min(CHART_WIDTH, CHART_HEIGHT) / 3

  const total = data.reduce((sum, item) => sum + item.count, 0)
  let startAngle = -Math.PI / 2
  const pieColors = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.accent,
    COLORS.purple,
    COLORS.pink,
    COLORS.cyan,
    COLORS.red,
    COLORS.green,
  ]

  data.forEach((item, index) => {
    const sliceAngle = (item.count / total) * 2 * Math.PI
    const endAngle = startAngle + sliceAngle

    // パイスライス描画
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = pieColors[index % pieColors.length]
    ctx.fill()
    ctx.strokeStyle = COLORS.background
    ctx.lineWidth = 2
    ctx.stroke()

    startAngle = endAngle
  })

  // 凡例
  const legendX = CHART_WIDTH / 2 + 150
  let legendY = 120
  const legendItemHeight = 35

  data.forEach((item, index) => {
    // 色ボックス
    ctx.fillStyle = pieColors[index % pieColors.length]
    ctx.fillRect(legendX, legendY - 15, 20, 20)

    // ラベル
    ctx.fillStyle = COLORS.text
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'left'
    const percentage = ((item.count / total) * 100).toFixed(1)
    ctx.fillText(`${item.name}: ${item.count}件 (${percentage}%)`, legendX + 30, legendY)

    legendY += legendItemHeight
  })

  return canvas.toDataURL()
}

/**
 * 棒グラフを生成（改善度・満足度用）
 */
export async function generateBarChart(
  data: ImprovementDistribution[] | SatisfactionDistribution[],
  title: string
): Promise<string> {
  const canvas = createCanvas(CHART_WIDTH, CHART_HEIGHT)
  const ctx = canvas.getContext('2d')

  // 背景
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT)

  // タイトル
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, CHART_WIDTH / 2, 40)

  if (data.length === 0) {
    ctx.font = '20px sans-serif'
    ctx.fillStyle = '#9CA3AF'
    ctx.fillText('データなし', CHART_WIDTH / 2, CHART_HEIGHT / 2)
    return canvas.toDataURL()
  }

  const maxValue = Math.max(...data.map((d) => d.value))
  const chartWidth = CHART_WIDTH - PADDING * 2
  const chartHeight = CHART_HEIGHT - PADDING * 2 - 40
  const barWidth = chartWidth / data.length - 40

  // グリッド線
  ctx.strokeStyle = COLORS.grid
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = PADDING + 40 + (chartHeight * i) / 5
    ctx.beginPath()
    ctx.moveTo(PADDING, y)
    ctx.lineTo(CHART_WIDTH - PADDING, y)
    ctx.stroke()

    // Y軸ラベル
    ctx.fillStyle = COLORS.text
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'right'
    const value = maxValue - (maxValue * i) / 5
    ctx.fillText(Math.round(value).toString(), PADDING - 10, y + 5)
  }

  // 棒グラフ描画
  data.forEach((item, index) => {
    const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0
    const x = PADDING + index * (chartWidth / data.length) + 20
    const y = PADDING + 40 + chartHeight - barHeight

    // 棒
    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
    gradient.addColorStop(0, COLORS.primary)
    gradient.addColorStop(1, COLORS.secondary)
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, barWidth, barHeight)

    // 値ラベル
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(item.value.toString(), x + barWidth / 2, y - 10)

    // X軸ラベル
    ctx.font = '14px sans-serif'
    ctx.fillText(item.label, x + barWidth / 2, CHART_HEIGHT - PADDING + 25)
  })

  // 軸
  ctx.strokeStyle = COLORS.text
  ctx.lineWidth = 2
  // Y軸
  ctx.beginPath()
  ctx.moveTo(PADDING, PADDING + 40)
  ctx.lineTo(PADDING, CHART_HEIGHT - PADDING)
  ctx.stroke()
  // X軸
  ctx.beginPath()
  ctx.moveTo(PADDING, CHART_HEIGHT - PADDING)
  ctx.lineTo(CHART_WIDTH - PADDING, CHART_HEIGHT - PADDING)
  ctx.stroke()

  return canvas.toDataURL()
}

/**
 * 折れ線グラフを生成（月次推移用）
 */
export async function generateLineChart(data: MonthlyTrend[]): Promise<string> {
  const canvas = createCanvas(CHART_WIDTH, CHART_HEIGHT)
  const ctx = canvas.getContext('2d')

  // 背景
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT)

  // タイトル
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('月次推移', CHART_WIDTH / 2, 40)

  if (data.length === 0) {
    ctx.font = '20px sans-serif'
    ctx.fillStyle = '#9CA3AF'
    ctx.fillText('データなし', CHART_WIDTH / 2, CHART_HEIGHT / 2)
    return canvas.toDataURL()
  }

  const chartWidth = CHART_WIDTH - PADDING * 2 - 80
  const chartHeight = CHART_HEIGHT - PADDING * 2 - 40

  // 最大値計算
  const maxAppointments = Math.max(...data.map((d) => d.appointments))
  const maxRating = 5

  // グリッド線とY軸ラベル（左：予約数）
  ctx.strokeStyle = COLORS.grid
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = PADDING + 40 + (chartHeight * i) / 5
    ctx.beginPath()
    ctx.moveTo(PADDING + 80, y)
    ctx.lineTo(CHART_WIDTH - PADDING, y)
    ctx.stroke()

    // 予約数ラベル（左）
    ctx.fillStyle = COLORS.primary
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'right'
    const appointmentValue = maxAppointments - (maxAppointments * i) / 5
    ctx.fillText(Math.round(appointmentValue).toString() + '件', PADDING + 70, y + 5)

    // 評価ラベル（右）
    ctx.fillStyle = COLORS.secondary
    ctx.textAlign = 'left'
    const ratingValue = maxRating - (maxRating * i) / 5
    ctx.fillText(ratingValue.toFixed(1), CHART_WIDTH - PADDING + 10, y + 5)
  }

  // データポイント描画
  const stepX = chartWidth / Math.max(data.length - 1, 1)

  // 予約数の線
  ctx.strokeStyle = COLORS.primary
  ctx.lineWidth = 3
  ctx.beginPath()
  data.forEach((item, index) => {
    const x = PADDING + 80 + index * stepX
    const y =
      PADDING +
      40 +
      chartHeight -
      (maxAppointments > 0 ? (item.appointments / maxAppointments) * chartHeight : 0)
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()

  // 予約数のドット
  data.forEach((item, index) => {
    const x = PADDING + 80 + index * stepX
    const y =
      PADDING +
      40 +
      chartHeight -
      (maxAppointments > 0 ? (item.appointments / maxAppointments) * chartHeight : 0)
    ctx.fillStyle = COLORS.primary
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, 2 * Math.PI)
    ctx.fill()
  })

  // 改善度の線
  ctx.strokeStyle = COLORS.secondary
  ctx.lineWidth = 3
  ctx.beginPath()
  data.forEach((item, index) => {
    const x = PADDING + 80 + index * stepX
    const y = PADDING + 40 + chartHeight - (item.avgImprovement / maxRating) * chartHeight
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()

  // 改善度のドット
  data.forEach((item, index) => {
    const x = PADDING + 80 + index * stepX
    const y = PADDING + 40 + chartHeight - (item.avgImprovement / maxRating) * chartHeight
    ctx.fillStyle = COLORS.secondary
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, 2 * Math.PI)
    ctx.fill()
  })

  // X軸ラベル（月）
  ctx.fillStyle = COLORS.text
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  data.forEach((item, index) => {
    const x = PADDING + 80 + index * stepX
    const monthLabel = item.month.replace('年', '/').replace('月', '')
    ctx.fillText(monthLabel, x, CHART_HEIGHT - PADDING + 25)
  })

  // 軸
  ctx.strokeStyle = COLORS.text
  ctx.lineWidth = 2
  // Y軸（左）
  ctx.beginPath()
  ctx.moveTo(PADDING + 80, PADDING + 40)
  ctx.lineTo(PADDING + 80, CHART_HEIGHT - PADDING)
  ctx.stroke()
  // Y軸（右）
  ctx.beginPath()
  ctx.moveTo(CHART_WIDTH - PADDING, PADDING + 40)
  ctx.lineTo(CHART_WIDTH - PADDING, CHART_HEIGHT - PADDING)
  ctx.stroke()
  // X軸
  ctx.beginPath()
  ctx.moveTo(PADDING + 80, CHART_HEIGHT - PADDING)
  ctx.lineTo(CHART_WIDTH - PADDING, CHART_HEIGHT - PADDING)
  ctx.stroke()

  // 凡例
  const legendY = CHART_HEIGHT - 20
  ctx.fillStyle = COLORS.primary
  ctx.fillRect(CHART_WIDTH / 2 - 150, legendY, 20, 3)
  ctx.fillStyle = COLORS.text
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('予約数', CHART_WIDTH / 2 - 120, legendY + 5)

  ctx.fillStyle = COLORS.secondary
  ctx.fillRect(CHART_WIDTH / 2 + 20, legendY, 20, 3)
  ctx.fillStyle = COLORS.text
  ctx.fillText('平均改善度', CHART_WIDTH / 2 + 50, legendY + 5)

  return canvas.toDataURL()
}
