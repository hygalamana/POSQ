export const successResponse = <T>(data: T, meta?: any) => {
  return {
    success: true,
    data,
    meta,
  };
};

export const errorResponse = (code: string, message: string, details?: any) => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
};
