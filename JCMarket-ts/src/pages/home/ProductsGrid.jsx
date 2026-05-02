
import { Product } from './Product'
import { useLanguage } from '../../i18n/LanguageContext';


export function ProductsGrid({ loadCart, products, search, error }){
  const { t } = useLanguage();

  if (error) {
    return <div className="products-state-card">{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="products-state-card">
        {search
          ? t('noProductsMatched', { search })
          : t('noProductsAvailable')}
      </div>
    );
  }

  return (
    <div className="products-grid">
          {products.map(product => {
            return (
              <Product key={product.id} product={product} loadCart={loadCart} />
            )
          })}

        </div> 
  )
}
