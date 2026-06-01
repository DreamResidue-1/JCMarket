import { Route, Routes} from 'react-router'
import { useState , useEffect } from 'react'
import { HomePage } from './pages/home/HomePage'
import { CheckoutPage } from './pages/checkout/CheckoutPage'
import { OrdersPage } from './pages/order/OrdersPage'
import { TrackingPage } from './pages/TrackingPage'
import { LoginPage } from './pages/login/LoginPage'
import { RegisterPage } from './pages/login/RegisterPage'
import { ForgotPasswordPage } from './pages/login/ForgotPasswordPage'
import { AddProductPage } from './pages/AddProductPage.tsx'
import { ProductPage } from './pages/home/ProductPage'
import { Page404 } from './pages/Page404'
import { ProtectedRoute } from './components/ProtectedRoute'
import ChatWidget from './components/ChatWidget.jsx'
import api from './lib/api'
import './App.css'
import './brand.css'

type CartItem = {
  productId: number;
  quantity: number;
  deliveryOptionId: number;
};

function App() {
 const [cart ,setCrat] = useState<CartItem[]>([]);
 
 const loadCart = async ()=>{
  const response = await api.get<CartItem[]>('/api/cart-items?expand=product');
  setCrat(response.data)
}
 useEffect(()=>{
  void loadCart();
 }, [])

  return (
    <>
    <Routes>
      <Route index element={<HomePage loadCart={loadCart} cart={cart}/>}/>
      <Route path='product/:productId' element={<ProductPage loadCart={loadCart} cart={cart} />}/>
      <Route path='checkout' element={<CheckoutPage loadCart={loadCart}  cart={cart}/>}/>
      <Route path='checkout/:productId' element={<CheckoutPage loadCart={loadCart}  cart={cart}/>}/>
      <Route path='orders'  element={<OrdersPage loadCart={loadCart} cart={cart} />}/>
      <Route path='login' element={<LoginPage />} />
      <Route path='signup' element={<RegisterPage />} />
      <Route path='forgot-password' element={<ForgotPasswordPage />} />
      <Route path='admin' element={<ProtectedRoute requiredPermission="create_product"><AddProductPage cart={cart} /></ProtectedRoute>} />
      <Route path='tracking/:orderId/:productId' element={<TrackingPage cart={cart}/>}/>
      <Route path='*' element={<Page404 cart={cart}/>} />
    </Routes>
    <ChatWidget />
    </>
  )
}

export default App
