cd seafront_full/full
for /f "delims=" %%f in ('dir /b /a-d-h-s') do (
ffmpeg -i %%f -vframes 1 -f image2 pics/%%~nf.jpg
)
pause