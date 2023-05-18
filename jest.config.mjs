import {defaults} from 'jest-config'

const config = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mts'],
  transform: {
    '^.+\\.m?tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.json',
      },
    ],
  },
  // typescript 5 removes the need to suffix relative imports with .js, so we should no longer need this workaround
  // but, we are keeping it for now to support both import styles
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testEnvironment: 'node',
  coverageProvider: 'v8'
}

export default config
