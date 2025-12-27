# Copyright (c) 2025, !! and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _


class Personnel(Document):
	pass


@frappe.whitelist()
def get_posting_history_html(service_number):
	"""Generate HTML table for posting history from Posting Authority Details"""
	if not service_number:
		return "<p>No service number provided.</p>"
	
	# Query all Posting Authority Details records for this service number
	posting_records = frappe.db.get_all(
		"Posting Authority Details",
		filters={
			"service_number": service_number
		},
		fields=[
			"parent",
			"from_unit",
			"to_unit",
			"appointment",
			"wef_date",
			"gaining_unit_date_tos",
			"posting_status",
			"part_2_order",
			"overstay_in_loosing_unit"
		],
		order_by="wef_date desc, creation desc"
	)
	print(posting_records)
	
	if not posting_records:
		return "<p>No posting history found.</p>"
	
	# Generate HTML table
	html = """
	<style>
		.posting-history-table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 10px;
		}
		.posting-history-table th {
			background-color: var(--subtle-fg);
			padding: 8px;
			text-align: left;
			border: 1px solid var(--table-border-color);
			font-weight: bold;
		}
		.posting-history-table td {
			padding: 8px;
			border: 1px solid var(--table-border-color);
		}
		.posting-history-table tr:nth-child(even) {
			background-color: var(--fg-color);
		}
	</style>
	<table class="posting-history-table">
		<thead>
			<tr>
				<th>Posting Authority</th>
				<th>From Unit</th>
				<th>To Unit</th>
				<th>Appointment</th>
				<th>WEF Date</th>
				<th>Date TOS</th>
				<th>Posting Status</th>
				<th>Part 2 Order</th>
				<th>Overstay (Days)</th>
			</tr>
		</thead>
		<tbody>
	"""
	
	for record in posting_records:
		# Get posting authority name (parent)
		posting_authority_name = record.parent or ""
		
		# Format dates
		wef_date = frappe.format_value(record.wef_date, {"fieldtype": "Date"}) if record.wef_date else ""
		date_tos = frappe.format_value(record.gaining_unit_date_tos, {"fieldtype": "Date"}) if record.gaining_unit_date_tos else ""
		
		# Format posting status with color
		posting_status = record.posting_status or ""
		status_color = "green" if posting_status == "Effected" else "orange" if posting_status == "Cancelled" else "gray"
		
		html += f"""
			<tr>
				<td><b>{frappe.utils.escape_html(posting_authority_name)}</b></td>
				<td>{frappe.utils.escape_html(record.from_unit or "")}</td>
				<td><b>{frappe.utils.escape_html(record.to_unit or "")}</b></td>
				<td>{frappe.utils.escape_html(record.appointment or "")}</td>
				<td>{wef_date}</td>
				<td>{date_tos}</td>
				<td><span class="indicator {status_color}">{frappe.utils.escape_html(posting_status)}</span></td>
				<td>{frappe.utils.escape_html(record.part_2_order or "")}</td>
				<td>{record.overstay_in_loosing_unit or 0}</td>
			</tr>
		"""
	
	html += """
		</tbody>
	</table>
	"""
	
	return html

@frappe.whitelist()
def get_courses_attended_html(service_number):
	"""Generate HTML table for courses attended from Course Attended doctype"""
	if not service_number:
		return "<p>No service number provided.</p>"
	
	# Query all Course Attended records for this service number
	course_records = frappe.db.get_all(
		"Course Attended",
		filters={
			"service_number": service_number
		},
		fields=[
			"course_name",
			"course_start_date",
			"course_end_date",
			"grade",
			"course_report"
		],
		order_by="course_start_date desc, creation desc"
	)
	
	if not course_records:
		return "<p>No courses attended found.</p>"
	
	# Generate HTML table
	html = """
	<style>
		.courses-attended-table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 10px;
		}
		.courses-attended-table th {
			background-color: var(--subtle-fg);
			padding: 8px;
			text-align: left;
			border: 1px solid var(--table-border-color);
			font-weight: bold;
		}
		.courses-attended-table td {
			padding: 8px;
			border: 1px solid var(--table-border-color);
		}
		.courses-attended-table tr:nth-child(even) {
			background-color: var(--fg-color);
		}
	</style>
	<table class="courses-attended-table">
		<thead>
			<tr>
				<th>Course Name</th>
				<th>Start Date</th>
				<th>End Date</th>
				<th>Grade</th>
				<th>Course Report</th>
			</tr>
		</thead>
		<tbody>
	"""
	
	for record in course_records:
		# Format dates
		start_date = frappe.format_value(record.course_start_date, {"fieldtype": "Date"}) if record.course_start_date else ""
		end_date = frappe.format_value(record.course_end_date, {"fieldtype": "Date"}) if record.course_end_date else ""
		
		# Format course report link if available
		course_report = ""
		if record.course_report:
			course_report = f'<a href="{record.course_report}" target="_blank">View Report</a>'
		else:
			course_report = "N/A"
		
		html += f"""
			<tr>
				<td>{frappe.utils.escape_html(record.course_name or "")}</td>
				<td>{start_date}</td>
				<td>{end_date}</td>
				<td>{frappe.utils.escape_html(record.grade or "")}</td>
				<td>{course_report}</td>
			</tr>
		"""
	
	html += """
		</tbody>
	</table>
	"""
	
	return html

@frappe.whitelist()
def get_promotion_history_html(service_number):
	"""Generate HTML table for promotion history from Promotion List child table"""
	if not service_number:
		return "<p>No service number provided.</p>"
	
	# Query all Promotion List records for this service number
	# Since it's a child table, we query it directly and get the parent
	promotion_records = frappe.db.sql("""
		SELECT 
			pl.name,
			pl.parent,
			pl.service_number,
			pl.personnel_name,
			pl.from_rank,
			pl.to_rank,
			pl.seniority_date,
			p.promotion_authority
		FROM `tabPromotion List` pl
		INNER JOIN `tabPromotion` p ON pl.parent = p.name
		WHERE pl.service_number = %s
		ORDER BY pl.seniority_date DESC, pl.creation DESC
	""", (service_number,), as_dict=True)
	
	if not promotion_records:
		return "<p>No promotion history found.</p>"
	
	# Generate HTML table
	html = """
	<style>
		.promotion-history-table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 10px;
		}
		.promotion-history-table th {
			background-color: var(--subtle-fg);
			padding: 8px;
			text-align: left;
			border: 1px solid var(--table-border-color);
			font-weight: bold;
		}
		.promotion-history-table td {
			padding: 8px;
			border: 1px solid var(--table-border-color);
		}
		.promotion-history-table tr:nth-child(even) {
			background-color: var(--fg-color);
		}
	</style>
	<table class="promotion-history-table">
		<thead>
			<tr>
				<th>Promotion Authority</th>
				<th>From Rank</th>
				<th>To Rank</th>
				<th>Seniority Date</th>
			</tr>
		</thead>
		<tbody>
	"""
	
	for record in promotion_records:
		# Format date
		seniority_date = frappe.format_value(record.seniority_date, {"fieldtype": "Date"}) if record.seniority_date else ""
		
		html += f"""
			<tr>
				<td><b>{frappe.utils.escape_html(record.promotion_authority or "")}</b></td>
				<td>{frappe.utils.escape_html(record.from_rank or "")}</td>
				<td><b>{frappe.utils.escape_html(record.to_rank or "")}</b></td>
				<td>{seniority_date}</td>
			</tr>
		"""
	
	html += """
		</tbody>
	</table>
	"""
	
	return html

@frappe.whitelist()
def get_personnel_data(service_number):
	"""Get complete personnel data for display page"""
	if not service_number:
		return None
	
	# Get personnel record
	personnel = frappe.get_doc("Personnel", service_number)
	
	# Get posting history
	posting_records = frappe.db.get_all(
		"Posting Authority Details",
		filters={
			"service_number": service_number
		},
		fields=[
			"parent",
			"from_unit",
			"to_unit",
			"appointment",
			"wef_date",
			"gaining_unit_date_tos",
			"posting_status",
			"part_2_order",
			"overstay_in_loosing_unit"
		],
		order_by="wef_date desc, creation desc"
	)
	
	# Format personnel data
	personnel_data = {
		"service_number": personnel.service_number,
		"personnel_name": personnel.personnel_name,
		"first_name": personnel.first_name,
		"last_name": personnel.last_name,
		"surname": personnel.surname,
		"category": personnel.category,
		"current_rank": personnel.current_rank,
		"current_unit": personnel.current_unit,
		"current_unit_location": personnel.current_unit_location,
		"current_deployment": personnel.current_deployment,
		"type_of_commission": personnel.type_of_commission,
		"course": personnel.course,
		"date_of_last_promotion": frappe.format_value(personnel.date_of_last_promotion, {"fieldtype": "Date"}) if personnel.date_of_last_promotion else "",
		"phone_number": personnel.phone_number,
		"remarks": personnel.remarks,
		"personnel_image": personnel.personnel_image,
		"posting_history": [],
		"promotion_history": [],
		"courses_attended": []
	}
	
	# Format posting history
	for record in posting_records:
		wef_date = frappe.format_value(record.wef_date, {"fieldtype": "Date"}) if record.wef_date else ""
		date_tos = frappe.format_value(record.gaining_unit_date_tos, {"fieldtype": "Date"}) if record.gaining_unit_date_tos else ""
		
		personnel_data["posting_history"].append({
			"posting_authority": record.parent or "",
			"from_unit": record.from_unit or "",
			"to_unit": record.to_unit or "",
			"appointment": record.appointment or "",
			"wef_date": wef_date,
			"date_tos": date_tos,
			"posting_status": record.posting_status or "",
			"part_2_order": record.part_2_order or "",
			"overstay_days": record.overstay_in_loosing_unit or 0
		})
	
	# Get promotion history
	promotion_records = frappe.db.sql("""
		SELECT 
			p.promotion_authority,
			pl.from_rank,
			pl.to_rank,
			pl.seniority_date
		FROM `tabPromotion List` pl
		INNER JOIN `tabPromotion` p ON pl.parent = p.name
		WHERE pl.service_number = %s
		ORDER BY pl.seniority_date DESC, pl.creation DESC
	""", (service_number,), as_dict=True)
	
	# Format promotion history
	for record in promotion_records:
		seniority_date = frappe.format_value(record.seniority_date, {"fieldtype": "Date"}) if record.seniority_date else ""
		
		personnel_data["promotion_history"].append({
			"promotion_authority": record.promotion_authority or "",
			"from_rank": record.from_rank or "",
			"to_rank": record.to_rank or "",
			"seniority_date": seniority_date
		})
	
	# Get courses attended
	course_records = frappe.db.get_all(
		"Course Attended",
		filters={
			"service_number": service_number
		},
		fields=[
			"course_name",
			"course_start_date",
			"course_end_date",
			"grade",
			"course_report"
		],
		order_by="course_start_date desc, creation desc"
	)
	
	# Format courses attended
	for record in course_records:
		start_date = frappe.format_value(record.course_start_date, {"fieldtype": "Date"}) if record.course_start_date else ""
		end_date = frappe.format_value(record.course_end_date, {"fieldtype": "Date"}) if record.course_end_date else ""
		
		personnel_data["courses_attended"].append({
			"course_name": record.course_name or "",
			"course_start_date": start_date,
			"course_end_date": end_date,
			"grade": record.grade or "",
			"course_report": record.course_report or ""
		})
	
	return personnel_data

@frappe.whitelist()
def get_personnel_brief_html(service_number):
	"""Generate comprehensive personnel brief HTML from all available data"""
	if not service_number:
		return "<p>No service number provided.</p>"
	
	# Get personnel record
	try:
		personnel = frappe.get_doc("Personnel", service_number)
	except frappe.DoesNotExistError:
		return "<p>Personnel record not found.</p>"
	
	# Start building the brief HTML
	html = """
	<style>
		.personnel-brief {
			font-family: Arial, sans-serif;
			line-height: 1.6;
			color: #333;
		}
		.brief-header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 20px;
			border-radius: 8px;
			margin-bottom: 20px;
		}
		.brief-header h2 {
			margin: 0;
			font-size: 24px;
		}
		.brief-section {
			margin-bottom: 25px;
			padding: 15px;
			background-color: #f8f9fa;
			border-left: 4px solid #667eea;
			border-radius: 4px;
		}
		.brief-section h3 {
			margin-top: 0;
			color: #667eea;
			font-size: 18px;
			border-bottom: 2px solid #667eea;
			padding-bottom: 8px;
		}
		.brief-row {
			display: flex;
			margin-bottom: 10px;
		}
		.brief-label {
			font-weight: bold;
			min-width: 180px;
			color: #555;
		}
		.brief-value {
			color: #333;
		}
		.brief-summary {
			background-color: #e8f4f8;
			padding: 15px;
			border-radius: 4px;
			margin-top: 15px;
		}
		.brief-table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 10px;
		}
		.brief-table th {
			background-color: #667eea;
			color: white;
			padding: 10px;
			text-align: left;
			border: 1px solid #ddd;
		}
		.brief-table td {
			padding: 8px;
			border: 1px solid #ddd;
			background-color: white;
		}
		.brief-table tr:nth-child(even) td {
			background-color: #f8f9fa;
		}
	</style>
	<div class="personnel-brief">
	"""
	
	# Header Section
	personnel_name = personnel.personnel_name or f"{personnel.first_name or ''} {personnel.last_name or ''} {personnel.surname or ''}".strip() or "N/A"
	html += f"""
		<div class="brief-header">
			<h2>{frappe.utils.escape_html(personnel_name)}</h2>
			<p style="margin: 5px 0 0 0; opacity: 0.9;">Service Number: {frappe.utils.escape_html(service_number)}</p>
		</div>
	"""
	
	# Personal Information Section
	html += """
		<div class="brief-section">
			<h3>Personal Information</h3>
	"""
	
	# Build personal info rows
	personal_info = []
	if personnel.category:
		personal_info.append(("Category", personnel.category))
	if personnel.current_rank:
		personal_info.append(("Current Rank", personnel.current_rank))
	if personnel.type_of_commission:
		personal_info.append(("Type of Commission", personnel.type_of_commission))
	if personnel.course:
		personal_info.append(("Course", personnel.course))
	if personnel.date_of_last_promotion:
		date_promoted = frappe.format_value(personnel.date_of_last_promotion, {"fieldtype": "Date"})
		personal_info.append(("Date of Last Promotion", date_promoted))
	if personnel.phone_number:
		personal_info.append(("Phone Number", personnel.phone_number))
	
	for label, value in personal_info:
		html += f"""
			<div class="brief-row">
				<span class="brief-label">{label}:</span>
				<span class="brief-value">{frappe.utils.escape_html(str(value))}</span>
			</div>
		"""
	
	html += "</div>"
	
	# Current Assignment Section
	html += """
		<div class="brief-section">
			<h3>Current Assignment</h3>
	"""
	
	current_assignment = []
	if personnel.current_unit:
		current_assignment.append(("Current Unit", personnel.current_unit))
	if personnel.current_unit_location:
		current_assignment.append(("Unit Location", personnel.current_unit_location))
	if personnel.current_deployment:
		current_assignment.append(("Current Deployment", personnel.current_deployment))
	
	if current_assignment:
		for label, value in current_assignment:
			html += f"""
				<div class="brief-row">
					<span class="brief-label">{label}:</span>
					<span class="brief-value">{frappe.utils.escape_html(str(value))}</span>
				</div>
			"""
	else:
		html += "<p>No current assignment information available.</p>"
	
	html += "</div>"
	
	# Posting History Summary
	posting_records = frappe.db.get_all(
		"Posting Authority Details",
		filters={"service_number": service_number},
		fields=["parent", "from_unit", "to_unit", "appointment", "wef_date", "gaining_unit_date_tos", "posting_status"],
		order_by="wef_date desc",
		limit=5
	)
	
	if posting_records:
		html += """
			<div class="brief-section">
				<h3>Recent Posting History</h3>
				<table class="brief-table">
					<thead>
						<tr>
							<th>Posting Authority</th>
							<th>From Unit</th>
							<th>To Unit</th>
							<th>Appointment</th>
							<th>WEF Date</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
		"""
		
		for record in posting_records:
			wef_date = frappe.format_value(record.wef_date, {"fieldtype": "Date"}) if record.wef_date else "N/A"
			status = record.posting_status or "N/A"
			status_color = "green" if status == "TOS" else "orange" if status == "Cancelled" else "gray"
			
			html += f"""
						<tr>
							<td>{frappe.utils.escape_html(record.parent or "N/A")}</td>
							<td>{frappe.utils.escape_html(record.from_unit or "N/A")}</td>
							<td><b>{frappe.utils.escape_html(record.to_unit or "N/A")}</b></td>
							<td>{frappe.utils.escape_html(record.appointment or "N/A")}</td>
							<td>{wef_date}</td>
							<td><span class="indicator {status_color}">{frappe.utils.escape_html(status)}</span></td>
						</tr>
			"""
		
		html += """
					</tbody>
				</table>
			</div>
		"""
	
	# Promotion History Summary
	promotion_records = frappe.db.sql("""
		SELECT 
			p.promotion_authority,
			pl.from_rank,
			pl.to_rank,
			pl.seniority_date
		FROM `tabPromotion List` pl
		INNER JOIN `tabPromotion` p ON pl.parent = p.name
		WHERE pl.service_number = %s
		ORDER BY pl.seniority_date DESC
		LIMIT 5
	""", (service_number,), as_dict=True)
	
	if promotion_records:
		html += """
			<div class="brief-section">
				<h3>Recent Promotion History</h3>
				<table class="brief-table">
					<thead>
						<tr>
							<th>Promotion Authority</th>
							<th>From Rank</th>
							<th>To Rank</th>
							<th>Seniority Date</th>
						</tr>
					</thead>
					<tbody>
		"""
		
		for record in promotion_records:
			seniority_date = frappe.format_value(record.seniority_date, {"fieldtype": "Date"}) if record.seniority_date else "N/A"
			
			html += f"""
						<tr>
							<td>{frappe.utils.escape_html(record.promotion_authority or "N/A")}</td>
							<td>{frappe.utils.escape_html(record.from_rank or "N/A")}</td>
							<td><b>{frappe.utils.escape_html(record.to_rank or "N/A")}</b></td>
							<td>{seniority_date}</td>
						</tr>
			"""
		
		html += """
					</tbody>
				</table>
			</div>
		"""
	
	# Courses Attended Summary
	course_records = frappe.db.get_all(
		"Course Attended",
		filters={"service_number": service_number},
		fields=["course_name", "course_start_date", "course_end_date", "grade"],
		order_by="course_start_date desc",
		limit=5
	)
	
	if course_records:
		html += """
			<div class="brief-section">
				<h3>Recent Courses Attended</h3>
				<table class="brief-table">
					<thead>
						<tr>
							<th>Course Name</th>
							<th>Start Date</th>
							<th>End Date</th>
							<th>Grade</th>
						</tr>
					</thead>
					<tbody>
		"""
		
		for record in course_records:
			start_date = frappe.format_value(record.course_start_date, {"fieldtype": "Date"}) if record.course_start_date else "N/A"
			end_date = frappe.format_value(record.course_end_date, {"fieldtype": "Date"}) if record.course_end_date else "N/A"
			
			html += f"""
						<tr>
							<td>{frappe.utils.escape_html(record.course_name or "N/A")}</td>
							<td>{start_date}</td>
							<td>{end_date}</td>
							<td>{frappe.utils.escape_html(record.grade or "N/A")}</td>
						</tr>
			"""
		
		html += """
					</tbody>
				</table>
			</div>
		"""
	
	# Remarks Section
	if personnel.remarks:
		html += f"""
			<div class="brief-section">
				<h3>Remarks</h3>
				<p>{frappe.utils.escape_html(personnel.remarks)}</p>
			</div>
		"""
	
	# Summary Section
	total_postings = len(posting_records) if posting_records else 0
	total_promotions = len(promotion_records) if promotion_records else 0
	total_courses = len(course_records) if course_records else 0
	
	html += f"""
		<div class="brief-summary">
			<h3 style="margin-top: 0;">Summary</h3>
			<div class="brief-row">
				<span class="brief-label">Total Postings:</span>
				<span class="brief-value">{total_postings}</span>
			</div>
			<div class="brief-row">
				<span class="brief-label">Total Promotions:</span>
				<span class="brief-value">{total_promotions}</span>
			</div>
			<div class="brief-row">
				<span class="brief-label">Total Courses:</span>
				<span class="brief-value">{total_courses}</span>
			</div>
		</div>
	"""
	
	html += """
	</div>
	"""
	
	return html

@frappe.whitelist()
def get_all_service_numbers():
	"""Get all service numbers for dropdown"""
	service_numbers = frappe.db.get_all(
		"Personnel",
		fields=["service_number", "personnel_name"],
		order_by="service_number"
	)
	return service_numbers

@frappe.whitelist()
def get_distinct_units():
	"""Get distinct current units for filter dropdown"""
	units = frappe.db.get_all(
		"Personnel",
		fields=["current_unit"],
		filters={"current_unit": ["!=", ""]},
		distinct=True,
		order_by="current_unit"
	)
	return [u["current_unit"] for u in units if u.get("current_unit")]

@frappe.whitelist()
def get_distinct_ranks():
	"""Get distinct ranks for filter dropdown"""
	ranks = frappe.db.get_all(
		"Personnel",
		fields=["current_rank"],
		filters={"current_rank": ["!=", ""]},
		distinct=True,
		order_by="current_rank"
	)
	return [r["current_rank"] for r in ranks if r.get("current_rank")]

@frappe.whitelist()
def get_units_with_personnel(category=None, page=1, page_length=10):
	"""Get all units with their associated personnel"""
	from frappe.utils import getdate, date_diff, today
	
	page = int(page)
	page_length = int(page_length)
	
	# Build filter for category if provided
	category_condition = ""
	params = []
	if category and category in ['Officer', 'Soldier']:
		category_condition = "AND p.category = %s"
		params.append(category)
	
	# Get all distinct units that have personnel (with category filter)
	sql_query = """
		SELECT DISTINCT 
			p.current_unit as unit_name,
			u.unit_location as unit_location
		FROM `tabPersonnel` p
		LEFT JOIN `tabUnit` u ON p.current_unit = u.name
		WHERE p.current_unit IS NOT NULL AND p.current_unit != ''
		""" + category_condition + """
		ORDER BY p.current_unit
	"""
	units = frappe.db.sql(sql_query, tuple(params), as_dict=True)
	
	# For each unit, get the personnel
	units_data = []
	today_date = getdate(today())
	
	for unit in units:
		unit_name = unit.get("unit_name")
		if not unit_name:
			continue
		
		# Build filters for personnel
		personnel_filters = {
			"current_unit": unit_name
		}
		if category and category in ['Officer', 'Soldier']:
			personnel_filters["category"] = category
		
		# Get personnel for this unit
		personnel_list = frappe.db.get_all(
			"Personnel",
			filters=personnel_filters,
			fields=[
				"service_number",
				"personnel_name",
				"current_rank",
				"personnel_image",
				"phone_number",
				"category"
			],
			order_by="personnel_name"
		)
		
		# Calculate period spent in current unit for each personnel
		personnel_with_period = []
		for person in personnel_list:
			service_number = person.get("service_number")
			
			# Get the TOS date when personnel was posted to current unit
			# Look for the TOS date from Unit TOS Record (from submitted Part 2 Orders only)
			tos_record = frappe.db.sql("""
				SELECT utr.date_tos
				FROM `tabUnit TOS Record` utr
				INNER JOIN `tabPart 2 Order` p2o ON utr.parent = p2o.name
				WHERE utr.service_number = %s
					AND utr.to_unit = %s
					AND utr.parenttype = 'Part 2 Order'
					AND p2o.docstatus = 1
				ORDER BY utr.date_tos DESC
				LIMIT 1
			""", (service_number, unit_name), as_dict=True)
			
			period_spent = "N/A"
			if tos_record and tos_record[0].get("date_tos"):
				tos_date_value = tos_record[0].get("date_tos")
				tos_date = getdate(tos_date_value)
				
				# Calculate difference in days
				days_diff = date_diff(today_date, tos_date)
				
				# Convert to years, months, days
				years = days_diff // 365
				remaining_days = days_diff % 365
				months = remaining_days // 30
				days = remaining_days % 30
				
				# Format period string
				period_parts = []
				if years > 0:
					period_parts.append(f"{years} year{'s' if years != 1 else ''}")
				if months > 0:
					period_parts.append(f"{months} month{'s' if months != 1 else ''}")
				if days > 0 or len(period_parts) == 0:
					period_parts.append(f"{days} day{'s' if days != 1 else ''}")
				
				period_spent = ", ".join(period_parts)
			
			# Add period to personnel data
			person["period_in_unit"] = period_spent
			personnel_with_period.append(person)
		
		# Get commander for this unit
		# Commander is personnel whose current_unit matches and appointment is in Commander Appointment doctype
		commander = frappe.db.sql("""
			SELECT 
				p.service_number,
				p.personnel_name,
				p.phone_number,
				p.current_rank,
				pad.appointment
			FROM `tabPersonnel` p
			INNER JOIN `tabPosting Authority Details` pad ON p.service_number = pad.service_number
			INNER JOIN `tabCommander Appointment` ca ON pad.appointment = ca.appointment
			WHERE p.current_unit = %s
				AND pad.to_unit = %s
			ORDER BY pad.wef_date DESC, pad.creation DESC
			LIMIT 1
		""", (unit_name, unit_name), as_dict=True)
		
		commander_info = None
		if commander and len(commander) > 0:
			commander_info = {
				"name": commander[0].get("personnel_name") or "",
				"phone_number": commander[0].get("phone_number") or "",
				"rank": commander[0].get("current_rank") or "",
				"service_number": commander[0].get("service_number") or "",
				"appointment": commander[0].get("appointment") or ""
			}
		
		units_data.append({
			"unit_name": unit_name,
			"unit_location": unit.get("unit_location") or "",
			"personnel_count": len(personnel_with_period),
			"personnel": personnel_with_period,
			"commander": commander_info
		})
	
	# Add "No Unit Assigned" group for personnel without current_unit
	# Use SQL to get personnel where current_unit is NULL or empty
	category_sql = ""
	category_params = []
	if category and category in ['Officer', 'Soldier']:
		category_sql = "AND p.category = %s"
		category_params.append(category)
	
	no_unit_sql = """
		SELECT 
			p.service_number,
			p.personnel_name,
			p.current_rank,
			p.personnel_image,
			p.phone_number,
			p.category
		FROM `tabPersonnel` p
		WHERE (p.current_unit IS NULL OR p.current_unit = '')
		""" + category_sql + """
		ORDER BY p.personnel_name
	"""
	
	no_unit_personnel_list = frappe.db.sql(no_unit_sql, tuple(category_params), as_dict=True)
	
	# Add period as "N/A" for personnel without unit
	no_unit_personnel_with_period = []
	for person in no_unit_personnel_list:
		person["period_in_unit"] = "N/A"
		no_unit_personnel_with_period.append(person)
	
	# Add "No Unit Assigned" group if there are personnel without unit
	if no_unit_personnel_with_period:
		units_data.append({
			"unit_name": "No Unit Assigned",
			"unit_location": "",
			"personnel_count": len(no_unit_personnel_with_period),
			"personnel": no_unit_personnel_with_period
		})
	
	# Create summary data for ALL units (regardless of filter) - get counts for all units
	all_units_for_summary = frappe.db.sql("""
		SELECT DISTINCT 
			p.current_unit as unit_name,
			u.unit_location as unit_location
		FROM `tabPersonnel` p
		LEFT JOIN `tabUnit` u ON p.current_unit = u.name
		WHERE p.current_unit IS NOT NULL AND p.current_unit != ''
		ORDER BY p.current_unit
	""", as_dict=True)
	
	units_summary = []
	for unit in all_units_for_summary:
		unit_name = unit.get("unit_name")
		if not unit_name:
			continue
		
		# Get counts for this unit (all categories)
		all_personnel = frappe.db.get_all(
			"Personnel",
			filters={"current_unit": unit_name},
			fields=["category"]
		)
		
		officers_count = sum(1 for p in all_personnel if p.get("category") == "Officer")
		soldiers_count = sum(1 for p in all_personnel if p.get("category") == "Soldier")
		total_count = len(all_personnel)
		
		units_summary.append({
			"unit_name": unit_name,
			"unit_location": unit.get("unit_location") or "",
			"officers_count": officers_count,
			"soldiers_count": soldiers_count,
			"total_count": total_count
		})
	
	# Add "No Unit Assigned" to summary
	no_unit_summary_sql = """
		SELECT category
		FROM `tabPersonnel`
		WHERE (current_unit IS NULL OR current_unit = '')
	"""
	no_unit_all_personnel = frappe.db.sql(no_unit_summary_sql, as_dict=True)
	
	if no_unit_all_personnel:
		no_unit_officers_count = sum(1 for p in no_unit_all_personnel if p.get("category") == "Officer")
		no_unit_soldiers_count = sum(1 for p in no_unit_all_personnel if p.get("category") == "Soldier")
		no_unit_total_count = len(no_unit_all_personnel)
		
		units_summary.append({
			"unit_name": "No Unit Assigned",
			"unit_location": "",
			"officers_count": no_unit_officers_count,
			"soldiers_count": no_unit_soldiers_count,
			"total_count": no_unit_total_count
		})
	
	# Sort units: regular units first (alphabetically), then "No Unit Assigned" at the end
	units_data.sort(key=lambda x: (x["unit_name"] == "No Unit Assigned", x["unit_name"]))
	
	# Pagination
	total_units = len(units_data)
	start_idx = (page - 1) * page_length
	end_idx = start_idx + page_length
	paginated_units = units_data[start_idx:end_idx]
	
	return {
		"units": paginated_units,
		"units_summary": units_summary,  # All units for summary table (unfiltered)
		"total_units": total_units,
		"page": page,
		"page_length": page_length,
		"total_pages": (total_units + page_length - 1) // page_length if total_units > 0 else 1
	}

@frappe.whitelist()
def get_personnel_list(page=1, page_length=20, current_unit=None, rank=None, date_tos=None, personnel_name=None, category=None):
	"""Get paginated list of personnel with current unit, rank, date TOS, and period spent"""
	from frappe.utils import getdate, date_diff, today
	from datetime import datetime
	
	page = int(page)
	page_length = int(page_length)
	limit_start = (page - 1) * page_length
	
	# Build filters
	filters = {}
	if current_unit:
		filters["current_unit"] = current_unit
	if rank:
		filters["current_rank"] = rank
	if personnel_name:
		filters["personnel_name"] = ["like", f"%{personnel_name}%"]
	if category:
		filters["category"] = category
	
	# Parse date_tos filter
	date_tos_filter = None
	if date_tos:
		try:
			date_tos_filter = getdate(date_tos)
		except:
			date_tos_filter = None
	
	# Get total count with filters (will be recalculated after date filtering)
	total_count = frappe.db.count("Personnel", filters=filters)
	
	# Get paginated personnel records with filters
	personnel_list = frappe.db.get_all(
		"Personnel",
		filters=filters,
		fields=[
			"service_number",
			"personnel_name",
			"current_unit",
			"current_rank",
			"category"
		],
		order_by="personnel_name",
		limit_start=limit_start,
		limit_page_length=page_length
	)
	
	# For each personnel, get the latest Date TOS and calculate period spent
	result = []
	for personnel in personnel_list:
		service_number = personnel.service_number
		
		# Get the latest Date TOS from Unit TOS Record (from submitted Part 2 Orders only)
		# Use SQL to join with Part 2 Order to check docstatus
		latest_tos_sql = frappe.db.sql("""
			SELECT utr.date_tos, utr.to_unit
			FROM `tabUnit TOS Record` utr
			INNER JOIN `tabPart 2 Order` p2o ON utr.parent = p2o.name
			WHERE utr.service_number = %s
				AND utr.parenttype = 'Part 2 Order'
				AND p2o.docstatus = 1
			ORDER BY utr.date_tos DESC
			LIMIT 1
		""", (service_number,), as_dict=True)
		
		latest_tos = latest_tos_sql if latest_tos_sql else None
		
		date_tos = None
		period_spent = ""
		
		if latest_tos and latest_tos[0].get("date_tos"):
			date_tos = latest_tos[0].get("date_tos")
			date_tos_formatted = frappe.format_value(date_tos, {"fieldtype": "Date"})
			
			# Calculate period spent
			today_date = getdate(today())
			tos_date = getdate(date_tos)
			
			# Calculate difference in days
			days_diff = date_diff(today_date, tos_date)
			
			# Convert to years, months, days
			years = days_diff // 365
			remaining_days = days_diff % 365
			months = remaining_days // 30
			days = remaining_days % 30
			
			# Format period string
			period_parts = []
			if years > 0:
				period_parts.append(f"{years} year{'s' if years != 1 else ''}")
			if months > 0:
				period_parts.append(f"{months} month{'s' if months != 1 else ''}")
			if days > 0 or len(period_parts) == 0:
				period_parts.append(f"{days} day{'s' if days != 1 else ''}")
			
			period_spent = ", ".join(period_parts)
			period_years = years + (months / 12.0) + (days / 365.0)  # Decimal years for color coding
		else:
			date_tos_formatted = "N/A"
			period_spent = "N/A"
			period_years = None
		
		# Filter by date_tos if provided
		if date_tos_filter:
			if date_tos_formatted == "N/A" or not date_tos:
				continue  # Skip records without date_tos when filter is set
			filter_date = getdate(date_tos_filter)
			tos_date_check = getdate(date_tos)
			if filter_date != tos_date_check:
				continue  # Skip this record if date doesn't match
		
		result.append({
			"service_number": service_number,
			"personnel_name": personnel.personnel_name or "N/A",
			"current_unit": personnel.current_unit or "N/A",
			"current_rank": personnel.current_rank or "N/A",
			"category": personnel.category or "N/A",
			"date_tos": date_tos_formatted,
			"period_spent": period_spent,
			"period_years": period_years  # For color coding
		})
	
	# Recalculate total count if date filter was applied (since we filtered in Python)
	if date_tos_filter:
		total_count = len(result) if page == 1 else total_count  # Approximate for other pages
	
	return {
		"data": result,
		"total_count": total_count,
		"page": page,
		"page_length": page_length,
		"total_pages": (total_count + page_length - 1) // page_length if total_count > 0 else 1
	}

@frappe.whitelist()
def export_personnel_list_to_excel(current_unit=None, rank=None, date_tos=None, personnel_name=None, category=None):
	"""Export all filtered personnel list to Excel"""
	from frappe.utils import getdate, date_diff, today
	from frappe.utils.xlsxutils import make_xlsx
	from frappe.desk.utils import provide_binary_file
	
	# Build filters (same as get_personnel_list)
	filters = {}
	if current_unit:
		filters["current_unit"] = current_unit
	if rank:
		filters["current_rank"] = rank
	if personnel_name:
		filters["personnel_name"] = ["like", f"%{personnel_name}%"]
	if category:
		filters["category"] = category
	
	# Parse date_tos filter
	date_tos_filter = None
	if date_tos:
		try:
			date_tos_filter = getdate(date_tos)
		except:
			date_tos_filter = None
	
	# Get all personnel records with filters (no pagination)
	personnel_list = frappe.db.get_all(
		"Personnel",
		filters=filters,
		fields=[
			"service_number",
			"personnel_name",
			"current_unit",
			"current_rank",
			"category"
		],
		order_by="personnel_name"
	)
	
	# Prepare data for export
	data = []
	headers = ["Service Number", "Personnel Name", "Category", "Current Unit", "Current Rank", "Date TOS", "Period Spent"]
	data.append(headers)
	
	for personnel in personnel_list:
		service_number = personnel.service_number
		
		# Get the latest Date TOS from Unit TOS Record (from submitted Part 2 Orders only)
		latest_tos_sql = frappe.db.sql("""
			SELECT utr.date_tos, utr.to_unit
			FROM `tabUnit TOS Record` utr
			INNER JOIN `tabPart 2 Order` p2o ON utr.parent = p2o.name
			WHERE utr.service_number = %s
				AND utr.parenttype = 'Part 2 Order'
				AND p2o.docstatus = 1
			ORDER BY utr.date_tos DESC
			LIMIT 1
		""", (service_number,), as_dict=True)
		
		latest_tos = latest_tos_sql if latest_tos_sql else None
		
		date_tos = None
		period_spent = "N/A"
		
		if latest_tos and latest_tos[0].get("date_tos"):
			date_tos = latest_tos[0].get("date_tos")
			date_tos_formatted = frappe.format_value(date_tos, {"fieldtype": "Date"})
			
			# Calculate period spent
			today_date = getdate(today())
			tos_date = getdate(date_tos)
			days_diff = date_diff(today_date, tos_date)
			
			# Convert to years, months, days
			years = days_diff // 365
			remaining_days = days_diff % 365
			months = remaining_days // 30
			days = remaining_days % 30
			
			# Format period string
			period_parts = []
			if years > 0:
				period_parts.append(f"{years} year{'s' if years != 1 else ''}")
			if months > 0:
				period_parts.append(f"{months} month{'s' if months != 1 else ''}")
			if days > 0 or len(period_parts) == 0:
				period_parts.append(f"{days} day{'s' if days != 1 else ''}")
			
			period_spent = ", ".join(period_parts)
		else:
			date_tos_formatted = "N/A"
			period_spent = "N/A"
		
		# Filter by date_tos if provided
		if date_tos_filter:
			if date_tos_formatted == "N/A" or not date_tos:
				continue  # Skip records without date_tos when filter is set
			filter_date = getdate(date_tos_filter)
			tos_date_check = getdate(date_tos)
			if filter_date != tos_date_check:
				continue  # Skip this record if date doesn't match
		
		# Add row to data
		data.append([
			personnel.service_number or "",
			personnel.personnel_name or "N/A",
			personnel.category or "N/A",
			personnel.current_unit or "N/A",
			personnel.current_rank or "N/A",
			date_tos_formatted,
			period_spent
		])
	
	# Create Excel file
	xlsx_file = make_xlsx(data, "Personnel List")
	file_content = xlsx_file.getvalue()
	
	# Generate filename with timestamp
	from frappe.utils import now_datetime
	timestamp = now_datetime().strftime("%Y%m%d_%H%M%S")
	file_name = f"Personnel_List_Export_{timestamp}.xlsx"
	
	# Use provide_binary_file to download directly
	provide_binary_file(file_name, "xlsx", file_content)
