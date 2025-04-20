const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const axios = require('axios');
const app = express();
const port = 3000;

// Set up file upload
const upload = multer({ dest: 'uploads/' });

// Serve static files
app.use(express.static('public'));

// Endpoint to handle file upload
app.post('/upload', upload.single('domainFile'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const data = await fs.readFile(filePath, 'utf-8');
    const domains = data.split('\n').filter(line => line.trim() !== '');
    await fs.unlink(filePath); // Clean up uploaded file
    res.json({ domains });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Endpoint to scan domain (simulated)
app.get('/scan/:domain', async (req, res) => {
  const domain = req.params.domain;
  // Simulate scanning (replace with actual scanning logic)
  const scanResult = {
    domain,
    status: 'Scanned',
    vulnerabilities: Math.random() > 0.7 ? ['XSS', 'SQLi'] : []
  };
  res.json(scanResult);
});

// Endpoint to fetch domain details (headers, status, redirect, content-length, source)
app.get('/details/:domain', async (req, res) => {
  const domain = req.params.domain;
  try {
    // Make HTTP request to the domain
    const response = await axios.get(`https://${domain}`, {
      maxRedirects: 0, // Prevent following redirects to capture redirect URL
      validateStatus: () => true, // Accept all status codes
      headers: { 'User-Agent': 'BugBountyScanner/1.0' }
    });

    // Extract headers
    const headers = response.headers;

    // Check for redirection
    let redirectUrl = null;
    if (response.status >= 300 && response.status < 400 && headers.location) {
      redirectUrl = headers.location;
    }

    // Fetch source code (make a separate request to follow redirects if needed)
    const sourceResponse = await axios.get(`https://${domain}`, {
      headers: { 'User-Agent': 'BugBountyScanner/1.0' }
    });

    res.json({
      statusCode: response.status,
      headers,
      redirectUrl,
      contentLength: headers['content-length'] || 'N/A',
      sourceCode: sourceResponse.data
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch details: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
