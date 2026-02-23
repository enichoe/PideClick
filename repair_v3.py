import re
import os

def final_cleanup(content):
    # Corregir palabras rotas por reemplazos anteriores
    corruptions = {
        'text-smrk': 'text-sm',
        'text-lgl': 'text-lg',
        'text-rightr': 'text-right',
        'text-xsted': 'text-zinc-300',
        'text-text-muted': 'text-zinc-300',
        'text-text-dark': 'text-zinc-100',
        'text-muted': 'text-zinc-300',
        'text-dark': 'text-zinc-100',
        'text-gris': 'text-zinc-300',
        'text-oscuro': 'text-zinc-100',
        # Asegurar no haya duplicados raros
        'text-zinc-100': 'text-white', # Forzar blanco puro
        'text-zinc-300': 'text-zinc-300', # Mantener zinc-300 para secundario
    }
    
    for old, new in corruptions.items():
        content = content.replace(old, new)
    
    # Asegurar body tag con texto blanco
    content = re.sub(r'<body[^>]*>', '<body class="min-h-screen bg-zinc-950 text-white selection:bg-primary/30">', content)
    
    # Asegurar que los inputs no tengan fondo blanco del navegador
    content = content.replace('bg-surface', 'bg-zinc-900')
    content = content.replace('bg-background', 'bg-zinc-950')
    
    return content

files = [
    r'c:\Users\enich\OneDrive\Escritorio\PideClick\index.html',
    r'c:\Users\enich\OneDrive\Escritorio\PideClick\script.js'
]

for path in files:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        fixed = final_cleanup(content)
        
        # Corrección adicional para script.js (asegurar que no haya herencias negras)
        if 'script.js' in path:
            fixed = fixed.replace('text-zinc-400', 'text-zinc-300')
            fixed = fixed.replace('text-smrk', 'text-sm')
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Cleaned: {path}")

# Verificar si quedaron palabras raras como "smrk" o "xsted" sin el prefijo text-
def check_rogue_words():
    for path in files:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'smrk' in content or 'xsted' in content or 'rightr' in content or 'lgl' in content:
                print(f"ALERTA: Quedan residuos en {path}")

check_rogue_words()
