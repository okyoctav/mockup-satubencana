import os
import sys
import json
import ssl
import time
import subprocess
import urllib.request

def grab_satupeta_geotagging():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dst_dir = os.path.join(root_dir, 'public', 'data')
    os.makedirs(dst_dir, exist_ok=True)
    dst_file = os.path.join(dst_dir, 'satupeta_geotagging.json')

    url = 'https://simrenas-webgis.bappenas.go.id/satupeta/api/survey_dtsen_kk'

    print(f"🚀 Memulai pengunduhan Satupeta Geotagging dari {url}...")

    # Method 1: urllib with SSL context & retry
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
    }

    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=25) as resp:
                raw_data = resp.read().decode('utf-8')
                json_data = json.loads(raw_data)
                
                with open(dst_file, 'w', encoding='utf-8') as f:
                    json.dump(json_data, f, ensure_ascii=False, indent=2)
                    
                item_count = len(json_data.get('data', [])) if isinstance(json_data, dict) else len(json_data)
                print(f"✅ [urllib Attempt {attempt}] Berhasil mengunduh & menyimpan {item_count} data KK ke {dst_file}")
                return True
        except Exception as e:
            print(f"⚠️ [urllib Attempt {attempt}/3] Gagal: {e}")
            time.sleep(1)

    # Method 2: Curl fallback (-k insecure)
    print("🔄 Menggunakan fallback curl -k...")
    try:
        cmd = ['curl', '-k', '-s', '-L', '--max-time', '30', url]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
        if res.returncode == 0 and res.stdout:
            json_data = json.loads(res.stdout)
            with open(dst_file, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            item_count = len(json_data.get('data', [])) if isinstance(json_data, dict) else len(json_data)
            print(f"✅ [curl fallback] Berhasil mengunduh & menyimpan {item_count} data KK ke {dst_file}")
            return True
    except Exception as e:
        print(f"❌ [curl fallback] Gagal: {e}")

    return False

if __name__ == '__main__':
    grab_satupeta_geotagging()
