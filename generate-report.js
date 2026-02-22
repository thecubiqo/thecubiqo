const fs = require('fs');
const { marked } = require('marked');

try {
  const markdown = fs.readFileSync('CUBIQO_MASTER_PLAN_2026.md', 'utf-8');
  const bodyContent = marked.parse(markdown);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CUBIQO Master Plan 2026</title>
    <!-- Inter Font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Mermaid script for rendering architecture diagrams -->
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
    </script>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 850px;
            margin: 0 auto;
            padding: 40px;
            background-color: #f9fafb;
        }
        .page {
            background: #ffffff;
            padding: 60px 80px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 8px;
            border-top: 5px solid #4fd1c5;
        }
        h1 {
            font-weight: 800;
            font-size: 2.5em;
            color: #1a202c;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 24px;
        }
        h2 {
            font-weight: 700;
            font-size: 1.8em;
            color: #2d3748;
            margin-top: 40px;
            padding-bottom: 8px;
            border-bottom: 1px solid #edf2f7;
        }
        h3 {
            font-weight: 600;
            font-size: 1.4em;
            color: #4a5568;
            margin-top: 30px;
        }
        p {
            margin-bottom: 16px;
            font-size: 15px;
        }
        strong {
            font-weight: 600;
            color: #1a202c;
        }
        a {
            color: #3182ce;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            font-size: 14px;
        }
        th {
            background-color: #f7fafc;
            color: #4a5568;
            font-weight: 600;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 2px solid #e2e8f0;
        }
        td {
            padding: 12px 16px;
            border-bottom: 1px solid #edf2f7;
            vertical-align: top;
        }
        tr:nth-child(even) td {
            background-color: #faf8f9;
        }
        code {
            background-color: #edf2f7;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.9em;
            color: #e53e3e;
        }
        pre {
            background-color: #2d3748;
            color: #e2e8f0;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 13px;
        }
        pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
        }
        blockquote {
            margin: 24px 0;
            padding: 16px 24px;
            border-left: 4px solid #4fd1c5;
            background-color: #e6fffa;
            color: #285e61;
            font-style: italic;
            border-radius: 0 8px 8px 0;
        }
        hr {
            border: 0;
            border-top: 1px solid #e2e8f0;
            margin: 40px 0;
        }
        /* Mermaid Fixes */
        .language-mermaid {
            display: none;
        }
        
        @media print {
            body { 
                background: white; 
                padding: 0;
                margin: 0;
                max-width: none;
            }
            .page { 
                box-shadow: none; 
                border: none;
                padding: 20px;
                border-top: none;
            }
            h1, h2, h3 { 
                break-after: avoid; 
                page-break-after: avoid;
            }
            table, pre, .mermaid { 
                break-inside: avoid; 
                page-break-inside: avoid;
            }
            @page {
                size: portrait;
                margin: 20mm 15mm;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        ${bodyContent.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, '<div class="mermaid">$1</div>')}
    </div>
</body>
</html>`;

  fs.writeFileSync('CUBIQO_MASTER_PLAN_2026.html', htmlContent);
  console.log("Successfully generated CUBIQO_MASTER_PLAN_2026.html!");
} catch (error) {
  console.error("Error generating report:", error);
}
