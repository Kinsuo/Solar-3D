$urls = @(
    "https://www.solarsystemscope.com/textures/download/2k_mercury.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_mars.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_saturn.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png",
    "https://www.solarsystemscope.com/textures/download/2k_uranus.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_neptune.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_moon.jpg",
    "https://www.solarsystemscope.com/textures/download/2k_sun.jpg"
)
New-Item -ItemType Directory -Force -Path .\textures

$headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    "Referer" = "https://www.solarsystemscope.com/textures/"
    "Accept" = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
}

foreach ($url in $urls) {
    $filename = Split-Path $url -Leaf
    Write-Host "Downloading $filename..."
    try {
        Invoke-WebRequest -Uri $url -OutFile ".\textures\$filename" -Headers $headers -UseBasicParsing
    } catch {
        Write-Host "Failed to download $filename : $_"
    }
}
Write-Host "Done downloading textures!"
