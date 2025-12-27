// Workspace Style Loader - Conditionally applies custom workspace styling
// based on NACST Settings configuration

(function() {
	'use strict';
	
	// Function to check workspace style setting and apply class
	function applyWorkspaceStyle() {
		// Wait for frappe to be ready
		if (typeof frappe === 'undefined' || !frappe.boot) {
			setTimeout(applyWorkspaceStyle, 100);
			return;
		}
		
		// For singleton doctypes, use get_single_value
		frappe.call({
			method: 'frappe.client.get_single_value',
			args: {
				doctype: 'NACST Settings',
				field: 'workspace_style'
			},
			callback: function(r) {
				if (r && r.message && r.message === 'NACST Custom') {
					// Add class to body to enable custom styling
					document.body.classList.add('nacst-custom-workspace-style');
					console.log('NACST Custom workspace style applied');
				} else {
					// Remove class to use default Frappe styling
					document.body.classList.remove('nacst-custom-workspace-style');
					console.log('Default Frappe workspace style (value:', r ? r.message : 'none', ')');
				}
			},
			error: function(r) {
				// If settings don't exist or error occurs, use default
				console.log('Error loading workspace style, using default:', r);
				document.body.classList.remove('nacst-custom-workspace-style');
			}
		});
	}
	
	// Use frappe.ready to ensure frappe is fully loaded
	frappe.ready(function() {
		applyWorkspaceStyle();
	});
	
	// Also try on app_ready event
	$(document).on('app_ready', function() {
		setTimeout(applyWorkspaceStyle, 200);
	});
	
	// Re-apply style when route changes (for SPA navigation)
	frappe.router.on('change', function() {
		setTimeout(applyWorkspaceStyle, 200);
	});
	
	// Also apply on page show events
	$(document).on('page-change', function() {
		setTimeout(applyWorkspaceStyle, 200);
	});
	
	// Fallback: apply immediately if frappe is already ready
	if (typeof frappe !== 'undefined' && frappe.boot) {
		setTimeout(applyWorkspaceStyle, 500);
	}
})();

