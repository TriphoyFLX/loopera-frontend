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
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
