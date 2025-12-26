# GitHub ブランチ保護ルール設定ガイド

このガイドでは、`main`ブランチを保護し、安全な開発フローを確立するための設定方法を説明します。

## 目的

ブランチ保護ルールを設定することで、以下のメリットがあります：

1. **誤った直接pushを防止** - `main`ブランチへの直接commitを禁止
2. **コードレビューの強制** - Pull Requestを通じたマージのみを許可
3. **品質の維持** - CIチェックが成功した場合のみマージ可能
4. **本番環境の安定性** - 意図しない変更が本番環境に反映されるのを防ぐ

## 設定手順

### 1. GitHubリポジトリにアクセス

1. ブラウザで以下のURLにアクセス：
   ```
   https://github.com/takaya-h11/leadoffhealth
   ```

2. リポジトリの **Settings** タブをクリック

### 2. ブランチ保護ルールの追加

1. 左サイドバーから **Branches** を選択

2. **Branch protection rules** セクションで **Add branch protection rule** をクリック

### 3. 保護するブランチの指定

1. **Branch name pattern** に以下を入力：
   ```
   main
   ```

   これにより、`main`ブランチが保護されます。

### 4. 推奨設定

以下の設定を有効化することを強く推奨します：

#### ✅ Require a pull request before merging

- **目的**: 直接pushを禁止し、Pull Requestを通じたマージのみを許可
- **設定**:
  - ☑️ **Require a pull request before merging** をチェック
  - **Required number of approvals before merging**: `1`
    - 1人以上のレビュアーの承認を必須にする
    - チーム規模に応じて調整可能

#### ✅ Require status checks to pass before merging

- **目的**: CI/CDチェックが成功した場合のみマージを許可
- **設定**:
  - ☑️ **Require status checks to pass before merging** をチェック
  - ☑️ **Require branches to be up to date before merging**
    - マージ前にベースブランチの最新コミットを取り込むことを強制

**注意**: この設定は、VercelなどのCIが設定されている場合に有効です。

#### ✅ Require conversation resolution before merging

- **目的**: Pull Requestのコメントがすべて解決されるまでマージを禁止
- **設定**:
  - ☑️ **Require conversation resolution before merging** をチェック

#### ✅ Do not allow bypassing the above settings

- **目的**: 管理者も含め、すべてのユーザーに保護ルールを適用
- **設定**:
  - ☑️ **Do not allow bypassing the above settings** をチェック

**重要**: この設定を有効にすると、管理者でも直接pushできなくなります。緊急時の対応が必要な場合は、一時的に無効化できます。

#### 🔴 Allow force pushes

- **設定**: ❌ **チェックしない**
- **理由**: force pushは履歴を書き換えるため、本番環境では危険

#### 🔴 Allow deletions

- **設定**: ❌ **チェックしない**
- **理由**: `main`ブランチの削除を防止

### 5. 設定を保存

1. すべての設定を確認

2. ページ下部の **Create** ボタンをクリック

これで、`main`ブランチが保護されました。

## 設定後のワークフロー

### 通常の開発フロー

```bash
# 1. developブランチで開発
git checkout develop
git pull origin develop

# 2. 機能開発
# ... コード編集 ...

# 3. commitとpush
git add .
git commit -m "feat: 新機能の実装"
git push origin develop
```

### 本番リリース（Pull Requestを使用）

```bash
# 1. developブランチを最新にする
git checkout develop
git pull origin develop

# 2. GitHubでPull Requestを作成
# ブラウザで以下のURLにアクセス:
# https://github.com/takaya-h11/leadoffhealth/compare/main...develop

# 3. Pull Requestの情報を入力
#    - Title: 本番リリース v1.2.3
#    - Description: 変更内容のサマリー
#    - Reviewers: レビュアーを指定（必要に応じて）

# 4. Create Pull Request をクリック

# 5. レビュー後、Merge Pull Request をクリック
```

### GitHub CLI を使用したPull Request作成

```bash
# GitHub CLIがインストールされている場合
gh auth login

# developからmainへのPRを作成
gh pr create --base main --head develop --title "本番リリース v1.2.3" --body "変更内容のサマリー"

# PRをマージ
gh pr merge <PR番号> --merge
```

## 緊急時の対応（Hotfix）

緊急修正が必要な場合も、Pull Requestを使用します：

```bash
# 1. mainブランチから修正用ブランチを作成
git checkout main
git pull origin main
git checkout -b hotfix/urgent-bug-fix

# 2. 修正を実施
# ... コード編集 ...

# 3. commitとpush
git add .
git commit -m "fix: 緊急バグ修正"
git push origin hotfix/urgent-bug-fix

# 4. GitHubでPull Requestを作成
# main <- hotfix/urgent-bug-fix

# 5. レビュー・マージ

# 6. developにもマージ
git checkout develop
git merge main
git push origin develop
```

## トラブルシューティング

### 「protected branch」エラーが出る

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
```

**原因**: `main`ブランチに直接pushしようとした

**解決方法**:
1. Pull Requestを作成してマージする
2. または、一時的にブランチ保護を無効化（非推奨）

### 管理者でもpushできない

**原因**: "Do not allow bypassing the above settings" が有効

**解決方法**:
1. 通常はPull Requestを使用（推奨）
2. 緊急時は一時的にルールを無効化：
   - GitHub Settings > Branches > Edit rule
   - "Do not allow bypassing" のチェックを外す
   - 作業完了後、再度有効化

### Pull Requestがマージできない

**原因1**: 必要な承認が得られていない

**解決方法**: レビュアーに承認を依頼

**原因2**: CIチェックが失敗している

**解決方法**:
1. Vercelのビルドログを確認
2. エラーを修正
3. 再度push（自動的にCIが再実行される）

**原因3**: コンフリクトが発生している

**解決方法**:
```bash
# ローカルでコンフリクトを解決
git checkout develop
git pull origin main
# コンフリクトを手動で解決
git add .
git commit -m "merge: mainブランチをマージしてコンフリクト解決"
git push origin develop
```

## ベストプラクティス

### 1. 定期的にdevelopをmainにマージ

- 本番環境とプレビュー環境の差を小さく保つ
- リリースサイクル: 週1回または機能完成時

### 2. 意味のあるコミットメッセージ

```bash
# 良い例
git commit -m "feat: ユーザー登録機能を追加"
git commit -m "fix: ログインエラーを修正"
git commit -m "docs: READMEを更新"

# 悪い例
git commit -m "update"
git commit -m "fix"
```

### 3. Pull Requestに詳細な説明を記載

```markdown
## 変更内容
- ユーザー登録機能の実装
- バリデーションの追加

## テスト
- ローカル環境で動作確認
- プレビュー環境でE2Eテスト実施

## スクリーンショット
（必要に応じて）
```

### 4. 小さなPull Requestを心がける

- 大きな変更は複数のPRに分割
- レビューしやすく、問題発見が容易

## 参考リンク

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CLI](https://cli.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**最終更新日**: 2025年12月4日
