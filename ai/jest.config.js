module.exports = {
    testEnvironment: 'node',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000,
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/setup.js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/'
    ]
}; 