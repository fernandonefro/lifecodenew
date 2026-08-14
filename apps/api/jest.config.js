/**
 * Jest config da API Lifecode.
 *
 * Notas de monorepo:
 * - Os pacotes internos (@lifecode/shared, @lifecode/database) são mapeados
 *   para o SOURCE (src/index.ts) para que o ts-jest os transpile em memória.
 *   Sem isso, o jest resolveria o symlink do pnpm e tentaria carregar TypeScript
 *   cru (@lifecode/database aponta seu "main" para src/index.ts).
 * - @lifecode/database reexporta @prisma/client — requer `prisma generate`
 *   (pnpm --filter @lifecode/database build) antes de rodar os testes.
 */
module.exports = {
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@lifecode/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@lifecode/database$': '<rootDir>/../../packages/database/src/index.ts',
  },
  testEnvironment: 'node',
};
