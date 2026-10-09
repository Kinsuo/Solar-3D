$url = "https://www.solarsystemscope.com/textures/download/2k_mercury.jpg"
$headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    "Referer" = "https://www.solarsystemscope.com/"
    "Accept" = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
}
Invoke-WebRequest -Uri $url -OutFile ".\textures\2k_mercury.jpg" -Headers $headers -UseBasicParsing
Write-Host "Mercury downloaded!"
