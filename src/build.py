from pathlib import Path
import base64
root=Path(__file__).parent
s=(root/'template.html').read_text()
for token,file in [('/*STYLE*/','style.css'),('/*MODEL*/','model.js'),('/*INFLUENCE*/','influence.js'),('/*APP*/','app.js')]:
    s=s.replace(token,(root/file).read_text())
for token,file in [('BGDATA','meadow.png'),('SPRITEDATA','organisms.png')]:
    s=s.replace(token,'data:image/png;base64,'+base64.b64encode((root/'assets'/file).read_bytes()).decode())
(root.parent/'index.html').write_text(s)
print('Built standalone index.html:',len(s),'characters')
