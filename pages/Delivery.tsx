import React from 'react';
import { Link } from 'react-router-dom';
import './Offer.css';

const Delivery: React.FC = () => {
  return (
    <div className="offer-container">
      <div className="offer-content">
        <h1>Получение услуги</h1>
        <p className="offer-date">Дата публикации: 03.08.2026</p>

        <nav className="legal-nav">
          <Link to="/offer">Оферта</Link>
          <Link to="/privacy">Политика конфиденциальности</Link>
          <Link to="/contacts">Контакты</Link>
          <Link to="/refunds">Возвраты</Link>
          <Link to="/delivery">Получение услуги</Link>
        </nav>

        <section className="offer-section">
          <h2>1. Что вы получаете</h2>
          <p>
            Loopera предоставляет цифровые товары и услуги без физической доставки:
          </p>
          <ul>
            <li>звуковые паки и материалы в форматах <strong>ZIP</strong> и/или <strong>MP3</strong>;</li>
            <li>доступ к скачиванию купленных товаров в личном кабинете;</li>
            <li>активация подписки Basic/Pro/Business — сразу после успешной оплаты.</li>
          </ul>
        </section>

        <section className="offer-section">
          <h2>2. Срок предоставления</h2>
          <p>
            2.1. Услуга предоставляется <strong>мгновенно</strong> после подтверждения успешной оплаты
            платёжной системой.
          </p>
          <p>
            2.2. Обычно доступ открывается в течение нескольких секунд. В редких случаях подтверждение
            платежа может занять до нескольких минут — обновите страницу покупки.
          </p>
        </section>

        <section className="offer-section">
          <h2>3. Как скачать</h2>
          <ol>
            <li>После оплаты вы попадаете на страницу покупки со кнопкой «Скачать».</li>
            <li>Повторно скачать можно в профиле → раздел «Покупки».</li>
            <li>Файл сохраняется на ваше устройство (ZIP / MP3).</li>
          </ol>
        </section>

        <section className="offer-section">
          <h2>4. Если что-то не скачалось</h2>
          <p>
            Напишите в поддержку с email аккаунта и названием Товара:
          </p>
          <p>
            Email: <a href="mailto:support@loopera.ru">support@loopera.ru</a><br />
            Telegram менеджер:{' '}
            <a href="https://t.me/looperamanager" target="_blank" rel="noreferrer">@looperamanager</a>
          </p>
        </section>

        <section className="offer-section">
          <h2>5. Реквизиты продавца</h2>
          <div className="requisites">
            <p><strong>ФИО:</strong> Матвеев Дмитрий Дмитриевич</p>
            <p><strong>Статус:</strong> Самозанятый</p>
            <p><strong>ИНН:</strong> 550367838850</p>
            <p><strong>Адрес:</strong> г. Омск</p>
            <p><strong>БИК:</strong> 044525974</p>
            <p><strong>Сайт:</strong> https://loopera.ru</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Delivery;
