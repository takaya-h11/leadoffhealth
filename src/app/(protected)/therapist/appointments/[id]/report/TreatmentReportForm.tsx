'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BodyDiagram } from '@/components/body-diagram';
import type { BodyDiagramData } from '@/types/body-diagram';
import { createTreatmentRecord, updateTreatmentRecord } from './actions';
import { Toast } from '@/components/ui/Toast';

interface Symptom {
  id: string;
  name: string;
}

interface ExistingRecord {
  id: string;
  treatment_content: string;
  patient_condition: string;
  improvement_level: number;
  satisfaction_level: number;
  actual_duration_minutes: number;
  next_recommendation: string;
  symptom_ids: string[];
  body_diagram_data: BodyDiagramData | null;
}

interface TreatmentReportFormProps {
  appointmentId: string;
  therapistId: string;
  defaultDuration: number;
  symptoms: Symptom[];
  editMode?: boolean;
  existingRecord?: ExistingRecord;
}

interface FormData {
  treatment_content: string;
  patient_condition: string;
  improvement_level: string;
  satisfaction_level: string;
  actual_duration_minutes: string;
  next_recommendation: string;
  symptoms: string[];
}

export function TreatmentReportForm({
  appointmentId,
  therapistId,
  defaultDuration,
  symptoms,
  editMode = false,
  existingRecord,
}: TreatmentReportFormProps) {
  const [bodyDiagramData, setBodyDiagramData] = useState<BodyDiagramData | undefined>(
    existingRecord?.body_diagram_data || undefined
  );
  const [showBodyDiagram, setShowBodyDiagram] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);

  // localStorage のキー（編集モードでは使用しない）
  const storageKey = `treatment-form-${appointmentId}`;

  // フォームデータの初期値を localStorage または既存レコードから復元
  const [formData, setFormData] = useState<FormData>(() => {
    // 編集モードの場合は既存レコードから初期化
    if (editMode && existingRecord) {
      return {
        treatment_content: existingRecord.treatment_content,
        patient_condition: existingRecord.patient_condition,
        improvement_level: existingRecord.improvement_level.toString(),
        satisfaction_level: existingRecord.satisfaction_level.toString(),
        actual_duration_minutes: existingRecord.actual_duration_minutes.toString(),
        next_recommendation: existingRecord.next_recommendation,
        symptoms: existingRecord.symptom_ids,
      };
    }

    // 新規作成モードの場合は localStorage から復元
    if (typeof window === 'undefined') return {
      treatment_content: '',
      patient_condition: '',
      improvement_level: '',
      satisfaction_level: '',
      actual_duration_minutes: defaultDuration.toString(),
      next_recommendation: '',
      symptoms: [],
    };

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          treatment_content: '',
          patient_condition: '',
          improvement_level: '',
          satisfaction_level: '',
          actual_duration_minutes: defaultDuration.toString(),
          next_recommendation: '',
          symptoms: [],
        };
      }
    }
    return {
      treatment_content: '',
      patient_condition: '',
      improvement_level: '',
      satisfaction_level: '',
      actual_duration_minutes: defaultDuration.toString(),
      next_recommendation: '',
      symptoms: [],
    };
  });

  // フォームデータの変更を localStorage に保存（編集モードでは保存しない）
  useEffect(() => {
    if (!editMode && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, storageKey, editMode]);

  const handleBodyDiagramSave = (data: BodyDiagramData) => {
    console.log('🎨 handleBodyDiagramSave called with data:', data);
    console.log('   Has views?', data?.views ? 'Yes' : 'No');
    console.log('   Metadata:', data?.metadata);
    setBodyDiagramData(data);
    console.log('✅ Body diagram data saved to state');

    // Show toast notification
    setShowToast(true);

    // Show visual feedback on the save button
    setSavedRecently(true);
    setTimeout(() => {
      setSavedRecently(false);
    }, 2000);
  };

  const handleSubmit = async (formDataObj: globalThis.FormData) => {
    // クライアントサイドバリデーション
    const treatmentContent = formDataObj.get('treatment_content') as string;
    const patientCondition = formDataObj.get('patient_condition') as string;
    const improvementLevel = formDataObj.get('improvement_level') as string;
    const satisfactionLevel = formDataObj.get('satisfaction_level') as string;
    const actualDurationMinutes = formDataObj.get('actual_duration_minutes') as string;
    const selectedSymptoms = formDataObj.getAll('symptoms') as string[];

    if (!treatmentContent?.trim()) {
      alert('施術内容を入力してください');
      return;
    }
    if (!patientCondition?.trim()) {
      alert('顧客の状態を入力してください');
      return;
    }
    if (!improvementLevel) {
      alert('改善度を選択してください');
      return;
    }
    if (!satisfactionLevel) {
      alert('満足度を選択してください');
      return;
    }
    if (!actualDurationMinutes) {
      alert('実際の施術時間を入力してください');
      return;
    }
    if (selectedSymptoms.length === 0) {
      alert('施術した症状を少なくとも1つ選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // Add body diagram data to form if available
      console.log('📋 Preparing form submission...');
      console.log('   bodyDiagramData state:', bodyDiagramData ? 'Has data' : 'null/undefined');

      if (bodyDiagramData) {
        const jsonString = JSON.stringify(bodyDiagramData);
        console.log('✅ Appending body_diagram_data to FormData');
        console.log('   JSON length:', jsonString.length);
        console.log('   JSON preview:', jsonString.substring(0, 200));
        formDataObj.append('body_diagram_data', jsonString);
      } else {
        console.log('⚠️  No bodyDiagramData to append - user did not draw anything');
      }

      // 編集モードか新規作成モードかで使用するアクションを切り替え
      if (editMode && existingRecord) {
        formDataObj.append('record_id', existingRecord.id);
        await updateTreatmentRecord(formDataObj);
      } else {
        await createTreatmentRecord(formDataObj);
        // 成功したら localStorage をクリア
        if (typeof window !== 'undefined') {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      setIsSubmitting(false);
      // エラー時は localStorage を保持（再入力の手間を省く）
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message="人体図データが保存されました！"
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Body Diagram Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">人体図記録（任意）</h3>
            {savedRecently && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold animate-in fade-in duration-200">
                <span>✓</span>
                <span>保存済み</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowBodyDiagram(!showBodyDiagram)}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {showBodyDiagram ? '人体図を閉じる' : '人体図を開く'}
          </button>
        </div>

        {showBodyDiagram && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              施術箇所や痛みの部位を視覚的に記録できます。ペンで描画、色で種類分け（赤=痛み、青=施術箇所など）、ピンで部位を特定できます。
            </p>
            <BodyDiagram data={bodyDiagramData} onSave={handleBodyDiagramSave} />
          </div>
        )}
      </div>

      {/* レポート記入フォーム */}
      <form ref={formRef} action={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <input type="hidden" name="appointment_id" value={appointmentId} />
        <input type="hidden" name="therapist_id" value={therapistId} />

        <div className="space-y-6">
          {/* 施術内容 */}
          <div>
            <label htmlFor="treatment_content" className="block text-sm font-medium text-gray-700">
              施術内容 <span className="text-red-600">*</span>
            </label>
            <textarea
              id="treatment_content"
              name="treatment_content"
              rows={5}
              required
              value={formData.treatment_content}
              onChange={(e) => setFormData({ ...formData, treatment_content: e.target.value })}
              placeholder="実施した施術の内容を詳しく記入してください"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* 顧客の状態 */}
          <div>
            <label htmlFor="patient_condition" className="block text-sm font-medium text-gray-700">
              顧客の状態 <span className="text-red-600">*</span>
            </label>
            <textarea
              id="patient_condition"
              name="patient_condition"
              rows={5}
              required
              value={formData.patient_condition}
              onChange={(e) => setFormData({ ...formData, patient_condition: e.target.value })}
              placeholder="施術前後の顧客の状態を記入してください"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* 症状（複数選択） */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              施術した症状 <span className="text-red-600">*</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">実際に施術した症状を選択してください（複数選択可）</p>
            <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
              {symptoms?.map((symptom) => (
                <label key={symptom.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="symptoms"
                    value={symptom.id}
                    checked={formData.symptoms.includes(symptom.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, symptoms: [...formData.symptoms, symptom.id] });
                      } else {
                        setFormData({ ...formData, symptoms: formData.symptoms.filter(id => id !== symptom.id) });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{symptom.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 改善度 */}
          <div>
            <label htmlFor="improvement_level" className="block text-sm font-medium text-gray-700">
              改善度 <span className="text-red-600">*</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">1: 改善なし 〜 5: 大幅改善</p>
            <select
              id="improvement_level"
              name="improvement_level"
              required
              value={formData.improvement_level}
              onChange={(e) => setFormData({ ...formData, improvement_level: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} - {n === 1 ? '改善なし' : n === 2 ? 'わずかに改善' : n === 3 ? 'やや改善' : n === 4 ? '改善' : '大幅改善'}
                </option>
              ))}
            </select>
          </div>

          {/* 満足度 */}
          <div>
            <label htmlFor="satisfaction_level" className="block text-sm font-medium text-gray-700">
              満足度 <span className="text-red-600">*</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              1: 不満 〜 5: 非常に満足（顧客にヒアリングして評価してください）
            </p>
            <select
              id="satisfaction_level"
              name="satisfaction_level"
              required
              value={formData.satisfaction_level}
              onChange={(e) => setFormData({ ...formData, satisfaction_level: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} - {n === 1 ? '不満' : n === 2 ? 'やや不満' : n === 3 ? '普通' : n === 4 ? '満足' : '非常に満足'}
                </option>
              ))}
            </select>
          </div>

          {/* 実際の施術時間 */}
          <div>
            <label htmlFor="actual_duration_minutes" className="block text-sm font-medium text-gray-700">
              実際の施術時間（分） <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              id="actual_duration_minutes"
              name="actual_duration_minutes"
              min="1"
              max="300"
              required
              value={formData.actual_duration_minutes}
              onChange={(e) => setFormData({ ...formData, actual_duration_minutes: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* 次回の提案 */}
          <div>
            <label htmlFor="next_recommendation" className="block text-sm font-medium text-gray-700">
              次回の提案
            </label>
            <p className="mt-1 text-xs text-gray-500">次回の施術に向けた提案やアドバイスを記入してください</p>
            <textarea
              id="next_recommendation"
              name="next_recommendation"
              rows={4}
              value={formData.next_recommendation}
              onChange={(e) => setFormData({ ...formData, next_recommendation: e.target.value })}
              placeholder="例: 2週間後に再度施術することをお勧めします。肩甲骨周りのストレッチを継続してください。"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (editMode ? '更新中...' : '記録中...') : (editMode ? '更新する' : '記録する')}
          </button>
          <a
            href="/therapist/appointments"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </a>
        </div>
      </form>

      {/* Debug info */}
      {bodyDiagramData && (
        <details className="mt-4 p-4 bg-gray-100 rounded-md">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            人体図データ（デバッグ用）
          </summary>
          <pre className="mt-2 text-xs overflow-auto max-h-96 bg-white p-4 rounded border">
            {JSON.stringify(bodyDiagramData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
