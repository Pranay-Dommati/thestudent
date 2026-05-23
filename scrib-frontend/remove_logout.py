import os, glob, re

files = glob.glob('src/**/*.jsx', recursive=True)

# Pattern for the logout button in navbars:
# e.g., <button onClick={logout} className="...">Log out</button>
# It handles spaces, newlines inside className, etc.
pattern = re.compile(r'\s*<button[^>]*onClick=\{logout\}[^>]*>\s*Log out\s*</button>', re.DOTALL)

for f in files:
    if 'ProfilePage.jsx' in f or 'AuthContext.jsx' in f:
        # We don't want to remove the button we are about to add in ProfilePage
        # And AuthContext might have something else
        pass
    
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content, count = pattern.subn('', content)
    
    if count > 0:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Removed {count} logout buttons from {f}')
