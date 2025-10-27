module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:svelte/recommended', 'prettier'],
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['node_modules', 'build', '.svelte-kit'],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte/svelte'
    }
  ]
};
