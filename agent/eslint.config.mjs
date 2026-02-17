import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 推奨設定の読み込み（基本的なバグ検出用）
  ...tseslint.configs.recommended,
  {
    // 対象ファイル
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 必要に応じてルールを無効化（0: off, 1: warn, 2: error）

      // 例: any型の使用を許可したい場合
      // '@typescript-eslint/no-explicit-any': 'off',

      // 例: 未使用変数をエラーにしない（開発中はウザいので）
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
);
