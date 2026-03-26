export default async function handler(req, res) {
  const target = 'http://45.83.140.152:5001';
  
  // Получаем URL запроса
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname + url.search;
  
  // Создаем новый URL для бэкенда
  const backendUrl = `${target}${path}`;
  
  try {
    // Копируем заголовки
    const headers = { ...req.headers };
    delete headers.host; // Удаляем host header
    
    // Делаем запрос к бэкенду
    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined
    });
    
    // Копируем ответ
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // Добавляем CORS
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    responseHeaders['Access-Control-Allow-Headers'] = 'X-Requested-With, Content-Type, Authorization';
    
    // Устанавливаем заголовки и статус
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    res.status(response.status);
    
    // Отправляем тело ответа
    if (response.body) {
      response.body.pipe(res);
    } else {
      res.end();
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
}
