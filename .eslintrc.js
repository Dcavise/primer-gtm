module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error'
  }
};
