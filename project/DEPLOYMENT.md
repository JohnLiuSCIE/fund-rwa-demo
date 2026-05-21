# Deployment Runbook

This project is a Vite React single-page app. It is deployed as static files behind Nginx.

## Current Hosting Model

The Huawei Cloud ECS instance is used as a shared demo host. Demos are separated by URL path prefixes while we are using only a public IP.

Current temporary public entry:

```text
http://119.8.50.65/fund-rwa-demo/
```

Current demo slug:

```text
fund-rwa-demo
```

Server-side directory convention:

```text
/var/www/demos/<demo-slug>/
```

Current deployment directory:

```text
/var/www/demos/fund-rwa-demo/
```

Do not commit private keys, passwords, `.pem` files, or personal local key paths.

## ECS Access

Use the ECS public IP, not the private subnet IP.

```bash
ssh -i <path-to-private-key.pem> root@119.8.50.65
```

Known server facts:

```text
Public IP: 119.8.50.65
Private IP: 192.168.0.110
Login user: root
Hostname: ecs-demo-host
OS: Ubuntu
Web server: Nginx
```

## App Base Path

The app supports path-prefix deployment through `VITE_BASE_PATH`.

Relevant files:

```text
vite.config.ts
src/app/App.tsx
```

For local development, no base path is required:

```bash
npm run dev
```

For this ECS deployment, build with:

```bash
VITE_BASE_PATH=/fund-rwa-demo/ npm run build
```

The trailing slash matters. The runtime route basename and static asset URLs must use the same prefix.

## Deploy Current Demo

From the `project/` directory:

```bash
npm install
npm test
VITE_BASE_PATH=/fund-rwa-demo/ npm run build
```

Upload the static build:

```bash
rsync -avz --delete \
  -e "ssh -i <path-to-private-key.pem>" \
  dist/ \
  root@119.8.50.65:/var/www/demos/fund-rwa-demo/
```

Reload Nginx after config changes:

```bash
ssh -i <path-to-private-key.pem> root@119.8.50.65 "nginx -t && systemctl reload nginx"
```

## Nginx Convention

The active Nginx site is:

```text
/etc/nginx/sites-available/fund-rwa-demo
/etc/nginx/sites-enabled/fund-rwa-demo
```

Current pattern:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 119.8.50.65 _;

    root /var/www/demos;
    index index.html;

    location = / {
        return 302 /fund-rwa-demo/;
    }

    location = /fund-rwa-demo {
        return 301 /fund-rwa-demo/;
    }

    location ^~ /fund-rwa-demo/assets/ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location ^~ /fund-rwa-demo/ {
        try_files $uri $uri/ /fund-rwa-demo/index.html;
    }
}
```

The `try_files ... /fund-rwa-demo/index.html` fallback is required for React Router deep links such as:

```text
/fund-rwa-demo/ta/queue
/fund-rwa-demo/create/fund-issuance
/fund-rwa-demo/fund-issuance/fund-open-003
```

## Adding Another Demo

Use lowercase hyphenated slugs:

```text
bond-demo
issuer-demo
ta-demo
```

Create a directory:

```bash
ssh -i <path-to-private-key.pem> root@119.8.50.65 \
  "mkdir -p /var/www/demos/<demo-slug>"
```

Build that app with a matching base path:

```bash
VITE_BASE_PATH=/<demo-slug>/ npm run build
```

Upload:

```bash
rsync -avz --delete \
  -e "ssh -i <path-to-private-key.pem>" \
  dist/ \
  root@119.8.50.65:/var/www/demos/<demo-slug>/
```

Add matching Nginx locations:

```nginx
location = /<demo-slug> {
    return 301 /<demo-slug>/;
}

location ^~ /<demo-slug>/assets/ {
    try_files $uri =404;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

location ^~ /<demo-slug>/ {
    try_files $uri $uri/ /<demo-slug>/index.html;
}
```

Then run:

```bash
nginx -t
systemctl reload nginx
```

## Verification Checklist

From the ECS instance:

```bash
curl -I http://127.0.0.1/fund-rwa-demo/
curl -I http://127.0.0.1/fund-rwa-demo/ta/queue
curl -I http://127.0.0.1/fund-rwa-demo/create/fund-issuance
```

Expected result: `200 OK`.

From a browser:

```text
http://119.8.50.65/fund-rwa-demo/
```

Check:

- Page renders, not just the HTML shell.
- JS/CSS load from `/fund-rwa-demo/assets/...`.
- Refreshing a deep route does not show Nginx 404.
- Browser console has no asset path errors.

## Notes

- The public IP is a temporary access pattern. Once a domain is available, prefer subdomains such as `fund-rwa.example.com` and `bond-demo.example.com`.
- When using subdomains, each demo can use `/` as its app base path again, which is simpler than path-prefix hosting.
- Keep private key material outside the repository.
