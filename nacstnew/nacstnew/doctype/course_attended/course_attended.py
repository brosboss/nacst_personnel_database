# Copyright (c) 2025, !! and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _


class CourseAttended(Document):
	def validate(self):
		"""Validate that course_report is a PDF file"""
		if self.course_report:
			self._validate_pdf_document('course_report')
	
	def _validate_pdf_document(self, fieldname):
		"""Validate that the specified attach field contains a PDF file"""
		document = self.get(fieldname)
		if not document:
			return
		
		# Get file extension
		file_extension = None
		if '.' in document:
			file_extension = document.split('.')[-1].lower()
		
		# Check if it's a PDF
		if file_extension != 'pdf':
			frappe.throw(
				_("Only PDF documents are allowed for {0}. The attached file '{1}' is not a PDF file.").format(
					_(self.meta.get_field(fieldname).label or fieldname),
					document
				),
				title=_("Invalid File Type")
			)
		
		# Additional validation: Check if file exists and verify MIME type if possible
		try:
			# Try to get file info from database
			file_doc = frappe.get_doc("File", {"file_url": document})
			if hasattr(file_doc, 'file_type') and file_doc.file_type:
				if file_doc.file_type.upper() != 'PDF':
					frappe.throw(
						_("Only PDF documents are allowed for {0}. The attached file '{1}' has file type '{2}'.").format(
							_(self.meta.get_field(fieldname).label or fieldname),
							document,
							file_doc.file_type
						),
						title=_("Invalid File Type")
					)
		except frappe.DoesNotExistError:
			# File might not be saved yet, just check extension
			pass
		except Exception:
			# If we can't check, just rely on extension validation
			pass
