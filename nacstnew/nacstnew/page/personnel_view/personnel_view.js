// frappe.pages['personnel-view'].on_page_load = function(wrapper) {
// 	var page = frappe.ui.make_app_page({
// 		parent: wrapper,
// 		title: 'personnel-view',
// 		single_column: true
// 	});
// }

// Copyright (c) 2025, !! and contributors
// For license information, please see license.txt

frappe.pages['personnel-view'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Personnel Information',
		single_column: true
	});
	
	// Store page reference for on_page_show
	wrapper.page = page;
	
	// Create the page content
	build_personnel_view_page(page);
	
	// Also listen to the "show" event directly
	$(wrapper).on('show', function() {
		setTimeout(function() {
			// Check if page content exists
			if ($('#service_number_select').length === 0 && wrapper.page) {
				// Page content doesn't exist, rebuild it
				build_personnel_view_page(wrapper.page);
			} else if (wrapper.page && $('#service_number_select').length > 0) {
				// Clear existing options except the first one
				$('#service_number_select option:not(:first)').remove();
				// Reload service numbers
				load_service_numbers();
				// Hide personnel details container
				$('#personnel_details_container').hide();
				// Reset select to default
				$('#service_number_select').val('');
			} else if (wrapper.page) {
				// If page elements don't exist, rebuild the page
				build_personnel_view_page(wrapper.page);
			}
		}, 100);
	});
}

// Reload content when page is shown (e.g., when navigating from another page)
frappe.pages['personnel-view'].on_page_show = function(wrapper) {
	// Reload service numbers and reset view when page is shown
	setTimeout(function() {
		// Check if page content exists
		if ($('#service_number_select').length === 0 && wrapper.page) {
			// Page content doesn't exist, rebuild it
			build_personnel_view_page(wrapper.page);
		} else if (wrapper.page && $('#service_number_select').length > 0) {
			// Clear existing options except the first one
			$('#service_number_select option:not(:first)').remove();
			// Reload service numbers
			load_service_numbers();
			// Hide personnel details container
			$('#personnel_details_container').hide();
			// Reset select to default
			$('#service_number_select').val('');
		} else if (wrapper.page) {
			// If page elements don't exist, rebuild the page
			build_personnel_view_page(wrapper.page);
		}
	}, 100);
}

function build_personnel_view_page(page) {
	// Check if CSS has already been added to avoid duplicates
	if (!page._cssAdded) {
		// Add CSS
		page.add_inner_message(
			hideDefaultSidebarCSS('personnel-view') + 
			getNavigationSidebarCSS('pv') + `
		<style id="pv-page-styles">
			.pv-container {
				padding: 20px;
			}
			
			.pv-selector-section {
				background: #fff;
				padding: 20px;
				border-radius: 8px;
				box-shadow: 0 2px 4px rgba(0,0,0,0.1);
				margin-bottom: 30px;
			}
			
			.pv-form-label {
				font-weight: 600;
				margin-bottom: 10px;
				display: block;
				color: #2c3e50;
			}
			
			.pv-details-container {
				animation: pv-fadeIn 0.3s ease-in;
			}
			
			@keyframes pv-fadeIn {
				from { opacity: 0; transform: translateY(10px); }
				to { opacity: 1; transform: translateY(0); }
			}
			
			.pv-card {
				background: #fff;
				border-radius: 8px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.1);
				overflow: hidden;
			}
			
			.pv-header {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: white;
				padding: 30px;
				display: flex;
				align-items: center;
				gap: 30px;
			}
			
			.pv-image-section {
				position: relative;
			}
			
			.pv-img {
				width: 150px;
				height: 150px;
				border-radius: 50%;
				object-fit: cover;
				border: 4px solid white;
				box-shadow: 0 4px 8px rgba(0,0,0,0.2);
			}
			
			.pv-img-placeholder {
				width: 150px;
				height: 150px;
				border-radius: 50%;
				background: rgba(255,255,255,0.2);
				display: flex;
				align-items: center;
				justify-content: center;
				border: 4px solid white;
				box-shadow: 0 4px 8px rgba(0,0,0,0.2);
			}
			
			.pv-img-placeholder i {
				font-size: 60px;
				color: white;
			}
			
			.pv-header-info {
				flex: 1;
			}
			
			.pv-name {
				font-size: 32px;
				font-weight: 700;
				margin: 0 0 10px 0;
			}
			
			.pv-service-number {
				font-size: 18px;
				margin: 5px 0;
				opacity: 0.9;
			}
			
			.pv-category {
				font-size: 16px;
				margin: 5px 0;
				opacity: 0.9;
			}
			
			.pv-body {
				padding: 30px;
			}
			
			.pv-section-title {
				font-size: 20px;
				font-weight: 600;
				color: #2c3e50;
				margin-bottom: 20px;
				padding-bottom: 10px;
				border-bottom: 2px solid #667eea;
			}
			
			.pv-info-section {
				margin-bottom: 30px;
			}
			
			.pv-info-grid {
				display: grid;
				grid-template-columns: 1fr;
				gap: 15px;
			}
			
			.pv-info-item {
				display: flex;
				flex-direction: column;
				padding: 12px;
				background: #f8f9fa;
				border-radius: 6px;
				border-left: 3px solid #667eea;
			}
			
			.pv-info-item label {
				font-weight: 600;
				color: #667eea;
				font-size: 12px;
				text-transform: uppercase;
				margin-bottom: 5px;
			}
			
			.pv-info-item span {
				color: #2c3e50;
				font-size: 14px;
			}
			
			.pv-posting-history-section {
				margin-top: 30px;
			}
			
			.pv-posting-history-table {
				width: 100%;
				border-collapse: collapse;
				margin-top: 10px;
				background: white;
			}
			
			.pv-posting-history-table th {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: white;
				padding: 12px;
				text-align: left;
				font-weight: 600;
				font-size: 13px;
				text-transform: uppercase;
			}
			
			.pv-posting-history-table td {
				padding: 12px;
				border-bottom: 1px solid #e0e0e0;
				font-size: 14px;
			}
			
			.pv-posting-history-table tr:hover {
				background-color: #f8f9fa;
			}
			
			.pv-posting-history-table tr:last-child td {
				border-bottom: none;
			}
			
			.pv-status-indicator {
				display: inline-block;
				padding: 4px 12px;
				border-radius: 12px;
				font-size: 12px;
				font-weight: 600;
				text-transform: uppercase;
			}
			
			.pv-status-tos {
				background: #d4edda;
				color: #155724;
			}
			
			.pv-status-pending {
				background: #fff3cd;
				color: #856404;
			}
			
			.pv-status-cancelled {
				background: #f8d7da;
				color: #721c24;
			}
			
			.pv-empty-state {
				text-align: center;
				padding: 40px;
				color: #6c757d;
			}
			
			.pv-empty-state i {
				font-size: 48px;
				margin-bottom: 15px;
				opacity: 0.5;
			}
		</style>
		`);
		page._cssAdded = true;
	}
	
	// Create HTML structure
	let html = `
		<div class="pv-container">
			${getNavigationSidebar('personnel-view', 'pv')}
			
			<div class="pv-selector-section">
				<div class="form-group">
					<label for="service_number_select" class="pv-form-label">Select Service Number:</label>
					<select id="service_number_select" class="form-control" style="max-width: 400px;">
						<option value="">-- Select Service Number --</option>
					</select>
				</div>
			</div>
			
			<div id="personnel_details_container" class="pv-details-container" style="display: none;">
				<div class="pv-card">
					<div class="pv-header">
						<div class="pv-image-section">
							<img id="personnel_image" src="" alt="Personnel Image" class="pv-img" style="display: none;">
							<div id="personnel_image_placeholder" class="pv-img-placeholder">
								<i class="fa fa-user"></i>
							</div>
						</div>
						<div class="pv-header-info">
							<h2 id="personnel_name" class="pv-name"></h2>
							<p id="personnel_service_number" class="pv-service-number"></p>
							<p id="personnel_category" class="pv-category"></p>
						</div>
					</div>
					
					<div class="pv-body">
						<div class="row">
							<div class="col-md-6">
								<div class="pv-info-section">
									<h3 class="pv-section-title">Personal Information</h3>
									<div class="pv-info-grid">
										<div class="pv-info-item">
											<label>First Name:</label>
											<span id="first_name"></span>
										</div>
										<div class="pv-info-item">
											<label>Last Name:</label>
											<span id="last_name"></span>
										</div>
										<div class="pv-info-item">
											<label>Surname:</label>
											<span id="surname"></span>
										</div>
										<div class="pv-info-item">
											<label>Phone Number:</label>
											<span id="phone_number"></span>
										</div>
										<div class="pv-info-item">
											<label>Type of Commission:</label>
											<span id="type_of_commission"></span>
										</div>
										<div class="pv-info-item">
											<label>Course:</label>
											<span id="course"></span>
										</div>
									</div>
								</div>
							</div>
							
							<div class="col-md-6">
								<div class="pv-info-section">
									<h3 class="pv-section-title">Service Information</h3>
									<div class="pv-info-grid">
										<div class="pv-info-item">
											<label>Current Rank:</label>
											<span id="current_rank"></span>
										</div>
										<div class="pv-info-item">
											<label>Date of Last Promotion:</label>
											<span id="date_of_last_promotion"></span>
										</div>
										<div class="pv-info-item">
											<label>Current Unit:</label>
											<span id="current_unit"></span>
										</div>
										<div class="pv-info-item">
											<label>Current Unit Location:</label>
											<span id="current_unit_location"></span>
										</div>
										<div class="pv-info-item">
											<label>Current Deployment:</label>
											<span id="current_deployment"></span>
										</div>
										<div class="pv-info-item">
											<label>Remarks:</label>
											<span id="remarks"></span>
										</div>
									</div>
								</div>
							</div>
						</div>
						
						<div class="pv-posting-history-section">
							<h3 class="pv-section-title">Posting History</h3>
							<div id="posting_history_table_container"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;
	
	page.main.html(html);
	
	// Load service numbers
	load_service_numbers();
	
	// Handle service number selection
	$('#service_number_select').on('change', function() {
		let service_number = $(this).val();
		if (service_number) {
			load_personnel_data(service_number);
		} else {
			$('#personnel_details_container').hide();
		}
	});
}

function load_service_numbers() {
	frappe.call({
		method: "nacstnew.nacstnew.doctype.personnel.personnel.get_all_service_numbers",
		callback: function(r) {
			if (r.message) {
				let select = $('#service_number_select');
				r.message.forEach(function(item) {
					let option = $('<option></option>')
						.attr('value', item.service_number)
						.text(item.service_number + ' - ' + (item.personnel_name || ''));
					select.append(option);
				});
			}
		}
	});
}

function load_personnel_data(service_number) {
	frappe.call({
		method: "nacstnew.nacstnew.doctype.personnel.personnel.get_personnel_data",
		args: {
			service_number: service_number
		},
		callback: function(r) {
			if (r.message) {
				display_personnel_data(r.message);
			}
		}
	});
}

function display_personnel_data(data) {
	// Display image
	if (data.personnel_image) {
		$('#personnel_image').attr('src', data.personnel_image).show();
		$('#personnel_image_placeholder').hide();
	} else {
		$('#personnel_image').hide();
		$('#personnel_image_placeholder').show();
	}
	
	// Display header info
	$('#personnel_name').text(data.personnel_name || 'N/A');
	$('#personnel_service_number').text('Service Number: ' + data.service_number);
	$('#personnel_category').text('Category: ' + (data.category || 'N/A'));
	
	// Display personal information
	$('#first_name').text(data.first_name || 'N/A');
	$('#last_name').text(data.last_name || 'N/A');
	$('#surname').text(data.surname || 'N/A');
	$('#phone_number').text(data.phone_number || 'N/A');
	$('#type_of_commission').text(data.type_of_commission || 'N/A');
	$('#course').text(data.course || 'N/A');
	
	// Display service information
	$('#current_rank').text(data.current_rank || 'N/A');
	$('#date_of_last_promotion').text(data.date_of_last_promotion || 'N/A');
	$('#current_unit').text(data.current_unit || 'N/A');
	$('#current_unit_location').text(data.current_unit_location || 'N/A');
	$('#current_deployment').text(data.current_deployment || 'N/A');
	$('#remarks').text(data.remarks || 'N/A');
	
	// Display posting history
	display_posting_history(data.posting_history);
	
	// Show container
	$('#personnel_details_container').show();
}

function display_posting_history(history) {
	let container = $('#posting_history_table_container');
	
	if (!history || history.length === 0) {
		container.html('<div class="pv-empty-state"><i class="fa fa-inbox"></i><p>No posting history available</p></div>');
		return;
	}
	
	let html = '<table class="pv-posting-history-table">';
	html += '<thead><tr>';
	html += '<th>Posting Authority</th>';
	html += '<th>From Unit</th>';
	html += '<th>To Unit</th>';
	html += '<th>Appointment</th>';
	html += '<th>WEF Date</th>';
	html += '<th>Date TOS</th>';
	html += '<th>Posting Status</th>';
	html += '<th>Part 2 Order</th>';
	html += '<th>Overstay (Days)</th>';
	html += '</tr></thead><tbody>';
	
	history.forEach(function(record) {
		let statusClass = 'pv-status-pending';
		if (record.posting_status === 'TOS') {
			statusClass = 'pv-status-tos';
		} else if (record.posting_status === 'Cancelled') {
			statusClass = 'pv-status-cancelled';
		}
		
		html += '<tr>';
		html += '<td><strong>' + frappe.utils.escape_html(record.posting_authority) + '</strong></td>';
		html += '<td>' + frappe.utils.escape_html(record.from_unit) + '</td>';
		html += '<td><strong>' + frappe.utils.escape_html(record.to_unit) + '</strong></td>';
		html += '<td>' + frappe.utils.escape_html(record.appointment) + '</td>';
		html += '<td>' + (record.wef_date || '') + '</td>';
		html += '<td>' + (record.date_tos || '') + '</td>';
		html += '<td><span class="pv-status-indicator ' + statusClass + '">' + frappe.utils.escape_html(record.posting_status) + '</span></td>';
		html += '<td>' + frappe.utils.escape_html(record.part_2_order) + '</td>';
		html += '<td>' + record.overstay_days + '</td>';
		html += '</tr>';
	});
	
	html += '</tbody></table>';
	container.html(html);
}

