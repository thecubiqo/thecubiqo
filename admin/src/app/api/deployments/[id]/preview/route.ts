import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/deployments/[id]/preview - Get preview HTML with injected config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const configParam = searchParams.get('config')

    // Get deployment with config
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        config: true,
        template: true,
        domain: true,
      },
    })

    if (!deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      )
    }

    // Use config from query param if provided (for live preview), otherwise use saved config
    let config: any
    if (configParam) {
      try {
        config = JSON.parse(decodeURIComponent(configParam))
      } catch (e) {
        console.error('Error parsing config param:', e)
        config = deployment.config?.configJson || {}
      }
    } else {
      config = deployment.config?.configJson || {}
    }

    // Validate that we have required data
    if (!deployment.template) {
      return NextResponse.json(
        { error: 'Template not found for deployment' },
        { status: 404 }
      )
    }

    if (!deployment.domain) {
      return NextResponse.json(
        { error: 'Domain not found for deployment' },
        { status: 404 }
      )
    }

    // For preview, we'll create a simple HTML page that renders the template
    // with the configuration injected via a script tag
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - ${deployment.domain.domainName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
    }
    .preview-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      text-align: center;
      z-index: 10000;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .preview-content {
      margin-top: 50px;
    }
    iframe {
      width: 100%;
      height: calc(100vh - 50px);
      border: none;
    }
  </style>
</head>
<body>
  <div class="preview-banner">
    🎨 Preview Mode - This is how your site will look with the current configuration
  </div>
  <div class="preview-content">
    <iframe id="preview-frame" src="/api/deployments/${id}/preview-frame?config=${encodeURIComponent(JSON.stringify(config))}"></iframe>
  </div>
</body>
</html>
    `

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}

