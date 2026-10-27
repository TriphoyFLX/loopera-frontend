import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import './Contacts.css';

const Contacts: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="contacts-container">
      <div className="contacts-content">
        <h1>{t('contactsPage.title')}</h1>
        <p className="contacts-subtitle">{t('contactsPage.support')}</p>

        <nav className="legal-nav">
          <Link to="/offer">Оферта</Link>
          <Link to="/privacy">Политика конфиденциальности</Link>
          <Link to="/contacts">Контакты</Link>
          <Link to="/refunds">Возвраты</Link>
          <Link to="/delivery">Получение услуги</Link>
        </nav>

        <section className="contacts-section">
          <h2>{t('contactsPage.requisites')}</h2>
          <div className="requisites-card">
            <div className="requisite-item">
              <span className="requisite-label">ФИО:</span>
              <span className="requisite-value">Матвеев Дмитрий Дмитриевич</span>
            </div>
            <div className="requisite-item">
              <span className="requisite-label">Форма:</span>
              <span className="requisite-value">Самозанятый</span>
            </div>
            <div className="requisite-item">
              <span className="requisite-label">ИНН:</span>
              <span className="requisite-value">550367838850</span>
            </div>
            <div className="requisite-item">
              <span className="requisite-label">Адрес:</span>
              <span className="requisite-value">г. Омск</span>
            </div>
            <div className="requisite-item">
              <span className="requisite-label">БИК:</span>
              <span className="requisite-value">044525974</span>
            </div>
            <div className="requisite-item">
              <span className="requisite-label">Сайт:</span>
              <span className="requisite-value">https://loopera.ru</span>
            </div>
          </div>
        </section>

        <section className="contacts-section">
          <h2>{t('contactsPage.support')}</h2>
          <div className="contact-card">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <div>
                <span className="contact-label">Email поддержки:</span>
                <a href="mailto:support@loopera.ru" className="contact-value">support@loopera.ru</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">🤝</span>
              <div>
                <span className="contact-label">Сотрудничество / реклама:</span>
                <a href="mailto:partners@loopera.ru" className="contact-value">partners@loopera.ru</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📱</span>
              <div>
                <span className="contact-label">Telegram менеджер:</span>
                <a href="https://t.me/looperamanager" className="contact-value" target="_blank" rel="noreferrer">
                  @looperamanager
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="contacts-section">
          <h2>Режим работы</h2>
          <div className="work-hours-card">
            <p>Сайт работает круглосуточно, 7 дней в неделю.</p>
            <p>Ответ поддержки — обычно в течение 24 часов в рабочие дни.</p>
          </div>
        </section>

        <section className="contacts-section">
          <h2>Документы для платёжных систем</h2>
          <div className="payment-info-card">
            <ul>
              <li>Оферта — <Link to="/offer">/offer</Link></li>
              <li>Политика конфиденциальности — <Link to="/privacy">/privacy</Link></li>
              <li>Возвраты — <Link to="/refunds">/refunds</Link></li>
              <li>Получение услуги — <Link to="/delivery">/delivery</Link></li>
              <li>Контакты и реквизиты — на этой странице</li>
            </ul>
          </div>
        </section>

        <section className="contacts-section">
          <h2>О товарах</h2>
          <div className="products-info-card">
            <p>Loopera — маркетплейс цифровых музыкальных товаров и подписок:</p>
            <ul>
              <li>звуковые паки (ZIP / MP3);</li>
              <li>лупы и сэмплы;</li>
              <li>подписки Basic / Pro / Business.</li>
            </ul>
            <p>
              После оплаты доступ открывается сразу: скачивание и повторная загрузка из личного кабинета.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contacts;
