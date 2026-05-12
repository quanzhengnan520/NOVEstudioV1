export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
  requestId: string;
};

export type ApiFailure = {
  success: false;
  data: null;
  error: string;
  requestId: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(requestId: string, data: T): ApiSuccess<T> {
  return { success: true, data, error: null, requestId };
}

export function fail(requestId: string, message: string): ApiFailure {
  return { success: false, data: null, error: message, requestId };
}
