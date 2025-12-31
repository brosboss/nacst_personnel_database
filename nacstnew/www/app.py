# Copyright (c) 2024, Nacstnew and Contributors
# License: MIT. See LICENSE

import frappe


# Monkey patch to extend app context with custom favicon and splash image
def patch_app_context():
	"""Patch frappe.www.app.get_context to add favicon and splash_image"""
	from frappe.www import app as frappe_app
	
	# Store original function
	if not hasattr(frappe_app, '_original_get_context'):
		frappe_app._original_get_context = frappe_app.get_context
	
	def get_context(context):
		"""Extend app context with custom favicon and splash image"""
		# Call original function first
		context = frappe_app._original_get_context(context)
		
		hooks = frappe.get_hooks()
		
		# Set favicon from hooks if available
		favicon_hooks = hooks.get("favicon", [])
		if favicon_hooks:
			context["favicon"] = favicon_hooks[0]
		
		# Set splash_image from hooks if available
		splash_hooks = hooks.get("splash_image", [])
		if splash_hooks:
			context["splash_image"] = splash_hooks[0]
		
		return context
	
	# Replace the original function
	frappe_app.get_context = get_context


# Apply the patch when module is imported
patch_app_context()

