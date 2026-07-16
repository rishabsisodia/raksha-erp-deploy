import urllib.request, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Test various endpoints
endpoints = [
    '/api/products',
    '/api/customers',
    '/api/orders',
    '/api/proforma-orders',
    '/api/sales',
    '/api/expenses',
    '/api/dashboard',
]
base = 'https://raksha-erp-deploy.onrender.com'
for ep in endpoints:
    try:
        resp = urllib.request.urlopen(base + ep)
        data = json.loads(resp.read().decode())
        count = len(data) if isinstance(data, list) else 'ok'
        print(f'{ep}: {count}')
    except Exception as e:
        body = ''
        if hasattr(e, 'read'):
            body = e.read().decode()[:200]
        print(f'{ep}: ERROR {e} | {body}')
