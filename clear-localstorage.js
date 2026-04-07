// Скрипт для очистки некорректных данных в localStorage
// Запустите в консоли браузера

console.log('Очистка localStorage...');

// Удаляем некорректные данные
if (localStorage.getItem('user') === 'undefined') {
  localStorage.removeItem('user');
  console.log('Удален некорректный user');
}

if (localStorage.getItem('token') === 'undefined') {
  localStorage.removeItem('token');
  console.log('Удален некорректный token');
}

// Полная очистка при необходимости
// localStorage.clear();

console.log('Очистка завершена');
console.log('Текущие данные:', {
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user')
});
