export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const OWNER = "Genie-will"
const REPO = "-coding-assistant-updates"
const GITHUB_API = `https://api.github.com/repos/${OWNER}/${REPO}/releases`

export async function GET() {
  try {
    // 0) Direct override: if WINDOWS_ASSET_URL is set, bypass release discovery
    if (process.env.WINDOWS_ASSET_URL) {
      const filename = process.env.WINDOWS_ASSET_NAME || 'installer.exe'
      const headers = new Headers({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Helvia-Downloader/1.0",
        "Accept": "application/octet-stream",
      })
      if (process.env.GITHUB_TOKEN) {
        headers.set("Authorization", `Bearer ${process.env.GITHUB_TOKEN}`)
      }
      const up = await fetch(process.env.WINDOWS_ASSET_URL, {
        cache: "no-store",
        headers,
        redirect: "follow",
      })
      if (!up.ok || !up.body) {
        const t = await up.text().catch(() => "")
        console.error("Override URL upstream error:", up.status, t?.slice(0, 500))
        return new Response(JSON.stringify({ error: `Override URL fetch failed (status ${up.status})` }), {
          status: up.status || 502,
          headers: { "content-type": "application/json" },
        })
      }
      return new Response(up.body, {
        status: 200,
        headers: {
          "content-type": up.headers.get("content-type") || "application/octet-stream",
          "content-disposition": `attachment; filename="${filename}"`,
          "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "pragma": "no-cache",
          "expires": "0",
        },
      })
    }

    // 1) Find latest release asset that ends with .exe
    const apiHeaders = new Headers({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Helvia-Downloader/1.0",
      "Accept": "application/vnd.github+json",
    })
    if (process.env.GITHUB_TOKEN) {
      apiHeaders.set("Authorization", `Bearer ${process.env.GITHUB_TOKEN}`)
    }
    const relRes = await fetch(GITHUB_API, {
      cache: "no-store",
      headers: apiHeaders,
    })

    if (!relRes.ok) {
      const t = await relRes.text().catch(() => "")
      console.error("GitHub releases API error:", relRes.status, t?.slice(0, 500))
      return new Response(JSON.stringify({ error: "Failed to query releases" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      })
    }

    const releases: any[] = await relRes.json()
    // Releases are returned newest-first. Find the first asset with .exe
    let asset: any | null = null
    for (const r of releases || []) {
      if (!Array.isArray(r?.assets)) continue
      asset = r.assets.find((a: any) => typeof a?.name === 'string' && a.name.toLowerCase().endsWith('.exe'))
      if (asset) break
    }

    if (!asset?.browser_download_url) {
      return new Response(JSON.stringify({ error: "No Windows installer found in latest releases" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      })
    }

    const fileUrl: string = asset.browser_download_url
    const assetId: number | undefined = asset.id
    const filename: string = asset.name || 'installer.exe'

    // 2) Fetch the asset stream from GitHub
    const dlHeaders = new Headers({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Helvia-Downloader/1.0",
      "Accept": "application/octet-stream",
    })
    if (process.env.GITHUB_TOKEN) {
      dlHeaders.set("Authorization", `Bearer ${process.env.GITHUB_TOKEN}`)
    }
    let upstream = await fetch(fileUrl, {
      // Ensure we always revalidate and stream
      cache: "no-store",
      // Some CDNs require forwarding headers; keep minimal here
      headers: dlHeaders,
    })

    // Fallback: If direct URL failed (common for draft assets) and we have a token, try the assets API
    if ((!upstream.ok || !upstream.body) && upstream.status === 404 && process.env.GITHUB_TOKEN && assetId) {
      const assetApiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${assetId}`
      const assetHeaders = new Headers({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Helvia-Downloader/1.0",
        "Accept": "application/octet-stream",
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
      })
      const up2 = await fetch(assetApiUrl, {
        cache: "no-store",
        headers: assetHeaders,
        redirect: "follow",
      })
      if (up2.ok && up2.body) {
        upstream = up2
      } else {
        const errText2 = await up2.text().catch(() => "")
        console.error("Asset API upstream error:", up2.status, errText2?.slice(0, 500))
      }
    }

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "")
      console.error("Download proxy upstream error:", upstream.status, errText?.slice(0, 500))
      return new Response(JSON.stringify({ error: `Failed to fetch file from source (status ${upstream.status})` }), {
        status: upstream.status || 502,
        headers: { "content-type": "application/json" },
      })
    }

    // Stream the body through with proper download headers
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/octet-stream",
        "content-disposition": `attachment; filename="${filename}"`,
        // Prevent caching on our edge as well
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "pragma": "no-cache",
        "expires": "0",
      },
    })
  } catch (err) {
    console.error("Download proxy unexpected error:", err)
    return new Response(JSON.stringify({ error: "Unexpected error while downloading" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}
