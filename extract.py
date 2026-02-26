import sys
sys.path.insert(0, '.deps')
import fitz

doc = fitz.open('/Users/artemluzanin/Downloads/ЛунгуКНиДр.pdf')
for page_num in range(doc.page_count):
    text = doc[page_num].get_text()
    if '8.4.18' in text:
        print(f"Page {page_num}:")
        print(text)
        print("-" * 40)
