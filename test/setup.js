require('jest-extended');
process.env.NODE_ENV = 'test';

const jestTimeout = 50000;

jest.setTimeout(jestTimeout);
