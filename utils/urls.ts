export const getApiUrl = () => {
  const apiURL = import.meta.env.VITE_API_URL;
  return apiURL || '';
};

export const getUploadsUrl = (filename: string) => {
  const apiURL = import.meta.env.VITE_API_URL;
  return apiURL ? `${apiURL}/uploads/loops/${filename}` : `/uploads/loops/${filename}`;
};
