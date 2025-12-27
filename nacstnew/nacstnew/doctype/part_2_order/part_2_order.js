// Copyright (c) 2025, !! and contributors
// For license information, please see license.txt

frappe.ui.form.on("Part 2 Order", {
	refresh(frm) {
		// Add custom CSS for error row highlighting
		if (!document.getElementById('part-2-order-error-style')) {
			let style = document.createElement('style');
			style.id = 'part-2-order-error-style';
			style.textContent = `
				.data-row.error-row,
				.data-row.error-row *,
				.data-row.error-row .form-control,
				.data-row.error-row .static-area,
				.data-row.error-row .link-btn,
				.data-row.error-row .control-value,
				.data-row.error-row input,
				.data-row.error-row select,
				.data-row.error-row span,
				.data-row.error-row div {
					font-weight: bold !important;
					color: #d32f2f !important;
				}
				.field-error-highlight {
					background-color: #ffebee !important;
					border: 2px solid #d32f2f !important;
					color: #d32f2f !important;
					font-weight: bold !important;
				}
				.field-error-highlight input,
				.field-error-highlight .control-value,
				.field-error-highlight .link-btn,
				.field-error-highlight .static-area {
					color: #d32f2f !important;
					font-weight: bold !important;
				}
			`;
			document.head.appendChild(style);
		}
		
		// Validate all Unit TOS Record rows on refresh
		if (frm.doc.unit_tos_record && frm.doc.unit_tos_record.length > 0) {
			validate_all_rows(frm);
		}
	},
	reference: function(frm) {
		update_part_2_order_reference(frm);
	},
	date: function(frm) {
		update_part_2_order_reference(frm);
	}
});

function update_part_2_order_reference(frm) {
	// Get reference and date values
	let reference = frm.doc.reference;
	let date = frm.doc.date;
	
	// Only update if both fields are provided
	if (reference && date) {
		// Format date as "5 Mar 25" (D MMM YY format)
		let formatted_date = moment(date).format('D MMM YY');
		
		// Construct part 2 order reference: "Reference Dated Date"
		// Handle case where reference might be a date string - convert to string if needed
		let reference_str = typeof reference === 'string' ? reference : (reference ? String(reference) : '');
		let part_2_order_reference = reference_str.trim() + " Dated " + formatted_date;
		
		// Update the field
		frm.set_value('part_2_order_reference', part_2_order_reference);
	} else if (!reference && !date) {
		// If both are cleared, clear part_2_order_reference
		frm.set_value('part_2_order_reference', '');
	}
}

// Auto-fill From Unit and To Unit from Posting Authority Details
frappe.ui.form.on("Unit TOS Record", {
	posting_authority: function(frm, cdt, cdn) {
		// Remove highlight when posting authority changes
		remove_highlight(frm, cdt, cdn);
		// Check for duplicate across Part 2 Orders
		check_duplicate_across_part2_orders(frm, cdt, cdn);
		auto_fill_units(frm, cdt, cdn);
	},
	service_number: function(frm, cdt, cdn) {
		// Remove highlight when service number changes
		remove_highlight(frm, cdt, cdn);
		// Check for duplicate service numbers within this document first
		if (!check_duplicate_service_number(frm, cdt, cdn)) {
			// Check for duplicate across Part 2 Orders
			check_duplicate_across_part2_orders(frm, cdt, cdn);
			// Only auto-fill units if no duplicate found
			auto_fill_units(frm, cdt, cdn);
		}
	}
});

function check_duplicate_service_number(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	
	if (!row.service_number) {
		return false;
	}
	
	// Check if this service number already exists in other rows
	let duplicate_found = false;
	if (frm.doc.unit_tos_record) {
		frm.doc.unit_tos_record.forEach(function(record) {
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
		return true; // Return true to indicate duplicate was found
	}
	
	return false; // No duplicate found
}

function check_duplicate_across_part2_orders(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	
	// Only check if both posting_authority and service_number are provided
	if (!row.posting_authority || !row.service_number) {
		return;
	}
	
	// Call server method to check for duplicates across Part 2 Orders
	frappe.call({
		method: "nacstnew.nacstnew.doctype.part_2_order.part_2_order.check_duplicate_posting_authority_service_number",
		args: {
			posting_authority: row.posting_authority,
			service_number: row.service_number,
			current_part_2_order: frm.doc.name || null,
			current_row_name: row.name || null
		},
		callback: function(r) {
			if (r.message && r.message.duplicate_found) {
				// Highlight the row
				highlight_row(frm, cdt, cdn);
				
				// Show warning message
				let error_message = __('<p><b>Duplicate Entry Detected!</b></p>');
				error_message += __('<p>The combination of Posting Authority "<b>{0}</b>" and Service Number "<b>{1}</b>" already exists in another Part 2 Order.</p>', [
					row.posting_authority,
					row.service_number
				]);
				
				if (r.message.existing_part_2_orders && r.message.existing_part_2_orders.length > 0) {
					error_message += __('<p><b>Found in the following Part 2 Order(s):</b></p><ul>');
					r.message.existing_part_2_orders.forEach(function(order_name) {
						let part_2_order_url = window.location.origin + '/app/part-2-order/' + encodeURIComponent(order_name);
						let part_2_order_link = `<a href="${part_2_order_url}" target="_blank" onclick="window.open('${part_2_order_url}', '_blank'); return false;" style="color: #007bff; text-decoration: underline; font-weight: bold; cursor: pointer;">${order_name}</a>`;
						error_message += __('<li>{0}</li>', [part_2_order_link]);
					});
					error_message += '</ul>';
				}
				
				error_message += __('<p><b>To resolve:</b></p>');
				error_message += __('<ul><li>Remove this row if it was entered by mistake</li>');
				error_message += __('<li>Or verify that this is a different entry and update the Posting Authority or Service Number</li></ul>');
				
				frappe.msgprint({
					title: __('Duplicate Entry Warning'),
					message: error_message,
					indicator: 'orange'
				});
			} else {
				// No duplicate found, remove highlight if it was set
				remove_highlight(frm, cdt, cdn);
			}
		}
	});
}

function auto_fill_units(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	
	// Check if both posting_authority and service_number are filled
	if (row.posting_authority && row.service_number) {
		// Load the Posting Authority document which includes its child table
		frappe.call({
			method: "frappe.client.get",
			args: {
				doctype: "Posting Authority",
				name: row.posting_authority
			},
			callback: function(r) {
				if (r.message && r.message.posting_authority_details) {
					// Find the matching record in the child table
					let matching_record = r.message.posting_authority_details.find(
						function(detail) {
							return detail.service_number === row.service_number;
						}
					);
					
					if (!matching_record) {
						// Service number not found in Posting Authority Details
						// Highlight the affected row
						highlight_row(frm, cdt, cdn);
						
						frappe.msgprint({
							title: __('Data Integrity Warning'),
							message: __('<p>Service Number <b>"{0}"</b> does not exist in Posting Authority <b>"{1}"</b>.</p><p>This validation ensures data integrity by verifying that the service number exists in the corresponding Posting Authority before proceeding. Please verify the service number or add it to the Posting Authority Details.</p>', [
								row.service_number,
								row.posting_authority
							]),
							indicator: 'orange'
						});
						
						// Clear the auto-filled fields if they were set
						frappe.model.set_value(cdt, cdn, "from_unit", "");
						frappe.model.set_value(cdt, cdn, "to_unit", "");
						return;
					}
					
					if (matching_record.from_unit && matching_record.to_unit) {
						// Auto-fill the from_unit and to_unit fields
						frappe.model.set_value(cdt, cdn, "from_unit", matching_record.from_unit);
						frappe.model.set_value(cdt, cdn, "to_unit", matching_record.to_unit);
						// Remove highlight if it was set
						remove_highlight(frm, cdt, cdn);
					} else {
						// Service number exists but units are not set
						// Highlight the affected row
						highlight_row(frm, cdt, cdn);
						
						frappe.msgprint({
							title: __('Data Integrity Warning'),
							message: __('<p>Service Number <b>"{0}"</b> exists in Posting Authority <b>"{1}"</b> but From Unit or To Unit is not set.</p><p>This validation ensures data integrity. Please update the Posting Authority Details with the required unit information.</p>', [
								row.service_number,
								row.posting_authority
							]),
							indicator: 'orange'
						});
					}
				} else {
					// No posting authority details found
					// Highlight the affected row
					highlight_row(frm, cdt, cdn);
					
					frappe.msgprint({
						title: __('Data Integrity Warning'),
						message: __('<p>No Posting Authority Details found for Posting Authority <b>"{0}"</b>.</p><p>This validation ensures data integrity. Please add Posting Authority Details to the selected Posting Authority before proceeding.</p>', [
							row.posting_authority
						]),
						indicator: 'orange'
					});
				}
			}
		});
	}
}

function highlight_row(frm, cdt, cdn) {
	// Get the grid field
	let grid_field = frm.get_field("unit_tos_record");
	if (grid_field && grid_field.grid) {
		// Find the row in the grid
		let grid_row = grid_field.grid.grid_rows_by_docname[cdn];
		if (grid_row) {
			// Add highlight class and error-row class for styling
			let $data_row = grid_row.wrapper.find(".data-row");
			$data_row.addClass("highlight error-row");
			
			// Scroll to the row if it's not visible
			setTimeout(() => {
				if ($data_row.length) {
					$data_row[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				}
			}, 100);
		}
	}
}

function remove_highlight(frm, cdt, cdn) {
	// Get the grid field
	let grid_field = frm.get_field("unit_tos_record");
	if (grid_field && grid_field.grid) {
		// Find the row in the grid
		let grid_row = grid_field.grid.grid_rows_by_docname[cdn];
		if (grid_row) {
			// Remove highlight and error-row classes
			let $data_row = grid_row.wrapper.find(".data-row");
			$data_row.removeClass("highlight error-row");
			// Remove field-specific highlights
			remove_field_highlights(frm, cdt, cdn);
		}
	}
}

function validate_all_rows(frm) {
	// Clear all existing highlights first
	clear_all_highlights(frm);
	
	if (!frm.doc.unit_tos_record || frm.doc.unit_tos_record.length === 0) {
		return;
	}
	
	// Prepare data for validation
	let rows_to_validate = frm.doc.unit_tos_record.map(function(row) {
		return {
			name: row.name,
			idx: row.idx,
			posting_authority: row.posting_authority,
			service_number: row.service_number,
			personnel_name: row.personnel_name,
			from_unit: row.from_unit,
			to_unit: row.to_unit
		};
	});
	
	// Call server method to validate
	frappe.call({
		method: "nacstnew.nacstnew.doctype.part_2_order.part_2_order.validate_unit_tos_records",
		args: {
			unit_tos_records: rows_to_validate
		},
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				// Highlight mismatched rows and fields
				r.message.forEach(function(validation_result) {
					highlight_mismatched_fields(frm, validation_result);
				});
				
				// Show notification to user
				let error_count = r.message.length;
				let error_message = error_count === 1 
					? __('<p><b>1 row</b> has data integrity issues.</p>')
					: __('<p><b>{0} rows</b> have data integrity issues.</p>', [error_count]);
				
				error_message += __('<p>Please review the highlighted rows and ensure data integrity by:</p>');
				error_message += __('<ul><li>Removing affected rows with incorrect values</li>');
				error_message += __('<li>Entering the correct values from Posting Authority Details</li></ul>');
				
				frappe.msgprint({
					title: __('Data Integrity Validation'),
					message: error_message,
					indicator: 'red'
				});
			}
		}
	});
}

function highlight_mismatched_fields(frm, validation_result) {
	let cdn = validation_result.row_name;
	let mismatches = validation_result.mismatches;
	
	// Get the grid field
	let grid_field = frm.get_field("unit_tos_record");
	if (!grid_field || !grid_field.grid) {
		return;
	}
	
	// Find the row in the grid
	let grid_row = grid_field.grid.grid_rows_by_docname[cdn];
	if (!grid_row) {
		return;
	}
	
	// Highlight the entire row
	let $data_row = grid_row.wrapper.find(".data-row");
	$data_row.addClass("error-row");
	
	// Highlight specific fields that don't match
	let fields_to_check = ["service_number", "personnel_name", "from_unit", "to_unit"];
	
	fields_to_check.forEach(function(fieldname) {
		if (mismatches[fieldname]) {
			// Find the field control in the grid row
			let field_control = grid_row.wrapper.find(`[data-fieldname="${fieldname}"]`);
			if (field_control && field_control.length) {
				// Add error highlight class
				field_control.addClass("field-error-highlight");
				
				// Also highlight the input/control inside
				field_control.find("input, .control-value, .link-btn, .static-area, .form-control")
					.addClass("field-error-highlight");
			}
		}
	});
	
	// Scroll to the first error row
	setTimeout(() => {
		if ($data_row.length) {
			$data_row[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, 100);
}

function remove_field_highlights(frm, cdt, cdn) {
	let grid_field = frm.get_field("unit_tos_record");
	if (grid_field && grid_field.grid) {
		let grid_row = grid_field.grid.grid_rows_by_docname[cdn];
		if (grid_row) {
			// Remove field-specific highlights
			grid_row.wrapper.find(".field-error-highlight").removeClass("field-error-highlight");
		}
	}
}

function clear_all_highlights(frm) {
	let grid_field = frm.get_field("unit_tos_record");
	if (grid_field && grid_field.grid) {
		// Remove all error highlights from all rows
		grid_field.grid.wrapper.find(".error-row").removeClass("error-row");
		grid_field.grid.wrapper.find(".field-error-highlight").removeClass("field-error-highlight");
	}
}
