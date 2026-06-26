from PIL import Image
import os

out_dir = r'D:\codex\guimi3\frontend\miniprogram\assets\icons\section'

for name in ['chat', 'user', 'target', 'style', 'save']:
    path = os.path.join(out_dir, name + '.png')
    if os.path.exists(path):
        img = Image.open(path)
        img = img.resize((80, 80), Image.LANCZOS)
        img.save(path, 'PNG')
        print(f'Resized {name}.png to 80x80')
    else:
        print(f'{name}.png not found')