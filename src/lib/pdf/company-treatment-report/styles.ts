import { StyleSheet, Font } from '@react-pdf/renderer'
import path from 'path'

// 日本語フォント登録（Noto Sans JP）
// publicフォルダに配置した静的フォントファイルを使用
// サーバーサイドでの実行のため、絶対パスを使用
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Regular.ttf')

Font.register({
  family: 'NotoSansJP',
  src: fontPath,
})

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'NotoSansJP',
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1F2937',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 20,
    color: '#374151',
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  column: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 12,
    color: '#111827',
    marginBottom: 8,
  },
  statBox: {
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 10,
    border: '1px solid #E5E7EB',
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  chartContainer: {
    width: '48%',
    marginBottom: 20,
  },
  chartImage: {
    width: '100%',
    height: 'auto',
  },
  chartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  treatmentCard: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    marginBottom: 15,
  },
  treatmentHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: '2px solid #3B82F6',
  },
  treatmentRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  treatmentLabel: {
    fontSize: 9,
    color: '#6B7280',
    width: '30%',
  },
  treatmentValue: {
    fontSize: 10,
    color: '#111827',
    width: '70%',
  },
  bodyDiagramImage: {
    width: '100%',
    maxWidth: 300,
    height: 'auto',
    marginTop: 10,
    marginBottom: 10,
  },
  userSection: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2px solid #D1D5DB',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderLeft: '4px solid #3B82F6',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 20,
    right: 40,
    color: '#6B7280',
  },
  footer: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 40,
    color: '#9CA3AF',
  },
  badge: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    marginRight: 6,
    marginBottom: 4,
  },
  symptomList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  ratingBadge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '4 10',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBoxSmall: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 10,
    border: '1px solid #E5E7EB',
  },
})
