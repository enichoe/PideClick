import re
import os

def find_text_classes(content):
    # Encontrar todas las clases que empiezan con text-
    return set(re.findall(r'text-[\w\-/]+', content))

files = [
    r'c:\Users\enich\OneDrive\Escritorio\PideClick\index.html',
    r'c:\Users\enich\OneDrive\Escritorio\PideClick\script.js'
]

all_classes = {}

for f_path in files:
    if os.path.exists(f_path):
        with open(f_path, 'r', encoding='utf-8') as f:
            classes = find_text_classes(f.read())
            all_classes[f_path] = sorted(list(classes))

for f, classes in all_classes.items():
    print(f"\nArchivo: {f}")
    for c in classes:
        print(f" - {c}")
