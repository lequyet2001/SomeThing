import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import './styles/base.css'
import './styles/header.css'
import './styles/forms.css'
import './styles/account.css'
import './styles/admin.css'
import './styles/home.css'
import './styles/shop.css'
import './styles/product.css'
import './styles/cart.css'
import './styles/checkout.css'
import './styles/contact.css'
import './styles/footer.css'
import './styles/responsive.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </LanguageProvider>
)
