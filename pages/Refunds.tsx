import React from 'react';
import { Link } from 'react-router-dom';
import './Offer.css';

const Refunds: React.FC = () => {
  return (
    <div className="offer-container">
      <div className="offer-content">
        <h1>Политика возвратов</h1>
        <p className="offer-date">Дата публикации: 03.08.2026</p>

        <nav className="legal-nav">
          <Link to="/offer">Оферта</Link>
          <Link to="/privacy">Политика конфиденциальности</Link>
          <Link to="/contacts">Контакты</Link>
          <Link to="/refunds">Возвраты</Link>
          <Link to="/delivery">Получение услуги</Link>
        </nav>

        <section className="offer-section">
          <h2>1. Общие правила</h2>
          <p>
            1.1. На сайте Loopera (https://loopera.ru) продаются цифровые товары и услуги
            (звуковые паки ZIP/MP3, доступ к скачиванию, подписки).
          </p>
          <p>
            1.2. В связи с характером цифрового контента <strong>возврат денежных средств
            после предоставления доступа к Товару не производится</strong>, кроме случая,
            указанного ниже.
          </p>
        </section>

        <section className="offer-section">
          <h2>2. Когда возврат возможен</h2>
          <p>
            2.1. Возврат возможен только при <strong>ошибочной (двойной) оплате</strong> одного
            и того же Товара/услуги, если средства были списаны повторно по технической ошибке
            или по вине платёжной системы / Сайта.
          </p>
          <p>
            2.2. Срок обращения за таким возвратом — <strong>не более 7 (семи) календарных дней</strong>
            с даты оплаты.
          </p>
        </section>

        <section className="offer-section">
          <h2>3. Как оформить обращение</h2>
          <p>3.1. Напишите в поддержку и укажите:</p>
          <ul>
            <li>email аккаунта Loopera;</li>
            <li>дату и сумму платежа;</li>
            <li>название Товара / ID заказа (если есть);</li>
            <li>подтверждение двойного списания (скрин / выписка).</li>
          </ul>
          <p>
            Email: <a href="mailto:support@loopera.ru">support@loopera.ru</a><br />
            Telegram: <a href="https://t.me/looperamanager" target="_blank" rel="noreferrer">@looperamanager</a>
          </p>
          <p>
            3.2. После проверки возврат осуществляется тем же способом, которым была произведена оплата,
            в сроки платёжного провайдера.
          </p>
        </section>

        <section className="offer-section">
          <h2>4. Технические проблемы без возврата</h2>
          <p>
            Если файл не скачивается или доступ не открылся, но оплата прошла один раз — напишите
            в поддержку. Мы восстановим доступ / выдадим ссылку на скачивание. Это не является
            основанием для возврата денег при успешном предоставлении Товара.
          </p>
        </section>

        <section className="offer-section">
          <h2>5. Реквизиты</h2>
          <div className="requisites">
            <p><strong>ФИО:</strong> Матвеев Дмитрий Дмитриевич</p>
            <p><strong>Статус:</strong> Самозанятый</p>
            <p><strong>ИНН:</strong> 550367838850</p>
            <p><strong>Адрес:</strong> г. Омск</p>
            <p><strong>БИК:</strong> 044525974</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Refunds;
