
for /f "delims=" %%f in ('dir /b /a-d-h-s') do ffmpeg -i %%f -ss 0.4 -t 10 new/%%f
pause