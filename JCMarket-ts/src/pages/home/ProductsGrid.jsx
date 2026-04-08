
import { Product } from './Product'


export function ProductsGrid({ loadCart, products, search, error }){
  if (error) {
    return <div className="products-state-card">{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="products-state-card">
        {search
          ? `No products matched "${search}". Try a broader term or a simpler spelling.`
          : 'No products are available right now.'}
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
