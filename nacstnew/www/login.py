# Copyright (c) 2024, Nacstnew and Contributors
# License: MIT. See LICENSE

import frappe


# Monkey patch to customize login page app name
def patch_login_context():
	"""Patch frappe.www.login.get_context to set custom app name"""
	from frappe.www import login as frappe_login
	
	# Store original function
	if not hasattr(frappe_login, '_original_get_context'):
		frappe_login._original_get_context = frappe_login.get_context
	
	def get_context(context):
		"""Extend login context with custom app name"""
		# Call original function first
		context = frappe_login._original_get_context(context)
		
		# Override app_name for login page
		context["app_name"] = "NACST Database"
		
		return context
	
	# Replace the original function
	frappe_login.get_context = get_context


# Apply the patch when module is imported
patch_login_context()

