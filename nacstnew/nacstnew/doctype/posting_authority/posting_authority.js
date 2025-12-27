// Copyright (c) 2025, !! and contributors
// For license information, please see license.txt

frappe.ui.form.on("Posting Authority", {
	refresh(frm) {

	},
	reference: function(frm) {
		update_posting_authority(frm);
	},
	date: function(frm) {
		update_posting_authority(frm);
	}
});

function update_posting_authority(frm) {
	// Get reference and date values
	let reference = frm.doc.reference;
	let date = frm.doc.date;
	
	// Only update if both fields are provided
	if (reference && date) {
		// Format date as "5 Mar 25" (D MMM YY format)
		let formatted_date = moment(date).format('D MMM YY');
		
		// Construct posting authority: "Reference Dated Date"
		let posting_authority = reference.trim() + " Dated " + formatted_date;
		
		// Update the field
		frm.set_value('posting_authority', posting_authority);
	} else if (!reference && !date) {
		// If both are cleared, clear posting_authority
		frm.set_value('posting_authority', '');
	}
}

// Prevent duplicate service numbers in Posting Authority Details
frappe.ui.form.on("Posting Authority Details", {
	service_number: function(frm, cdt, cdn) {
		check_duplicate_service_number(frm, cdt, cdn);
	},
	before_posting_authority_details_remove: function(frm, doctype, name) {
		// Prevent deletion if row is used in Unit TOS Record
		console.log("before_posting_authority_details_remove", doctype, name);
		
		// prevent_deletion_if_used(frm, doctype, name);
		
		return prevent_deletion_if_used(frm, doctype, name);
		// frappe.throw("Cannot delete row - used in Unit TOS Record");
	}
});

function check_duplicate_service_number(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	
	if (!row.service_number) {
		return;
	}
	
	// Check if this service number already exists in other rows
	let duplicate_found = false;
	if (frm.doc.posting_authority_details) {
		frm.doc.posting_authority_details.forEach(function(record) {
			// Skip the current row being edited
			if (record.name !== row.name && record.service_number === row.service_number) {
				duplicate_found = true;
			}
		});
	}
	
	if (duplicate_found) {
		frappe.msgprint({
			title: __('Duplicate Service Number'),
			message: __('Service Number "{0}" already exists in another row. Please use a different service number.', [row.service_number]),
			indicator: 'red'
		});
		// Clear the service number field
		frappe.model.set_value(cdt, cdn, "service_number", "");
		frappe.model.set_value(cdt, cdn, "personnel_name", "");
	}
}

function prevent_deletion_if_used(frm, doctype, name) {
	// Get the row being deleted
	let row = frappe.get_doc(doctype, name);
	
	
	
	if (!frm.doc.name || !row.service_number) {
		// Allow deletion if required fields are missing
		return Promise.resolve();
	}
	
	// Check if this row is used in Unit TOS Record
	return frappe.call({
		method: "nacstnew.nacstnew.doctype.posting_authority.posting_authority.check_posting_authority_details_used_in_unit_tos",
		args: {
			posting_authority:   frm.doc.name,
			service_number: row.service_number,
			personnel_name: row.personnel_name,
			from_unit: row.from_unit,
			to_unit: row.to_unit
		}
	}).then(function(r) {
		

		if (r.message && r.message.used) {
			let error_message = __('Cannot delete Posting Authority Details row for Service Number "<b>{0}</b>".<br><br>', [row.service_number]);
			
			if (r.message.part_2_order) {
				// Create clickable link for Part 2 Order that opens in new tab
				let part_2_order_url = window.location.origin + '/app/part-2-order/' + encodeURIComponent(r.message.part_2_order);
				let part_2_order_link = `<a href="${part_2_order_url}" target="_blank" onclick="window.open('${part_2_order_url}', '_blank'); return false;" style="color: #007bff; text-decoration: underline; font-weight: bold; cursor: pointer;">${r.message.part_2_order}</a>`;
				
				error_message += __('This record is used in Part 2 Order "<b>{0}</b>" in the Unit TOS Record child table.<br><br>', [part_2_order_link]);
				error_message += __('Deleting this record would create an orphaned record in the Part 2 Order.<br><br>');
				error_message += __('<b>To delete this record:</b><br>');
				error_message += __('1. Open Part 2 Order {0}<br>', [part_2_order_link]);
				error_message += __('2. Remove the corresponding row from the Unit TOS Record child table<br>');
				error_message += __('3. Save the Part 2 Order<br>');
				error_message += __('4. Then you can delete this Posting Authority Details row');
			} else {
				error_message += __('This record is used in a Unit TOS Record child table.<br><br>');
				error_message += __('Deleting this record would create an orphaned record.<br><br>');
				error_message += __('<b>To delete this record:</b><br>');
				error_message += __('1. Remove the corresponding row from the Unit TOS Record in the Part 2 Order<br>');
				error_message += __('2. Save the Part 2 Order<br>');
				error_message += __('3. Then you can delete this Posting Authority Details row');
			}
			
			frappe.msgprint({
				title: __('Cannot Delete - Used in Unit TOS Record'),
				message: error_message,
				indicator: 'red'
			});
			
			// Prevent deletion by rejecting the promise
			return Promise.reject(new Error("Cannot delete row - used in Unit TOS Record"));
		}
	});
}