import React from 'react';
import './Contacts.css';

const Contacts: React.FC = () => {
  return (
    <div className="contacts-container">
      <div className="contacts-content">
        <h1>Контакты и реквизиты</h1>
        <p className="contacts-subtitle">Информация для связи и платежей</p>

        <section className="contacts-section">
          <h2>Реквизиты</h2>
          <div className="requisites-card">
            <div className="requisite-item">
              <span className="requisite-label">Форма собственности:</span>
              <span className="requisite-value">Самозанятый</span>
            </div>
            <div className="requisite-item">
              <span className="requisite-label">ФИО:</span>
              <span className="requisite-value">[Укажите ФИО]</span>
            </div>
            <div className="requisite-item">
              <span className="requisite-label">ИНН:</span>
              <span className="requisite-value">[Укажите ИНН]</span>
            </div>
            <div className="requisite-item">
              <span className="requisite-label">Юридический адрес:</span>
              <span className="requisite-value">[Укажите адрес]</span>
            </div>
          </div>
        </section>

        <section className="contacts-section">
          <h2>Контактная информация</h2>
          <div className="contact-card">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <div>
                <span className="contact-label">Email:</span>
                <a href="mailto:triphoyprod@gmail.com" className="contact-value">triphoyprod@gmail.com</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📱</span>
              <div>
                <span className="contact-label">Telegram:</span>
                <a href="https://t.me/Troizkoe228" className="contact-value">@Troizkoe228</a>
              </div>
            </div>
          </div>
        </section>

        <section className="contacts-section">
          <h2>Сайт</h2>
          <div className="site-card">
            <div className="site-item">
              <span className="site-icon">🌐</span>
              <a href="https://loopera-lpr.vercel.app" className="site-value">loopera-lpr.vercel.app</a>
            </div>
          </div>
        </section>

        <section className="contacts-section">
          <h2>Режим работы</h2>
          <div className="work-hours-card">
            <p>Сайт работает круглосуточно, 7 дней в неделю.</p>
            <p>Ответ на обращения в службу поддержки предоставляется в течение 24 часов в рабочие дни.</p>
          </div>
        </section>

        <section className="contacts-section">
          <h2>Для платежных систем</h2>
          <div className="payment-info-card">
            <p>Данная страница создана для соответствия требованиям платежных систем и содержит всю необходимую информацию для подключения онлайн-кассы.</p>
            <ul>
              <li>✅ Оферта доступна по адресу <a href="/offer">/offer</a></li>
              <li>✅ Политика конфиденциальности доступна по адресу <a href="/privacy">/privacy</a></li>
              <li>✅ Контактная информация указана выше</li>
              <li>✅ Реквизиты для платежей указаны выше</li>
            </ul>
          </div>
        </section>

        <section className="contacts-section">
          <h2>Информация о товарах</h2>
          <div className="products-info-card">
            <p>Loopera — маркетплейс цифровых музыкальных товаров:</p>
            <ul>
              <li>Музыкальные лупы (loops)</li>
              <li>Сэмплы (samples)</li>
              <li>Звуковые паки (sound packs)</li>
              <li>Пресеты и другие цифровые материалы</li>
            </ul>
            <p>Все товары предоставляются в цифровом виде. После оплаты пользователи получают немедленный доступ к скачиванию через личный кабинет.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contacts;
