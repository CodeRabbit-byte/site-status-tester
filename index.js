const fs = require('fs');
const http = require('http');
const https = require('https');
const querystring = require('querystring');
const favicon = fs.readFileSync('favicon.ico');
const home = fs.readFileSync("index.html");

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(home);
  }
  else if (req.method === 'POST' && req.url === '/submit') {
    let body = "";

    req.on('data', chunk => {
      body += chunk.toString(); 
    });

    req.on('end', () => {
      const parsed = querystring.parse(body);
      const targetUrl = parsed.website;

      if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        return res.end(`
          <html><body>
            <div>Please provide a valid URL.</div>
            <a href="/">Go back</a>
          </body></html>
        `);
      }

      try {
        
        const url = new URL(targetUrl);

        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: 'GET',
          headers: {
            'User-Agent': 'Node.js HTTP Client',
          }
        };

        const protocolModule = url.protocol === 'https:' ? https : http;

        const reqPing = protocolModule.request(options, (resPing) => {
          let responseData = '';

          resPing.on('data', chunk => {
            responseData += chunk.toString();
          });

          resPing.on('end', () => {
            
            const snippet = responseData;


            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h2>Ping Result for ${targetUrl}</h2>
                  <p>Status Code: ${resPing.statusCode}<br> It is currently up</p>
                  <h3>Response snippet:</h3>
                  <pre style="white-space: pre-wrap; background:#eee; padding:10px; border-radius:5px;">${snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                  <br>
                  <a href="/">Test another website</a>
                </body>
              </html>
            `);
          });
        });

        reqPing.on('error', (error) => {
          console.error(`Error pinging ${targetUrl}: ${error.message}`);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <div>Failed to ping ${targetUrl}<br> ${error.message}<br>It could mean that the Url is not currently available</div>
                <a href="/">Try again</a>
              </body>
            </html>
          `);
        });

        reqPing.end();

      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`
          <html><body>
            <div>Invalid URL format or the server might be down.</div>
            <a href="/">Go back</a>
          </body></html>
        `);
      }
    });
  }
  else if (req.url === '/favicon.ico') {
      res.writeHead(200, { 'Content-Type': 'image/x-icon' });
      res.end(favicon);
    }
  else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

const HOST = '0.0.0.0';
const PORT = 80;

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});