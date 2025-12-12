export interface apiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export const buildSuccessResponse = <T>(
  message: string,
  data?: T,
): apiResponse<T> => ({
  success: true,
  message,
  data,
});
