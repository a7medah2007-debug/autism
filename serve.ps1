Set-Location "C:\Users\XPS Store\Desktop\bsu"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:7788/")
$listener.Start()
Write-Host "Server: http://localhost:7788/"
while ($true) {
    $ctx  = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $file = (Get-Location).Path + $path.Replace("/", "\")
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ext   = [System.IO.Path]::GetExtension($file).ToLower()
        $mime  = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css" }
            ".js"   { "application/javascript" }
            ".json" { "application/json" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            default { "application/octet-stream" }
        }
        $ctx.Response.ContentType      = $mime
        $ctx.Response.ContentLength64  = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $ctx.Response.StatusCode = 404
    }
    $ctx.Response.OutputStream.Close()
}
