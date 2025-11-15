import ast
import sys

def check_python_syntax(file_path):
    """Check if a Python file has valid syntax"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()
        
        # Try to parse the AST
        ast.parse(source)
        print(f"✅ {file_path} has valid Python syntax")
        return True
        
    except SyntaxError as e:
        print(f"❌ Syntax error in {file_path}:")
        print(f"   Line {e.lineno}: {e.text}")
        print(f"   Error: {e.msg}")
        return False
    except Exception as e:
        print(f"❌ Error checking {file_path}: {e}")
        return False

# Check the Pro Learning views file
views_file = r"c:\Users\banny\OneDrive\Documents\Desktop\STUDENTSHUB\SHPRO\thestudent\backend\courses\pro_learning_views.py"
urls_file = r"c:\Users\banny\OneDrive\Documents\Desktop\STUDENTSHUB\SHPRO\thestudent\backend\courses\pro_learning_urls.py"

print("Checking syntax of Pro Learning files...")
views_ok = check_python_syntax(views_file)
urls_ok = check_python_syntax(urls_file)

if views_ok and urls_ok:
    print("✅ All Pro Learning files have valid syntax!")
else:
    print("❌ Please fix syntax errors before testing API")
