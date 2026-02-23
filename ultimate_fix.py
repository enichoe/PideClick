import re
import os

def fix_content(content):
    # 1. Asegurar color de texto global en body
    content = content.replace('<body class="min-h-screen bg-pattern"', '<body class="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-primary/30"')
    
    # 2. Corregir Tailwind Config para usar clases directas y evitar confusiones
    # Mantendremos la paleta pero aseguraremos nombres claros
    
    # 3. Limpieza de clases corruptas (vistas en el scan anterior)
    content = content.replace('text-smrk', 'text-sm')
    content = content.replace('text-lgl', 'text-lg')
    content = content.replace('text-rightr', 'text-right')
    content = content.replace('text-xsted', 'text-zinc-400')
    content = content.replace('text-text-muted', 'text-zinc-400')
    content = content.replace('text-text-dark', 'text-zinc-100')
    
    # 4. Forzar visibilidad en elementos críticos
    content = content.replace('p-1 border border-zinc-800', 'p-1 border border-zinc-700 bg-zinc-900')
    content = content.replace('bg-surface', 'bg-zinc-900')
    content = content.replace('bg-background', 'bg-zinc-950')
    
    # 5. Corregir el footer que el usuario mencionó específicamente (y el navbar)
    content = content.replace('text-zinc-400', 'text-zinc-300') # Hacerlo un poco más claro
    
    return content

files = [
    r'c:\Users\enich\OneDrive\Escritorio\PideClick\index.html',
    r'c:\Users\enich\OneDrive\Escritorio\PideClick\script.js',
    r'c:\Users\enich\OneDrive\Escritorio\PideClick\styles.css'
]

for path in files:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            new_content = fix_content(f.read())
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed: {path}")

# Fix específico para script.js que tiene plantillas literales
def fix_js_literals():
    path = r'c:\Users\enich\OneDrive\Escritorio\PideClick\script.js'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Asegurar que los items del carrito y productos tengan texto claro
    content = content.replace('text-zinc-400', 'text-zinc-300')
    content = content.replace('text-zinc-100', 'text-white') # Blanco puro para JS dinámico
    content = content.replace('bg-zinc-900', 'bg-zinc-800')   # Un poco más claro para elevar
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_js_literals()
