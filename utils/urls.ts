export const getApiUrl = () => {
  const apiURL = import.meta.env.VITE_API_URL;
  return apiURL || '';
};

export const getUploadsUrl = (filename: string) => {
  // Используем переменную окружения или fallback для разработки
  const apiURL = import.meta.env.VITE_API_URL;
  return `${apiURL}/uploads/loops/${filename}`;
};
