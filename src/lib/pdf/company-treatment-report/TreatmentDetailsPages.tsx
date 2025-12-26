import React from 'react'
import { Page, Text, View, Image } from '@react-pdf/renderer'
import { styles } from './styles'
import type { TreatmentsByUser } from '@/types/report'

interface TreatmentDetailsPagesProps {
  treatmentsByUser: TreatmentsByUser[]
}

export function TreatmentDetailsPages({ treatmentsByUser }: TreatmentDetailsPagesProps) {
  return (
    <>
      {treatmentsByUser.map((userGroup, userIndex) => (
        <Page key={userIndex} size="A4" style={styles.page}>
          <View style={styles.userSection}>
            <Text style={styles.userName}>
              {userGroup.employeeName}様
            </Text>

            {userGroup.treatments.map((treatment, treatmentIndex) => (
              <View key={treatmentIndex} style={styles.treatmentCard}>
                <Text style={styles.treatmentHeader}>
                  施術 {treatmentIndex + 1} -{' '}
                  {treatment.date.toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>

                <View style={styles.treatmentRow}>
                  <Text style={styles.treatmentLabel}>日時</Text>
                  <Text style={styles.treatmentValue}>
                    {treatment.date.toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}{' '}
                    {treatment.date.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={styles.treatmentRow}>
                  <Text style={styles.treatmentLabel}>担当整体師</Text>
                  <Text style={styles.treatmentValue}>{treatment.therapistName}</Text>
                </View>

                <View style={styles.treatmentRow}>
                  <Text style={styles.treatmentLabel}>施術時間</Text>
                  <Text style={styles.treatmentValue}>
                    {treatment.actualDurationMinutes || '-'}分
                  </Text>
                </View>

                <View style={styles.treatmentRow}>
                  <Text style={styles.treatmentLabel}>症状</Text>
                  <View style={styles.symptomList}>
                    {treatment.symptoms && treatment.symptoms.length > 0 ? (
                      treatment.symptoms.map((symptom, idx) => (
                        <Text key={idx} style={styles.badge}>
                          {symptom}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.treatmentValue}>-</Text>
                    )}
                  </View>
                </View>

                <View style={styles.treatmentRow}>
                  <Text style={styles.treatmentLabel}>改善度</Text>
                  <View style={{ width: '70%' }}>
                    <Text style={styles.ratingBadge}>
                      ★ {treatment.improvementLevel} / 5
                    </Text>
                  </View>
                </View>

                <View style={styles.treatmentRow}>
                  <Text style={styles.treatmentLabel}>満足度</Text>
                  <View style={{ width: '70%' }}>
                    <Text style={styles.ratingBadge}>
                      ★ {treatment.satisfactionLevel} / 5
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 10, marginBottom: 6 }}>
                  <Text style={styles.label}>施術内容</Text>
                  <Text style={styles.treatmentValue}>{treatment.treatmentContent || '-'}</Text>
                </View>

                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.label}>患者状態</Text>
                  <Text style={styles.treatmentValue}>{treatment.patientCondition || '-'}</Text>
                </View>

                {treatment.bodyDiagramImageUrl && (
                  <View style={{ marginTop: 10, marginBottom: 10 }}>
                    <Text style={styles.label}>身体図</Text>
                    <Image src={treatment.bodyDiagramImageUrl} style={styles.bodyDiagramImage} />
                  </View>
                )}

                {treatment.nextRecommendation && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.label}>次回の提案</Text>
                    <Text style={styles.treatmentValue}>{treatment.nextRecommendation}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <Text style={styles.footer}>Lead off Health 施術レポート</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      ))}
    </>
  )
}
