import subprocess

result = subprocess.run(
    ['docker', 'logs', 'coolify-cloudflared'],
    capture_output=True, text=True, timeout=10
)
print(result.stdout[-1000:] if len(result.stdout) > 1000 else result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[-500:])
