__version__ = "0.0.1"

# Import www module to apply app context patches
try:
	from nacstnew import www  # noqa: F401
except ImportError:
	pass


def _patch_delete_doc_message():
	"""Override the delete_doc error message to remove ERPNext link"""
	import frappe
	from frappe import _
	import frappe.model.delete_doc

	def custom_check_permission_and_not_submitted(doc):
		# permission
		if (
			not doc.flags.ignore_permissions
			and frappe.session.user != "Administrator"
			and (not doc.has_permission("delete") or (doc.doctype == "DocType" and not doc.custom))
		):
			frappe.msgprint(
				_("User not allowed to delete {0}: {1}").format(doc.doctype, doc.name),
				raise_exception=frappe.PermissionError,
			)

		# check if submitted - custom message without ERPNext link
		if doc.meta.is_submittable and doc.docstatus.is_submitted():
			frappe.msgprint(
				_("{0} {1}: Submitted Record cannot be deleted. You must Cancel it first.").format(
					_(doc.doctype),
					doc.name,
				),
				raise_exception=True,
			)

	# Replace the function
	frappe.model.delete_doc.check_permission_and_not_submitted = custom_check_permission_and_not_submitted


# Apply the patch when module is imported
try:
	_patch_delete_doc_message()
except Exception:
	# Silently fail if patching fails (e.g., during migrations)
	pass
