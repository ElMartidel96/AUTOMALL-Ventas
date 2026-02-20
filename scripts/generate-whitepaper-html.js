/**
 * 📄 Whitepaper HTML Generator
 *
 * Generates a professional, print-ready HTML version of the whitepaper
 * that can be printed to PDF directly from the browser.
 *
 * Usage: node scripts/generate-whitepaper-html.js
 *
 * Output: public/CRYPTOGIFT_WHITEPAPER_v1.2.html
 *
 * Made by mbxarts.com The Moon in a Box property
 */

const fs = require('fs');
const path = require('path');

// Paths
const MARKDOWN_PATH = path.join(__dirname, '../public/CRYPTOGIFT_WHITEPAPER_v1.2.md');
const HTML_OUTPUT_PATH = path.join(__dirname, '../public/CRYPTOGIFT_WHITEPAPER_v1.2.html');

/**
 * Convert markdown to HTML with basic formatting
 * @param {string} markdown - Raw markdown content
 * @returns {string} HTML content
 */
function markdownToHtml(markdown) {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Code blocks
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr>');

  // Tables (basic support)
  html = html.replace(/\n\|(.+)\|\n/g, function(match, content) {
    const cells = content.split('|').map(c => c.trim()).filter(c => c);
    return '<tr>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>\n';
  });

  // Blockquotes
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

  // Paragraphs (preserve line breaks, create paragraphs)
  html = html.split('\n\n').map(para => {
    if (para.trim() && !para.startsWith('<')) {
      return '<p>' + para.trim() + '</p>';
    }
    return para;
  }).join('\n');

  return html;
}

/**
 * Generate complete HTML document with professional styling
 * @param {string} bodyContent - HTML body content
 * @returns {string} Complete HTML document
 */
function generateHtmlDocument(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRYPTOGIFT WALLETS DAO - WHITEPAPER v1.2</title>
  <style>
    /* Print-optimized professional styling */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page-break {
        page-break-before: always;
      }
      a {
        color: #0066cc;
        text-decoration: none;
      }
      a::after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: #666;
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: #ffffff;
    }

    h1 {
      font-size: 2.5em;
      font-weight: 700;
      margin: 0.5em 0;
      color: #1a1a1a;
      border-bottom: 3px solid #0052ff;
      padding-bottom: 0.3em;
    }

    h2 {
      font-size: 1.8em;
      font-weight: 600;
      margin: 1.2em 0 0.6em 0;
      color: #1a1a1a;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.3em;
    }

    h3 {
      font-size: 1.3em;
      font-weight: 600;
      margin: 1em 0 0.5em 0;
      color: #333;
    }

    p {
      margin: 0.8em 0;
      text-align: justify;
    }

    strong {
      font-weight: 600;
      color: #1a1a1a;
    }

    em {
      font-style: italic;
    }

    a {
      color: #0052ff;
      text-decoration: none;
      border-bottom: 1px solid #0052ff;
    }

    a:hover {
      background: #e8f0ff;
    }

    code {
      font-family: 'Monaco', 'Courier New', monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
      color: #d63384;
    }

    pre {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      margin: 1em 0;
    }

    pre code {
      background: none;
      padding: 0;
      color: #333;
    }

    blockquote {
      border-left: 4px solid #0052ff;
      margin: 1em 0;
      padding: 0.5em 0 0.5em 1em;
      background: #f8f9fa;
      font-style: italic;
      color: #555;
    }

    ul, ol {
      margin: 0.8em 0;
      padding-left: 2em;
    }

    li {
      margin: 0.3em 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      font-size: 0.95em;
    }

    th, td {
      border: 1px solid #dee2e6;
      padding: 12px;
      text-align: left;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #1a1a1a;
    }

    tr:nth-child(even) {
      background: #f8f9fa;
    }

    hr {
      border: none;
      border-top: 2px solid #e0e0e0;
      margin: 2em 0;
    }

    .header {
      text-align: center;
      margin-bottom: 2em;
      padding-bottom: 1em;
      border-bottom: 3px solid #0052ff;
    }

    .header .version {
      color: #666;
      font-size: 0.9em;
      margin-top: 0.5em;
    }

    .footer {
      text-align: center;
      margin-top: 3em;
      padding-top: 1em;
      border-top: 2px solid #e0e0e0;
      color: #666;
      font-size: 0.9em;
    }

    .toc {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 20px;
      margin: 2em 0;
    }

    .toc h2 {
      margin-top: 0;
      border-bottom: none;
      font-size: 1.5em;
    }

    @media screen and (max-width: 768px) {
      body {
        padding: 10px;
      }
      h1 {
        font-size: 2em;
      }
      h2 {
        font-size: 1.5em;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📘 CRYPTOGIFT WALLETS DAO</h1>
    <h2>WHITEPAPER v1.2</h2>
    <div class="version">
      <strong>Version:</strong> 1.2<br>
      <strong>Last Updated:</strong> December 7, 2025<br>
      <strong>Network:</strong> Base Mainnet (Chain ID: 8453)<br>
      <strong>Token Contract:</strong> <code>0x5e3a61b550328f3D8C44f60b3e10a49D3d806175</code>
    </div>
    <p><em>Made by mbxarts.com The Moon in a Box property</em></p>
  </div>

  ${bodyContent}

  <div class="footer">
    <p><strong>© 2024-2025 The Moon in a Box Inc. All rights reserved.</strong></p>
    <p>This document is for informational purposes only and may be subject to change without notice.</p>
    <p><em>Generated: ${new Date().toISOString().split('T')[0]}</em></p>
  </div>
</body>
</html>`;
}

/**
 * Main execution
 */
function main() {
  console.log('📄 Generating Whitepaper HTML...\n');

  try {
    // Read markdown file
    console.log('📖 Reading markdown file...');
    const markdownContent = fs.readFileSync(MARKDOWN_PATH, 'utf8');
    console.log('✅ Markdown file read successfully\n');

    // Convert to HTML
    console.log('🔄 Converting markdown to HTML...');
    const bodyHtml = markdownToHtml(markdownContent);
    console.log('✅ Markdown converted to HTML\n');

    // Generate complete HTML document
    console.log('🎨 Generating complete HTML document...');
    const completeHtml = generateHtmlDocument(bodyHtml);
    console.log('✅ HTML document generated\n');

    // Write to file
    console.log('💾 Writing HTML file...');
    fs.writeFileSync(HTML_OUTPUT_PATH, completeHtml, 'utf8');
    console.log('✅ HTML file written successfully\n');

    // Success message
    console.log('════════════════════════════════════════════════════════');
    console.log('✅ WHITEPAPER HTML GENERATED SUCCESSFULLY!');
    console.log('════════════════════════════════════════════════════════\n');
    console.log(`📍 Output file: ${HTML_OUTPUT_PATH}\n`);
    console.log('📋 INSTRUCTIONS TO GENERATE PDF:\n');
    console.log('1. Open the HTML file in your browser:');
    console.log(`   file://${HTML_OUTPUT_PATH}`);
    console.log('\n2. Press Ctrl+P (Windows/Linux) or Cmd+P (Mac)');
    console.log('\n3. Configure print settings:');
    console.log('   - Destination: Save as PDF');
    console.log('   - Paper size: A4 or Letter');
    console.log('   - Margins: Default');
    console.log('   - Background graphics: Enabled (recommended)');
    console.log('\n4. Click "Save" to generate the PDF');
    console.log('\n📄 The generated PDF will be professional and print-ready!');
    console.log('════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Execute
main();
