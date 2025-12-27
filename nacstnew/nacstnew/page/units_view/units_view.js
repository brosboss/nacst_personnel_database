// Copyright (c) 2025, !! and contributors
// For license information, please see license.txt

frappe.pages['units-view'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Units View',
		single_column: true
	});
	
	// Store page reference for on_page_show
	wrapper.page = page;
	
	// Create the page content
	build_units_view_page(page);
	
	// Also listen to the "show" event directly
	$(wrapper).on('show', function() {
		setTimeout(function() {
			// Check if page content exists
			if ($('#units_container').length === 0 && wrapper.page) {
				// Page content doesn't exist, rebuild it
				build_units_view_page(wrapper.page);
			} else if (wrapper.page && $('#units_container').length > 0) {
				// Reload units data
				load_units_data();
			} else if (wrapper.page) {
				// If page elements don't exist, rebuild the page
				build_units_view_page(wrapper.page);
			}
		}, 100);
	});
}

// Reload content when page is shown
frappe.pages['units-view'].on_page_show = function(wrapper) {
	setTimeout(function() {
		// Check if page content exists
		if ($('#units_container').length === 0 && wrapper.page) {
			// Page content doesn't exist, rebuild it
			build_units_view_page(wrapper.page);
		} else if (wrapper.page && $('#units_container').length > 0) {
			// Reload units data
			load_units_data();
		} else if (wrapper.page) {
			// If page elements don't exist, rebuild the page
			build_units_view_page(wrapper.page);
		}
	}, 100);
}

function build_units_view_page(page) {
	// Check if CSS has already been added to avoid duplicates
	if (!page._cssAdded) {
		// Ensure navigation functions are available
		if (typeof hideDefaultSidebarCSS === 'undefined') {
			console.error('hideDefaultSidebarCSS is not defined. Make sure navigation_sidebar.js is loaded.');
		}
		if (typeof getNavigationSidebarCSS === 'undefined') {
			console.error('getNavigationSidebarCSS is not defined. Make sure navigation_sidebar.js is loaded.');
		}
		if (typeof getNavigationSidebar === 'undefined') {
			console.error('getNavigationSidebar is not defined. Make sure navigation_sidebar.js is loaded.');
		}
		
		// Add CSS - include reusable sidebar CSS and page-specific CSS
		let sidebarCSS = typeof hideDefaultSidebarCSS !== 'undefined' ? hideDefaultSidebarCSS('units-view') : '';
		let navCSS = typeof getNavigationSidebarCSS !== 'undefined' ? getNavigationSidebarCSS('uv') : '';
		
		page.add_inner_message(
			sidebarCSS + 
			navCSS + `
		<style id="uv-page-styles">
			/* Make the page container full width */
			body[data-page-name="units-view"] .page-wrapper {
				width: 100% !important;
			}
			
			body[data-page-name="units-view"] .layout-main-section-wrapper {
				display: flex !important;
				flex-direction: column !important;
			}
			
			.uv-container {
				display: flex;
				gap: 20px;
				width: 100%;
				margin: 0;
				padding: 20px;
				min-height: calc(100vh - 120px);
			}
			
			.uv-main-content {
				flex: 1;
				display: flex;
				flex-direction: row;
				gap: 20px;
				overflow: hidden;
				min-height: 0;
			}
			
			.uv-content-left {
				flex: 1;
				display: flex;
				flex-direction: column;
				overflow: hidden;
				min-height: 0;
			}
			
			.uv-summary-section {
				width: 420px;
				flex-shrink: 0;
				display: flex;
				flex-direction: column;
				max-height: calc(100vh - 160px);
				overflow-y: auto;
				overflow-x: hidden;
			}
			
			.uv-summary-section::-webkit-scrollbar {
				width: 8px;
			}
			
			.uv-summary-section::-webkit-scrollbar-track {
				background: rgba(255,255,255,0.1);
				border-radius: 10px;
			}
			
			.uv-summary-section::-webkit-scrollbar-thumb {
				background: rgba(102, 126, 234, 0.3);
				border-radius: 10px;
			}
			
			.uv-summary-section::-webkit-scrollbar-thumb:hover {
				background: rgba(102, 126, 234, 0.5);
			}
			
			.uv-header {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				padding: 20px;
				border-radius: 12px;
				margin-bottom: 20px;
				box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
			}
			
			.uv-header h1 {
				color: white;
				margin: 0;
				font-size: 24px;
				font-weight: 700;
			}
			
			.uv-header p {
				color: rgba(255, 255, 255, 0.9);
				margin: 5px 0 0 0;
				font-size: 14px;
			}
			
			.uv-filter-section {
				background: #fff;
				padding: 15px 20px;
				border-radius: 8px;
				margin-bottom: 20px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.1);
				display: flex;
				align-items: center;
				gap: 15px;
			}
			
			.uv-filter-label {
				font-weight: 600;
				color: #2c3e50;
				font-size: 14px;
				display: flex;
				align-items: center;
				gap: 8px;
			}
			
			.uv-filter-label i {
				color: #667eea;
			}
			
			.uv-filter-select {
				padding: 8px 15px;
				border: 1px solid #e0e0e0;
				border-radius: 6px;
				font-size: 14px;
				background: white;
				color: #2c3e50;
				cursor: pointer;
				min-width: 200px;
			}
			
			.uv-filter-select:focus {
				outline: none;
				border-color: #667eea;
				box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
			}
			
			#units_container {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
				gap: 20px;
				padding: 0;
			}
			
			.uv-unit-card {
				background: #fff;
				border-radius: 12px;
				box-shadow: 0 4px 20px rgba(0,0,0,0.1);
				overflow: hidden;
				transition: transform 0.2s ease, box-shadow 0.2s ease;
				display: flex;
				flex-direction: column;
				min-height: 200px;
			}
			
			.uv-unit-card:hover {
				transform: translateY(-5px);
				box-shadow: 0 8px 30px rgba(0,0,0,0.15);
			}
			
			.uv-unit-card-header {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				padding: 20px;
				color: white;
			}
			
			.uv-unit-card-header h3 {
				margin: 0 0 5px 0;
				font-size: 18px;
				font-weight: 700;
			}
			
			.uv-unit-card-header .uv-unit-location {
				font-size: 13px;
				opacity: 0.9;
				margin: 0;
			}
			
			.uv-unit-card-header .uv-personnel-count {
				font-size: 12px;
				opacity: 0.8;
				margin-top: 5px;
			}
			
			.uv-unit-card-body {
				padding: 15px 20px;
				flex: 1;
				overflow-y: auto;
				max-height: 400px;
			}
			
			.uv-personnel-list {
				list-style: none;
				padding: 0;
				margin: 0;
			}
			
			.uv-personnel-item {
				padding: 10px 12px;
				border-bottom: 1px solid #f0f0f0;
				display: flex;
				align-items: flex-start;
				gap: 12px;
				transition: background-color 0.2s ease;
			}
			
			.uv-personnel-item:last-child {
				border-bottom: none;
			}
			
			.uv-personnel-item:hover {
				background-color: #f8f9fa;
			}
			
			.uv-personnel-image {
				width: 45px;
				height: 45px;
				border-radius: 50%;
				object-fit: cover;
				border: 2px solid #e0e0e0;
				flex-shrink: 0;
			}
			
			.uv-personnel-placeholder {
				width: 45px;
				height: 45px;
				border-radius: 50%;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				display: flex;
				align-items: center;
				justify-content: center;
				border: 2px solid #e0e0e0;
				flex-shrink: 0;
			}
			
			.uv-personnel-placeholder i {
				color: white;
				font-size: 20px;
			}
			
			.uv-personnel-info {
				flex: 1;
				min-width: 0;
			}
			
			.uv-personnel-name {
				font-weight: 600;
				color: #2c3e50;
				font-size: 13px;
				margin: 0 0 4px 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			
			.uv-personnel-details {
				font-size: 12px;
				color: #6c757d;
				margin: 0;
			}
			
			.uv-personnel-rank {
				font-weight: 600;
				color: #667eea;
			}
			
			.uv-personnel-phone {
				color: #25D366;
				text-decoration: none;
				font-weight: 600;
				cursor: pointer;
				transition: color 0.2s ease;
				display: inline-flex;
				align-items: center;
				gap: 5px;
			}
			
			.uv-personnel-phone:hover {
				color: #128C7E;
				text-decoration: underline;
			}
			
			.uv-personnel-phone i {
				font-size: 14px;
			}
			
			.uv-personnel-period {
				font-size: 11px;
				color: #6c757d;
				margin-top: 3px;
				display: flex;
				align-items: center;
				gap: 5px;
			}
			
			.uv-personnel-period i {
				font-size: 10px;
				color: #667eea;
			}
			
			.uv-personnel-details-link {
				margin-top: 8px;
				display: inline-block;
			}
			
			.uv-personnel-details-link a {
				color: #667eea;
				text-decoration: none;
				font-size: 12px;
				font-weight: 600;
				display: inline-flex;
				align-items: center;
				gap: 5px;
				padding: 5px 10px;
				border-radius: 5px;
				background: rgba(102, 126, 234, 0.1);
				transition: all 0.2s ease;
			}
			
			.uv-personnel-details-link a:hover {
				background: rgba(102, 126, 234, 0.2);
				color: #5568d3;
				text-decoration: none;
			}
			
			.uv-personnel-details-link a i {
				font-size: 11px;
			}
			
			.uv-personnel-category {
				display: inline-block;
				padding: 3px 8px;
				border-radius: 4px;
				font-size: 10px;
				font-weight: 700;
				text-transform: uppercase;
				margin-top: 5px;
			}
			
			.uv-personnel-category.officer {
				background: #e3f2fd;
				color: #1976d2;
			}
			
			.uv-personnel-category.soldier {
				background: #fff3e0;
				color: #e65100;
			}
			
			.uv-pagination {
				display: flex;
				justify-content: center;
				align-items: center;
				gap: 10px;
				margin-top: 30px;
				padding: 20px;
			}
			
			.uv-pagination button {
				padding: 8px 15px;
				border: 1px solid #e0e0e0;
				border-radius: 6px;
				background: white;
				color: #2c3e50;
				cursor: pointer;
				font-size: 14px;
				transition: all 0.2s ease;
			}
			
			.uv-pagination button:hover:not(:disabled) {
				background: #667eea;
				color: white;
				border-color: #667eea;
			}
			
			.uv-pagination button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
			
			.uv-pagination .uv-page-info {
				color: #6c757d;
				font-size: 14px;
				margin: 0 10px;
			}
			
			.uv-summary-card {
				background: #fff;
				border-radius: 12px;
				box-shadow: 0 4px 20px rgba(0,0,0,0.1);
				padding: 15px;
				margin-bottom: 20px;
				overflow-x: hidden;
				width: 100%;
				box-sizing: border-box;
			}
			
			.uv-summary-card h3 {
				margin: 0 0 15px 0;
				font-size: 18px;
				font-weight: 700;
				color: #2c3e50;
				padding-bottom: 10px;
				border-bottom: 2px solid #667eea;
			}
			
			.uv-summary-table {
				width: 100%;
				border-collapse: collapse;
				font-size: 11px;
				table-layout: fixed;
			}
			
			.uv-summary-table thead {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: white;
			}
			
			.uv-summary-table th {
				padding: 10px 6px;
				text-align: left;
				font-weight: 600;
				font-size: 10px;
				text-transform: uppercase;
			}
			
			.uv-summary-table th:first-child {
				width: 50%;
			}
			
			.uv-summary-table th:nth-child(2),
			.uv-summary-table th:nth-child(3) {
				width: 18%;
			}
			
			.uv-summary-table th:last-child {
				width: 14%;
				text-align: right;
			}
			
			.uv-summary-table td {
				padding: 10px 6px;
				border-bottom: 1px solid #f0f0f0;
				vertical-align: middle;
				word-wrap: break-word;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			
			.uv-summary-table td:first-child {
				font-size: 13px;
				font-weight: 700;
				color: #667eea;
				background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
				padding: 12px 6px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			
			.uv-summary-table td:last-child {
				text-align: right;
				font-weight: 600;
				font-size: 13px;
			}
			
			.uv-summary-table th:first-child {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: white;
			}
			
			.uv-summary-table tbody tr:hover {
				background-color: #f8f9fa;
			}
			
			.uv-summary-table tbody tr:hover td:first-child {
				background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
			}
			
			.uv-summary-table tbody tr:last-child td {
				border-bottom: none;
			}
			
			.uv-summary-table tbody tr:last-child td:first-child {
				background: #f8f9fa;
				color: #2c3e50;
			}
			
			.uv-officer-count {
				color: #1976d2;
				font-weight: 700;
				font-size: 12px;
			}
			
			.uv-soldier-count {
				color: #e65100;
				font-weight: 700;
				font-size: 12px;
			}
			
			.uv-empty-state {
				text-align: center;
				padding: 40px 20px;
				color: #6c757d;
			}
			
			.uv-empty-state i {
				font-size: 48px;
				margin-bottom: 15px;
				opacity: 0.5;
			}
			
			.uv-loading {
				text-align: center;
				padding: 40px;
				color: #6c757d;
			}
			
			.uv-loading i {
				font-size: 32px;
				animation: spin 1s linear infinite;
			}
			
			@keyframes spin {
				from { transform: rotate(0deg); }
				to { transform: rotate(360deg); }
			}
			
			/* Scrollbar styling */
			.uv-unit-card-body::-webkit-scrollbar {
				width: 6px;
			}
			
			.uv-unit-card-body::-webkit-scrollbar-track {
				background: rgba(255,255,255,0.1);
				border-radius: 10px;
			}
			
			.uv-unit-card-body::-webkit-scrollbar-thumb {
				background: rgba(102, 126, 234, 0.3);
				border-radius: 10px;
			}
			
			.uv-unit-card-body::-webkit-scrollbar-thumb:hover {
				background: rgba(102, 126, 234, 0.5);
			}
		</style>
		`);
		page._cssAdded = true;
	}
	
	// Create HTML structure
	let sidebarHTML = typeof getNavigationSidebar !== 'undefined' ? getNavigationSidebar('units-view', 'uv') : '<div></div>';
	
	let html = `
		<div class="uv-container">
			${sidebarHTML}
			
			<div class="uv-main-content">
				<div class="uv-content-left">
					<div class="uv-header">
						<h1><i class="fa fa-building"></i> Units View</h1>
						<p>View all units and their assigned personnel</p>
					</div>
					
					<div class="uv-filter-section">
						<label class="uv-filter-label">
							<i class="fa fa-filter"></i> Filter by Category:
						</label>
						<select id="category_filter" class="uv-filter-select">
							<option value="">All Categories</option>
							<option value="Officer">Officer</option>
							<option value="Soldier">Soldier</option>
						</select>
					</div>
					
					<div id="units_container">
						<div class="uv-loading">
							<i class="fa fa-spinner"></i>
							<p>Loading units...</p>
						</div>
					</div>
					
					<div id="pagination_container" style="display: none;">
						<!-- Pagination will be inserted here -->
					</div>
				</div>
				
				<div class="uv-summary-section">
					<div class="uv-summary-card">
						<h3><i class="fa fa-chart-bar"></i> Unit Summary</h3>
						<div id="units_summary_table_container">
							<div class="uv-loading">
								<i class="fa fa-spinner"></i>
								<p>Loading summary...</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;
	
	page.main.html(html);
	
	// Setup filter change handler
	$('#category_filter').on('change', function() {
		currentPage = 1; // Reset to first page when filter changes
		load_units_data();
	});
	
	// Load units data
	currentPage = 1;
	load_units_data();
}

// Global variable for current page
var currentPage = 1;
var pageLength = 10;

function navigateToPersonnelRecord(serviceNumber) {
	// Open personnel record page in a new tab with service number parameter
	// Store service number in sessionStorage for the page to pick up
	sessionStorage.setItem('personnel_record_service_number', serviceNumber);
	// Get the base URL and construct the full route
	var baseUrl = window.location.origin;
	var route = '/app/personnel-record';
	// Open in new tab
	window.open(baseUrl + route, '_blank');
}

function formatPhoneNumber(phone) {
	if (!phone) return '';
	
	// Remove all non-digit characters except +
	let cleaned = phone.replace(/[^\d+]/g, '');
	
	// If it starts with +, keep it, otherwise ensure country code
	if (cleaned.startsWith('+')) {
		return cleaned.substring(1); // Remove + for WhatsApp API
	}
	
	// If it starts with 0, replace with country code (assuming Nigeria +234)
	if (cleaned.startsWith('0')) {
		return '234' + cleaned.substring(1);
	}
	
	// If it doesn't start with country code, assume it's a local number and add country code
	if (cleaned.length === 10 || cleaned.length === 11) {
		return '234' + cleaned;
	}
	
	return cleaned;
}

function load_units_data() {
	let container = $('#units_container');
	let category = $('#category_filter').val() || '';
	
	// Show loading state
	container.html('<div class="uv-loading"><i class="fa fa-spinner"></i><p>Loading units...</p></div>');
	
	frappe.call({
		method: "nacstnew.nacstnew.doctype.personnel.personnel.get_units_with_personnel",
		args: {
			category: category,
			page: currentPage,
			page_length: pageLength
		},
		callback: function(r) {
			if (r.message) {
				if (r.message.units && r.message.units.length > 0) {
					display_units(r.message.units);
					display_pagination(r.message);
					display_units_summary(r.message.units_summary || []);
				} else {
					container.html('<div class="uv-empty-state"><i class="fa fa-building"></i><p>No units found</p></div>');
					$('#pagination_container').hide();
					$('#units_summary_table_container').html('<div class="uv-empty-state" style="padding: 20px;"><i class="fa fa-building"></i><p>No units found</p></div>');
				}
			} else {
				container.html('<div class="uv-empty-state"><i class="fa fa-building"></i><p>No units found</p></div>');
				$('#pagination_container').hide();
				$('#units_summary_table_container').html('<div class="uv-empty-state" style="padding: 20px;"><i class="fa fa-building"></i><p>No units found</p></div>');
			}
		},
		error: function(r) {
			console.error("Error loading units:", r);
			container.html('<div class="uv-empty-state"><i class="fa fa-exclamation-triangle"></i><p>Error loading units. Please try again.</p></div>');
			$('#pagination_container').hide();
		}
	});
}

function display_units(units) {
	let container = $('#units_container');
	
	if (!units || units.length === 0) {
		container.html('<div class="uv-empty-state"><i class="fa fa-building"></i><p>No units found</p></div>');
		return;
	}
	
	let html = '';
	
	units.forEach(function(unit) {
		html += '<div class="uv-unit-card">';
		html += '<div class="uv-unit-card-header">';
		html += '<h3>' + frappe.utils.escape_html(unit.unit_name) + '</h3>';
		if (unit.unit_location) {
			html += '<p class="uv-unit-location"><i class="fa fa-map-marker"></i> ' + frappe.utils.escape_html(unit.unit_location) + '</p>';
		}
		html += '<p class="uv-personnel-count">' + unit.personnel_count + ' Personnel</p>';
		html += '</div>';
		html += '<div class="uv-unit-card-body">';
		
		if (unit.personnel && unit.personnel.length > 0) {
			html += '<ul class="uv-personnel-list">';
			unit.personnel.forEach(function(person) {
				html += '<li class="uv-personnel-item">';
				
				// Personnel image or placeholder
				if (person.personnel_image) {
					html += '<img src="' + frappe.utils.escape_html(person.personnel_image) + '" alt="' + frappe.utils.escape_html(person.personnel_name || '') + '" class="uv-personnel-image" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">';
					html += '<div class="uv-personnel-placeholder" style="display: none;"><i class="fa fa-user"></i></div>';
				} else {
					html += '<div class="uv-personnel-placeholder"><i class="fa fa-user"></i></div>';
				}
				
				html += '<div class="uv-personnel-info">';
				
				// Period in unit (in front of name)
				if (person.period_in_unit && person.period_in_unit !== 'N/A') {
					html += '<div class="uv-personnel-period" style="margin-bottom: 3px;">';
					html += '<i class="fa fa-clock-o"></i>';
					html += '<span>' + frappe.utils.escape_html(person.period_in_unit) + '</span>';
					html += '</div>';
				}
				
				// Personnel name
				html += '<div class="uv-personnel-name">' + frappe.utils.escape_html(person.personnel_name || 'N/A') + '</div>';
				
				// Phone number and service number (phone in front of service number)
				html += '<div class="uv-personnel-details" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">';
				
				// Phone number with WhatsApp link
				if (person.phone_number) {
					let phoneNumber = formatPhoneNumber(person.phone_number);
					if (phoneNumber) {
						let imageUrl = person.personnel_image ? window.location.origin + person.personnel_image : '';
						let personnelName = person.personnel_name || 'there';
						let message = 'Hello ' + personnelName + '!';
						
						// Create WhatsApp URL with message
						let whatsappUrl = 'https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message);
						
						// If image exists, add it to the message
						if (imageUrl) {
							whatsappUrl += encodeURIComponent('\n\nImage link: ') + encodeURIComponent(imageUrl);
						}
						
						html += '<a href="' + whatsappUrl + '" target="_blank" class="uv-personnel-phone" onclick="event.stopPropagation(); return true;" style="font-size: 11px;">';
						html += '<i class="fa fa-whatsapp"></i>';
						html += '<span>' + frappe.utils.escape_html(person.phone_number) + '</span>';
						html += '</a>';
					} else {
						html += '<span style="font-size: 11px; color: #6c757d;"><i class="fa fa-phone"></i> ' + frappe.utils.escape_html(person.phone_number) + '</span>';
					}
				}
				
				// Service number
				html += '<span style="font-size: 11px; color: #6c757d;">';
				html += '<span class="uv-personnel-rank">' + frappe.utils.escape_html(person.current_rank || 'N/A') + '</span>';
				html += ' • ';
				html += '<span>' + frappe.utils.escape_html(person.service_number || '') + '</span>';
				html += '</span>';
				
				html += '</div>';
				
				// Category and See Details button
				html += '<div style="display: flex; align-items: center; gap: 10px; margin-top: 5px; flex-wrap: wrap;">';
				
				// Category badge
				if (person.category) {
					let categoryClass = person.category.toLowerCase();
					html += '<span class="uv-personnel-category ' + categoryClass + '">' + frappe.utils.escape_html(person.category) + '</span>';
				}
				
				// See Details link
				if (person.service_number) {
					let serviceNumber = frappe.utils.escape_html(person.service_number);
					html += '<div class="uv-personnel-details-link" style="margin-top: 0;">';
					html += '<a href="#" onclick="event.stopPropagation(); navigateToPersonnelRecord(\'' + serviceNumber + '\'); return false;" title="Open in new tab">';
					html += '<i class="fa fa-eye"></i>';
					html += '<span>See Details</span>';
					html += '</a>';
					html += '</div>';
				}
				
				html += '</div>';
				
				html += '</div>';
				html += '</li>';
			});
			html += '</ul>';
		} else {
			html += '<div class="uv-empty-state" style="padding: 20px;"><i class="fa fa-users"></i><p>No personnel assigned</p></div>';
		}
		
		html += '</div>';
		html += '</div>';
	});
	
	container.html(html);
}

function display_pagination(paginationData) {
	let container = $('#pagination_container');
	
	if (!paginationData || paginationData.total_pages <= 1) {
		container.hide();
		return;
	}
	
	let html = '<div class="uv-pagination">';
	
	// Previous button
	html += '<button onclick="goToPage(' + (paginationData.page - 1) + ')" ' + (paginationData.page <= 1 ? 'disabled' : '') + '>';
	html += '<i class="fa fa-chevron-left"></i> Previous';
	html += '</button>';
	
	// Page info
	html += '<span class="uv-page-info">';
	html += 'Page ' + paginationData.page + ' of ' + paginationData.total_pages;
	html += ' (' + paginationData.total_units + ' units)';
	html += '</span>';
	
	// Next button
	html += '<button onclick="goToPage(' + (paginationData.page + 1) + ')" ' + (paginationData.page >= paginationData.total_pages ? 'disabled' : '') + '>';
	html += 'Next <i class="fa fa-chevron-right"></i>';
	html += '</button>';
	
	html += '</div>';
	
	container.html(html);
	container.show();
}

function goToPage(page) {
	if (page < 1) return;
	currentPage = page;
	load_units_data();
	// Scroll to top of units container
	$('#units_container')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function display_units_summary(unitsSummary) {
	let container = $('#units_summary_table_container');
	
	if (!unitsSummary || unitsSummary.length === 0) {
		container.html('<div class="uv-empty-state" style="padding: 20px;"><i class="fa fa-building"></i><p>No units found</p></div>');
		return;
	}
	
	// Sort units by name
	unitsSummary.sort(function(a, b) {
		return (a.unit_name || '').localeCompare(b.unit_name || '');
	});
	
	let html = '<table class="uv-summary-table">';
	html += '<thead>';
	html += '<tr>';
	html += '<th>Unit</th>';
	html += '<th>Officers</th>';
	html += '<th>Soldiers</th>';
	html += '<th style="text-align: right;">Total</th>';
	html += '</tr>';
	html += '</thead>';
	html += '<tbody>';
	
	unitsSummary.forEach(function(unit) {
		html += '<tr>';
		html += '<td>' + frappe.utils.escape_html(unit.unit_name || 'N/A') + '</td>';
		html += '<td><span class="uv-officer-count">' + (unit.officers_count || 0) + '</span></td>';
		html += '<td><span class="uv-soldier-count">' + (unit.soldiers_count || 0) + '</span></td>';
		html += '<td style="text-align: right;"><strong style="font-size: 14px;">' + (unit.total_count || 0) + '</strong></td>';
		html += '</tr>';
	});
	
	// Add totals row
	let totalOfficers = unitsSummary.reduce(function(sum, unit) { return sum + (unit.officers_count || 0); }, 0);
	let totalSoldiers = unitsSummary.reduce(function(sum, unit) { return sum + (unit.soldiers_count || 0); }, 0);
	let totalPersonnel = unitsSummary.reduce(function(sum, unit) { return sum + (unit.total_count || 0); }, 0);
	
	html += '<tr style="background: #f8f9fa; font-weight: 700; border-top: 2px solid #667eea;">';
	html += '<td><strong>Total</strong></td>';
	html += '<td><span class="uv-officer-count">' + totalOfficers + '</span></td>';
	html += '<td><span class="uv-soldier-count">' + totalSoldiers + '</span></td>';
	html += '<td style="text-align: right;"><strong>' + totalPersonnel + '</strong></td>';
	html += '</tr>';
	
	html += '</tbody>';
	html += '</table>';
	
	container.html(html);
}

