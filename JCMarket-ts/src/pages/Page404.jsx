import { Header } from "../components/Header";
import './Page404.css'
export function Page404({cart}){
  return (
    <>
      <Header cart={cart}/>
      <div className="page-404-container">
        <div>
            404 (Not Found)
        </div>
      </div>
    </>
  )
}