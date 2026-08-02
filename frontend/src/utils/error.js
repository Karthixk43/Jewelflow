export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  const responseError = error?.response?.data?.error;
  const responseMessage = error?.response?.data?.message;
  const status = error?.response?.status;
  const statusText = error?.response?.statusText;

  if (typeof responseError === 'string' && responseError.trim()) return responseError;
  if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;
  if (typeof error?.message === 'string' && error.message.trim()) {
    if (status) {
      return `${fallback} (${status}${statusText ? ` ${statusText}` : ''})`;
    }
    return error.message;
  }

  return fallback;
};
