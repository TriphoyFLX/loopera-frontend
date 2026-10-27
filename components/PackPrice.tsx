import { useI18n } from '../i18n/useI18n';
import styles from './PackPrice.module.css';

export type PackPriceFields = {
  price: number;
  original_price?: number;
  final_price?: number;
  discount_percent?: number;
  has_discount?: boolean;
};

export function getPackChargePrice(pack: PackPriceFields): number {
  return pack.final_price ?? pack.price;
}

interface PackPriceProps {
  pack: PackPriceFields;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PackPrice = ({ pack, size = 'md', className = '' }: PackPriceProps) => {
  const { t } = useI18n();
  const finalPrice = getPackChargePrice(pack);
  const originalPrice = pack.original_price ?? pack.price;
  const hasDiscount = pack.has_discount ?? (pack.discount_percent ?? 0) > 0;

  if (!hasDiscount || finalPrice >= originalPrice) {
    return (
      <span className={`${styles.price} ${styles[size]} ${className}`}>
        {finalPrice} ₽
      </span>
    );
  }

  return (
    <div className={`${styles.wrap} ${styles[size]} ${className}`}>
      <span className={styles.badge}>
        {t('shopPage.discountBadge', { percent: pack.discount_percent ?? 0 })}
      </span>
      <div className={styles.row}>
        <span className={styles.final}>{finalPrice} ₽</span>
        <span className={styles.original}>{originalPrice} ₽</span>
      </div>
    </div>
  );
};

export default PackPrice;
