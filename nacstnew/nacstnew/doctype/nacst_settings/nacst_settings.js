// Copyright (c) 2025, !! and contributors
// For license information, please see license.txt

frappe.ui.form.on("NACST Settings", {
	refresh(frm) {
		// This is a singleton document
		if (!frm.doc.name) {
			frm.set_value("workspace_style", "Default");
		}
	},
	workspace_style: function(frm) {
		if (frm.doc.workspace_style === "NACST Custom") {
			frappe.show_alert({
				message: __("Custom workspace style will be applied after page refresh."),
				indicator: "blue"
			}, 5);
		} else {
			frappe.show_alert({
				message: __("Default Frappe style will be used after page refresh."),
				indicator: "blue"
			}, 5);
		}
	},
	after_save: function(frm) {
		// Show message that page refresh is needed
		frappe.show_alert({
			message: __("Workspace style setting saved. Please refresh the page to see the changes."),
			indicator: "green"
		}, 5);
	}
});

