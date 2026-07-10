#!/bin/sh
set -e
# Ensure the persistent save volume is owned by the runtime user before dropping privileges.
if [ -d /data ]; then
  chown -R nextjs:nodejs /data 2>/dev/null || true
fi
exec su-exec nextjs:nodejs node server.js
