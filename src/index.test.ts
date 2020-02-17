import helloWorld from './index';

test('hello world', () => {
  expect(helloWorld()).toBe('Hello World');
});
