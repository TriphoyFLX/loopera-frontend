export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL;
};

export const getUploadsUrl = (filename: string) => {
  return `${import.meta.env.VITE_API_URL}/uploads/loops/${filename}`;
};
