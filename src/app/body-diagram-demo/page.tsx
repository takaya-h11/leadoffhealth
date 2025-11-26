'use client';

import React, { useRef } from 'react';
import { BodyDiagram } from '@/components/body-diagram';
import type { BodyDiagramData } from '@/types/body-diagram';

export default function BodyDiagramDemoPage() {
  const [savedData, setSavedData] = React.useState<BodyDiagramData | undefined>();
  const [showSaveMessage, setShowSaveMessage] = React.useState(false);

  const handleSave = (data: BodyDiagramData) => {
    console.log('Saving body diagram data:', data);
    setSavedData(data);
    setShowSaveMessage(true);

    // Auto-hide message after 3 seconds
    setTimeout(() => {
      setShowSaveMessage(false);
    }, 3000);

    // In production, this would save to database
    // Example:
    // await supabase
    //   .from('treatment_records')
    //   .update({ body_diagram_data: data })
    //   .eq('id', treatmentRecordId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            人体図描画機能デモ
          </h1>
          <p className="mt-2 text-gray-600">
            施術記録用の人体図描画機能のデモです。自由に描画、注釈、ピンを追加できます。
          </p>
        </div>

        {/* Success message */}
        {showSaveMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            ✅ データを保存しました！（コンソールを確認してください）
          </div>
        )}

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="font-semibold text-blue-900 mb-2">使い方:</h2>
          <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
            <li>
              <strong>ペン:</strong> キャンバスをドラッグして自由に描画
            </li>
            <li>
              <strong>消しゴム:</strong> 描いた線を消去
            </li>
            <li>
              <strong>ピン:</strong> キャンバスをクリックして部位と注釈を追加
            </li>
            <li>
              <strong>テキスト:</strong> キャンバスをクリックしてテキスト注釈を追加
            </li>
            <li>
              <strong>色:</strong> 赤=痛み、青=施術箇所、緑=改善など
            </li>
            <li>
              <strong>ズーム:</strong> 拡大/縮小して詳細に描画
            </li>
            <li>
              <strong>元に戻す:</strong> Ctrl+Z（Mac: Cmd+Z）
            </li>
            <li>
              <strong>やり直し:</strong> Ctrl+Y（Mac: Cmd+Y）
            </li>
          </ul>
        </div>

        {/* Body Diagram Component */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <BodyDiagram data={savedData} onSave={handleSave} />
        </div>

        {/* Saved Data Preview */}
        {savedData && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold mb-2">保存されたデータ（JSON）:</h3>
            <pre className="text-xs overflow-auto max-h-96 bg-white p-4 rounded border">
              {JSON.stringify(savedData, null, 2)}
            </pre>
          </div>
        )}

        {/* Feature Checklist */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-3">実装済み機能:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>✏️ 自由描画（ペン）</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>🎨 色選択（6色）</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>📏 線の太さ調整（4段階）</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>🧹 消しゴム</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>↩️ 元に戻す/やり直し</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>🔍 ズーム/パン</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>📍 部位クリック（ピン）</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>📝 テキスト注釈</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>🖼️ PNG画像保存（ユーティリティ）</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>🔄 4方向切り替え（前・後・左・右）</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
