async function uploadFile() {
  const fileInput = document.getElementById('domainFile');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a .txt file');
    return;
  }

  const formData = new FormData();
  formData.append('domainFile', file);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    displayDomains(data.domains);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

function displayDomains(domains) {
  const domainList = document.getElementById('domainList');
  domainList.innerHTML = '';
  domains.forEach(domain => {
    const li = document.createElement('li');
    li.textContent = domain;
    li.onclick = () => showDetails(domain);
    domainList.appendChild(li);
    scanDomain(domain); // Start scanning
  });
}

async function scanDomain(domain) {
  try {
    const response = await fetch(`/scan/${encodeURIComponent(domain)}`);
    const data = await response.json();
    // Update UI with scan results (e.g., add badge to domain)
    const li = Array.from(document.querySelectorAll('#domainList li')).find(
      el => el.textContent === domain
    );
    if (data.vulnerabilities.length > 0) {
      li.style.color = '#ff4444';
      li.title = `Vulnerabilities: ${data.vulnerabilities.join(', ')}`;
    }
  } catch (error) {
    console.error('Scan error:', error);
  }
}

async function showDetails(domain) {
  const detailsContainer = document.getElementById('detailsContainer');
  detailsContainer.innerHTML = '<p>Loading details...</p>';

  try {
    const response = await fetch(`/details/${encodeURIComponent(domain)}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // Format headers
    const headersHtml = Object.entries(data.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    // Build details HTML
    detailsContainer.innerHTML = `
      <h3>Status Code</h3>
      <p>${data.statusCode}</p>
      <h3>HTTP Headers</h3>
      <pre>${headersHtml}</pre>
      ${data.redirectUrl ? `
        <h3>Redirect URL</h3>
        <p>${data.redirectUrl}</p>
      ` : ''}
      <h3>Content-Length</h3>
      <p>${data.contentLength}</p>
      <h3>Source Code</h3>
      <pre>${escapeHtml(data.sourceCode)}</pre>
    `;
  } catch (error) {
    detailsContainer.innerHTML = `<p>Error loading details: ${error.message}</p>`;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
