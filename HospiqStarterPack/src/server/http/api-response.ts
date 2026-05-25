export type ApiOk<TData> = {
  ok: true;
  data: TData;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export function apiOk<TData>(data: TData): ApiOk<TData> {
  return { ok: true, data };
}

export function apiError(message: string, code = "BAD_REQUEST"): ApiError {
  return {
    ok: false,
    error: { code, message },
  };
}
