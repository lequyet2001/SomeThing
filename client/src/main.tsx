import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { shopStore } from './store/shopStore'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Không tìm thấy phần tử #root để khởi động ứng dụng.')
}

ReactDOM.createRoot(rootElement).render(
  <Provider store={shopStore}>
    <LanguageProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LanguageProvider>
  </Provider>
)
