import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Deposit = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="deposit-page">
      <style>{`
        .deposit-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .deposit-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .deposit-header h1 {
          font-size: 32px;
          margin-bottom: 10px;
          color: #fff;
        }

        .deposit-header p {
          color: #888;
        }

        .coming-soon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          color: white;
        }

        .coming-soon-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .coming-soon h2 {
          font-size: 28px;
          margin-bottom: 15px;
        }

        .coming-soon p {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 30px;
        }

        .back-button {
          display: inline-block;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          color: white;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <div className="deposit-header">
        <h1>Пополнение баланса</h1>
        <p>Добавьте coins на свой аккаунт</p>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">💰</div>
        <h2>Скоро будет доступно</h2>
        <p>Мы работаем над системой пополнения баланса. Скоро здесь появятся способы оплаты.</p>
        <button className="back-button" onClick={() => navigate('/profile')}>
          Вернуться в профиль
        </button>
      </div>
    </div>
  )
}

export default Deposit
