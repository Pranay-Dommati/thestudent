import sys
content = open('scrib-frontend/src/GeneratePage.jsx', 'r', encoding='utf-8').read()

old_str = '''                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-[#ded6cc] bg-[#faf8f3] p-4">'''

new_str = '''                  </div>
                </div>
              </>
              ) : (
                <div className="mt-4 rounded-xl border border-[#ded6cc] bg-[#faf8f3] p-4">'''

content = content.replace(old_str, new_str)
open('scrib-frontend/src/GeneratePage.jsx', 'w', encoding='utf-8').write(content)
