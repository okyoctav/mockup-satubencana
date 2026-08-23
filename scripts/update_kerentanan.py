import urllib.request
import ssl
import os
import sys

def update_kerentanan(code='7172'):
    url = f'https://inarisk2.bnpb.go.id/api/kerentanan/get-data/{code}'
    dst_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'data')
    os.makedirs(dst_dir, exist_ok=True)
    dst_file = os.path.join(dst_dir, f'kerentanan_{code}.json')

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

    try:
        print(f'🔄 Mengunduh data kerentanan terbaru ({code}) dari InARISK...')
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if response.status == 200:
                data = response.read()
                with open(dst_file, 'wb') as f:
                    f.write(data)
                print(f'✅ Berhasil memperbarui {dst_file} ({len(data)} bytes)!')
            else:
                print(f'❌ Gagal mengunduh data. Status code: {response.status}')
    except Exception as e:
        print(f'⚠️ Error saat memperbarui data {code}:', e)

if __name__ == '__main__':
    code_arg = sys.argv[1] if len(sys.argv) > 1 else '7172'
    update_kerentanan(code_arg)
