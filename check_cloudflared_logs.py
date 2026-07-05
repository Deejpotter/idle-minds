import subprocess

result = subprocess.run(
    ['docker', 'logs', 'coolify-cloudflared'],
    capture_output=True, text=True, timeout=10
)
lines = result.stdout.split('\n')
for line in lines:
    if any(kw in line.lower() for kw in ['connected', 'registered', 'serve', 'cloudflare', 'tunnel', 'ready', 'running']):
        print(line)
