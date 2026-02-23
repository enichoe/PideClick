import re
import os

def final_polish(content):
    # 1. Corregir atributos de clase duplicados
    content = content.replace('class="w-full px-4 py-3 rounded-xl border border-zinc-700 focus:border-primary focus:ring-2 focus:ring-coral/20 outline-none transition-all" class="placeholder-zinc-500"', 'class="w-full px-4 py-3 rounded-xl border border-zinc-700 focus:border-primary outline-none transition-all bg-zinc-800 text-white placeholder-zinc-500"')
    
    # 2. Reemplazar coral/20 por primary/20 (coral ya no existe)
    content = content.replace('focus:ring-coral/20', 'focus:ring-primary/20')
    content = content.replace('focus:ring-coral', 'focus:ring-primary')
    
    # 3. Asegurar que los inputs en los modales tengan fondo oscuro y texto blanco
    content = content.replace('placeholder="987654321"', 'class="w-full px-4 py-3 rounded-xl border border-zinc-700 focus:border-primary outline-none transition-all bg-zinc-800 text-white placeholder-zinc-500" placeholder="987654321"')
    
    # 4. Eliminar residuos de text-smerald
    content = content.replace('text-smerald-400', 'text-emerald-400')
    content = content.replace('text-xlimary', 'text-primary')
    content = content.replace('text-xsght', 'text-right')
    
    # 5. Forzar visibilidad en los botones de admin
    content = content.replace('border-text-dark/10', 'border-zinc-700')
    
    return content

files = [
    r'c:\Users\enich\OneDrive\Escritorio\PideClick\index.html',
    r'c:\Users\enich\OneDrive\Escritorio\PideClick\script.js'
]

for path in files:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        fixed = final_polish(content)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Polished: {path}")
