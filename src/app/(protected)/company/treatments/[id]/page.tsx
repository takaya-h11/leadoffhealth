import TreatmentDetailPage from '@/app/(protected)/admin/treatments/[id]/page'

// 法人担当者用の詳細ページは管理者用と同じコンポーネントを使用
// （権限チェックと自社データのみ閲覧制限は共通コンポーネント内で行われる）
export default TreatmentDetailPage
