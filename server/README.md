# Buzzer.js Server

Simple buzzer app for debates.  This is the server-side app, written with Express.js/Socket.io.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
This requires the client to be running in a different console window.
```
npm run dev
```

### Compiles and serves for production
This serves the built client from a static directory (`/www`), so no need to run the client seperately.
```
npm start
```

### Deployment
Ideally, you'd use a process monitor of some sort to start and monitor the Node process, so that it can be automatically restarted in the event something goes wrong, and to maintain logs.  For that purpose, [PM2](https://www.npmjs.com/package/pm2) is highly reccommended.

Likewise, for security reasons, I reccommend using a production-ready webserver (such as Apache or Nginx) as a proxy-host for the script.  I've always been a LAMP fan, so here is an example configuration for Apache:

```
<VirtualHost *:80>
        DocumentRoot /var/www/buzzerjs/www
        ServerName www.buzzerjs.your-domain.com
        ServerAlias buzzerjs.your-domain.com
        ServerAdmin you@gmail.com

        ErrorLog /var/log/httpd/buzzerjs_error.log
        CustomLog /var/log/httpd/buzzerjs_access.log combined

        ProxyRequests On
        ProxyPass / http://127.0.0.1:3000/
        ProxyPassReverse / http://127.0.0.1:3000/

        RewriteEngine on
        RewriteCond %{SERVER_NAME} =www.buzzerjs.your-domain.com [OR]
        RewriteCond %{SERVER_NAME} =buzzerjs.your-domain.com
        RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
```