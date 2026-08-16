/** Jest config do Portal Web (React/Next). Usa ts-jest + jsdom. */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          module: 'commonjs',
          target: 'es2019',
          moduleResolution: 'node',
          strict: false,
        },
      },
    ],
  },
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
};
