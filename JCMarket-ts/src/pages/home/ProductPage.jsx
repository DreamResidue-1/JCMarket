import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import api from '../../lib/api';
import { Header } from '../../components/Header';
import { resolveBackendAssetUrl } from '../../lib/assets';
import { formatMoney } from '../../utils/Money';
import sampleProducts from '../../sample-products.json';
import { useLanguage } from '../../i18n/LanguageContext';
import './ProductPage.css';

export function ProductPage({ cart, loadCart }) {
  const { productId } = useParams();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!productId) return;
      try {
        const response = await api.get(`/api/products/${productId}`);
        if (response?.data) {
          setProduct(response.data);
          return;
        }
      } catch (err) {
        // ignore and fallback to sample data
        // eslint-disable-next-line no-console
        console.warn('Failed to load product from API, falling back to sample data', err);
      }

      const local = sampleProducts.find((p) => String(p.id) === String(productId));
      if (local) setProduct(local);
    };

    void load();
  }, [productId]);

  if (!product) {
    return (
      <>
        <Header cart={cart} />
        <div className="container">
          <div className="products-state-card">{t('loading') || 'Loading product...'}</div>
        </div>
      </>
    );
  }

  const addToCart = async () => {
    try {
      await api.post('/api/cart-items', { productId: product.id, quantity });
      if (typeof loadCart === 'function') await loadCart();
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Add to cart failed', err);
    }
  };

  return (
    <>
      <Header cart={cart} />

      <div className="container product-page">
        <div className="product-detail">
          <div className="product-detail__media">
            <img src={resolveBackendAssetUrl(product.image)} alt={product.name} />
          </div>

          <div className="product-detail__info">
            <h1 className="product-detail__title">{product.name}</h1>
            <div className="product-detail__price">{formatMoney(product.priceCents)}</div>
            <div className="product-detail__desc">{product.description}</div>

            <div className="product-detail__controls">
              <label>
                {t('quantity') || 'Quantity'}
                <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <button className="button-primary" onClick={addToCart}>
                {t('addToCart') || 'Add to cart'}
              </button>
            </div>

            {added && <div className="product-detail__added">{t('added') || 'Added to cart'}</div>}

            <div className="product-detail__meta">
              <span>{product.inventory} in stock</span>
              <span style={{ marginLeft: 12 }}>{product.rating?.stars}★ ({product.rating?.count})</span>
            </div>

            <Link to="/" className="back-link">
              ← {t('backToProducts') || 'Back to products'}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
