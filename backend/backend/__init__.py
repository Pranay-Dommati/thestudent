"""
Backend package init.

Includes optional PyMySQL fallback so the app can run on hosts where
`mysqlclient` native bindings aren't available.
"""

# Try to ensure MySQL DB driver availability
try:
	import MySQLdb  # type: ignore  # noqa: F401
except Exception:
	try:
		import pymysql  # type: ignore
		pymysql.install_as_MySQLdb()
	except Exception:
		# If both drivers are unavailable, Django will raise a clear error
		# when trying to connect using the MySQL backend.
		pass
