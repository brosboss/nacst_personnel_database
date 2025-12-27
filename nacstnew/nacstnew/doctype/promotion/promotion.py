# Copyright (c) 2025, !! and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Promotion(Document):
	def on_submit(self):
		"""Update Personnel records with latest promotion information"""
		# Get all unique service numbers from this promotion's promotion list
		service_numbers = set()
		for row in self.promotion_list:
			if row.service_number:
				service_numbers.add(row.service_number)
		
		# For each personnel, find their max seniority date from all submitted promotions
		for service_number in service_numbers:
			self.update_personnel_rank(service_number)
	
	def update_personnel_rank(self, service_number):
		"""Update personnel's current rank and date of last promotion based on max seniority date"""
		# Get the promotion record with max seniority_date for this personnel
		# Only consider submitted promotion records
		max_promotion = frappe.db.sql("""
			SELECT 
				pl.service_number,
				pl.to_rank,
				pl.seniority_date
			FROM `tabPromotion List` pl
			INNER JOIN `tabPromotion` p ON pl.parent = p.name
			WHERE pl.service_number = %s
				AND p.docstatus = 1
			ORDER BY pl.seniority_date DESC
			LIMIT 1
		""", (service_number,), as_dict=True)
		
		if max_promotion and len(max_promotion) > 0:
			promotion_data = max_promotion[0]
			to_rank = promotion_data.get('to_rank')
			seniority_date = promotion_data.get('seniority_date')
			
			if to_rank and seniority_date:
				# Update the Personnel record
				try:
					personnel = frappe.get_doc("Personnel", service_number)
					personnel.current_rank = to_rank
					personnel.date_of_last_promotion = seniority_date
					personnel.save(ignore_permissions=True)
					frappe.db.commit()
					
					frappe.msgprint(
						f"Updated {personnel.personnel_name or service_number}: "
						f"Current Rank = {to_rank}, Date of Last Promotion = {frappe.format_value(seniority_date, {'fieldtype': 'Date'})}",
						indicator="green"
					)
				except frappe.DoesNotExistError:
					frappe.log_error(f"Personnel {service_number} not found", "Promotion Update Error")
				except Exception as e:
					frappe.log_error(f"Error updating Personnel {service_number}: {str(e)}", "Promotion Update Error")
