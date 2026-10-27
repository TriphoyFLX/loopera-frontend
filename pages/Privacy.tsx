import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import './Privacy.css';

const PUBLISHED = '03.08.2026';

const Privacy: React.FC = () => {
  const { t, locale } = useI18n();

  return (
    <div className="privacy-container">
      <div className="privacy-content">
        {locale === 'en' && (
          <div className="privacy-locale-note">{t('legal.localeNote')}</div>
        )}
        <h1>{t('legal.privacyTitle')}</h1>
        <p className="privacy-date">{t('legal.published', { date: PUBLISHED })}</p>

        <nav className="legal-nav">
          <Link to="/offer">Оферта</Link>
          <Link to="/privacy">Политика конфиденциальности</Link>
          <Link to="/contacts">Контакты</Link>
          <Link to="/refunds">Возвраты</Link>
          <Link to="/delivery">Получение услуги</Link>
        </nav>

        <section className="privacy-section">
          <h2>1. Общие положения</h2>
          <p>
            1.1. Настоящая Политика определяет порядок обработки персональных данных пользователей
            сайта https://loopera.ru (далее — «Сайт»).
          </p>
          <p>
            1.2. Оператор персональных данных — самозанятый Матвеев Дмитрий Дмитриевич, ИНН 550367838850
            (далее — «Оператор»).
          </p>
          <p>
            1.3. Использование Сайта означает согласие с настоящей Политикой.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Какие данные мы собираем</h2>
          <ul>
            <li><strong>Регистрация:</strong> email, имя пользователя, пароль (в хешированном виде)</li>
            <li><strong>Профиль:</strong> данные, которые пользователь указывает сам</li>
            <li><strong>Платежи:</strong> сведения о заказах и статусе оплаты (карточные данные обрабатывает платёжный провайдер)</li>
            <li><strong>Технические:</strong> IP, браузер, устройство, логи действий</li>
            <li><strong>Связь:</strong> сообщения в поддержку, Telegram при обращении</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. Цели обработки</h2>
          <ul>
            <li>доступ к аккаунту и функциям Сайта;</li>
            <li>оплата, выдача цифровых Товаров и подписок;</li>
            <li>поддержка пользователей;</li>
            <li>безопасность и предотвращение мошенничества;</li>
            <li>исполнение требований закона.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Защита данных</h2>
          <p>4.1. Оператор применяет организационные и технические меры защиты данных.</p>
          <p>4.2. Пароли хранятся в зашифрованном (хешированном) виде.</p>
          <p>4.3. Передача данных при оплате идёт по защищённым каналам через платёжного провайдера.</p>
        </section>

        <section className="privacy-section">
          <h2>5. Передача третьим лицам</h2>
          <p>5.1. Данные могут передаваться:</p>
          <ul>
            <li>платёжным системам для проведения оплаты;</li>
            <li>по требованию закона / уполномоченных органов;</li>
            <li>сервисам хостинга и почтовой доставки в объёме, нужном для работы Сайта.</li>
          </ul>
          <p>5.2. Оператор не продаёт персональные данные.</p>
        </section>

        <section className="privacy-section">
          <h2>6. Cookies</h2>
          <p>
            Сайт использует cookies для авторизации, настроек и аналитики. Отказ от cookies может
            ограничить работу Сайта.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Права пользователя</h2>
          <p>
            Пользователь вправе запросить доступ, исправление или удаление данных, написав на{' '}
            <a href="mailto:support@loopera.ru">support@loopera.ru</a>.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Хранение</h2>
          <p>
            Данные хранятся, пока нужен аккаунт и пока это требуется законом (в т.ч. по платежам).
            После удаления аккаунта персональные данные удаляются, кроме обязательных к хранению.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. Изменения Политики</h2>
          <p>
            Новая редакция публикуется на Сайте и действует с даты размещения.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Возраст</h2>
          <p>Сайт предназначен для лиц старше 18 лет.</p>
        </section>

        <section className="privacy-section">
          <h2>11. Контакты Оператора</h2>
          <div className="privacy-contacts">
            <p><strong>ФИО:</strong> Матвеев Дмитрий Дмитриевич</p>
            <p><strong>ИНН:</strong> 550367838850</p>
            <p><strong>Адрес:</strong> г. Омск</p>
            <p><strong>Email:</strong> <a href="mailto:support@loopera.ru">support@loopera.ru</a></p>
            <p><strong>Telegram:</strong> <a href="https://t.me/looperamanager" target="_blank" rel="noreferrer">@looperamanager</a></p>
            <p><Link to="/contacts">Страница контактов</Link></p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
