export class InconsistencyError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, InconsistencyError.prototype);
  }
};

export class UnsupportedFeatureError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, UnsupportedFeatureError.prototype);
  }
};

export class NotFoundError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
};
