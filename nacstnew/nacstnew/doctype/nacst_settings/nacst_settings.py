# Copyright (c) 2025, !! and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class NACSTSettings(Document):
	def on_update(self):
		# """Clear cache when settings are updated"""
		# frappe.clear_cache(doctype="NACST Settings")
		pass

