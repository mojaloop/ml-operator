'use strict'
const { pathsToModuleNameMapper } = require('ts-jest/utils')
const { compilerOptions } = require('./tsconfig')
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  // Only checking coverage of domain for now
  collectCoverageFrom: [
    './src/domain/*.ts',
    '!src/**/*.unit.ts',
    '!src/**/*.integration.ts',
  ],
  coverageReporters: ['json', 'lcov', 'text'],
  clearMocks: true,
  coverageThreshold: {
    global: {
      statements: 90,
      functions: 90,
      branches: 85,
      lines: 90
    }
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/'
  }),
  reporters: ['jest-junit', 'default']
}
