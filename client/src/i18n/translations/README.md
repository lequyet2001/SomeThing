# Translation files

Text is grouped by language and namespace so keys are easy to find and edit. Namespace files are JSON, while each language has a small JS index that merges them for the app.

Examples:

- Vietnamese admin text: `vi/admin.json`
- English account text: `en/account.json`
- Shared export: `index.js`

Common namespaces:

- `admin.json`: admin dashboard, orders, inventory, categories, users, contacts, reviews.
- `auth.json`: login, register, forgot password, reset password.
- `account.json`: customer profile, avatar, addresses, order/contact history.
- `shop.json`, `product.json`, `cart.json`, `checkout.json`: shopping flow.
- `home.json`, `footer.json`, `common.json`: shared public UI.

Keys stay flat, such as `admin.addProduct`, `admin.customerType.guest`, or `account.profile`, so existing `t('...')` calls do not change. Add a new key to both `vi` and `en`; if a key is missing, `LanguageContext` falls back to Vietnamese and then to the key name.
