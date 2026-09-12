type TestFailure = {
  name: string;
  error: unknown;
};

const failures: TestFailure[] = [];
let passed = 0;

export const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

export const assertEqual = <T>(actual: T, expected: T, message?: string): void => {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      `${message ?? 'assertEqual failed'}\n  expected: ${expectedJson}\n  actual:   ${actualJson}`,
    );
  }
};

export const test = (name: string, fn: () => void): void => {
  try {
    fn();
    passed += 1;
    // eslint-disable-next-line no-console
    console.log(`ok - ${name}`);
  } catch (error) {
    failures.push({ name, error });
    // eslint-disable-next-line no-console
    console.error(`FAIL - ${name}`);
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

export const report = (): boolean => {
  const failedCount = failures.length;
  // eslint-disable-next-line no-console
  console.log(`\n${passed} passed, ${failedCount} failed`);

  const ok = 0 === failedCount;
  passed = 0;
  failures.length = 0;

  return ok;
};
