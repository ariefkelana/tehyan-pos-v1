import sys
content = open('src/routes/api.js', 'r', encoding='utf-8').read()

replacements = {
    "router.post(\n  '/products',": "router.post(\n  '/products',\n  requireAuth,\n  requireAdmin,",
    "router.put(\n  '/products/:id',": "router.put(\n  '/products/:id',\n  requireAuth,\n  requireAdmin,",
    "router.delete('/products/:id', [param('id').isInt()], async (req, res) => {": "router.delete('/products/:id', requireAuth, requireAdmin, [param('id').isInt()], async (req, res) => {",
    "router.get('/orders', async (req, res) => {": "router.get('/orders', requireAuth, async (req, res) => {",
    "router.patch(\n  '/orders/:id/status',": "router.patch(\n  '/orders/:id/status',\n  requireAuth,",
    "router.post(\n  '/payments',": "router.post(\n  '/payments',\n  requireAuth,",
    "router.get('/tables', async (req, res) => {": "router.get('/tables', requireAuth, async (req, res) => {",
    "router.patch(\n  '/tables/:id',": "router.patch(\n  '/tables/:id',\n  requireAuth,"
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open('src/routes/api.js', 'w', encoding='utf-8') as f:
    f.write(content)
