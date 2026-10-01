<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap | Siddhivinayak Overseas</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script type="text/javascript">
          // If this stylesheet is visited directly as .xsl, redirect to the actual XML data file
          if (window.location.pathname.indexOf('.xsl') !== -1) {
            window.location.replace('/sitemap.xml');
          }
        </script>
        <style type="text/css">
          :root {
            --bg-color: #0b1120;
            --card-bg: #111827;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #38bdf8;
            --accent-hover: #0284c7;
            --border-color: #1e293b;
            --gold: #d4a843;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            padding: 2.5rem 1.5rem;
            line-height: 1.6;
          }
          .container {
            max-width: 1100px;
            margin: 0 auto;
          }
          .header {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }
          .brand-title {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-main);
            letter-spacing: -0.02em;
          }
          .badge {
            display: inline-block;
            background: rgba(212, 168, 67, 0.15);
            color: var(--gold);
            border: 1px solid rgba(212, 168, 67, 0.3);
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.2rem 0.6rem;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .tagline {
            color: var(--text-muted);
            font-size: 0.95rem;
            margin-bottom: 1rem;
          }
          .stats-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 0.75rem;
            padding: 1rem 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
            margin-top: 1rem;
          }
          .stats-info {
            font-size: 0.875rem;
            color: var(--text-muted);
          }
          .stats-count {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--accent);
          }
          .notice-box {
            background: rgba(212, 168, 67, 0.1);
            border: 1px solid rgba(212, 168, 67, 0.3);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-top: 1.5rem;
            text-align: center;
          }
          .notice-box h3 {
            color: var(--gold);
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
          }
          .notice-box p {
            color: var(--text-muted);
            font-size: 0.95rem;
            margin-bottom: 1rem;
          }
          .btn-link {
            display: inline-block;
            background: var(--gold);
            color: #000;
            font-weight: 600;
            padding: 0.6rem 1.25rem;
            border-radius: 0.5rem;
            text-decoration: none;
            transition: opacity 0.15s ease;
          }
          .btn-link:hover {
            opacity: 0.9;
          }
          .table-container {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 0.75rem;
            overflow-x: auto;
            margin-top: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.875rem;
          }
          th {
            background-color: #0f172a;
            color: var(--text-muted);
            font-weight: 600;
            padding: 0.875rem 1.25rem;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            border-bottom: 1px solid var(--border-color);
          }
          td {
            padding: 0.875rem 1.25rem;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-main);
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:hover td {
            background-color: rgba(56, 189, 248, 0.04);
          }
          .url-link {
            color: var(--accent);
            text-decoration: none;
            word-break: break-all;
            transition: color 0.15s ease;
          }
          .url-link:hover {
            color: var(--accent-hover);
            text-decoration: underline;
          }
          .index-col {
            width: 60px;
            color: var(--text-muted);
            font-family: monospace;
          }
          .date-col {
            width: 160px;
            color: var(--text-muted);
            white-space: nowrap;
            font-family: monospace;
          }
          .footer {
            margin-top: 2rem;
            text-align: center;
            font-size: 0.8rem;
            color: var(--text-muted);
          }
          .footer a {
            color: var(--text-muted);
            text-decoration: none;
          }
          .footer a:hover {
            color: var(--accent);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">
              <h1 class="brand-title">Siddhivinayak Overseas</h1>
              <span class="badge">XML Sitemap</span>
            </div>
            <p class="tagline">
              Official XML Sitemap for search engines (Google, Bing). This file helps web crawlers discover all indexed pages.
            </p>
            <div class="stats-card">
              <div class="stats-info">
                This sitemap indexes all verified public routes, study destinations, visa guides, and regional branches.
              </div>
              <div class="stats-count">
                <xsl:choose>
                  <xsl:when test="count(sitemap:urlset/sitemap:url) &gt; 0">
                    Total URLs: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
                  </xsl:when>
                  <xsl:otherwise>
                    Stylesheet Preview Mode
                  </xsl:otherwise>
                </xsl:choose>
              </div>
            </div>
          </div>

          <xsl:choose>
            <xsl:when test="count(sitemap:urlset/sitemap:url) &gt; 0">
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th class="index-col">#</th>
                      <th>URL Address</th>
                      <th class="date-col">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    <xsl:for-each select="sitemap:urlset/sitemap:url">
                      <tr>
                        <td class="index-col">
                          <xsl:value-of select="position()"/>
                        </td>
                        <td>
                          <a href="{sitemap:loc}" class="url-link" target="_blank" rel="noopener">
                            <xsl:value-of select="sitemap:loc"/>
                          </a>
                        </td>
                        <td class="date-col">
                          <xsl:value-of select="sitemap:lastmod"/>
                        </td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </table>
              </div>
            </xsl:when>
            <xsl:otherwise>
              <div class="notice-box">
                <h3>You are viewing the XSL Stylesheet Template</h3>
                <p>This file provides styling for the XML sitemap. To view all 126 indexed URLs, please open the actual data file:</p>
                <a href="/sitemap.xml" class="btn-link">View sitemap.xml with 126 URLs</a>
              </div>
            </xsl:otherwise>
          </xsl:choose>

          <div class="footer">
            <p>
              &#169; 2026 Siddhivinayak Overseas · 
              <a href="https://siddhivinayakoverseas.com/">Visit Website</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
