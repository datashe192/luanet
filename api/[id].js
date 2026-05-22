export default async function handler(req, res) {
  // This grabs the ID from the URL (e.g., /api/123 -> id = 123)
  const { id } = req.query;
  const userAgent = req.headers['user-agent'] || '';

  if (!id) return res.status(400).send("Luanet API: Payload ID required.");

  const BIN_URL = "https://api.jsonbin.io/v3/b/6a0f135bee5a733b12f7d4ec?meta=false";
  const API_KEY = "$2a$10$ZIn.UyUVBI2mtaIHI8wvXO/l67hIde7k0kPRsz15kpWomcbRCIOYS";

  try {
    const dbResponse = await fetch(BIN_URL, { headers: { "X-Access-Key": API_KEY } });
    if (!dbResponse.ok) throw new Error("Database offline");
    
    const data = await dbResponse.json();
    const scripts = data.record ? data.record.Scripts : (data.Scripts || []);
    const validPages = data.record ? data.record.Pages : (data.Pages || []);

    const foundScript = scripts.find(s => s.id === id);
    
    // Check if the request is coming from a Web Browser or Discord
    const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge|Opera|Discord/i.test(userAgent);

    // 1. Handle Fake or Deleted ID
    if (!foundScript && !validPages.includes(id)) {
      if (isBrowser) {
        return res.status(404).setHeader('Content-Type', 'text/html').send(`
          <body style="background:#0a0a0a; color:#fff; font-family:monospace; text-align:center; padding-top:100px;">
            <h1 style="color:#ef4444; font-size:30px;">PAYLOAD NOT FOUND</h1>
            <p style="color:#666;">This execution ID does not exist or was wiped.</p>
          </body>
        `);
      } else {
        return res.status(404).setHeader('Content-Type', 'text/plain').send("print('Luanet: Execution failed. Payload not found.')");
      }
    }

    // 2. Handle Real ID requested by a Browser (Show Lock Screen)
    if (isBrowser) {
      const lockUrl = `https://${req.headers.host}/api/${id}`;
      return res.status(200).setHeader('Content-Type', 'text/html').send(`
        <!DOCTYPE html>
        <html>
        <body style="background:#0a0a0a; color:#fff; font-family:monospace; text-align:center; padding-top:10vh;">
          <div style="border: 1px solid #333; padding: 40px; max-width: 500px; margin: 0 auto; background: #111; border-radius: 10px;">
            <h1 style="color:#ef4444; margin-bottom: 5px;">PROTECTED BY LUANET</h1>
            <p style="color:#888; font-size: 14px; margin-bottom: 30px;">Direct API access blocked. Execute the loader below in your environment to inject the payload.</p>
            <div style="background:#000; padding: 15px; border: 1px solid #222; border-radius: 5px; text-align: left;">
              <p style="color:#555; font-size: 10px; text-transform: uppercase; margin: 0 0 10px 0;">Roblox Execution String</p>
              <code style="color:#10b981;">loadstring(game:HttpGet("${lockUrl}"))()</code>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // 3. Handle Real ID requested by Roblox (Send Raw Lua)
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(foundScript.content);

  } catch (err) {
    return res.status(500).send("Luanet Core Error");
  }
}
