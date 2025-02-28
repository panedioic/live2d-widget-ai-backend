module.exports = {
    root: true,
    env: {
        node: true,
        es2022: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
        'no-console': 'warn',
        '@typescript-eslint/no-explicit-any': 'off'
    }
}