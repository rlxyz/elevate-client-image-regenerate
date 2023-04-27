/**
 * This is a helper function for any API response in the application.
 *
 * Source: https://github.com/upsidecomp/upsidecomp-app-v1/blob/develop/api/libs/result.ts
 */
export class Result<T> {
  public ok: boolean;
  public failed: boolean;
  public error?: string;
  private _value?: T;

  private constructor(ok: boolean, error?: string, value?: T) {
    if (ok && error) {
      throw new Error(`InvalidOperation: A result cannot be
            successful and contain an error`);
    }
    if (!ok && !error) {
      throw new Error(`InvalidOperation: A failing result
            needs to contain an error message`);
    }

    this.ok = ok;
    this.failed = !ok;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.ok || !this._value) {
      throw new Error("Cant retrieve the value from a failed result.");
    }

    return this._value;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (result.failed) return result;
    }
    return Result.ok<any>();
  }
}
