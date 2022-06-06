'use strict';

module.exports = {
	globals: {
		'ts-jest': {
			tsconfig: './tsconfig.json',
		},
	},
	rootDir: '..',
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},
	verbose: false,
	collectCoverage: false,
	coverageReporters: ['json'],
	setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
	testMatch: ['<rootDir>/test/**/*.(spec|test).(js|ts)'],
	modulePathIgnorePatterns: ['<rootDir>/dist/','<rootDir>/cdk/'],
	restoreMocks: true,
	resetModules: true,
	coverageDirectory: '.coverage/integration',
};
