// Copyright (c) 2025, !! and contributors
// For license information, please see license.txt

frappe.ui.form.on("Personnel", {
	refresh(frm) {
		// Generate posting history HTML table on document load/refresh
		if (frm.doc.service_number) {
			load_posting_history(frm);
			load_courses_attended(frm);
			load_promotion_history(frm);
			load_personnel_brief(frm);
		} else {
			frm.set_value("personnel_posting_history_html", "");
			frm.refresh_field("personnel_posting_history_html");
			frm.set_value("courses_attended", "");
			frm.refresh_field("courses_attended");
			frm.set_value("personnel_promotion_history", "");
			frm.refresh_field("personnel_promotion_history");
			frm.set_value("personnel_brief", "");
			frm.refresh_field("personnel_brief");
		}
	},
	service_number: function(frm) {
		// Regenerate posting history, courses attended, promotion history, and brief when service number changes
		if (frm.doc.service_number) {
			load_posting_history(frm);
			load_courses_attended(frm);
			load_promotion_history(frm);
			load_personnel_brief(frm);
		} else {
			frm.set_value("personnel_posting_history_html", "");
			frm.refresh_field("personnel_posting_history_html");
			frm.set_value("courses_attended", "");
			frm.refresh_field("courses_attended");
			frm.set_value("personnel_promotion_history", "");
			frm.refresh_field("personnel_promotion_history");
			frm.set_value("personnel_brief", "");
			frm.refresh_field("personnel_brief");
		}
	}
});

function load_posting_history(frm) {
	// Call server method to generate posting history HTML
	frappe.call({
		method: "nacstnew.nacstnew.doctype.personnel.personnel.get_posting_history_html",
		args: {
			service_number: frm.doc.service_number
		},
		callback: function(r) {
			if (r.message) {
				console.log("Posting history HTML received:", r.message);
				// Set the value using the field control directly (HTML fields use df.options)
				let html_field = frm.get_field("personnel_posting_history_html");
				if (html_field) {
					// Update the df.options property and set the value
					html_field.df.options = r.message;
					html_field.set_value(r.message);
					// Ensure the wrapper is visible
					if (html_field.$wrapper) {
						html_field.$wrapper.show();
						console.log("HTML field wrapper found and shown");
					} else if (html_field.wrapper) {
						$(html_field.wrapper).show();
						console.log("HTML field wrapper (non-jQuery) found and shown");
					}
					console.log("HTML field updated via field control, wrapper:", html_field.$wrapper || html_field.wrapper);
				} else {
					console.log("HTML field control not found, using fallback method");
					// Fallback: set df property and refresh
					frm.set_df_property("personnel_posting_history_html", "options", r.message);
					frm.refresh_field("personnel_posting_history_html");
					// Try direct DOM manipulation as last resort
					setTimeout(() => {
						// Try multiple selectors to find the HTML field wrapper
						let field_wrapper = $(`[data-fieldname="personnel_posting_history_html"]`);
						if (field_wrapper && field_wrapper.length) {
							// HTML fields typically have the content in the wrapper itself or in a child div
							field_wrapper.html(r.message).show();
							console.log("Updated HTML field via direct DOM manipulation");
						} else {
							console.log("Could not find HTML field wrapper in DOM");
						}
					}, 200);
				}
			} else {
				let html_field = frm.get_field("personnel_posting_history_html");
				if (html_field) {
					html_field.df.options = "<p>No posting history found.</p>";
					html_field.set_value("<p>No posting history found.</p>");
				} else {
					frm.set_df_property("personnel_posting_history_html", "options", "<p>No posting history found.</p>");
					frm.refresh_field("personnel_posting_history_html");
				}
			}
		},
		error: function(r) {
			console.error("Error loading posting history:", r);
			let html_field = frm.get_field("personnel_posting_history_html");
			if (html_field) {
				html_field.df.options = "<p>Error loading posting history.</p>";
				html_field.set_value("<p>Error loading posting history.</p>");
			} else {
				frm.set_df_property("personnel_posting_history_html", "options", "<p>Error loading posting history.</p>");
				frm.refresh_field("personnel_posting_history_html");
			}
		}
	});
}

function load_courses_attended(frm) {
	// Call server method to generate courses attended HTML
	frappe.call({
		method: "nacstnew.nacstnew.doctype.personnel.personnel.get_courses_attended_html",
		args: {
			service_number: frm.doc.service_number
		},
		callback: function(r) {
			if (r.message) {
				console.log("Courses attended HTML received:", r.message);
				// Set the value using the field control directly (HTML fields use df.options)
				let html_field = frm.get_field("courses_attended");
				if (html_field) {
					// Update the df.options property and set the value
					html_field.df.options = r.message;
					html_field.set_value(r.message);
					// Ensure the wrapper is visible
					if (html_field.$wrapper) {
						html_field.$wrapper.show();
						console.log("HTML field wrapper found and shown");
					} else if (html_field.wrapper) {
						$(html_field.wrapper).show();
						console.log("HTML field wrapper (non-jQuery) found and shown");
					}
					console.log("HTML field updated via field control, wrapper:", html_field.$wrapper || html_field.wrapper);
				} else {
					console.log("HTML field control not found, using fallback method");
					// Fallback: set df property and refresh
					frm.set_df_property("courses_attended", "options", r.message);
					frm.refresh_field("courses_attended");
					// Try direct DOM manipulation as last resort
					setTimeout(() => {
						// Try multiple selectors to find the HTML field wrapper
						let field_wrapper = $(`[data-fieldname="courses_attended"]`);
						if (field_wrapper && field_wrapper.length) {
							// HTML fields typically have the content in the wrapper itself or in a child div
							field_wrapper.html(r.message).show();
							console.log("Updated HTML field via direct DOM manipulation");
						} else {
							console.log("Could not find HTML field wrapper in DOM");
						}
					}, 200);
				}
			} else {
				let html_field = frm.get_field("courses_attended");
				if (html_field) {
					html_field.df.options = "<p>No courses attended found.</p>";
					html_field.set_value("<p>No courses attended found.</p>");
				} else {
					frm.set_df_property("courses_attended", "options", "<p>No courses attended found.</p>");
					frm.refresh_field("courses_attended");
				}
			}
		},
		error: function(r) {
			console.error("Error loading courses attended:", r);
			let html_field = frm.get_field("courses_attended");
			if (html_field) {
				html_field.df.options = "<p>Error loading courses attended.</p>";
				html_field.set_value("<p>Error loading courses attended.</p>");
			} else {
				frm.set_df_property("courses_attended", "options", "<p>Error loading courses attended.</p>");
				frm.refresh_field("courses_attended");
			}
		}
	});
}

function load_promotion_history(frm) {
	// Call server method to generate promotion history HTML
	frappe.call({
		method: "nacstnew.nacstnew.doctype.personnel.personnel.get_promotion_history_html",
		args: {
			service_number: frm.doc.service_number
		},
		callback: function(r) {
			if (r.message) {
				console.log("Promotion history HTML received:", r.message);
				// Set the value using the field control directly (HTML fields use df.options)
				let html_field = frm.get_field("personnel_promotion_history");
				if (html_field) {
					// Update the df.options property and set the value
					html_field.df.options = r.message;
					html_field.set_value(r.message);
					// Ensure the wrapper is visible
					if (html_field.$wrapper) {
						html_field.$wrapper.show();
						console.log("HTML field wrapper found and shown");
					} else if (html_field.wrapper) {
						$(html_field.wrapper).show();
						console.log("HTML field wrapper (non-jQuery) found and shown");
					}
					console.log("HTML field updated via field control, wrapper:", html_field.$wrapper || html_field.wrapper);
				} else {
					console.log("HTML field control not found, using fallback method");
					// Fallback: set df property and refresh
					frm.set_df_property("personnel_promotion_history", "options", r.message);
					frm.refresh_field("personnel_promotion_history");
					// Try direct DOM manipulation as last resort
					setTimeout(() => {
						// Try multiple selectors to find the HTML field wrapper
						let field_wrapper = $(`[data-fieldname="personnel_promotion_history"]`);
						if (field_wrapper && field_wrapper.length) {
							// HTML fields typically have the content in the wrapper itself or in a child div
							field_wrapper.html(r.message).show();
							console.log("Updated HTML field via direct DOM manipulation");
						} else {
							console.log("Could not find HTML field wrapper in DOM");
						}
					}, 200);
				}
			} else {
				let html_field = frm.get_field("personnel_promotion_history");
				if (html_field) {
					html_field.df.options = "<p>No promotion history found.</p>";
					html_field.set_value("<p>No promotion history found.</p>");
				} else {
					frm.set_df_property("personnel_promotion_history", "options", "<p>No promotion history found.</p>");
					frm.refresh_field("personnel_promotion_history");
				}
			}
		},
		error: function(r) {
			console.error("Error loading promotion history:", r);
			let html_field = frm.get_field("personnel_promotion_history");
			if (html_field) {
				html_field.df.options = "<p>Error loading promotion history.</p>";
				html_field.set_value("<p>Error loading promotion history.</p>");
			} else {
				frm.set_df_property("personnel_promotion_history", "options", "<p>Error loading promotion history.</p>");
				frm.refresh_field("personnel_promotion_history");
			}
		}
	});
}

function load_personnel_brief(frm) {
	// Call server method to generate personnel brief HTML
	frappe.call({
		method: "nacstnew.nacstnew.doctype.personnel.personnel.get_personnel_brief_html",
		args: {
			service_number: frm.doc.service_number
		},
		callback: function(r) {
			if (r.message) {
				console.log("Personnel brief HTML received:", r.message);
				// Set the value using the field control directly (HTML fields use df.options)
				let html_field = frm.get_field("personnel_brief");
				if (html_field) {
					// Update the df.options property and set the value
					html_field.df.options = r.message;
					html_field.set_value(r.message);
					// Ensure the wrapper is visible
					if (html_field.$wrapper) {
						html_field.$wrapper.show();
						console.log("HTML field wrapper found and shown");
					} else if (html_field.wrapper) {
						$(html_field.wrapper).show();
						console.log("HTML field wrapper (non-jQuery) found and shown");
					}
					console.log("HTML field updated via field control, wrapper:", html_field.$wrapper || html_field.wrapper);
				} else {
					console.log("HTML field control not found, using fallback method");
					// Fallback: set df property and refresh
					frm.set_df_property("personnel_brief", "options", r.message);
					frm.refresh_field("personnel_brief");
					// Try direct DOM manipulation as last resort
					setTimeout(() => {
						// Try multiple selectors to find the HTML field wrapper
						let field_wrapper = $(`[data-fieldname="personnel_brief"]`);
						if (field_wrapper && field_wrapper.length) {
							// HTML fields typically have the content in the wrapper itself or in a child div
							field_wrapper.html(r.message).show();
							console.log("Updated HTML field via direct DOM manipulation");
						} else {
							console.log("Could not find HTML field wrapper in DOM");
						}
					}, 200);
				}
			} else {
				let html_field = frm.get_field("personnel_brief");
				if (html_field) {
					html_field.df.options = "<p>No personnel data available.</p>";
					html_field.set_value("<p>No personnel data available.</p>");
				} else {
					frm.set_df_property("personnel_brief", "options", "<p>No personnel data available.</p>");
					frm.refresh_field("personnel_brief");
				}
			}
		},
		error: function(r) {
			console.error("Error loading personnel brief:", r);
			let html_field = frm.get_field("personnel_brief");
			if (html_field) {
				html_field.df.options = "<p>Error loading personnel brief.</p>";
				html_field.set_value("<p>Error loading personnel brief.</p>");
			} else {
				frm.set_df_property("personnel_brief", "options", "<p>Error loading personnel brief.</p>");
				frm.refresh_field("personnel_brief");
			}
		}
	});
}
