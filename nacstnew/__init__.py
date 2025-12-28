__version__ = "0.0.1"

# Import www module to apply app context patches
try:
	from nacstnew import www  # noqa: F401
except ImportError:
	pass
