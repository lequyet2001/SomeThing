# Translation files

Text is grouped by language and namespace so keys are easy to find and edit. Namespace files are JSON, while each language has a small JS index that merges them for the app.

Examples:

- Vietnamese admin text: `vi/admin.json`
- English account text: `en/account.json`
- Shared export: `index.js`

Keys stay flat, such as `admin.addProduct` or `account.profile`, so existing `t('...')` calls do not change.
