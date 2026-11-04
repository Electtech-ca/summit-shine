#!/usr/bin/env bash
# Deploy Summit Shine to the ElectTech VPS: uploads the working tree (tracked + new, non-ignored
# files) to /opt/clients/summit-shine/src, builds the image there, and restarts the web container.
# The database volume, .env.production and the server's docker-compose.yml are never touched;
# a change to deploy/vps/docker-compose.yml takes effect once copied there by hand.
#
# The build renders static pages from the site's database, as Netlify's build did. It reaches the
# database on the server's loopback (port 5444) over the host network, with the address passed as a
# build secret from /opt/clients/summit-shine/build-database-url (mode 600), so it stays out of the image.
#
# Usage (Git Bash):  bash deploy/vps/deploy.sh
# Requires the "electTechOVH" host in ~/.ssh/config.
set -euo pipefail

HOST="${DEPLOY_HOST:-electTechOVH}"
DIR=/opt/clients/summit-shine
BASE_PATH=/portfolio/summit-shine
SITE_URL=https://www.electtech.ca$BASE_PATH

cd "$(dirname "$0")/../.."

echo "==> Uploading source, then building and starting the web container on $HOST"
git ls-files -co --exclude-standard -z | tar --null -czf - -T - | ssh "$HOST" "set -e
  rm -rf '$DIR/src.new' && mkdir -p '$DIR/src.new' && tar -xzf - -C '$DIR/src.new'
  rm -rf '$DIR/src' && mv '$DIR/src.new' '$DIR/src'
  cd '$DIR'
  sudo docker buildx build --allow network.host --network host \
    --secret id=build_database_url,src=build-database-url \
    --build-arg BASE_PATH='$BASE_PATH' --build-arg NEXT_PUBLIC_SITE_URL='$SITE_URL' \
    --load -t summit-shine-web src
  sudo docker compose --env-file .env.production up -d web"

echo "==> Checking the site answers"
ssh "$HOST" "curl -s -o /dev/null -w '%{http_code}\n' --retry 10 --retry-connrefused --retry-delay 3 http://127.0.0.1:3040$BASE_PATH"
