// Add "View Changes" button to all doctype forms
frappe.ui.form.on('*', {
	onload: function(frm) {
		add_view_changes_button(frm);
	},
	refresh: function(frm) {
		add_view_changes_button(frm);
	}
});

function add_view_changes_button(frm) {
	// Check if button already exists
	if (frm.custom_buttons && frm.custom_buttons['View Changes']) {
		return;
	}
	
	// Add button if document is not new and has a name
	// We'll check for versions when the button is clicked
	if (frm && !frm.is_new() && frm.docname) {
		// Add button to form toolbar
		frm.add_custom_button(__('View Changes'), function() {
			show_document_changes(frm.doctype, frm.docname);
		}, __('Tools'));
	}
}

function show_document_changes(doctype, docname) {
	// Fetch versions for this document
	frappe.call({
		method: 'nacstnew.nacstnew.page.audit_log.audit_log.get_document_changes',
		args: {
			doctype: doctype,
			docname: docname
		},
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				display_changes_dialog(doctype, docname, r.message);
			} else {
				frappe.msgprint({
					title: __('No Changes Found'),
					message: __('No changes have been tracked for this document.'),
					indicator: 'blue'
				});
			}
		},
		error: function(r) {
			frappe.msgprint({
				title: __('Error'),
				message: __('Error loading changes: {0}', [r.message || 'Unknown error']),
				indicator: 'red'
			});
		}
	});
}

function display_changes_dialog(doctype, docname, versions) {
	let dialog = new frappe.ui.Dialog({
		title: __('Document Changes - {0}: {1}', [doctype, docname]),
		fields: [
			{
				fieldtype: 'HTML',
				options: '<div id="changes-container" style="max-height: 600px; overflow-y: auto;"></div>'
			}
		],
		size: 'extra-large'
	});
	
	let html = '<div style="padding: 10px;">';
	
	versions.forEach(function(version, index) {
		let date = version.communication_date ? 
			frappe.datetime.str_to_user(version.communication_date, true) : 
			__('Unknown date');
		
		let user = version.full_name || version.user || __('Unknown user');
		
		html += `
			<div style="
				border: 1px solid #e0e0e0; 
				border-radius: 4px; 
				padding: 15px; 
				margin-bottom: 15px;
				background: #fff;
			">
				<div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">
					<div>
						<strong>${frappe.utils.escape_html(version.subject || __('Document changed'))}</strong>
					</div>
					<div style="font-size: 12px; color: #666;">
						${date} by ${frappe.utils.escape_html(user)}
					</div>
				</div>
				<div style="color: #555; font-size: 13px;">
					${format_changes_content(version.content)}
				</div>
			</div>
		`;
	});
	
	html += '</div>';
	
	dialog.$body.find('#changes-container').html(html);
	dialog.show();
}

function format_changes_content(content) {
	if (!content) return '<span class="text-muted">No details available</span>';
	
	// Extract text if it's HTML
	let temp_div = $('<div>').html(content);
	let text_content = temp_div.text();
	
	// If content has multiple lines, format as list
	if (text_content.includes('\n')) {
		let lines = text_content.split('\n').filter(function(line) {
			return line.trim();
		});
		
		if (lines.length > 1) {
			let html = '<ul style="margin: 0; padding-left: 20px;">';
			lines.forEach(function(line) {
				line = frappe.utils.escape_html(line);
				line = line.replace(/→/g, '<span style="color: #007bff; font-weight: bold; margin: 0 5px;">→</span>');
				html += '<li style="margin-bottom: 5px;">' + line + '</li>';
			});
			html += '</ul>';
			return html;
		}
	}
	
	// Single line or no newlines
	let escaped = frappe.utils.escape_html(text_content);
	escaped = escaped.replace(/→/g, '<span style="color: #007bff; font-weight: bold; margin: 0 5px;">→</span>');
	return escaped;
}

