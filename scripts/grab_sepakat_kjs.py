import os
import sys
import json
import base64
import ssl
import time
import urllib.request

def grab_sepakat_pages(start_page=1, end_page=276):
    dst_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'datakjs')
    os.makedirs(dst_dir, exist_ok=True)

    username = '27082026'
    password = 'sepakat@2026'
    auth_str = f'{username}:{password}'
    b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    headers = {
        'Authorization': f'Basic {b64_auth}',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
    }

    print(f"🚀 Memulai proses pengunduhan 276 halaman SEPAKAT KJS ke {dst_dir}...")

    success_count = 0
    for page in range(start_page, end_page + 1):
        url = f"https://sepakat.bappenas.go.id/pk-api/?app=bitung_kolut&individu=1&page={page}"
        dst_file = os.path.join(dst_dir, f"page_{page}.json")

        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                content = resp.read().decode('utf-8')
                if "Just a moment..." in content or "challenge-platform" in content:
                    print(f"⚠️ Halaman {page} terhalang Cloudflare Challenge! Simpan template fallback.")
                else:
                    with open(dst_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"✅ Halaman {page}/{end_page} berhasil disimpan ({len(content)} bytes)")
                    success_count += 1
        except Exception as e:
            print(f"❌ Gagal mengunduh halaman {page}: {e}")
        time.sleep(0.2)

    print(f"🎉 Selesai! Total {success_count} dari {end_page} halaman berhasil diunduh ke public/datakjs/")

if __name__ == '__main__':
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    end = int(sys.argv[2]) if len(sys.argv) > 2 else 276
    grab_sepakat_pages(start, end)
